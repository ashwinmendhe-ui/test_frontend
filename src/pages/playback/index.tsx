import FolderIcon from "@/assets/folder-icon.svg";
import NoVideoIcon from "@/assets/no-video-icon.svg";
import SelectIcon from "@/assets/playback-select-icon.svg";
import XIcon from "@/assets/x-icon.svg";
import HLSPlayer from "@/components/hlsPlayer/hlsPlayer";
import type { HLSPlayerRef } from "@/components/hlsPlayer/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserStore } from "@/stores/userStore";
import { useCompanyStore } from "@/stores/companyStore";
import { useSiteStore } from "@/stores/siteStore";
import { useRobotStore } from "@/stores/robotStore";
import { useMissionStore } from "@/stores/missionStore";
import { usePlaybackStore } from "@/stores/playbackStore";
import ControlBar from "@/components/common/controlBar";
import { Form, Select, Slider, Switch } from "antd";
import { formatTime } from "@/utils/date";
import { useLocation } from "react-router-dom";
import { LiveMap } from "@/components/map/liveMap";

type PlaybackFormValues = {
  company?: string;
  site?: string;
  device?: string;
  mission?: string;
};

type AICategory = "common" | "danger";

type AIModuleItem = {
  value: number;
  label: string;
  category: string;
  type: AICategory;
  color: string;
};

type VideoBookmark = {
  timeSec: number | null;
  type?: number;
  c_ar?: number[];
  labels?: string[];
};

type TimelineMarker = {
  id: string;
  timeSec: number;
  type: "vehicle" | "person" | "safety" | "alert";
  label: string;
  confidence?: number;
  position?: "top" | "bottom";
  classIds?: number[];
  labels?: string[];
};

type LabelsMap = Record<number, string>;

type PlaybackHlsError = {
  fatal?: boolean;
  details?: string;
  type?: string;
};

const getMetadataBaseUrl = (videoUrl: string) => {
  return videoUrl
    .replace(/\/index\.m3u8(\?.*)?$/i, "")
    .replace(/\/playlist\.m3u8(\?.*)?$/i, "");
};

const normalizeText = (value?: string) => (value || "").trim().toLowerCase();

const getMarkerTypeFromLabel = (
  label?: string
): TimelineMarker["type"] => {
  const text = normalizeText(label);

  if (
    text.includes("person") ||
    text.includes("human") ||
    text.includes("intrusion")
  ) {
    return "person";
  }

  if (
    text.includes("vehicle") ||
    text.includes("car") ||
    text.includes("truck") ||
    text.includes("forklift")
  ) {
    return "vehicle";
  }

  if (
    text.includes("helmet") ||
    text.includes("vest") ||
    text.includes("ppe") ||
    text.includes("safety")
  ) {
    return "safety";
  }

  return "alert";
};

const getMarkerConfidence = (classIds?: number[]) => {
  if (!classIds || classIds.length === 0) return undefined;
  return 100;
};


