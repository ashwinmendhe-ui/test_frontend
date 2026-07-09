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
import { Form, Select, Switch } from "antd";
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
  value: string;
  label: string;
  category: string;
  type: AICategory;
  color: string;
};

type DeviceInfo = {
  deviceName: string;
  companyName: string;
  siteName: string;
  missionName: string;
  status: string;
  deviceSn: string;
  startTime: string;
  operatingHour: string;
  latitude: string;
  longitude: string;
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
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
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
  const [videoLoading, setVideoLoading] = useState<Record<string, boolean>>({});
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
    { value: "construction", label: "Construction", category: "YOLO", type: "common", color: "#8B6F63" },
    { value: "hardhat", label: "HardHat", category: "YOLO", type: "common", color: "#FFD600" },
    { value: "machinery", label: "Machinery", category: "YOLO", type: "common", color: "#14B8C8" },
    { value: "mask", label: "Mask", category: "YOLO", type: "common", color: "#A855F7" },
    { value: "person", label: "Person", category: "YOLO", type: "common", color: "#22C55E" },
    { value: "vest", label: "Safety Vest", category: "YOLO", type: "common", color: "#1683FF" },
    { value: "vehicle", label: "Vehicle", category: "YOLO", type: "common", color: "#1683FF" },
    { value: "cone", label: "Safety Cone", category: "YOLO", type: "common", color: "#FF8A00" },

    { value: "no-hardhat", label: "No HardHat", category: "YOLO", type: "danger", color: "#FF2D55" },
    { value: "no-vest", label: "No Safety Vest", category: "YOLO", type: "danger", color: "#FF8A00" },
    { value: "no-mask", label: "No Mask", category: "YOLO", type: "danger", color: "#D100D8" },
    { value: "llm-hardhat", label: "No HardHat", category: "LLM", type: "danger", color: "#FF2D55" },
    { value: "llm-vest", label: "No Safety Vest", category: "LLM", type: "danger", color: "#FF8A00" },
    { value: "llm-rope", label: "No Safety Rope", category: "LLM", type: "danger", color: "#FF2D55" },
  ],
  []
);

