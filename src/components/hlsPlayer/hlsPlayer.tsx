import Hls from "hls.js";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import type { HLSPlayerRef } from "./types";

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

    const safeJsonFetch = async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status}`);
      }
      return response.json();
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
          } else if (item && typeof item === "object") {
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
        const id = Number(key);
        if (Number.isFinite(id) && typeof value === "string") {
          next[id] = value;
        } else if (
          Number.isFinite(id) &&
          value &&
          typeof value === "object" &&
          typeof (value as Record<string, unknown>).label === "string"
        ) {
          next[id] = (value as Record<string, unknown>).label as string;
        }
      });

      return next;
    };

    const normalizeSegments = (raw: unknown): SegmentInfo[] => {
      if (!raw) return [];

      const source = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as Record<string, unknown>)?.segments)
        ? ((raw as Record<string, unknown>).segments as unknown[])
        : [];

      let runningStartSec = 0;

      return source
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const entry = item as Record<string, unknown>;

          const name =
            typeof entry.name === "string"
              ? entry.name
              : typeof entry.segment === "string"
              ? entry.segment
              : typeof entry.file === "string"
              ? entry.file
              : "";

          const durationSec =
            typeof entry.durationSec === "number"
              ? entry.durationSec
              : typeof entry.duration === "number"
              ? entry.duration
              : typeof entry.d === "number"
              ? entry.d
              : 0;

          const startSec =
            typeof entry.startSec === "number"
              ? entry.startSec
              : typeof entry.start === "number"
              ? entry.start
              : runningStartSec;

          const segment: SegmentInfo = {
            name,
            startSec,
          };

          runningStartSec = startSec + durationSec;
          return name ? segment : null;
        })
        .filter((item): item is SegmentInfo => Boolean(item));
    };

    const extractBookmarks = (raw: unknown): BookmarkPayload[] => {
      if (!raw) return [];

      if (Array.isArray(raw)) {
        return raw as BookmarkPayload[];
      }

      if (typeof raw === "object") {
        const obj = raw as Record<string, unknown>;

        if (Array.isArray(obj.bookmarks)) {
          return obj.bookmarks as BookmarkPayload[];
        }
        if (Array.isArray(obj.items)) {
          return obj.items as BookmarkPayload[];
        }
        if (Array.isArray(obj.events)) {
          return obj.events as BookmarkPayload[];
        }
      }

      return [];
    };

    const getBookmarkTimeSec = (bookmark: BookmarkPayload): number | null => {
      if (typeof bookmark.timeSec === "number") {
        return bookmark.timeSec;
      }

      if (
        bookmark.s &&
        typeof bookmark.o === "number" &&
        Array.isArray(playlistSegmentsRef.current)
      ) {
        const segment = playlistSegmentsRef.current.find(
          (item) => item.name === bookmark.s
        );

        if (segment) {
          return segment.startSec + bookmark.o / 1000;
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
            } catch (error) {
              console.error("Video autoplay failed:", error);
            }
          }
        });

        hlsRef.current = hls;
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        if (autoPlay) {
          video
            .play()
            .catch((error) => console.error("Native HLS autoplay failed:", error));
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

      const loadPlaybackMetadata = async () => {
        if (!metadataBaseUrl || !src) {
          onBookmarksChange?.([], src || "");
          return;
        }

        const bookmarkCandidates = [
          `${metadataBaseUrl}/bookmarks.json`,
          `${metadataBaseUrl}/metadata/bookmarks.json`,
          `${metadataBaseUrl}/events.json`,
          `${metadataBaseUrl}/metadata/events.json`,
        ];

        const labelsCandidates = [
          `${metadataBaseUrl}/labels.json`,
          `${metadataBaseUrl}/metadata/labels.json`,
          `${metadataBaseUrl}/info.json`,
          `${metadataBaseUrl}/metadata/info.json`,
        ];

        const segmentsCandidates = [
          `${metadataBaseUrl}/segments.json`,
          `${metadataBaseUrl}/metadata/segments.json`,
          `${metadataBaseUrl}/index.json`,
          `${metadataBaseUrl}/metadata/index.json`,
        ];

        let labelsMap: LabelsMap = {};
        let bookmarks: BookmarkPayload[] = [];
        let sessionStartMs: number | null = null;
        let segments: SegmentInfo[] = [];

        for (const candidate of labelsCandidates) {
          try {
            const raw = await safeJsonFetch(candidate);
            labelsMap = normalizeLabels(raw);

            if (
              raw &&
              typeof raw === "object" &&
              typeof (raw as Record<string, unknown>).sessionStartTime === "number"
            ) {
              sessionStartMs = (raw as Record<string, unknown>)
                .sessionStartTime as number;
            }

            if (
              raw &&
              typeof raw === "object" &&
              typeof (raw as Record<string, unknown>).sessionStartMs === "number"
            ) {
              sessionStartMs = (raw as Record<string, unknown>).sessionStartMs as number;
            }

            break;
          } catch {
            //
          }
        }

        for (const candidate of segmentsCandidates) {
          try {
            const raw = await safeJsonFetch(candidate);
            segments = normalizeSegments(raw);
            if (segments.length > 0) break;
          } catch {
            //
          }
        }

        for (const candidate of bookmarkCandidates) {
          try {
            const raw = await safeJsonFetch(candidate);
            bookmarks = extractBookmarks(raw);

            if (
              raw &&
              typeof raw === "object" &&
              typeof (raw as Record<string, unknown>).sessionStartTime === "number"
            ) {
              sessionStartMs = (raw as Record<string, unknown>)
                .sessionStartTime as number;
            }

            if (
              raw &&
              typeof raw === "object" &&
              typeof (raw as Record<string, unknown>).sessionStartMs === "number"
            ) {
              sessionStartMs = (raw as Record<string, unknown>).sessionStartMs as number;
            }

            break;
          } catch {
            //
          }
        }

        if (cancelled) return;

        sessionStartTimeRef.current = sessionStartMs;
        playlistSegmentsRef.current = segments;

        if (Object.keys(labelsMap).length > 0) {
          onLabelsLoaded?.(labelsMap, src);
        }

        const parsedBookmarks = bookmarks
          .map((bookmark) => ({
            timeSec: getBookmarkTimeSec(bookmark),
            t: bookmark.t,
            c_ar: Array.isArray(bookmark.c_ar) ? bookmark.c_ar : [],
          }))
          .filter((item) => item.timeSec !== null);

        onBookmarksChange?.(parsedBookmarks, src);
      };

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
        const video = videoRef.current;
        if (!video) return;
        video.pause();
      },
      seekBy: (seconds: number) => {
        const video = videoRef.current;
        if (!video) return;

        const duration = Number.isFinite(video.duration) ? video.duration : 0;
        const nextTime = video.currentTime + seconds;

        if (duration > 0) {
          video.currentTime = Math.min(Math.max(nextTime, 0), duration);
        } else {
          video.currentTime = Math.max(nextTime, 0);
        }
      },
      seekTo: (seconds: number) => {
        const video = videoRef.current;
        if (!video) return;

        const duration = Number.isFinite(video.duration) ? video.duration : 0;

        if (duration > 0) {
          video.currentTime = Math.min(Math.max(seconds, 0), duration);
        } else {
          video.currentTime = Math.max(seconds, 0);
        }
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