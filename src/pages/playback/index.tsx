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
};

type TimelineMarker = {
  timeSec: number;
  type: "vehicle" | "person" | "safety" | "alert";
  label: string;
  confidence?: number;
  position?: "top" | "bottom";
  classIds?: number[];
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

export default function Playback() {
  const { t } = useTranslation();
  const { detailUserLogin } = useUserStore();
  const [form] = Form.useForm<PlaybackFormValues>();

  const playerRefs = useRef<Record<string, HLSPlayerRef | null>>({});
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

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
      {
        value: "helmet",
        label: t("stream_ai_helmet"),
        category: t("stream_ai_category_safety"),
        type: "common",
        color: "#34C759",
      },
      {
        value: "vest",
        label: t("stream_ai_vest"),
        category: t("stream_ai_category_safety"),
        type: "common",
        color: "#0A84FF",
      },
      {
        value: "person",
        label: t("stream_ai_person"),
        category: t("stream_ai_category_object"),
        type: "common",
        color: "#AF52DE",
      },
      {
        value: "fire",
        label: t("stream_ai_fire"),
        category: t("stream_ai_category_risk"),
        type: "danger",
        color: "#FF3B30",
      },
      {
        value: "smoke",
        label: t("stream_ai_smoke"),
        category: t("stream_ai_category_risk"),
        type: "danger",
        color: "#FF9500",
      },
      {
        value: "intrusion",
        label: t("stream_ai_intrusion"),
        category: t("stream_ai_category_security"),
        type: "danger",
        color: "#FF2D55",
      },
    ],
    [t]
  );

  const [selectedModules, setSelectedModules] = useState<string[]>(
    aiModules.map((item) => item.value)
  );

  const selectedVideoItems = useMemo(
    () => videoOptions.filter((item) => selectedVideos.includes(item.value)),
    [selectedVideos, videoOptions]
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
          return selectedModules.some(
            (moduleValue) => normalizedLabel === normalizeText(moduleValue)
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
    (
      items: Array<{ timeSec: number | null; t?: number; c_ar?: number[] }>,
      videoUrl: string
    ) => {
      setBookmarksByVideo((prev) => ({
        ...prev,
        [videoUrl]: items.map((item) => ({
          timeSec: item.timeSec,
          type: item.t,
          c_ar: item.c_ar,
        })),
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

  useEffect(() => {
    if (userRole === 1) {
      getCompanyList();
    }
  }, [userRole, getCompanyList]);

  useEffect(() => {
    if (userRole !== 1 && detailUserLogin?.user?.companyId) {
      form.setFieldValue("company", detailUserLogin.user.companyId);
    }
  }, [userRole, detailUserLogin, form]);

  useEffect(() => {
    if (values?.company) {
      getListByCompany(values.company);
    }
  }, [values?.company, getListByCompany]);

  useEffect(() => {
    if (values?.site) {
      getRobotListBySite(values.site);
      getMissionListBySite(values.site);
    }
  }, [values?.site, getRobotListBySite, getMissionListBySite]);

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

  useEffect(() => {
    if (selectedVideos.length === 0) {
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
    }
  }, [selectedVideos]);

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
    if (mainDuration <= 0) return [];

    const buildMarkers = (
      videoUrl: string | undefined,
      position: "top" | "bottom"
    ): TimelineMarker[] => {
      if (!videoUrl) return [];

      const bookmarks = bookmarksByVideo[videoUrl] || [];
      const labelsMap = labelsByVideo[videoUrl] || {};
      const allowedIds = selectedModuleIdsByVideo[videoUrl] || [];

      return bookmarks
        .filter((bookmark) => {
          if (bookmark.timeSec == null) return false;
          if (!bookmark.c_ar || bookmark.c_ar.length === 0) return true;
          if (allowedIds.length === 0) return true;
          return bookmark.c_ar.some((id) => allowedIds.includes(id));
        })
        .map((bookmark, index) => {
          const primaryClassId = bookmark.c_ar?.[0];
          const primaryLabel = primaryClassId != null ? labelsMap[primaryClassId] : "";
          const fallbackLabel =
            primaryLabel ||
            (bookmark.type != null ? `Event ${bookmark.type}` : t("playback_event"));

          return {
            timeSec: Number(bookmark.timeSec?.toFixed(1) || 0),
            type: getMarkerTypeFromLabel(primaryLabel),
            label: fallbackLabel,
            confidence: getMarkerConfidence(bookmark.c_ar),
            position,
            classIds: bookmark.c_ar,
            id: `${videoUrl}-${index}`,
          };
        })
        .filter((marker) => marker.timeSec >= 0 && marker.timeSec <= mainDuration);
    };

    const primary = buildMarkers(selectedVideos[0], "top");
    const secondary = buildMarkers(selectedVideos[1], "bottom");

    return [...primary, ...secondary].sort((a, b) => a.timeSec - b.timeSec);
  }, [
    bookmarksByVideo,
    labelsByVideo,
    selectedModuleIdsByVideo,
    selectedVideos,
    mainDuration,
    t,
  ]);

  return (
    <div className="w-full h-full flex gap-[11px]">
      <div className="w-2/3 flex flex-col bg-[#F6F7F9] px-6 py-7 gap-4 rounded-[10px]">
        <Form layout="vertical" form={form}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
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

            <div>
              <Select
                mode="multiple"
                maxCount={2}
                options={videoOptions}
                value={selectedVideos}
                className="w-full h-[48px]"
                onChange={handleVideoSelectionChange}
                placeholder={t("playback_select_video")}
                disabled={!values?.device}
                maxTagCount={2}
                maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
              />
            </div>
          </div>
        </Form>

        <div className="bg-[#364152] rounded-[10px] overflow-hidden min-h-[430px] relative">
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
                  metadataBaseUrl={
                    selectedVideos[0] ? metadataBaseByVideo[selectedVideos[0]] : undefined
                  }
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
                          metadataBaseUrl={metadataBaseByVideo[video.value]}
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
        />

        <div className="bg-white rounded-[10px] p-6">
          <h2 className="text-[20px] font-bold mb-4">{t("stream_device_info")}</h2>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-[#F6F7F9] rounded-[8px] p-3">
              <div className="text-[#8E8E93]">{t("stream_info_device")}</div>
              <div className="font-medium mt-1">{playbackDeviceInfo.deviceName}</div>
            </div>
            <div className="bg-[#F6F7F9] rounded-[8px] p-3">
              <div className="text-[#8E8E93]">{t("stream_info_status")}</div>
              <div className="font-medium mt-1">
                {selectedVideos.length > 0 ? t("status_active") : t("status_inactive")}
              </div>
            </div>
            <div className="bg-[#F6F7F9] rounded-[8px] p-3">
              <div className="text-[#8E8E93]">{t("stream_info_mission")}</div>
              <div className="font-medium mt-1">{playbackDeviceInfo.missionName}</div>
            </div>
            <div className="bg-[#F6F7F9] rounded-[8px] p-3">
              <div className="text-[#8E8E93]">{t("stream_info_serial")}</div>
              <div className="font-medium mt-1">{playbackDeviceInfo.deviceSn}</div>
            </div>
            <div className="bg-[#F6F7F9] rounded-[8px] p-3">
              <div className="text-[#8E8E93]">{t("stream_info_start_time")}</div>
              <div className="font-medium mt-1">{playbackDeviceInfo.startTime}</div>
            </div>
            <div className="bg-[#F6F7F9] rounded-[8px] p-3">
              <div className="text-[#8E8E93]">{t("stream_info_operating_hour")}</div>
              <div className="font-medium mt-1">{playbackDeviceInfo.operatingHour}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-1/3 px-6 py-7 flex flex-col gap-3 bg-[#F6F7F9] rounded-[10px]">
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
                  className="flex items-center justify-between bg-[#F6F7F9] border border-[#DDE0E5] rounded-lg px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={FolderIcon} alt="Folder Icon" />
                    <div className="min-w-0">
                      <div className="text-xs text-[#8E8E93] mb-1">
                        {index === 0
                          ? t("playback_primary_video")
                          : t("playback_secondary_video")}
                      </div>
                      <div
                        className="text-xs text-[#6B7280] line-clamp-2"
                        title={video.label}
                      >
                        {video.label}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveVideo(index)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <img src={XIcon} alt="Remove Icon" />
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
          <div className="h-[260px] bg-[#F6F7F9] rounded-[8px] flex items-center justify-center text-[#8E8E93]">
            {t("playback_map_placeholder")}
          </div>
        </div>
      </div>
    </div>
  );
} 