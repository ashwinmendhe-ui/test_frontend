import Hls from "hls.js";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import type { HLSPlayerRef } from "./types";

const getFileName = (path: string) => {
  return path.split("/").pop()?.split("?")[0] || path;
};
const getBasePathFromUrl = (url: string) => {
      return url.substring(0, url.lastIndexOf("/"));
    };

type BookmarkPayload = {
  m?: number;
  t?: number;
  c_ar?: number[];
  s?: string;
  o?: number;
  timeSec?: number | null;
};

type LabelsMap = Record<number, string>;

interface HLSPlayerProps {
  src?: string;
  className?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  metadataBaseUrl?: string;
  onLoadedMetadata?: () => void;
  onTimeUpdate?: () => void;
  onEnded?: () => void;
  onBookmarksChange?: (
    bookmarks: Array<{ timeSec: number | null; t?: number; c_ar?: number[] }>,
    videoUrl: string
  ) => void;
  onLabelsLoaded?: (labels: LabelsMap, videoUrl: string) => void;
}

type SegmentInfo = {
  name: string;
  startSec: number;
};

const HLSPlayer = forwardRef<HLSPlayerRef, HLSPlayerProps>(
  (
    {
      src,
      className,
      autoPlay = true,
      muted = true,
      controls = false,
      metadataBaseUrl,
      onLoadedMetadata,
      onTimeUpdate,
      onEnded,
      onBookmarksChange,
      onLabelsLoaded,
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    const sessionStartTimeRef = useRef<number | null>(null);
    const playlistSegmentsRef = useRef<SegmentInfo[]>([]);
    const metadataLoadedKeyRef = useRef<string>("");

    const safeJsonFetch = async (url: string) => {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status}`);
      }
      return response.json();
    };

    const safeTextFetch = async (url: string) => {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status}`);
      }
      return response.text();
    };

    const parseBookmarkNdjson = (text: string): BookmarkPayload[] => {
      return text
        .trim()
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          try {
            return JSON.parse(line) as BookmarkPayload;
          } catch {
            return null;
          }
        })
        .filter((item): item is BookmarkPayload => Boolean(item));
    };

    const parsePlaylistSegments = async (
      m3u8Url: string
    ): Promise<SegmentInfo[]> => {
      const text = await safeTextFetch(m3u8Url);
      const lines = text.split("\n").map((line) => line.trim());

      const segments: SegmentInfo[] = [];
      let currentStartSec = 0;
      let lastDurationSec = 0;

      for (const line of lines) {
        if (line.startsWith("#EXTINF:")) {
          lastDurationSec =
            Number(line.replace("#EXTINF:", "").split(",")[0]) || 0;
          continue;
        }

        if (line && !line.startsWith("#") && line.endsWith(".ts")) {
          segments.push({
            name: getFileName(line),
            startSec: currentStartSec,
          });

          currentStartSec += lastDurationSec;
        }
      }
      return segments;
    };

    const normalizeLabels = (raw: unknown): LabelsMap => {
      if (!raw || typeof raw !== "object") return {};

      if ("labels" in (raw as Record<string, unknown>)) {
        return normalizeLabels((raw as Record<string, unknown>).labels);
      }

      if (Array.isArray(raw)) {
        const next: LabelsMap = {};

        raw.forEach((item, index) => {
          if (typeof item === "string") {
            next[index] = item;
            return;
          }

          if (item && typeof item === "object") {
            const entry = item as Record<string, unknown>;

            const id =
              typeof entry.id === "number"
                ? entry.id
                : typeof entry.value === "number"
                ? entry.value
                : index;

            const label =
              typeof entry.label === "string"
                ? entry.label
                : typeof entry.name === "string"
                ? entry.name
                : "";

            if (label) next[id] = label;
          }
        });

        return next;
      }

      const obj = raw as Record<string, unknown>;
      const next: LabelsMap = {};

      Object.entries(obj).forEach(([key, value]) => {
        const numericKey = Number(key);

        if (Number.isFinite(numericKey) && typeof value === "string") {
          next[numericKey] = value;
          return;
        }

        if (
          Number.isFinite(numericKey) &&
          value &&
          typeof value === "object" &&
          typeof (value as Record<string, unknown>).label === "string"
        ) {
          next[numericKey] = (value as Record<string, unknown>).label as string;
          return;
        }

        if (typeof value === "number") {
          next[value] = key;
        }
      });

      return next;
    };

    const getBookmarkTimeSec = (bookmark: BookmarkPayload): number | null => {
      if (typeof bookmark.timeSec === "number") {
        return bookmark.timeSec;
      }

      if (bookmark.s && typeof bookmark.o === "number") {
          const bookmarkSegmentName = getFileName(bookmark.s);

          const segment = playlistSegmentsRef.current.find(
            (item) => item.name === bookmarkSegmentName
          );

          if (!segment) {
            console.log("Segment not found for bookmark:", {
              bookmarkSegmentName,
              availableSegments: playlistSegmentsRef.current.slice(0, 10),
            });
          }

          if (segment) {
            return segment.startSec + Number(bookmark.o || 0) / 1000;
          }
        }

      if (
        typeof bookmark.m === "number" &&
        typeof sessionStartTimeRef.current === "number"
      ) {
        return (bookmark.m - sessionStartTimeRef.current) / 1000;
      }

      return null;
    };

    useEffect(() => {
      const video = videoRef.current;

      if (!video || !src) return;

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, async () => {
          if (autoPlay) {
            try {
              await video.play();
            } catch {
              // autoplay can fail depending on browser policy
            }
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;

        if (autoPlay) {
          video.play().catch(() => {
            // autoplay can fail depending on browser policy
          });
        }
      }

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }
      };
    }, [src, autoPlay]);

    useEffect(() => {
  let cancelled = false;

  const metadataKey = `${src || ""}_${metadataBaseUrl || ""}`;

  const loadPlaybackMetadata = async () => {
    if (!metadataBaseUrl || !src) {
      onBookmarksChange?.([], src || "");
      onLabelsLoaded?.({}, src || "");
      return;
    }

    const baseUrl = metadataBaseUrl.replace(/\/$/, "");
    console.log("🎬 HLS src:", src);
    console.log("📂 metadataBaseUrl prop:", metadataBaseUrl);
    console.log("📂 normalized metadata baseUrl:", baseUrl);
    console.log("📂 base path from src:", getBasePathFromUrl(src));
    console.log("🧠 test segment JSON:", `${baseUrl}/segment_000_00000.json`);
    let labelsMap: LabelsMap = {};
    let bookmarks: BookmarkPayload[] = [];
    let sessionStartMs: number | null = null;
    let segments: SegmentInfo[] = [];

    try {
      segments = await parsePlaylistSegments(src);

console.log("✅ Parsed playlist segments:", segments);
console.log(
  "🧠 Segment JSON candidates:",
  segments.slice(0, 5).map((seg) => {
    const tsBaseName = seg.name.replace(".ts", "");
    return {
      ts: seg.name,
      startSec: seg.startSec,
      candidate1: `${baseUrl}/${tsBaseName}.json`,
      candidate2: `${baseUrl}/segment_000_${String(
        segments.indexOf(seg)
      ).padStart(5, "0")}.json`,
    };
  })
);
    } catch (error) {
      console.log("Playlist parse failed:", error);
      segments = [];
    }


try {
  const testUrl = `${baseUrl}/segment_000_00000.json`;
  const res = await fetch(testUrl, { cache: "no-store" });

  console.log("📡 Segment JSON fetch status:", res.status);
  console.log("📡 Segment JSON fetch url:", testUrl);

  if (res.ok) {
    const data = await res.json();
    console.log("✅ Segment JSON data:", data);
  } else {
    console.error("❌ Segment JSON not accessible:", res.status, testUrl);
  }
} catch (error) {
  console.error("🔥 Segment JSON fetch failed:", error);
}


    try {
      const rawInfo = await safeJsonFetch(`${baseUrl}/info.json`);
      labelsMap = normalizeLabels(rawInfo);
    } catch (error) {
      console.log("Info fetch failed:", error);
      labelsMap = {};
    }

    try {
      const bookmarkUrl = `${baseUrl}/bookmark.ndjson`;
      const text = await safeTextFetch(bookmarkUrl);
      bookmarks = parseBookmarkNdjson(text);
    } catch (error) {
      console.log("Bookmark fetch/parse failed:", error);
      bookmarks = [];
    }

    if (cancelled) return;

    sessionStartTimeRef.current = sessionStartMs;
    playlistSegmentsRef.current = segments;

    onLabelsLoaded?.(labelsMap, src);
    
    const getFileName = (value?: string) => {
  return value?.split("/").pop()?.split("?")[0] || "";
};
try {
  const parsedBookmarks = bookmarks
    .map((bookmark) => {
      const bookmarkSegmentName =
        bookmark.s?.split("/").pop()?.split("?")[0] || "";

      const segment = segments.find((item) => item.name === bookmarkSegmentName);

      const timeSec =
        segment && typeof bookmark.o === "number"
          ? segment.startSec + Number(bookmark.o || 0) / 1000
          : null;

      return {
        ...bookmark,
        timeSec,
        c_ar: Array.isArray(bookmark.c_ar) ? bookmark.c_ar : [],
      };
    })
    .filter((item) => item.timeSec != null)
    .map((item) => ({
      ...item,
      timeSec: item.timeSec as number,
    }));


  onBookmarksChange?.(parsedBookmarks, src);
} catch (error) {
  console.log("Parsed bookmark mapping failed:", error);
  onBookmarksChange?.([], src);
}};

  loadPlaybackMetadata();

  return () => {
    cancelled = true;
  };
}, [metadataBaseUrl, src, onBookmarksChange, onLabelsLoaded]);

    useImperativeHandle(ref, () => ({
      play: async () => {
        const video = videoRef.current;
        if (!video) return;
        await video.play();
      },
      pause: () => {
        videoRef.current?.pause();
      },
      seekBy: (seconds: number) => {
        const video = videoRef.current;
        if (!video) return;

        const duration = Number.isFinite(video.duration) ? video.duration : 0;
        const nextTime = video.currentTime + seconds;

        video.currentTime =
          duration > 0
            ? Math.min(Math.max(nextTime, 0), duration)
            : Math.max(nextTime, 0);
      },
      seekTo: (seconds: number) => {
        const video = videoRef.current;
        if (!video) return;

        const duration = Number.isFinite(video.duration) ? video.duration : 0;

        video.currentTime =
          duration > 0
            ? Math.min(Math.max(seconds, 0), duration)
            : Math.max(seconds, 0);
      },
      getCurrentTime: () => {
        return videoRef.current?.currentTime ?? 0;
      },
      getDuration: () => {
        const duration = videoRef.current?.duration ?? 0;
        return Number.isFinite(duration) ? duration : 0;
      },
      isPaused: () => {
        return videoRef.current?.paused ?? true;
      },
    }));

    return (
      <video
        ref={videoRef}
        className={className}
        muted={muted}
        controls={controls}
        playsInline
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onEnded={onEnded}
      />
    );
  }
);

HLSPlayer.displayName = "HLSPlayer";

export default HLSPlayer;