const [selectedModules, setSelectedModules] = useState<string[]>(() =>
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

  const selectedModuleIdsByVideo = useMemo(() => {
    const result: Record<string, number[]> = {};

    selectedVideos.forEach((videoUrl) => {
      const labels = labelsByVideo[videoUrl] || {};
      const matchedIds = Object.entries(labels)
        .filter(([, label]) => {
          const normalizedLabel = normalizeText(label);
          return selectedModules.some((moduleValue) =>
            normalizedLabel.includes(normalizeText(moduleValue))
          );
        })
        .map(([id]) => Number(id))
        .filter((id) => Number.isFinite(id));

      result[videoUrl] = matchedIds;
    });

    return result;
  }, [labelsByVideo, selectedModules, selectedVideos]);

  const mainDuration = useMemo(() => {
    if (selectedVideos.length === 0) return 0;
    const durations = selectedVideos.map((url) => videoDurations[url] || 0);
    return durations.length > 0 ? Math.max(...durations) : 0;
  }, [selectedVideos, videoDurations]);

  const mainVideoUrl = useMemo(() => {
    if (selectedVideos.length === 0) return undefined;

    return selectedVideos.reduce((longest, current) => {
      const longestDuration = videoDurations[longest] || 0;
      const currentDuration = videoDurations[current] || 0;
      return currentDuration > longestDuration ? current : longest;
    }, selectedVideos[0]);
  }, [selectedVideos, videoDurations]);

  const getMainPlayer = () => {
    if (!mainVideoUrl) return null;
    return playerRefs.current[mainVideoUrl] || null;
  };

  const playbackDeviceInfo: DeviceInfo = {
    deviceName:
      robotList.find((item) => item.deviceId === values?.device)?.deviceName || "-",
    companyName:
      companyList.find((item) => item.companyId === values?.company)?.name ||
      detailUserLogin?.user?.companyName ||
      "-",
    siteName: siteList.find((item) => item.siteId === values?.site)?.name || "-",
    missionName:
      missionList.find((item) => item.missionId === values?.mission)?.missionName ||
      "-",
    status: selectedVideos.length > 0 ? "active" : "inactive",
    deviceSn:
      robotList.find((item) => item.deviceId === values?.device)?.deviceSn || "-",
    startTime: "-",
    operatingHour: "_",
    latitude: "-",
    longitude: "-",
  };

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
    setVideoLoading({});
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
      const players = selectedVideos
        .map((url) => playerRefs.current[url])
        .filter(Boolean) as HLSPlayerRef[];

      if (players.length === 0) return;

      const shouldPlay = players.some((player) => player.isPaused());

      if (shouldPlay) {
        await Promise.all(
          players.map(async (player, index) => {
            const videoUrl = selectedVideos[index];
            const current = videoTimes[videoUrl] || 0;
            const videoDuration = videoDurations[videoUrl] || 0;

            if (videoDuration > 0 && current >= videoDuration) {
              player.seekTo(Math.max(0, videoDuration - 0.1));
            }

            await player.play();
          })
        );
        setIsPlaying(true);
      } else {
        players.forEach((player) => player.pause());
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("Playback toggle failed:", error);
    }
  };

  const handlePrevious = () => {
    const players = selectedVideos
      .map((url) => playerRefs.current[url])
      .filter(Boolean) as HLSPlayerRef[];

    if (players.length === 0) return;

    players.forEach((player, index) => {
      const videoUrl = selectedVideos[index];
      const current = videoTimes[videoUrl] || 0;
      const next = Math.max(0, current - 10);
      player.seekTo(next);
    });

    const nextMainTime = Math.max(0, currentTime - 10);
    setCurrentTime(nextMainTime);
  };

  const handleNext = () => {
    const players = selectedVideos
      .map((url) => playerRefs.current[url])
      .filter(Boolean) as HLSPlayerRef[];

    if (players.length === 0) return;

    players.forEach((player, index) => {
      const videoUrl = selectedVideos[index];
      const current = videoTimes[videoUrl] || 0;
      const videoDuration = videoDurations[videoUrl] || 0;
      const next = Math.min(videoDuration, current + 10);
      player.seekTo(next);
    });

    const nextMainTime = Math.min(mainDuration, currentTime + 10);
    setCurrentTime(nextMainTime);
  };

  const handleSliderChange = (value: number) => {
    setCurrentTime(value);
  };

  const handleTimeChangeComplete = (value: number) => {
    selectedVideos.forEach((url) => {
      const player = playerRefs.current[url];
      const videoDuration = videoDurations[url] || 0;
      if (!player) return;

      const clampedValue = Math.min(value, videoDuration || value);
      player.seekTo(clampedValue);
    });

    setCurrentTime(value);
  };

  const toggleModule = (value: string) => {
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
    if (videoLoading[videoUrl]) {
      return {
        label: "Loading...",
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



    return bookmarks
      .filter((bookmark) => bookmark.timeSec != null)
      .map((bookmark, index) => {
        const markerLabels =
          bookmark.c_ar
            ?.map((id) => labelsMap[Number(id)])
            .filter((label): label is string => Boolean(label)) || [];

        const primaryLabel = markerLabels[0] || "";

        const fallbackLabel =
          markerLabels.length > 0
            ? markerLabels.join(", ")
            : bookmark.type != null
            ? `Event ${bookmark.type}`
            : t("playback_event");

        const marker = {
          id: `${videoUrl}-${index}`,
          timeSec: Number(bookmark.timeSec?.toFixed(1) || 0),
          type: getMarkerTypeFromLabel(primaryLabel),
          label: fallbackLabel,
          confidence: getMarkerConfidence(bookmark.c_ar),
          position,
          classIds: bookmark.c_ar,
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
  mainDuration,
  t,
]);
const selectedVideoInfo = selectedVideos[0]
  ? deviceInfoByVideo[selectedVideos[0]]
  : undefined;

const playbackLatitude = Number(selectedVideoInfo?.latitude);
const playbackLongitude = Number(selectedVideoInfo?.longitude);

const playbackMapGpsData = useMemo(() => {
  if (
    Number.isFinite(playbackLatitude) &&
    Number.isFinite(playbackLongitude) &&
    playbackLatitude !== 0 &&
    playbackLongitude !== 0
  ) {
    return [
      {
        lat: playbackLatitude,
        lng: playbackLongitude,
        time: currentTime,
      },
    ];
  }

  return [];
}, [playbackLatitude, playbackLongitude, currentTime]);

  return (
  <div className="w-full h-full overflow-auto">
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

        <div className="bg-[#364152] rounded-[10px] overflow-hidden min-h-[430px] relative min-w-[660px]">
          {selectedVideos.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-[#D5D7D8]">
              <img src={NoVideoIcon} alt="No video available" className="w-24 h-24" />
              <p className="text-base">{t("playback_no_video")}</p>
            </div>
          ) : selectedVideos.length === 1 ? (
            <div className="p-2 h-full">
              <div className="relative rounded-[8px] bg-black overflow-hidden">
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

                <HLSPlayer
                  ref={(instance) => {
                    if (selectedVideos[0]) {
                      playerRefs.current[selectedVideos[0]] = instance;
                    }
                  }}
                  src={selectedVideos[0]}
                  onDeviceInfoUpdate={handleDeviceInfoUpdate}
                  metadataBaseUrl={
                    selectedVideos[0] ? metadataBaseByVideo[selectedVideos[0]] : undefined
                  }
                  selectedClassIds={
                    selectedVideos[0]
                      ? selectedModuleIdsByVideo[selectedVideos[0]] ?? []
                      : []
                  }
                  showCommonDetection={selectedModules.some((value) =>
                    aiModules.some(
                      (item) => item.value === value && item.type === "common"
                    )
                  )}
                  
                  showDangerDetection={selectedModules.some((value) =>
                    aiModules.some(
                      (item) => item.value === value && item.type === "danger"
                    )
                  )}
                  onBookmarksChange={handleBookmarksChange}
                  onLabelsLoaded={handleLabelsLoaded}
                  
                  className="w-full h-[410px] object-contain bg-black"
                  autoPlay={false}
                  muted={true}
                  controls={false}
                  onLoadedMetadata={() => {
                    const player = selectedVideos[0]
                      ? playerRefs.current[selectedVideos[0]]
                      : null;

                    const playerDuration = player?.getDuration() || 0;

                    if (selectedVideos[0]) {
                      setVideoLoading((prev) => ({
                        ...prev,
                        [selectedVideos[0]]: false,
                      }));
                    }

                    if (selectedVideos[0]) {
                      setVideoDurations((prev) => ({
                        ...prev,
                        [selectedVideos[0]]: playerDuration,
                      }));
                    }

                    setDuration(playerDuration);

                    if (
                      selectedVideos[0] === historyPlaybackState?.playbackUrl &&
                      historySeekTime > 0
                    ) {
                      player?.seekTo(historySeekTime);
                      setCurrentTime(historySeekTime);
                      setVideoTimes((prev) => ({
                        ...prev,
                        [selectedVideos[0]]: historySeekTime,
                      }));
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
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 p-2 h-full">
              {selectedVideoItems.map((video) => {
                const videoTime = videoTimes[video.value] || 0;
                const videoDuration = videoDurations[video.value] || 0;

                return (
                  <div key={video.value} className="flex flex-col gap-2">
                    <div className="relative rounded-[8px] bg-black overflow-hidden flex items-center justify-center">
                      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-[#374151]/90 rounded-full px-3 py-1.5 text-xs font-semibold text-white">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${getVideoStatus(video.value).dotClass}`}
                        />
                        <span>{getVideoStatus(video.value).label}</span>
                      </div>

                      <div className="w-full h-full">
                        <HLSPlayer
                          ref={(instance) => {
                            playerRefs.current[video.value] = instance;
                          }}
                          src={video.value}
                          onDeviceInfoUpdate={handleDeviceInfoUpdate}
                          metadataBaseUrl={metadataBaseByVideo[video.value]}
                          selectedClassIds={selectedModuleIdsByVideo[video.value] ?? []}
                          showCommonDetection={selectedModules.some((value) =>
                              aiModules.some(
                                (item) => item.value === value && item.type === "common"
                              )
                            )}

                            showDangerDetection={selectedModules.some((value) =>
                              aiModules.some(
                                (item) => item.value === value && item.type === "danger"
                              )
                            )}
                          onBookmarksChange={handleBookmarksChange}
                          onLabelsLoaded={handleLabelsLoaded}
                          className="w-full h-[410px] object-contain bg-black"
                          autoPlay={false}
                          muted={true}
                          controls={false}
                          onLoadedMetadata={() => {
                            const player = playerRefs.current[video.value];

                            setVideoLoading((prev) => ({
                              ...prev,
                              [video.value]: false,
                            }));

                            setVideoDurations((prev) => ({
                              ...prev,
                              [video.value]: player?.getDuration() || 0,
                            }));

                            if (video.value === selectedVideos[0]) {
                              const mainPlayer = getMainPlayer();
                              setDuration(mainPlayer?.getDuration() || 0);
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

                              if (video.value === selectedVideos[0]) {
                                setCurrentTime(historySeekTime);
                              }
                            }

                          }}
                          onTimeUpdate={() => {
                            const player = playerRefs.current[video.value];

                            setVideoTimes((prev) => ({
                              ...prev,
                              [video.value]: player?.getCurrentTime() || 0,
                            }));

                            setVideoDurations((prev) => ({
                              ...prev,
                              [video.value]: player?.getDuration() || 0,
                            }));

                            if (video.value === selectedVideos[0]) {
                              const mainPlayer = getMainPlayer();
                              setCurrentTime(mainPlayer?.getCurrentTime() || 0);
                              setDuration(mainPlayer?.getDuration() || 0);
                              setIsPlaying(!(mainPlayer?.isPaused() ?? true));
                            }
                          }}
                          onEnded={() => {
                            if (video.value === selectedVideos[0]) {
                              setIsPlaying(false);
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="bg-[#F3F4F6] rounded-[10px] px-5 py-4">
                      <input
                        type="range"
                        min={0}
                        max={videoDuration || 0}
                        step={0.1}
                        value={Math.min(videoTime, videoDuration || 0)}
                        onChange={(e) => {
                          const nextValue = Number(e.target.value);

                          setVideoTimes((prev) => ({
                            ...prev,
                            [video.value]: nextValue,
                          }));
                        }}
                        onMouseUp={(e) => {
                          const nextValue = Number((e.target as HTMLInputElement).value);
                          const player = playerRefs.current[video.value];
                          if (player) {
                            player.seekTo(nextValue);
                          }

                          if (video.value === mainVideoUrl) {
                            setCurrentTime(nextValue);
                          }
                        }}
                        onTouchEnd={(e) => {
                          const target = e.target as HTMLInputElement;
                          const nextValue = Number(target.value);
                          const player = playerRefs.current[video.value];
                          if (player) {
                            player.seekTo(nextValue);
                          }

                          if (video.value === mainVideoUrl) {
                            setCurrentTime(nextValue);
                          }
                        }}
                        className="w-full accent-[#3B82F6]"
                      />

                      <div className="text-sm text-[#6B7280] mt-3">
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
          disabled={selectedVideos.length === 0}
          bookmarks={timelineMarkers}
          showCommonDetection={selectedModules.some((value) =>
              aiModules.some(
                (item) => item.value === value && item.type === "common"
              )
            )}

            showDangerDetection={selectedModules.some((value) =>
              aiModules.some(
                (item) => item.value === value && item.type === "danger"
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
          <h2 className="text-[20px] font-bold mb-8">
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
  <h2 className="text-[20px] font-bold mb-8">
    {t("playback_operation_info")}
  </h2>

  <div className="space-y-6 text-sm">
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
          <h2 className="text-[20px] font-bold mb-4">{t("playback_selected_video")}</h2>

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
          <h2 className="text-[20px] font-bold mb-5">{t("stream_ai_module")}</h2>

          <div className="flex gap-3 h-[calc(100%-36px)]">
            <div className="flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="text-[16px] font-bold leading-[1.05]">
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
                <div className="text-[16px] font-bold leading-[1.05]">
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
          <h2 className="text-[20px] font-bold mb-6">{t("playback_route_map")}</h2>
          <div className="h-[260px] bg-[#F6F7F9] rounded-[8px] overflow-hidden">
            {selectedVideos.length > 0 ? (
              <LiveMap
                currentTime={currentTime}
                latitude={playbackLatitude}
                longitude={playbackLongitude}
                videoUrl={selectedVideos?.[0] || ""}
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
                {t("playback_map_idle_message")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  )}
