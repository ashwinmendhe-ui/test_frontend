import Hls from "hls.js";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDetectionCanvas } from "@/hooks/usePlaybackDetectionCanvas";
import type { HLSPlayerRef } from "./types";
const getFileName = (path: string) => {
  return path.split("/").pop()?.split("?")[0] || path;
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
  selectedClassIds?: number[];
  showCommonDetection?: boolean;
  showDangerDetection?: boolean;
  onReady?: () => void;
  onError?: (error?: unknown) => void;
  onLoadedMetadata?: () => void;
  onTimeUpdate?: (time: number) => void;
  onEnded?: () => void;
  disableBackgroundTasks?: boolean;
    type?: "live" | "vector" | "playback";
  onBookmarksChange?: (
    bookmarks: Array<{ timeSec: number | null; t?: number; c_ar?: number[] }>,
    videoUrl: string
  ) => void;
  onLabelsLoaded?: (labels: LabelsMap, videoUrl: string) => void;
  onDeviceInfoUpdate?: (
  deviceInfo: any,
  videoUrl: string,
  videoTime: number
) => void;
}

type SegmentInfo = {
  name: string;
  startSec: number;
  durationSec: number;
  startMs?: number;
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
      onError,
      onBookmarksChange,
      onLabelsLoaded,
      onDeviceInfoUpdate,
      onReady,
      selectedClassIds = [],
      showCommonDetection = true,
      showDangerDetection = true,
      disableBackgroundTasks = false,
      type = "playback",
    },
    ref
  ) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    const lastDetectionsRef = useRef<any[]>([]);
    const sessionStartTimeRef = useRef<number | null>(null);
    const playlistSegmentsRef = useRef<SegmentInfo[]>([]);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const labelsMapRef = useRef<LabelsMap>({});
    const segmentMetadataRef = useRef<Record<string, any[]>>({});
    const currentSegmentNameRef = useRef<string | null>(null);
    const currentMetadataRef = useRef<any[]>([]);
    const rafIdRef = useRef<number | null>(null);
    const [frameDimensions, setFrameDimensions] = useState<{
      width: number | null;
      height: number | null;
    }>({
      width: null,
      height: null,
    });

    const { drawDetections, clearCanvas } = useDetectionCanvas({
      videoRef,
      canvasRef,
      frameWidth: frameDimensions.width,
      frameHeight: frameDimensions.height,
    });


    const onErrorRef = useRef(onError);
    const onDeviceInfoUpdateRef = useRef(onDeviceInfoUpdate);
    const onReadyRef = useRef(onReady);
    const onTimeUpdateRef = useRef(onTimeUpdate);

    const safeJsonFetch = async (url: string) => {
  try {
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (error) {
    // console.warn("JSON fetch failed:", url, error);
    return null;
  }
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
      let currentProgramTimeMs: number | null = null;

      
      for (const line of lines) {
        if (line.startsWith("#EXTINF:")) {
          lastDurationSec =
            Number(line.replace("#EXTINF:", "").split(",")[0]) || 0;
          continue;
        }

        if (line.startsWith("#EXT-X-PROGRAM-DATE-TIME:")) {
          currentProgramTimeMs = new Date(
            line.replace("#EXT-X-PROGRAM-DATE-TIME:", "")
          ).getTime();
          continue;
        }

        if (line && !line.startsWith("#") && line.endsWith(".ts")) {
            segments.push({
              name: getFileName(line),
              startSec: currentStartSec,
              durationSec: lastDurationSec,
              startMs: currentProgramTimeMs ?? undefined,
            });

            currentStartSec += lastDurationSec;

            if (currentProgramTimeMs != null) {
              currentProgramTimeMs += lastDurationSec * 1000;
            }
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
  const getLabelName = useCallback((classId?: number) => {
      if (classId == null) return "unknown";
      return labelsMapRef.current[classId] || `Class${classId}`;
    }, []);

    const loadSegmentMetadata = useCallback(
  async (segmentName: string): Promise<any[]> => {
    
    if (!metadataBaseUrl) return [];

    if (segmentMetadataRef.current[segmentName]) {
      return segmentMetadataRef.current[segmentName];
    }

    const baseUrl = metadataBaseUrl.replace(/\/$/, "");
    const segmentBaseName = getFileName(segmentName).replace(/\.ts$/i, "");

    const candidates = [
      `${segmentBaseName}_1.json`,
      `${segmentBaseName}.json`,
    ];

    for (const candidate of candidates) {
      const data = await safeJsonFetch(`${baseUrl}/${candidate}`);

      if (Array.isArray(data)) {
        const sorted = data.sort(
          (a, b) => Number(a.m ?? a.ts_ms ?? 0) - Number(b.m ?? b.ts_ms ?? 0)
        );

        segmentMetadataRef.current[segmentName] = sorted;
        return sorted;
      }
    }

    segmentMetadataRef.current[segmentName] = [];
    return [];
  },
  [metadataBaseUrl]
);

const normalizedSelectedClassIds = useMemo(
  () =>
    selectedClassIds
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id)),
  [selectedClassIds]
);

  const startFrameSync = useCallback(() => {
  const syncLoop = () => {
    const video = videoRef.current; 

  if (
      !video ||
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      playlistSegmentsRef.current.length === 0
    ) {
      clearCanvas();
      rafIdRef.current = requestAnimationFrame(syncLoop);
      return;
    }

    const currentTime = video.currentTime;

    const segment = playlistSegmentsRef.current.find((item) => {
      const start = item.startSec;
      const end = item.startSec + item.durationSec;
      return currentTime >= start && currentTime < end;
    });

    if (!segment) {
      clearCanvas();
      rafIdRef.current = requestAnimationFrame(syncLoop);
      return;
    }

    if (currentSegmentNameRef.current !== segment.name) {
      currentSegmentNameRef.current = segment.name;
      currentMetadataRef.current = [];

      loadSegmentMetadata(segment.name).then((metadata) => {
        if (currentSegmentNameRef.current === segment.name) {

          currentMetadataRef.current = metadata;
        }
      });
    }

    const metadata = currentMetadataRef.current;

    if (!metadata.length) {
      clearCanvas();
      rafIdRef.current = requestAnimationFrame(syncLoop);
      return;
    }

    const segmentStartMs = segment.startMs ?? 0;
    const timeInSegmentMs = (currentTime - segment.startSec) * 1000;
    const targetFrameTime = segmentStartMs + timeInSegmentMs;

  
    let nearestYoloFrame: any | null = null;
    let nearestLlmFrame: any | null = null;
    let nearestDeviceInfoFrame: any | null = null;

    let latestYoloTime = 0;
    let latestLlmTime = 0;
    let latestDeviceInfoTime = 0;

    for (const frame of metadata) {
      const frameTime = Number(frame.m ?? frame.ts_ms ?? 0);

      if (!frameTime || frameTime > targetFrameTime) continue;

      const hasYolo =
        Array.isArray(frame?.d) && frame.d.length > 0;

      const hasLlm =
        (Array.isArray(frame?.ld) && frame.ld.length > 0) ||
        (Array.isArray(frame?.llm) && frame.llm.length > 0);

      const hasDeviceInfo =
        frame?.device_info &&
        typeof frame.device_info === "object";

      if (hasYolo && frameTime > latestYoloTime) {
        nearestYoloFrame = frame;
        latestYoloTime = frameTime;
      }

      if (hasLlm && frameTime > latestLlmTime) {
        nearestLlmFrame = frame;
        latestLlmTime = frameTime;
      }
      if (
        hasDeviceInfo &&
        frameTime > latestDeviceInfoTime
      ) {
        nearestDeviceInfoFrame = frame;
        latestDeviceInfoTime = frameTime;
      }
        }

    if (nearestDeviceInfoFrame?.device_info) {
      onDeviceInfoUpdateRef.current?.(
        nearestDeviceInfoFrame.device_info,
        src || "",
        currentTime
      );
    }

    const yoloSource = Array.isArray(nearestYoloFrame?.d)
      ? nearestYoloFrame.d
      : [];

    const llmSource = Array.isArray(nearestLlmFrame?.ld)
      ? nearestLlmFrame.ld
      : Array.isArray(nearestLlmFrame?.llm)
        ? nearestLlmFrame.llm
        : [];

    if (yoloSource.length === 0 && llmSource.length === 0) {
      clearCanvas();
      rafIdRef.current = requestAnimationFrame(syncLoop);
      return;
    }

   const convertDetection = (det: any, type: "yolo" | "llm") => {
      const rawClassIds =
        type === "llm" && Array.isArray(det.cids)
          ? det.cids
              .map((id: unknown) => Number(id))
              .filter((id: number) => Number.isFinite(id))
          : undefined;

      const selectedLlmClassIds =
        type === "llm" && rawClassIds
          ? rawClassIds.filter((id: number) =>
              normalizedSelectedClassIds.includes(id)
            )
          : undefined;

      const classIds =
        type === "llm"
          ? selectedLlmClassIds
          : undefined;

      const classId =
        type === "llm"
          ? classIds?.[0]
          : Number(
              det.cid ??
              det.classId ??
              det.class_id ??
              det.c ??
              det.id
            );

      const classNames = classIds?.map((id: number) =>
        getLabelName(id)
      );

      const bb = Array.isArray(det.bb) ? det.bb : null;

      return {
        x: bb ? Number(bb[0] || 0) / 1000 : Number(det.x || 0),
        y: bb ? Number(bb[1] || 0) / 1000 : Number(det.y || 0),
        w: bb ? Number(bb[2] || 0) / 1000 : Number(det.w || 0),
        h: bb ? Number(bb[3] || 0) / 1000 : Number(det.h || 0),
        class:
          type === "llm"
            ? getLabelName(classId)
            : det.class || det.label || getLabelName(classId),
        classId,
        classIds,
        classNames,
        confidence: det.cf
          ? Number(det.cf) / 1000
          : Number(det.confidence || 0),
        type,
        properties: type === "llm" ? det.p : undefined,
      };
    };

      if (normalizedSelectedClassIds.length === 0) {
        lastDetectionsRef.current = [];
        clearCanvas();
        rafIdRef.current = requestAnimationFrame(syncLoop);
        return;
      }

      const DANGER_CLASS_IDS = [3, 4, 5, 20, 21, 22];

      const yoloDetections = yoloSource
        .map((det: any) => convertDetection(det, "yolo"))
        .filter((det: any) => {
          if (!(det.w > 0 && det.h > 0)) {
            return false;
          }

          const classId = Number(det.classId);

          if (!Number.isFinite(classId)) {
            return false;
          }

          if (!normalizedSelectedClassIds.includes(classId)) {
              return false;
            }

          const isDanger = DANGER_CLASS_IDS.includes(classId);

          if (isDanger && !showDangerDetection) {
            return false;
          }

          if (!isDanger && !showCommonDetection) {
            return false;
          }

          return true;
        });

      const llmDetections = llmSource
        .map((det: any) => convertDetection(det, "llm"))
        .filter((det: any) => {
          if (!(det.w > 0 && det.h > 0)) {
            return false;
          }

          const matchingClassIds = Array.isArray(det.classIds)
          ? det.classIds.filter((id: number) => {
              const numericId = Number(id);

              return (
                Number.isFinite(numericId) &&
                (
                  normalizedSelectedClassIds.includes(numericId)
                )
              );
            })
          : [];

          if (matchingClassIds.length === 0) {
            return false;
          }

          if (!showDangerDetection) {
            return false;
          }

          return true;
        });

      const detections = [...yoloDetections, ...llmDetections];



    if (detections.length > 0) {
        lastDetectionsRef.current = detections;
        drawDetections(detections);
      } else {
        lastDetectionsRef.current = [];
        clearCanvas();
      }

    rafIdRef.current = requestAnimationFrame(syncLoop);
    };

    rafIdRef.current = requestAnimationFrame(syncLoop);
  }, [
  clearCanvas,
  drawDetections,
  getLabelName,
  loadSegmentMetadata,
  normalizedSelectedClassIds,
  showCommonDetection,
  showDangerDetection,
  src,
]);


useEffect(() => {
  onDeviceInfoUpdateRef.current = onDeviceInfoUpdate;
}, [onDeviceInfoUpdate]);

useEffect(() => {
  onReadyRef.current = onReady;
}, [onReady]);

useEffect(() => {
  onTimeUpdateRef.current = onTimeUpdate;
}, [onTimeUpdate]);


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

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      if (autoPlay) {
        video.play().catch((error) => {
          console.warn("[HLS] Autoplay failed", error);
        });
      }
    });

   hls.on(Hls.Events.ERROR, (_, data) => {
  if (!data.fatal) {
    return;
  }

  console.error("[HLS] Fatal error", {
    type: data.type,
    details: data.details,
    fatal: data.fatal,
  });

  if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
  const isManifestError =
    data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR ||
    data.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT;

  const isLevelErrorBeforeVideoReady =
    (
      data.details === Hls.ErrorDetails.LEVEL_LOAD_ERROR ||
      data.details === Hls.ErrorDetails.LEVEL_LOAD_TIMEOUT
    ) &&
    video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA;

  const isInitialPlaylistError =
    isManifestError || isLevelErrorBeforeVideoReady;

  if (isInitialPlaylistError) {
    console.warn(
      "[HLS] Initial playlist unavailable; requesting retry",
      {
        details: data.details,
      }
    );

    onErrorRef.current?.(data);
    return;
  }

  try {
    console.warn("[HLS] Attempting fragment/network recovery", {
      details: data.details,
    });

    hls.startLoad();
  } catch (error) {
    console.error("[HLS] Network recovery failed", error);
    onErrorRef.current?.(data);
  }

  return;
}

  if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
    try {
      console.warn("[HLS] Attempting media recovery", {
        details: data.details,
      });

      hls.recoverMediaError();
    } catch (error) {
      console.error("[HLS] Media recovery failed", error);
      onErrorRef.current?.(data);
    }

    return;
  }

  onErrorRef.current?.(data);

  hls.destroy();

  if (hlsRef.current === hls) {
    hlsRef.current = null;
  }
});

    hlsRef.current = hls;
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = src;

    if (autoPlay) {
      video.play().catch(() => {});
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
  const getFileName = (value?: string) => {
    return value?.split("/").pop()?.split("?")[0] || "";
  };
  const getSegmentJsonCandidates = (segmentTsName: string) => {
    const tsBaseName = getFileName(segmentTsName).replace(/\.ts$/i, "");

    return [
      `${tsBaseName}_1.json`,
      `${tsBaseName}.json`,
    ];
  };
  const loadPlaybackMetadata = async () => {
    if (!metadataBaseUrl || !src) {
      onBookmarksChange?.([], src || "");
      onLabelsLoaded?.({}, src || "");
      return;
    }

    const baseUrl = metadataBaseUrl.replace(/\/$/, "");
    if (disableBackgroundTasks || type === "vector") {
      onBookmarksChange?.([], src || "");
      onLabelsLoaded?.({}, src || "");
      return;
    }

    let labelsMap: LabelsMap = {};
    let bookmarks: BookmarkPayload[] = [];
    let sessionStartMs: number | null = null;
    let segments: SegmentInfo[] = [];

    try {
      segments = await parsePlaylistSegments(src);

    } catch (error) {
      // console.error("Playlist parse failed:", error);
      segments = [];
    }

    try {
      const firstSegment = segments[0];

      if (firstSegment?.name) {
        const candidates = getSegmentJsonCandidates(firstSegment.name);

        for (const candidate of candidates) {
          const testUrl = `${baseUrl}/${candidate}`;
          const res = await fetch(testUrl, { cache: "no-store" });


          if (res.ok) {
            break;
          }
        }
      }
    } catch (error) {
      // console.error("🔥 Segment JSON fetch failed:", error);
    }
  

    try {
  const info = await safeJsonFetch(`${baseUrl}/info.json`);
  labelsMap = normalizeLabels(info);

  labelsMapRef.current = labelsMap;

  if (info?.frame_width && info?.frame_height) {
    setFrameDimensions({
      width: info.frame_width,
      height: info.frame_height,
    });
  }

  onLabelsLoaded?.(labelsMap, src);
} catch (error) {
  // console.error("Info fetch failed:", error);

  labelsMapRef.current = {};
  onLabelsLoaded?.({}, src);
}

    try {
      const bookmarkUrl = `${baseUrl}/bookmark.ndjson`;
      const text = await safeTextFetch(bookmarkUrl);
      bookmarks = parseBookmarkNdjson(text);
    } catch (error) {
      // console.error("Bookmark fetch/parse failed:", error);
      bookmarks = [];
    }

    if (cancelled) return;

    sessionStartTimeRef.current = sessionStartMs;
    playlistSegmentsRef.current = segments;

    onLabelsLoaded?.(labelsMap, src);
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
  // console.error("Parsed bookmark mapping failed:", error);
  onBookmarksChange?.([], src);
}};

  loadPlaybackMetadata();

  return () => {
    cancelled = true;
  };
}, [metadataBaseUrl, src, onBookmarksChange, onLabelsLoaded,disableBackgroundTasks,type]);


 useEffect(() => {
  if (!src || !metadataBaseUrl) return;

  startFrameSync();

  return () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    clearCanvas();
    currentSegmentNameRef.current = null;
    currentMetadataRef.current = [];
    lastDetectionsRef.current = [];
  };
}, [src, metadataBaseUrl, startFrameSync, clearCanvas]);

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


    useEffect(() => {
  if (!src || !metadataBaseUrl) return;

  let stopped = false;

  const refreshSegments = async () => {
    try {
      const segments = await parsePlaylistSegments(src);

      if (!stopped && segments.length > 0) {
        playlistSegmentsRef.current = segments;
      }
    } catch (error) {
      // console.error("[PLAYLIST REFRESH ERROR]", error);
    }
  };

  refreshSegments();

  const interval = window.setInterval(refreshSegments, 2000);

  return () => {
    stopped = true;
    window.clearInterval(interval);
  };
}, [src, metadataBaseUrl]);


useEffect(() => {
  onErrorRef.current = onError;
}, [onError]);

    return (
  <div className="relative w-full h-full bg-black overflow-hidden">
    
      <video
          ref={videoRef}
          className={className}
          muted={muted}
          controls={controls}
          playsInline
          onPlaying={() => {
            onReadyRef.current?.();
          }}
          onLoadedMetadata={onLoadedMetadata}
          onTimeUpdate={() => {
            const video = videoRef.current;
            if (!video) return;

            onTimeUpdateRef.current?.(video.currentTime);
          }}
          onEnded={onEnded}
        />

    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none object-contain z-10"
    />
  </div>
);
  });

HLSPlayer.displayName = "HLSPlayer";

export default HLSPlayer;