const timeToSeconds = (time?: string) => {
  if (!time) return 0;

  const parts = time.split(":").map(Number);

  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }

  if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }

  return 0;
};
  const parseCoordinate = (...values: unknown[]): number | undefined => {
  for (const value of values) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    const parsed =
      typeof value === "number"
        ? value
        : Number(String(value).trim());

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const OFFSET_MIN_SECONDS = -30;
const OFFSET_MAX_SECONDS = 30;
const SYNC_TOLERANCE_SECONDS = 0.25;
export default function Playback() {
  const location = useLocation();
  const historyPlaybackState = location.state as
  | {
      playbackUrl?: string;
      timestamp?: string;
      label?: string;

      // 🔥 ADD THESE
      companyId?: string;
      siteId?: string;
      missionId?: string;
      deviceSn?: string;

      historyDetail?: any;
    }
  | undefined;

  const historySeekTime = timeToSeconds(historyPlaybackState?.timestamp);
  const { t } = useTranslation();
  const { detailUserLogin } = useUserStore();
  const [form] = Form.useForm<PlaybackFormValues>();

  const playerRefs = useRef<Record<string, HLSPlayerRef | null>>({});
  const isSharedSeekingRef = useRef(false);
  const sharedSeekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [, setDuration] = useState(0);
  const [deviceInfoByVideo, setDeviceInfoByVideo] = useState<Record<string, any>>({});
  const handleDeviceInfoUpdate = useCallback(
  (deviceInfo: any, videoUrl: string) => {
    setDeviceInfoByVideo((prev) => {
      const previous = prev[videoUrl];

      const isSame =
        previous?.status === deviceInfo?.status &&
        previous?.battery === deviceInfo?.battery &&
        previous?.network === deviceInfo?.network &&
        previous?.gps === deviceInfo?.gps &&
        previous?.altitude === deviceInfo?.altitude &&
        previous?.speed === deviceInfo?.speed &&
        previous?.latitude === deviceInfo?.latitude &&
        previous?.longitude === deviceInfo?.longitude;

      if (isSame) {
        return prev;
      }

      return {
        ...prev,
        [videoUrl]: deviceInfo,
      };
    });
  },
  []
);

  const [videoTimes, setVideoTimes] = useState<Record<string, number>>({});
  const [videoDurations, setVideoDurations] = useState<Record<string, number>>({});
  const [videoOffsets, setVideoOffsets] = useState<Record<string, number>>({});
  const [videoLoading, setVideoLoading] = useState<Record<string, boolean>>({});
  const [videoUnavailable, setVideoUnavailable] = useState<
    Record<string, boolean>
  >({});

  const playbackErrorCountRef = useRef<Record<string, number>>({});

  const PLAYBACK_ERROR_LIMIT = 5;
  const [bookmarksByVideo, setBookmarksByVideo] = useState<
    Record<string, VideoBookmark[]>
  >({});
  const [labelsByVideo, setLabelsByVideo] = useState<Record<string, LabelsMap>>({});
  const { list: companyList, getList: getCompanyList } = useCompanyStore();
  const { list: siteList, getListByCompany } = useSiteStore();
  const { list: robotList, getListBySite: getRobotListBySite } = useRobotStore();
  const { listBySite: missionList, getListBySite: getMissionListBySite } =
    useMissionStore();
  const { list: playbackList, getPlayback, resetPlayback } = usePlaybackStore();

  const userRole = detailUserLogin?.roles?.[0];
  const values = Form.useWatch([], form);

  const companyOptions = useMemo(() => {
    if (userRole === 1) {
      return companyList.map((item) => ({
        value: item.companyId,
        label: item.name,
      }));
    }

    return detailUserLogin?.user?.companyId
      ? [
          {
            value: detailUserLogin.user.companyId,
            label: detailUserLogin.user.companyName || "",
          },
        ]
      : [];
  }, [userRole, companyList, detailUserLogin]);

  const siteOptions = useMemo(
    () =>
      siteList.map((item) => ({
        value: item.siteId,
        label: item.name,
      })),
    [siteList]
  );

  const deviceOptions = useMemo(
    () =>
      robotList.map((item) => ({
        value: item.deviceId,
        label: item.deviceName,
      })),
    [robotList]
  );

  const selectedDevice = useMemo(
    () => robotList.find((item) => item.deviceId === values?.device),
    [robotList, values?.device]
  );

  const missionOptions = useMemo(() => {
    return missionList
      .filter((item) =>
        selectedDevice?.deviceType
          ? item.deviceType === selectedDevice.deviceType
          : true
      )
      .map((item) => ({
        value: item.missionId,
        label: item.missionName,
      }));
  }, [missionList, selectedDevice]);

  const videoOptions = useMemo(
    () =>
      playbackList
        .slice()
        .sort((a, b) => b.segment.localeCompare(a.segment))
        .map((item) => ({
          value: item.url,
          label: item.segment,
        })),
    [playbackList]
  );

  const aiModules: AIModuleItem[] = useMemo(
  () => [
    {
      value: 0,
      label: "Construction",
      category: "YOLO",
      type: "common",
      color: "#8B6F63",
    },
    {
      value: 1,
      label: "HardHat",
      category: "YOLO",
      type: "common",
      color: "#FFD600",
    },
    {
      value: 9,
      label: "Machinery",
      category: "YOLO",
      type: "common",
      color: "#14B8C8",
    },
    {
      value: 2,
      label: "Mask",
      category: "YOLO",
      type: "common",
      color: "#A855F7",
    },
    {
      value: 6,
      label: "Person",
      category: "YOLO",
      type: "common",
      color: "#22C55E",
    },
    {
      value: 8,
      label: "Safety Vest",
      category: "YOLO",
      type: "common",
      color: "#1683FF",
    },
    {
      value: 10,
      label: "Vehicle",
      category: "YOLO",
      type: "common",
      color: "#1683FF",
    },
    {
      value: 7,
      label: "Safety Cone",
      category: "YOLO",
      type: "common",
      color: "#FF8A00",
    },

    {
      value: 3,
      label: "No HardHat",
      category: "YOLO",
      type: "danger",
      color: "#FF2D55",
    },
    {
      value: 5,
      label: "No Safety Vest",
      category: "YOLO",
      type: "danger",
      color: "#FF8A00",
    },
    {
      value: 4,
      label: "No Mask",
      category: "YOLO",
      type: "danger",
      color: "#D100D8",
    },
    {
      value: 20,
      label: "No HardHat",
      category: "LLM",
      type: "danger",
      color: "#FF2D55",
    },
    {
      value: 21,
      label: "No Safety Vest",
      category: "LLM",
      type: "danger",
      color: "#FF8A00",
    },
    {
      value: 22,
      label: "No Safety Rope",
      category: "LLM",
      type: "danger",
      color: "#FF2D55",
    },
  ],
  []
);

const [selectedModules, setSelectedModules] = useState<number[]>(() =>
  aiModules.map((item) => item.value)
);

  const selectedVideoItems = useMemo(
  () =>
    selectedVideos.map((url) => {
      const matched = videoOptions.find((item) => item.value === url);

      return (
        matched || {
          value: url,
          label: historyPlaybackState?.historyDetail?.missionName
            ? `${historyPlaybackState.historyDetail.missionName} - ${
                historyPlaybackState.timestamp || ""
              }`
            : url,
        }
      );
    }),
  [selectedVideos, videoOptions, historyPlaybackState]
);

  const metadataBaseByVideo = useMemo(() => {
    const next: Record<string, string> = {};
    selectedVideos.forEach((url) => {
      next[url] = getMetadataBaseUrl(url);
    });
    return next;
  }, [selectedVideos]);

  
  const mainDuration = useMemo(() => {
    if (selectedVideos.length === 0) return 0;
    const durations = selectedVideos.map((url) => videoDurations[url] || 0);
    return durations.length > 0 ? Math.max(...durations) : 0;
  }, [selectedVideos, videoDurations]);

  const masterVideoUrl = selectedVideos[0];

  const getVideoOffset = useCallback(
  (videoUrl: string) => videoOffsets[videoUrl] || 0,
  [videoOffsets]
);

const getVideoTargetTime = useCallback(
  (
    videoUrl: string,
    sharedTime: number,
    offsetOverride?: number
  ) => {
    const videoDuration = videoDurations[videoUrl] || 0;

    const offset =
      offsetOverride !== undefined
        ? offsetOverride
        : videoOffsets[videoUrl] || 0;

    const targetTime = sharedTime + offset;

    if (videoDuration <= 0) {
      return Math.max(0, targetTime);
    }

    return Math.min(Math.max(targetTime, 0), videoDuration);
  },
  [videoDurations, videoOffsets]
);

const seekAllVideosToSharedTime = useCallback(
  (
    sharedTime: number,
    offsetOverrides?: Record<string, number>
  ) => {
    isSharedSeekingRef.current = true;

    if (sharedSeekTimerRef.current) {
      clearTimeout(sharedSeekTimerRef.current);
    }

    selectedVideos.forEach((videoUrl) => {
      if (videoUnavailable[videoUrl]) return;

      const player = playerRefs.current[videoUrl];
      if (!player) return;

      const offset =
        offsetOverrides?.[videoUrl] ??
        videoOffsets[videoUrl] ??
        0;

      const targetTime = getVideoTargetTime(
        videoUrl,
        sharedTime,
        offset
      );

      const playerTime = player.getCurrentTime();

      if (
        Math.abs(playerTime - targetTime) >
        SYNC_TOLERANCE_SECONDS
      ) {
        player.seekTo(targetTime);
      }
    });

    sharedSeekTimerRef.current = setTimeout(() => {
      isSharedSeekingRef.current = false;
      sharedSeekTimerRef.current = null;
    }, 300);
  },
  [
    selectedVideos,
    videoUnavailable,
    videoOffsets,
    getVideoTargetTime,
  ]
);

const formatOffset = (offset: number) => {
  const rounded = Math.round(offset * 10) / 10;

  if (rounded > 0) {
    return `+${rounded.toFixed(1)}s`;
  }

  if (rounded < 0) {
    return `${rounded.toFixed(1)}s`;
  }

  return "0.0s";
};

  const handlePlaybackError = useCallback(
  (videoUrl: string, error?: unknown) => {
    const hlsError = error as PlaybackHlsError | undefined;
    const isFatal = Boolean(hlsError?.fatal);

    const nextErrorCount =
      (playbackErrorCountRef.current[videoUrl] || 0) + 1;

    playbackErrorCountRef.current[videoUrl] = nextErrorCount;

    console.warn("[Playback] Video load error", {
      videoUrl,
      errorCount: nextErrorCount,
      fatal: isFatal,
      details: hlsError?.details,
      error,
    });

    if (!isFatal && nextErrorCount < PLAYBACK_ERROR_LIMIT) {
      return;
    }

    console.error("[Playback] Recording unavailable", {
      videoUrl,
      errorCount: nextErrorCount,
      fatal: isFatal,
      details: hlsError?.details,
      error,
    });

    playerRefs.current[videoUrl]?.pause();

    setVideoLoading((prev) => ({
      ...prev,
      [videoUrl]: false,
    }));

    setVideoUnavailable((prev) => ({
      ...prev,
      [videoUrl]: true,
    }));

    setVideoTimes((prev) => ({
      ...prev,
      [videoUrl]: 0,
    }));

    setVideoDurations((prev) => ({
      ...prev,
      [videoUrl]: 0,
    }));

    if (videoUrl === masterVideoUrl) {
  setIsPlaying(false);
  setCurrentTime(0);
  setDuration(0);
}
  },
  [masterVideoUrl]
);

  const handleBookmarksChange = useCallback(
  (bookmarks: any[], videoUrl: string) => {

    setBookmarksByVideo((prev) => ({
      ...prev,
      [videoUrl]: bookmarks,
    }));
  },
  []
);

  const handleLabelsLoaded = useCallback((labels: LabelsMap, videoUrl: string) => {
    setLabelsByVideo((prev) => ({
      ...prev,
      [videoUrl]: labels,
    }));
  }, []);

  const handleSelectChange = (
    fieldName: keyof PlaybackFormValues,
    value: string
  ) => {
    form.setFieldValue(fieldName, value);

    if (fieldName === "company") {
      form.setFieldsValue({
        site: undefined,
        device: undefined,
        mission: undefined,
      });

      setSelectedVideos([]);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      setBookmarksByVideo({});
      setLabelsByVideo({});
      resetPlayback();
    } else if (fieldName === "site") {
      form.setFieldsValue({
        device: undefined,
        mission: undefined,
      });

      setSelectedVideos([]);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      setBookmarksByVideo({});
      setLabelsByVideo({});
      resetPlayback();
    } else if (fieldName === "device") {
      form.setFieldsValue({
        mission: undefined,
      });

      setSelectedVideos([]);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      setBookmarksByVideo({});
      setLabelsByVideo({});
      resetPlayback();
    } else if (fieldName === "mission") {
      setSelectedVideos([]);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      setBookmarksByVideo({});
      setLabelsByVideo({});
    }
  };

  const handleVideoSelectionChange = (value: string[]) => {
    const limited = value.slice(0, 2);

    Object.keys(playerRefs.current).forEach((key) => {
      if (!limited.includes(key)) {
        delete playerRefs.current[key];
      }
    });

    setSelectedVideos(limited);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setVideoTimes({});
    setVideoDurations({});
    setVideoOffsets(
      limited.reduce<Record<string, number>>((result, videoUrl) => {
        result[videoUrl] = 0;
        return result;
      }, {})
    );
    setVideoLoading({});
    setVideoUnavailable({});
    playbackErrorCountRef.current = {};
    setBookmarksByVideo((prev) => {
      const next: Record<string, VideoBookmark[]> = {};
      limited.forEach((url) => {
        if (prev[url]) next[url] = prev[url];
      });
      return next;
    });
    setLabelsByVideo((prev) => {
      const next: Record<string, LabelsMap> = {};
      limited.forEach((url) => {
        if (prev[url]) next[url] = prev[url];
      });
      return next;
    });
  };

  const handleRemoveVideo = (index: number) => {
    const removedVideo = selectedVideos[index];

    if (removedVideo) {
      delete playerRefs.current[removedVideo];
    }

    setVideoLoading((prev) => {
      const next = { ...prev };
      if (removedVideo) delete next[removedVideo];
      return next;
    });

    setVideoUnavailable((prev) => {
      const next = { ...prev };

      if (removedVideo) {
        delete next[removedVideo];
      }

      return next;
    });

  setVideoOffsets((prev) => {
    const next = { ...prev };

    if (removedVideo) {
      delete next[removedVideo];
    }

    return next;
  });

if (removedVideo) {
  delete playbackErrorCountRef.current[removedVideo];
}

    setSelectedVideos((prev) => prev.filter((_, i) => i !== index));
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);

    setVideoTimes((prev) => {
      const next = { ...prev };
      if (removedVideo) delete next[removedVideo];
      return next;
    });

    setVideoDurations((prev) => {
      const next = { ...prev };
      if (removedVideo) delete next[removedVideo];
      return next;
    });

    setBookmarksByVideo((prev) => {
      const next = { ...prev };
      if (removedVideo) delete next[removedVideo];
      return next;
    });

    setLabelsByVideo((prev) => {
      const next = { ...prev };
      if (removedVideo) delete next[removedVideo];
      return next;
    });
  };

 const handlePlayPause = async () => {
  if (selectedVideos.length === 0) return;

  try {
    const availablePlayers = selectedVideos
      .filter((videoUrl) => !videoUnavailable[videoUrl])
      .map((videoUrl) => ({
        videoUrl,
        player: playerRefs.current[videoUrl],
      }))
      .filter(
        (
          item
        ): item is {
          videoUrl: string;
          player: HLSPlayerRef;
        } => Boolean(item.player)
      );

    if (availablePlayers.length === 0) return;

    const shouldPlay = availablePlayers.some(({ player }) =>
      player.isPaused()
    );

    if (shouldPlay) {
  seekAllVideosToSharedTime(currentTime);

  await Promise.all(
    availablePlayers.map(({ player }) => player.play())
  );

  setIsPlaying(true);
} else {
      availablePlayers.forEach(({ player }) => {
        player.pause();
      });

      setIsPlaying(false);
    }
  } catch (error) {
    console.error("Playback toggle failed:", error);
  }
};

  const handlePrevious = () => {
  if (selectedVideos.length === 0) return;

  const nextSharedTime = Math.max(0, currentTime - 10);

  seekAllVideosToSharedTime(nextSharedTime);
  setCurrentTime(nextSharedTime);
};

 const handleNext = () => {
  if (selectedVideos.length === 0) return;

  const nextSharedTime = Math.min(
    mainDuration,
    currentTime + 10
  );

  seekAllVideosToSharedTime(nextSharedTime);
  setCurrentTime(nextSharedTime);
};

  const handleSliderChange = (value: number) => {
    setCurrentTime(value);
  };

  const handleTimeChangeComplete = (value: number) => {
  seekAllVideosToSharedTime(value);
  setCurrentTime(value);
};

  const toggleModule = (value: number) => {
    setSelectedModules((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const toggleAllModules = (type: AICategory) => {
    const categoryValues = aiModules
      .filter((item) => item.type === type)
      .map((item) => item.value);

    const allSelected = categoryValues.every((value) =>
      selectedModules.includes(value)
    );

    if (allSelected) {
      setSelectedModules((prev) =>
        prev.filter((item) => !categoryValues.includes(item))
      );
    } else {
      setSelectedModules((prev) => [...new Set([...prev, ...categoryValues])]);
    }
  };

  const commonCount = aiModules.filter((item) => item.type === "common").length;
  const dangerCount = aiModules.filter((item) => item.type === "danger").length;

  const selectedCommonCount = selectedModules.filter(
    (value) => aiModules.find((item) => item.value === value)?.type === "common"
  ).length;

  const selectedDangerCount = selectedModules.filter(
    (value) => aiModules.find((item) => item.value === value)?.type === "danger"
  ).length;

  
useEffect(() => {
  return () => {
    if (sharedSeekTimerRef.current) {
      clearTimeout(sharedSeekTimerRef.current);
      sharedSeekTimerRef.current = null;
    }
  };
}, []);
  
// Load company list
useEffect(() => {
  if (userRole === 1) {
    getCompanyList();
  }
}, [userRole, getCompanyList]);

// Default company for non-admin
useEffect(() => {
  if (userRole !== 1 && detailUserLogin?.user?.companyId) {
    form.setFieldValue("company", detailUserLogin.user.companyId);
  }
}, [userRole, detailUserLogin, form]);

// Set video from history
useEffect(() => {
  if (!historyPlaybackState?.playbackUrl) return;
  setSelectedVideos([historyPlaybackState.playbackUrl]);
}, [historyPlaybackState?.playbackUrl]);

// Set company
useEffect(() => {
  if (!historyPlaybackState?.companyId) return;
  form.setFieldValue("company", historyPlaybackState.companyId);
}, [historyPlaybackState?.companyId, form]);

// Load sites
useEffect(() => {
  if (values?.company) {
    getListByCompany(values.company);
  }
}, [values?.company, getListByCompany]);

// Set site
useEffect(() => {
  if (!historyPlaybackState?.siteId) return;
  form.setFieldValue("site", historyPlaybackState.siteId);
}, [historyPlaybackState?.siteId, form]);

// Load robots + missions
useEffect(() => {
  if (values?.site) {

    getRobotListBySite(values.site, "site");
    getMissionListBySite(values.site);
  }
}, [values?.site, getRobotListBySite, getMissionListBySite]);

// Map deviceSn → deviceId
useEffect(() => {
  if (!historyPlaybackState?.deviceSn || robotList.length === 0) return;

  const matched = robotList.find(
    (item) => item.deviceSn === historyPlaybackState.deviceSn
  );

  if (matched) {
    form.setFieldValue("device", matched.deviceId);
  }
}, [historyPlaybackState?.deviceSn, robotList, form]);

// Set mission
useEffect(() => {
  if (!historyPlaybackState?.missionId || missionList.length === 0) return;
  form.setFieldValue("mission", historyPlaybackState.missionId);
}, [historyPlaybackState?.missionId, missionList, form]);

// Load playback list
useEffect(() => {
  if (!values?.company) {
    resetPlayback();
    return;
  }

  getPlayback({
    companyId: values.company,
    siteId: values.site || "",
    deviceSn: selectedDevice?.deviceSn || "",
    missionId: values.mission || "",
  });
}, [
  values?.company,
  values?.site,
  values?.mission,
  selectedDevice?.deviceSn,
  getPlayback,
  resetPlayback,
]);

// Reset playback state
useEffect(() => {
  if (selectedVideos.length === 0) {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }
}, [selectedVideos]);

// Loading state
useEffect(() => {
  if (selectedVideos.length === 0) return;

  const nextLoading: Record<string, boolean> = {};
  selectedVideos.forEach((url) => {
    nextLoading[url] = true;
  });

  setVideoLoading(nextLoading);
}, [selectedVideos]);

  const getVideoStatus = (videoUrl: string) => {
  if (videoUnavailable[videoUrl]) {
    return {
      label: t("playback_unavailable_status"),
      dotClass: "bg-[#EF4444]",
    };
  }

  if (videoLoading[videoUrl]) {
    return {
      label: t("playback_loading"),
      dotClass: "bg-[#F59E0B]",
    };
  }

  if (isPlaying) {
    return {
      label: "PLAY",
      dotClass: "bg-[#22C55E]",
    };
  }

  return {
    label: "PAUSE",
    dotClass: "bg-[#F59E0B]",
  };
};

const allSelectedVideosUnavailable =
  selectedVideos.length > 0 &&
  selectedVideos.every(
    (videoUrl) => videoUnavailable[videoUrl]
  );

  const timelineMarkers = useMemo(() => {
  if (mainDuration <= 0) {
    return [];
  }

  const buildMarkers = (
    videoUrl: string | undefined,
    position: "top" | "bottom"
  ): TimelineMarker[] => {

    if (!videoUrl) return [];

    const bookmarks = bookmarksByVideo[videoUrl] || [];
    const labelsMap = labelsByVideo[videoUrl] || {};
    const videoOffset = videoOffsets[videoUrl] || 0;



    return bookmarks
        .filter((bookmark) => {
          if (bookmark.timeSec == null) {
            return false;
          }

          if (!Array.isArray(bookmark.c_ar) || bookmark.c_ar.length === 0) {
            return false;
          }

          return bookmark.c_ar.some((classId) =>
          selectedModules.includes(Number(classId))
        );
      })
      .map((bookmark, index) => {
        const selectedBookmarkClassIds =
          bookmark.c_ar?.filter((classId) =>
            selectedModules.includes(Number(classId))
          ) || [];

        const markerLabels = selectedBookmarkClassIds
          .map((classId) => labelsMap[Number(classId)])
          .filter((label): label is string => Boolean(label));

        const primaryLabel = markerLabels[0] || "";

        const fallbackLabel =
          markerLabels.length > 0
            ? markerLabels.join(", ")
            : bookmark.type != null
            ? `Event ${bookmark.type}`
            : t("playback_event");

        const marker = {
          id: `${videoUrl}-${index}`,
          timeSec: Number(
            Math.max(
              0,
              Number(bookmark.timeSec || 0) - videoOffset
            ).toFixed(1)
          ),
          type: getMarkerTypeFromLabel(primaryLabel),
          label: fallbackLabel,
          confidence: getMarkerConfidence(selectedBookmarkClassIds),
          position,
          classIds: selectedBookmarkClassIds,
          labels: markerLabels,
        };

        return marker;
      })
      .filter((marker) => {
        const valid =
          marker.timeSec >= 0 && marker.timeSec <= mainDuration;

        if (!valid) {
        }

        return valid;
      });
  };

  const primary = buildMarkers(selectedVideos[0], "top");
  const secondary = buildMarkers(selectedVideos[1], "bottom");

  const result = [...primary, ...secondary].sort(
    (a, b) => a.timeSec - b.timeSec
  );
  return result;
}, [
  bookmarksByVideo,
  labelsByVideo,
  selectedVideos,
  selectedModules,
  videoOffsets,
  mainDuration,
  t,
]);
const selectedVideoInfo = selectedVideos[0]
  ? deviceInfoByVideo[selectedVideos[0]]
  : undefined;

const playbackLatitude = parseCoordinate(
  selectedVideoInfo?.latitude,
  selectedVideoInfo?.lat,
  selectedVideoInfo?.gpsLatitude,
  selectedVideoInfo?.gps_latitude,
  selectedVideoInfo?.location?.latitude,
  selectedVideoInfo?.location?.lat
);

const playbackLongitude = parseCoordinate(
  selectedVideoInfo?.longitude,
  selectedVideoInfo?.lng,
  selectedVideoInfo?.lon,
  selectedVideoInfo?.gpsLongitude,
  selectedVideoInfo?.gps_longitude,
  selectedVideoInfo?.location?.longitude,
  selectedVideoInfo?.location?.lng,
  selectedVideoInfo?.location?.lon
);

const hasValidPlaybackCoordinates =
  playbackLatitude !== undefined &&
  playbackLongitude !== undefined &&
  Number.isFinite(playbackLatitude) &&
  Number.isFinite(playbackLongitude) &&
  playbackLatitude >= -90 &&
  playbackLatitude <= 90 &&
  playbackLongitude >= -180 &&
  playbackLongitude <= 180 &&
  !(playbackLatitude === 0 && playbackLongitude === 0);

const playbackMapGpsData = useMemo(() => {
  if (!hasValidPlaybackCoordinates) {
    return [];
  }

  return [
    {
      lat: playbackLatitude as number,
      lng: playbackLongitude as number,
      time: currentTime,
    },
  ];
}, [
  hasValidPlaybackCoordinates,
  playbackLatitude,
  playbackLongitude,
  currentTime,
]);
  return (
<div className="w-full h-full overflow-auto text-[#111827] bg-[#F6F7F9]">
      <div className="w-full min-w-[1120px] min-h-full grid grid-cols-[minmax(700px,1fr)_390px] gap-[11px]">
      <div className="min-w-[700px] flex flex-col bg-[#F6F7F9] px-6 py-7 gap-4 rounded-[10px] overflow-hidden">
        <Form layout="vertical" form={form}>
          


      <div className="grid grid-cols-[1fr_1.15fr_1fr_1fr_220px] gap-3 items-center max-w-full">
          <Form.Item
            name="company"
            className="mb-0"
            rules={[
              {
                required: true,
                message: t("playback_validation_select_company"),
              },
            ]}
          >
            <Select
              placeholder={t("stream_select_company")}
              options={companyOptions}
              disabled={userRole !== 1}
              className="h-[48px]"
              onChange={(value) => handleSelectChange("company", value)}
            />
          </Form.Item>

          <Form.Item
            name="site"
            className="mb-0"
            rules={[
              {
                required: true,
                message: t("playback_validation_select_site"),
              },
            ]}
          >
            <Select
              placeholder={t("stream_select_site")}
              options={siteOptions}
              disabled={!values?.company}
              className="h-[48px]"
              onChange={(value) => handleSelectChange("site", value)}
            />
          </Form.Item>

          <Form.Item
            name="device"
            className="mb-0"
            rules={[
              {
                required: true,
                message: t("playback_validation_select_device"),
              },
            ]}
          >
            <Select
              placeholder={t("stream_select_device")}
              options={deviceOptions}
              disabled={!values?.site}
              className="h-[48px]"
              onChange={(value) => handleSelectChange("device", value)}
            />
          </Form.Item>

          <Form.Item
            name="mission"
            className="mb-0"
            rules={[
              {
                required: true,
                message: t("playback_validation_select_mission"),
              },
            ]}
          >
            <Select
              placeholder={t("stream_select_mission")}
              options={missionOptions}
              disabled={!values?.device}
              className="h-[48px]"
              onChange={(value) => handleSelectChange("mission", value)}
            />
          </Form.Item>

          <Select
              mode="multiple"
              placeholder="Select Video"
              value={selectedVideos}
              options={videoOptions}
              loading={videoLoading.video}
              disabled={
                !values?.company ||
                !values?.site ||
                !values?.device ||
                !values?.mission ||
                videoLoading.video ||
                videoOptions.length === 0
              }
              notFoundContent={videoLoading.video ? "Loading..." : "No data"}
              onChange={handleVideoSelectionChange}
              className="w-full h-[48px]"
              popupMatchSelectWidth={220}
            />
        </div>




        </Form>

        <div
            className={
              selectedVideos.length === 0
                ? "relative min-w-[660px] min-h-[430px] bg-[#364152] rounded-[10px] overflow-hidden"
                : "relative min-w-[660px] w-full"
            }
          >
          {selectedVideos.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-[#D5D7D8]">
              <img src={NoVideoIcon} alt="No video available" className="w-24 h-24" />
              <p className="text-base">{t("playback_no_video")}</p>
            </div>
          ) : selectedVideos.length === 1 ? (
            <div className="p-2 h-full">
              <div className="relative w-full h-[410px] rounded-[8px] bg-black overflow-hidden">
                <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-[#374151]/90 rounded-full px-3 py-1.5 text-xs font-semibold text-white">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      selectedVideos[0] && getVideoStatus(selectedVideos[0]).dotClass
                    }`}
                  />
                  <span>
                    {selectedVideos[0]
                      ? getVideoStatus(selectedVideos[0]).label
                      : "PAUSE"}
                  </span>
                </div>

                {videoUnavailable[selectedVideos[0]] ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-black px-5 text-center">
                      <img
                        src={NoVideoIcon}
                        alt={t("playback_recording_unavailable")}
                        className="w-20 h-20 opacity-80"
                      />

                      <div>
                        <h3 className="text-white text-[18px] font-bold">
                          {t("playback_recording_unavailable")}
                        </h3>

                        <p className="mt-2 text-[#D1D5DB] text-[14px]">
                          {t("playback_recording_unavailable_description")}
                        </p>
                      </div>
                    </div>
                  ) : (
                <HLSPlayer
                  ref={(instance) => {
                    if (selectedVideos[0]) {
                      playerRefs.current[selectedVideos[0]] = instance;
                    }
                  }}
                  src={selectedVideos[0]}
                  onError={(error) => {
                    handlePlaybackError(selectedVideos[0], error);
                  }}
                  onDeviceInfoUpdate={handleDeviceInfoUpdate}
                  metadataBaseUrl={
                    selectedVideos[0]
                      ? metadataBaseByVideo[selectedVideos[0]]
                      : undefined
                  }
                  selectedClassIds={selectedModules}
                  showCommonDetection={selectedModules.some((value) =>
                    aiModules.some(
                      (item) =>
                        item.value === value &&
                        item.type === "common"
                    )
                  )}
                  showDangerDetection={selectedModules.some((value) =>
                    aiModules.some(
                      (item) =>
                        item.value === value &&
                        item.type === "danger"
                    )
                  )}
                  onBookmarksChange={handleBookmarksChange}
                  onLabelsLoaded={handleLabelsLoaded}
                  className="w-full h-full object-contain bg-black"
                  autoPlay={false}
                  muted={true}
                  controls={false}
                  type="playback"
                  onLoadedMetadata={() => {
                    const videoUrl = selectedVideos[0];

                    const player = videoUrl
                      ? playerRefs.current[videoUrl]
                      : null;

                    const playerDuration = player?.getDuration() || 0;

                    if (videoUrl) {
                      playbackErrorCountRef.current[videoUrl] = 0;

                      setVideoLoading((prev) => ({
                        ...prev,
                        [videoUrl]: false,
                      }));

                      setVideoUnavailable((prev) => ({
                        ...prev,
                        [videoUrl]: false,
                      }));

                      setVideoDurations((prev) => ({
                        ...prev,
                        [videoUrl]: playerDuration,
                      }));
                    }

                    setDuration(playerDuration);

                    if (
                      videoUrl === historyPlaybackState?.playbackUrl &&
                      historySeekTime > 0
                    ) {
                      player?.seekTo(historySeekTime);
                      setCurrentTime(historySeekTime);

                      if (videoUrl) {
                        setVideoTimes((prev) => ({
                          ...prev,
                          [videoUrl]: historySeekTime,
                        }));
                      }
                    }
                  }}
                  onTimeUpdate={() => {
                    const player = selectedVideos[0]
                      ? playerRefs.current[selectedVideos[0]]
                      : null;

                    const playerTime = player?.getCurrentTime() || 0;
                    const playerDuration = player?.getDuration() || 0;

                    if (selectedVideos[0]) {
                      setVideoTimes((prev) => ({
                        ...prev,
                        [selectedVideos[0]]: playerTime,
                      }));

                      setVideoDurations((prev) => ({
                        ...prev,
                        [selectedVideos[0]]: playerDuration,
                      }));
                    }

                    setCurrentTime(playerTime);
                    setDuration(playerDuration);
                    setIsPlaying(!(player?.isPaused() ?? true));
                  }}
                  onEnded={() => {
                    setIsPlaying(false);
                  }}
                />
              )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 w-full">
            {selectedVideoItems.map((video) => {
              const videoTime = videoTimes[video.value] || 0;
              const videoDuration = videoDurations[video.value] || 0;
              const videoOffset = videoOffsets[video.value] || 0;

              return (
                <div
                    key={video.value}
                    className="relative w-full min-w-0"
                  >
                  <div className="relative w-full aspect-video rounded-[8px] bg-black overflow-hidden">
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-2 bg-[#374151]/90 rounded-full px-3 py-1.5 text-xs font-semibold text-white">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          getVideoStatus(video.value).dotClass
                        }`}
                      />
                      <span>{getVideoStatus(video.value).label}</span>
                    </div>

                    <div className="w-full h-full">
                      {videoUnavailable[video.value] ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-black px-5 text-center">
                          <img
                            src={NoVideoIcon}
                            alt={t("playback_recording_unavailable")}
                            className="w-16 h-16 opacity-80"
                          />

                          <div>
                            <h3 className="text-white text-[16px] font-bold">
                              {t("playback_recording_unavailable")}
                            </h3>

                            <p className="mt-2 text-[#D1D5DB] text-[13px]">
                              {t("playback_recording_unavailable_description")}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <HLSPlayer
                          ref={(instance) => {
                            playerRefs.current[video.value] = instance;
                          }}
                          src={video.value}
                          onError={(error) => {
                            handlePlaybackError(video.value, error);
                          }}
                          onDeviceInfoUpdate={handleDeviceInfoUpdate}
                          metadataBaseUrl={metadataBaseByVideo[video.value]}
                          selectedClassIds={selectedModules}
                          showCommonDetection={selectedModules.some((value) =>
                            aiModules.some(
                              (item) =>
                                item.value === value &&
                                item.type === "common"
                            )
                          )}
                          showDangerDetection={selectedModules.some((value) =>
                            aiModules.some(
                              (item) =>
                                item.value === value &&
                                item.type === "danger"
                            )
                          )}
                          onBookmarksChange={handleBookmarksChange}
                          onLabelsLoaded={handleLabelsLoaded}
                          className="w-full h-full object-contain bg-black"
                          autoPlay={false}
                          muted={true}
                          controls={false}
                          type="playback"
                          onLoadedMetadata={() => {
                            const player = playerRefs.current[video.value];
                            const playerDuration =
                              player?.getDuration() || 0;

                            playbackErrorCountRef.current[video.value] = 0;

                            setVideoLoading((prev) => ({
                              ...prev,
                              [video.value]: false,
                            }));

                            setVideoUnavailable((prev) => ({
                              ...prev,
                              [video.value]: false,
                            }));

                            setVideoDurations((prev) => ({
                              ...prev,
                              [video.value]: playerDuration,
                            }));

                            if (video.value === masterVideoUrl) {
                              setDuration(playerDuration);
                            }

                            if (
                              video.value === historyPlaybackState?.playbackUrl &&
                              historySeekTime > 0
                            ) {
                              player?.seekTo(historySeekTime);

                              setVideoTimes((prev) => ({
                                ...prev,
                                [video.value]: historySeekTime,
                              }));

                              if (video.value === masterVideoUrl) {
                                setCurrentTime(historySeekTime);
                              }
                            }
                          }}
                          onTimeUpdate={() => {
                            const player =
                              playerRefs.current[video.value];

                            const playerTime =
                              player?.getCurrentTime() || 0;

                            const playerDuration =
                              player?.getDuration() || 0;

                            setVideoTimes((prev) => ({
                              ...prev,
                              [video.value]: playerTime,
                            }));

                            setVideoDurations((prev) => ({
                              ...prev,
                              [video.value]: playerDuration,
                            }));

                            if (
                              video.value === masterVideoUrl &&
                              !isSharedSeekingRef.current
                            ) {
                              const masterOffset =
                                getVideoOffset(video.value);

                              const nextSharedTime = Math.min(
                                mainDuration,
                                Math.max(
                                  0,
                                  playerTime - masterOffset
                                )
                              );

                              setCurrentTime(nextSharedTime);
                              setDuration(mainDuration);
                              setIsPlaying(
                                !(player?.isPaused() ?? true)
                              );
                            }
                          }}
                          onEnded={() => {
                            if (video.value === masterVideoUrl) {
                              setIsPlaying(false);
                            }
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-2 w-full bg-white rounded-[8px] px-4 py-3">
                    <Slider
                      className="w-full"
                      min={OFFSET_MIN_SECONDS}
                      max={OFFSET_MAX_SECONDS}
                      step={0.1}
                      value={videoOffset}
                      tooltip={{
                        formatter: (value) =>
                          formatOffset(Number(value || 0)),
                      }}
                      onChange={(nextOffset) => {
                        const numericOffset = Number(nextOffset);

                        setVideoOffsets((prev) => ({
                          ...prev,
                          [video.value]: numericOffset,
                        }));

                        const player = playerRefs.current[video.value];

                        if (!player) return;

                        const targetTime = getVideoTargetTime(
                          video.value,
                          currentTime,
                          numericOffset
                        );

                        const playerTime = player.getCurrentTime();

                        if (
                          Math.abs(playerTime - targetTime) >
                          SYNC_TOLERANCE_SECONDS
                        ) {
                          player.seekTo(targetTime);
                        }
                      }}
                      onChangeComplete={(nextOffset) => {
                        const numericOffset = Number(nextOffset);

                        setVideoOffsets((prev) => ({
                          ...prev,
                          [video.value]: numericOffset,
                        }));

                        const player = playerRefs.current[video.value];

                        if (!player) return;

                        player.seekTo(
                          getVideoTargetTime(
                            video.value,
                            currentTime,
                            numericOffset
                          )
                        );
                      }}
                    />

                    <div className="text-sm text-[#6B7280] text-left mt-2 mx-1">
                      {formatTime(videoTime)} / {formatTime(videoDuration)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
        <div className="min-w-[660px]">
        <ControlBar
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={mainDuration}
          onPlayPause={handlePlayPause}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onTimeChange={handleSliderChange}
          onTimeChangeComplete={handleTimeChangeComplete}
          disabled={
            selectedVideos.length === 0 ||
            allSelectedVideosUnavailable
          }
          bookmarks={timelineMarkers}
          showCommonDetection={selectedModules.some((value) =>
            aiModules.some(
              (item) =>
                item.value === value &&
                item.type === "common"
            )
          )}
          showDangerDetection={selectedModules.some((value) =>
            aiModules.some(
              (item) =>
                item.value === value &&
                item.type === "danger"
            )
          )}
        />
        </div>
        <div
  className={`grid gap-4 ${
    selectedVideoItems.length > 1 ? "grid-cols-2" : "grid-cols-1"
  }`}
>
  {selectedVideoItems.map((video) => (
    <div key={video.value} className="space-y-3">
      <h3 className="text-[18px] font-bold text-[#111827]">
        {video.label}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {/* Robot Status */}
        <div className="bg-white rounded-[10px] p-6 min-h-[250px]">
          <h2 className="text-[20px] font-bold mb-8 text-[#111827]">
            {t("playback_robot_status")}
          </h2>

          <div className="space-y-6 text-sm">
  <div className="flex justify-between">
    <span>{t("stream_info_status")}</span>
    <span className="px-3 py-1 rounded-full bg-green-200 text-green-700 font-bold">
  {selectedVideoInfo?.status ?? "-"}
</span>
  </div>

  <div className="flex justify-between">
    <span>{t("stream_info_battery")}</span>
    <span className="px-3 py-1 rounded-full bg-green-200 text-green-700 font-bold">
  {selectedVideoInfo?.battery != null ? `${selectedVideoInfo.battery}%` : "-"}
</span>
  </div>

  <div className="flex justify-between">
    <span>{t("stream_info_network")}</span>
    <span className="px-3 py-1 rounded-full bg-green-200 text-green-700 font-bold">
  {selectedVideoInfo?.network ?? "-"}
</span>
  </div>

  <div className="flex justify-between">
    <span>{t("stream_info_gps")}</span>
    <span className="px-3 py-1 rounded-full bg-green-200 text-green-700 font-bold">
  {selectedVideoInfo?.gps ?? "-"}
</span>
  </div>
</div>
        </div>

       {/* Operation Info */}
<div className="bg-white rounded-[10px] p-6 min-h-[250px]">
  <h2 className="text-[20px] font-bold mb-8 text-[#111827]">
    {t("playback_operation_info")}
  </h2>

<div className="space-y-6 text-sm text-[#111827]">
      <div className="flex justify-between">
      <span>{t("stream_info_altitude")}</span>
      <span className="font-bold text-[#6B7280]">
  {selectedVideoInfo?.altitude != null
    ? `${Number(selectedVideoInfo.altitude).toFixed(2)} m`
    : "-"}
</span>
    </div>

    <div className="flex justify-between">
      <span>{t("stream_info_speed")}</span>
      <span className="font-bold text-[#6B7280]">
  {selectedVideoInfo?.speed != null
    ? `${selectedVideoInfo.speed} m/s`
    : "-"}
</span>
    </div>

    <div className="flex justify-between">
  <span>{t("stream_info_operating_hour")}</span>

  <span className="font-bold text-[#6B7280]">
    {new Date(currentTime * 1000)
      .toISOString()
      .substring(11, 19)}
  </span>
</div>

    <div className="flex justify-between">
      <span>{t("stream_info_start_time")}</span>
      <span className="font-bold text-[#6B7280]">
  {selectedVideoItems?.[0]?.label ?? "-"}
</span>
    </div>
  </div>
</div>
      </div>
    </div>
  ))}
</div>
      </div>

      <div className="w-[390px] shrink-0 px-6 py-7 flex flex-col gap-3 bg-[#F6F7F9] rounded-[10px]">
        <div className="w-full p-6 bg-white rounded-[10px]">
          <h2 className="text-[20px] font-bold mb-4 text-[#111827]">
            {t("playback_selected_video")}
          </h2>

          <div className="space-y-3">
            {selectedVideoItems.length === 0 ? (
              <div className="flex items-center justify-center bg-[#F6F7F9] border border-dashed border-[#DDE0E5] rounded-lg px-4 py-5 text-gray-400 text-sm">
                <img src={SelectIcon} alt="Select Icon" className="mr-2" />
                {t("playback_select_first_video")}
              </div>
            ) : (
              selectedVideoItems.map((video, index) => (
                <div
                  key={video.value}
                  className="flex items-center justify-between gap-4 bg-[#F6F7F9] border border-[#DDE0E5] rounded-lg px-5 py-4 min-h-[66px]"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <img src={FolderIcon} alt="Folder Icon" className="w-7 h-7 flex-shrink-0" />

                    <div
                      className="text-[15px] font-semibold text-[#1F2937] whitespace-nowrap overflow-visible"
                      title={video.label}
                    >
                      {video.label}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveVideo(index)}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <img src={XIcon} alt="Remove Icon" className="w-6 h-6" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="w-full p-6 h-[350px] bg-white rounded-[10px]">
          <h2 className="text-[20px] font-bold mb-5 text-[#111827]">
            {t("stream_ai_module")}
          </h2>

          <div className="flex gap-3 h-[calc(100%-36px)]">
            <div className="flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="text-[16px] font-bold leading-[1.05] text-[#111827]">
                  {t("stream_ai_common")}
                </div>
                <div className="text-[13px] text-gray-500 flex items-center">
                  <Switch
                    size="small"
                    checked={selectedCommonCount === commonCount}
                    onChange={() => toggleAllModules("common")}
                    className="mr-1!"
                  />
                  ({selectedCommonCount}/{commonCount})
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-[#F6F7F9] border border-[#DDE0E5] rounded-[8px] p-2 space-y-2">
                {aiModules
                  .filter((item) => item.type === "common")
                  .map((item) => {
                    const isChecked = selectedModules.includes(item.value);

                    return (
                      <div
                        key={item.value}
                        className="relative bg-white border border-[#E5E7EB] rounded-[8px] p-3"
                      >
                        <div className="absolute top-0 right-2">
                          <svg width="10" height="22" viewBox="0 0 10 22" fill="none">
                            <path d="M0 0H10V16L5 22L0 16V0Z" fill={item.color} />
                          </svg>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-[10px] text-gray-400 mb-1">
                              {item.category}
                            </div>
                            <div className="text-[12px] font-bold text-[#333] leading-tight">
                              {item.label}
                            </div>
                          </div>

                          <Switch
                            size="small"
                            checked={isChecked}
                            onChange={() => toggleModule(item.value)}
                            style={{
                              backgroundColor: isChecked ? item.color : "#d1d5db",
                              marginRight: "8px",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="text-[16px] font-bold leading-[1.05] text-[#111827]">
                  {t("stream_ai_danger")}
                </div>
                <div className="text-[13px] text-gray-500 flex items-center">
                  <Switch
                    size="small"
                    checked={selectedDangerCount === dangerCount}
                    onChange={() => toggleAllModules("danger")}
                    className="mr-1!"
                  />
                  ({selectedDangerCount}/{dangerCount})
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-[#F6F7F9] border border-[#DDE0E5] rounded-[8px] p-2 space-y-2">
                {aiModules
                  .filter((item) => item.type === "danger")
                  .map((item) => {
                    const isChecked = selectedModules.includes(item.value);

                    return (
                      <div
                        key={item.value}
                        className="relative bg-white border border-[#E5E7EB] rounded-[8px] p-3"
                      >
                        <div className="absolute top-0 right-2">
                          <svg width="10" height="22" viewBox="0 0 10 22" fill="none">
                            <path d="M0 0H10V16L5 22L0 16V0Z" fill={item.color} />
                          </svg>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-[10px] text-gray-400 mb-1">
                              {item.category}
                            </div>
                            <div className="text-[12px] font-bold text-[#333] leading-tight">
                              {item.label}
                            </div>
                          </div>

                          <Switch
                            size="small"
                            checked={isChecked}
                            onChange={() => toggleModule(item.value)}
                            style={{
                              backgroundColor: isChecked ? item.color : "#d1d5db",
                              marginRight: "8px",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full p-6 bg-white rounded-[10px]">
          <h2 className="text-[20px] font-bold mb-6 text-[#111827]">
            {t("playback_route_map")}
          </h2>
          <div className="h-[260px] bg-[#F6F7F9] rounded-[8px] overflow-hidden">
            {selectedVideos.length > 0 && hasValidPlaybackCoordinates ? (
            <LiveMap
              currentTime={currentTime}
              latitude={playbackLatitude}
              longitude={playbackLongitude}
              videoUrl={selectedVideos[0] || ""}
              gpsData={playbackMapGpsData}
              streamStatus={{
                error: null,
                isLoading: false,
                videoConnected: true,
                isPaused: !isPlaying,
                isReconnecting: false,
              }}
              mode="playback"
            />
          ) : (
            <div className="h-full w-full bg-[#737D89] rounded-[8px] flex items-center justify-center text-white text-[15px]">
              {selectedVideos.length > 0
                ? "GPS coordinates are not available"
                : t("playback_map_idle_message")}
            </div>
          )}
           
          </div>
        </div>
      </div>
    </div>
    </div>
  )}
