import NoVideoIcon from "@/assets/no-video-icon.svg";
import CustomModal from "@/components/common/customModal";
import { Button, Form, Select, Switch } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserStore } from "@/stores/userStore";
import { useNavigate } from "react-router-dom";
import { useCompanyStore } from "@/stores/companyStore";
import { useSiteStore } from "@/stores/siteStore";
import { useMissionStore } from "@/stores/missionStore";
import { useRobotStore } from "@/stores/robotStore";
import { useStreamStore } from "@/stores/streamStore";
import { streamApi } from "@/api";
import { showNotification } from "@/utils/notification";
import HLSPlayer from "@/components/hlsPlayer/hlsPlayer";
import type { HLSPlayerRef } from "@/components/hlsPlayer/types";
import ControlBar from "@/components/common/controlBar";

type StreamFormValues = {
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
type PlayerStatus =
  | "OFFLINE"
  | "LOADING"
  | "CONNECTING"
  | "RECONNECTING"
  | "LIVE";

export default function StreamIndex() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [hasConnectedOnce, setHasConnectedOnce] = useState(false);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>("OFFLINE");
  const [hlsRetryKey, setHlsRetryKey] = useState(0);
  const [hlsRetryCount, setHlsRetryCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const retryTimerRef = useRef<number | null>(null);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { detailUserLogin } = useUserStore();

  const { list: companyList, getList: getCompanyList } = useCompanyStore();
  const { list: siteList, getListByCompany: getSiteListByCompany } =
    useSiteStore();
  const { listBySite: missionList, getListBySite: getMissionListBySite } =
    useMissionStore();
  const {
    list: robotList,
    detail: selectedRobotDetail,
    getListBySite: getRobotListBySite,
    getDetail: getRobotDetail,
  } = useRobotStore();
  const { startStream, heartBeat, createReport } = useStreamStore();

  const [form] = Form.useForm<StreamFormValues>();
  const values = Form.useWatch([], form);
  const playerRef = useRef<HLSPlayerRef | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [streamPlaybackUrl, setStreamPlaybackUrl] = useState("");
  const [streamMapUrl, setStreamMapUrl] = useState("");

  const userRole = detailUserLogin?.roles?.[0];

  const companyOptions = useMemo(() => {
    if (userRole === 1) {
      return companyList.map((item) => ({
        value: item.companyId,
        label: item.name,
      }));
    }

    return [
      {
        value: detailUserLogin?.user?.companyId || "",
        label: detailUserLogin?.user?.companyName || "",
      },
    ];
  }, [companyList, detailUserLogin, userRole]);
  const CLASS_LABELS: Record<number, string> = {
    0: "Construction",
    1: "Hardhat",
    2: "Mask",
    3: "NO-Hardhat",
    4: "NO-Mask",
    5: "NO-Safety Vest",
    6: "Person",
    7: "Safety Cone",
    8: "Safety Vest",
    9: "Machinery",
    10: "Vehicle",
    20: "NO-Hardhat(LLM)",
    21: "NO-Safety Vest(LLM)",
    22: "NO-Safety Rope(LLM)",
  };
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

  const missionOptions = useMemo(() => {
    if (!values?.device) {
      return missionList.map((item) => ({
        value: item.missionId,
        label: item.missionName,
      }));
    }

    const selectedDevice = robotList.find(
      (item) => item.deviceId === values.device
    );

    const filteredMissions = missionList.filter((item) => {
      if (!selectedDevice?.deviceType) return true;
      return item.deviceType === selectedDevice.deviceType;
    });

    return filteredMissions.map((item) => ({
      value: item.missionId,
      label: item.missionName,
    }));
  }, [missionList, robotList, values?.device]);


  const playerStatusConfig: Record<
  PlayerStatus,
  { label: string; dotClass: string; badgeClass: string }
  > = {
    OFFLINE: {
      label: "OFFLINE",
      dotClass: "bg-[#9CA3AF]",
      badgeClass: "bg-[#374151]/90",
    },
    LOADING: {
      label: "Loading...",
      dotClass: "bg-[#F59E0B]",
      badgeClass: "bg-[#1F2937]/90",
    },
    CONNECTING: {
      label: "Connecting...",
      dotClass: "bg-[#3B82F6]",
      badgeClass: "bg-[#1F2937]/90",
    },
    RECONNECTING: {
      label: "Reconnecting...",
      dotClass: "bg-[#A855F7] animate-pulse",
      badgeClass: "bg-[#1F2937]/90",
    },
    LIVE: {
      label: "LIVE",
      dotClass: "bg-[#22C55E]",
      badgeClass: "bg-[#1F2937]/90",
    },
  };

const currentPlayerStatus = playerStatusConfig[playerStatus];

  const aiModules: AIModuleItem[] = useMemo(
    () => [
      {
        value: "construction",
        label: t("stream_ai_construction"),
        category: "YOLO",
        type: "common",
        color: "#8D6E63",
      },
      {
        value: "hardhat",
        label: t("stream_ai_hardhat"),
        category: "YOLO",
        type: "common",
        color: "#F4C20D",
      },
      {
        value: "machinery",
        label: t("stream_ai_machinery"),
        category: "YOLO",
        type: "common",
        color: "#1FB6CF",
      },
      {
        value: "person",
        label: t("stream_ai_person"),
        category: "YOLO",
        type: "common",
        color: "#7C4DFF",
      },
      {
        value: "no_hardhat",
        label: t("stream_ai_no_hardhat"),
        category: "YOLO",
        type: "danger",
        color: "#FF2D55",
      },
      {
        value: "no_safety_vest",
        label: t("stream_ai_no_safety_vest"),
        category: "YOLO",
        type: "danger",
        color: "#FF9500",
      },
      {
        value: "no_mask",
        label: t("stream_ai_no_mask"),
        category: "YOLO",
        type: "danger",
        color: "#C218F3",
      },
      {
        value: "fire",
        label: t("stream_ai_fire"),
        category: "YOLO",
        type: "danger",
        color: "#FF3B30",
      },
    ],
    [t]
  );

  const [selectedModules, setSelectedModules] = useState<string[]>(
    aiModules.map((item) => item.value)
  );

  const commonModules = aiModules.filter((item) => item.type === "common");
  const dangerModules = aiModules.filter((item) => item.type === "danger");

  const selectedCommonCount = selectedModules.filter((value) =>
    commonModules.some((item) => item.value === value)
  ).length;

  const selectedDangerCount = selectedModules.filter((value) =>
    dangerModules.some((item) => item.value === value)
  ).length;

  const handleSelectChange = async (
    fieldName: keyof StreamFormValues,
    value: string
  ) => {
    form.setFieldValue(fieldName, value);

    if (fieldName === "company") {
      form.setFieldsValue({
        site: undefined,
        device: undefined,
        mission: undefined,
      });
      setIsStreaming(false);
      setStreamPlaybackUrl("");
      setStreamMapUrl("");

      await getSiteListByCompany(value);
    } else if (fieldName === "site") {
      form.setFieldsValue({
        device: undefined,
        mission: undefined,
      });
      setIsStreaming(false);
      setStreamPlaybackUrl("");
      setStreamMapUrl("");

      await Promise.all([
        getRobotListBySite(value),
        getMissionListBySite(value),
      ]);
    } else if (fieldName === "device") {
      form.setFieldValue("mission", undefined);
      setIsStreaming(false);
      setStreamPlaybackUrl("");
      setStreamMapUrl("");

      await getRobotDetail(value);
    }
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

  const streamPayload = useMemo(() => {
    return {
      deviceSn: selectedRobotDetail?.deviceSn || "",
      urlType: 1,
      videoId: {
        droneSn: selectedRobotDetail?.droneSn || "1581F7FVC25A700DF473",
        payloadIndex: {
          type: selectedRobotDetail?.subDeviceInfo?.type || 99,
          subType: selectedRobotDetail?.subDeviceInfo?.subType || 0,
          position: 0,
        },
        videoType: "normal",
      },
      videoQuality: 0,
      videoType: "zoom",
      missionId: values?.mission || "",
    };
  }, [selectedRobotDetail, values?.mission]);

  const handleStartWork = async () => {
  try {
    await form.validateFields();
    setIsLoading(true);
    setPlayerStatus("LOADING");

    const res = await streamApi.start(streamPayload);

    if (res?.code === -1) {
      showNotification(
        "error",
        "Start stream failed",
        res?.message || "Unable to start stream."
      );
      return;
    }

    if (res?.data?.streamId) {
      const streamInfo = await startStream(res.data.streamId);

      if (!streamInfo?.playback_url) {
        throw new Error("Stream started, but playback URL was not found.");
      }

      setStreamPlaybackUrl(streamInfo.playback_url);
      setPlayerStatus("LOADING");
      setHlsRetryCount(0);
      setHlsRetryKey(0);
      setStreamMapUrl(streamInfo.map_url || "");
      setIsStreaming(streamInfo.state === "RUNNING");
    }

    if (res?.data?.sessionId) {
      setSessionId(res.data.sessionId);
      await heartBeat(res.data.sessionId);
    }

    showNotification(
      "success",
      "Stream started",
      "Live stream started successfully."
    );
  } catch (error: any) {
    showNotification(
      "error",
      "Start stream failed",
      error?.message || "Validation or API error."
    );
  } finally {
    setIsLoading(false);
  }
};

  const handleStopWork = async () => {
    try {
      setIsLoading(true);

      await streamApi.stop(streamPayload);

      if (streamPlaybackUrl && selectedRobotDetail?.deviceSn && values?.mission) {
        await createReport({
          deviceSn: selectedRobotDetail.deviceSn,
          playbackUrl: streamPlaybackUrl,
          missionId: values.mission,
        });
      }

      showNotification(
        "success",
        "Stream stopped",
        "Work session stopped successfully."
      );
      setIsReportOpen(true);
    } catch (error: any) {
      showNotification(
        "error",
        "Stop stream failed",
        error?.response?.data?.message ||
          error?.message ||
          "Unable to stop stream."
      );
    } finally {
  playerRef.current?.pause();

  setIsStreaming(false);
  setIsPlaying(false);
  setCurrentTime(0);
  setDuration(0);

  setSessionId(null);
  setStreamPlaybackUrl("");
  setStreamMapUrl("");
  setBookmarks([]);

  setHlsRetryCount(0);
  setHlsRetryKey(0);

  setIsLoading(false);
  setPlayerStatus("OFFLINE");
  setHasConnectedOnce(false);
}
  };

  const handleReportOk = () => {
    setIsReportOpen(false);
    navigate("/history");
  };

  const handleReportCancel = () => {
    setIsReportOpen(false);
  };


 const handleHlsError = useCallback(() => {
  if (!isStreaming || !streamPlaybackUrl) return;
    if (playerStatus === "CONNECTING") return;


  // Only reconnect state after stream was already live once
  if (hasConnectedOnce) {
    setPlayerStatus("RECONNECTING");

    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current);
    }

    retryTimerRef.current = window.setTimeout(() => {
      setPlayerStatus("CONNECTING");

      setHlsRetryCount((prev) => prev + 1);
      setHlsRetryKey((prev) => prev + 1);
    }, 700);

    return;
  }

  // Initial startup retry
  if (hlsRetryCount >= 30) {
    setPlayerStatus("OFFLINE");

    showNotification(
      "error",
      "Live stream unavailable",
      "Stream playlist is still not accessible after retrying."
    );

    return;
  }

  if (retryTimerRef.current) {
    window.clearTimeout(retryTimerRef.current);
  }

  retryTimerRef.current = window.setTimeout(() => {
    setHlsRetryCount((prev) => prev + 1);
    setHlsRetryKey((prev) => prev + 1);
  }, 1200);
}, [
  hlsRetryCount,
  isStreaming,
  streamPlaybackUrl,
  hasConnectedOnce,
  playerStatus,
]);


const handlePlayPause = () => {
  if (!playerRef.current) return;

  if (isPlaying) {
    playerRef.current.pause();
    setIsPlaying(false);
  } else {
    playerRef.current.play();
    setIsPlaying(true);
  }
};

const handlePrevious = () => {
  if (!playerRef.current) return;
  const nextTime = Math.max(currentTime - 5, 0);
  playerRef.current.seekTo(nextTime);
  setCurrentTime(nextTime);
};

const handleNext = () => {
  if (!playerRef.current) return;
  const nextTime = duration ? Math.min(currentTime + 5, duration) : currentTime + 5;
  playerRef.current.seekTo(nextTime);
  setCurrentTime(nextTime);
};

const handleTimeChange = (value: number) => {
  setCurrentTime(value);
};

const handleTimeChangeComplete = (value: number) => {
  playerRef.current?.seekTo(value);
};

useEffect(() => {
  if (!streamPlaybackUrl || !isStreaming) return;

  const fetchBookmarks = async () => {
    try {
      const bookmarkUrl = streamPlaybackUrl.replace(
        "index.m3u8",
        "bookmark.ndjson"
      );

      const response = await fetch(bookmarkUrl);

      if (!response.ok) {
        return;
      }

      const text = await response.text();

      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      const parsedRaw = lines.map((line) => JSON.parse(line));

      const firstTimestamp = parsedRaw[0]?.m || 0;

      const parsed = parsedRaw.map((item, index) => {
        const classIds = item.c_ar || [];

        return {
          id: `${item.s}-${index}`,
          timeSec: (item.m - firstTimestamp) / 1000,
          type: classIds.some((id: number) =>
            [3, 4, 5, 20, 21, 22].includes(id)
          )
            ? "alert"
            : "person",
          classIds,
          c_ar: classIds,
          labels: classIds.map(
            (id: number) => CLASS_LABELS[id] || `Class ${id}`
          ),
          confidence: 90,
          position: "top",
        };
      });

      setBookmarks(parsed);
    } catch (error) {
      console.log("[BOOKMARK ERROR]", error);
    }
  };

  fetchBookmarks();

  const interval = window.setInterval(fetchBookmarks, 3000);

  return () => {
    window.clearInterval(interval);
  };
}, [streamPlaybackUrl, isStreaming, CLASS_LABELS]);

  useEffect(() => {
    if (userRole === 1) {
      getCompanyList();
    }
  }, [getCompanyList, userRole]);

  useEffect(() => {
    if (userRole !== 1 && detailUserLogin?.user?.companyId) {
      form.setFieldValue("company", detailUserLogin.user.companyId);
      getSiteListByCompany(detailUserLogin.user.companyId);
    }
  }, [detailUserLogin, form, getSiteListByCompany, userRole]);

  useEffect(() => {
  if (!sessionId || !isStreaming) return;

  const interval = setInterval(() => {
    heartBeat(sessionId).catch((error) => {
      console.error("Heartbeat failed:", error);
    });
  }, 30000);

  return () => clearInterval(interval);
}, [heartBeat, isStreaming, sessionId]);


useEffect(() => {
  return () => {
    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current);
    }
  };
}, []);


const showCommonDetection =
  selectedModules.some((m) =>
    commonModules.some((c) => c.value === m)
  );

const showDangerDetection =
  selectedModules.some((m) =>
    dangerModules.some((d) => d.value === m)
  );

  return (
    <>
      <div className="w-full rounded-[10px] bg-[#F6F7F9] p-6">
        <div className="flex flex-col gap-4">
          <Form form={form} layout="vertical">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_150px] gap-3 items-center">
              <Form.Item
                name="company"
                className="mb-0"
                rules={[
                  {
                    required: true,
                    message: t("stream_validation_select_company"),
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
                    message: t("stream_validation_select_site"),
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
                    message: t("stream_validation_select_device"),
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
                    message: t("stream_validation_select_mission"),
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

              <div className="flex items-center justify-end">
              {!isStreaming ? (
                <Button
                  type="primary"
                  loading={isLoading}
                  onClick={handleStartWork}
                  className="w-[138px]! h-[56px]! rounded-[10px]! bg-[#16A34A]! border-[#16A34A]! text-white! font-bold! text-[18px]!"
                >
                  {t("stream_start_work")}
                </Button>
              ) : (
                <Button
                  loading={isLoading}
                  onClick={handleStopWork}
                  className="w-[138px]! h-[56px]! rounded-[10px]! bg-[#FF3B3B]! border-[#FF3B3B]! text-white! font-bold! text-[18px]!"
                >
                  {t("stream_stop_work")}
                </Button>
              )}
            </div>
            </div>
          </Form>

          <div className="grid grid-cols-[minmax(0,1fr)_380px] gap-5 items-start">
            <div className="flex flex-col gap-4">
              <div className="relative bg-[#364152] rounded-[10px] h-[500px] overflow-hidden">
              <div className="absolute top-4 left-5 z-10">
                <div
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-bold text-white shadow-sm ${currentPlayerStatus.badgeClass}`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${currentPlayerStatus.dotClass}`}
                  />
                  {currentPlayerStatus.label}
                </div>
              </div>

                {isStreaming && streamPlaybackUrl ? (
                  <HLSPlayer
                    key={`${streamPlaybackUrl}-${hlsRetryKey}`}
                    ref={playerRef}
                    src={streamPlaybackUrl}
                    metadataBaseUrl={streamPlaybackUrl.replace("/index.m3u8", "")}
                    className="w-full h-full object-contain bg-black"
                    autoPlay
                    muted
                    controls={false}
                    selectedClassIds={[]}
                    showCommonDetection={showCommonDetection}
                    showDangerDetection={showDangerDetection}
                    onReady={() => {
                      if (hasConnectedOnce) {
                        setPlayerStatus("LIVE");
                        setIsPlaying(true);
                        return;
                      }

                      setPlayerStatus("CONNECTING");

                      setTimeout(() => {
                        setHasConnectedOnce(true);
                        setPlayerStatus("LIVE");
                        setIsPlaying(true);
                      }, 400);
                    }}
                    onError={handleHlsError}
                    onLoadedMetadata={() => {
                      setCurrentTime(0);
                      setDuration(0);
                    }}
                    onTimeUpdate={(time) => {
                      setCurrentTime(time);
                      setDuration((prev) => Math.max(prev, time + 5));
                    }}
                    onEnded={() => {
                      setIsPlaying(false);
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
                    <img
                      src={NoVideoIcon}
                      alt="No video"
                      className="w-28 h-28 opacity-90"
                    />
                    <p className="text-white text-[18px]">
                      {t("stream_waiting_activation")}
                    </p>
                  </div>
                )}
              </div>

              {isStreaming && streamPlaybackUrl && (
              <ControlBar
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                onPlayPause={handlePlayPause}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onTimeChange={handleTimeChange}
                onTimeChangeComplete={handleTimeChangeComplete}
                disabled={!isStreaming || !streamPlaybackUrl}
                isLive
                bookmarks={bookmarks}
                showCommonDetection={showCommonDetection}
                showDangerDetection={showDangerDetection}
                onBookmarkClick={(time) => {
                  playerRef.current?.seekTo(time);
                  setCurrentTime(time);
                }}
              />
            )}

            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
  <div className="bg-white rounded-[10px] p-6 min-h-[220px]">
    <h2 className="text-[20px] font-bold mb-8">
      {t("stream_robot_status")}
    </h2>

    <div className="space-y-6 text-sm">
      <div className="flex justify-between">
        <span>{t("stream_situation")}</span>
        <span>
          {playerStatus === "LIVE"
            ? "Live"
            : playerStatus === "LOADING"
            ? "Loading"
            : "Offline"}
        </span>
      </div>
      <div className="flex justify-between">
        <span>{t("stream_battery")}</span>
        <span>-</span>
      </div>
      <div className="flex justify-between">
        <span>{t("stream_network_century")}</span>
        <span>-</span>
      </div>
      <div className="flex justify-between">
        <span>{t("stream_gps_century")}</span>
        <span>-</span>
      </div>
    </div>
  </div>

  <div className="bg-white rounded-[10px] p-6 min-h-[220px]">
    <h2 className="text-[20px] font-bold mb-8 leading-tight">
      {t("stream_operation_information")}
    </h2>

    <div className="space-y-6 text-sm">
      <div className="flex justify-between">
        <span>{t("stream_altitude")}</span>
        <span>-</span>
      </div>
      <div className="flex justify-between">
        <span>{t("stream_speed")}</span>
        <span>-</span>
      </div>
      <div className="flex justify-between">
        <span>{t("stream_operating_hours")}</span>
        <span>-</span>
      </div>
      <div className="flex justify-between">
        <span>{t("stream_start_time")}</span>
        <span>-</span>
      </div>
    </div>
  </div>
</div>

              <div className="bg-white rounded-[10px] p-6 min-h-[350px]">
                <h2 className="text-[20px] font-bold mb-5">
                  {t("stream_ai_module")}
                </h2>

                <div className="flex gap-3 h-[calc(100%-36px)]">
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-[18px] font-bold leading-[1.05]">
                        {t("stream_ai_general_detection")}
                      </div>
                      <div className="text-[14px] text-gray-500 flex items-center">
                        <Switch
                          size="small"
                          checked={selectedCommonCount === commonModules.length}
                          onChange={() => toggleAllModules("common")}
                          className="mr-1!"
                        />
                        ({selectedCommonCount}/{commonModules.length})
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-[#F6F7F9] border border-[#DDE0E5] rounded-[8px] p-2 space-y-2">
                      {commonModules.map((item) => {
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
                                <div className="text-[11px] text-gray-400 mb-1">
                                  {item.category}
                                </div>
                                <div className="text-[13px] font-bold text-[#333] leading-tight">
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
                      <div className="text-[18px] font-bold leading-[1.05]">
                        {t("stream_ai_risk_detection")}
                      </div>
                      <div className="text-[14px] text-gray-500 flex items-center">
                        <Switch
                          size="small"
                          checked={selectedDangerCount === dangerModules.length}
                          onChange={() => toggleAllModules("danger")}
                          className="mr-1!"
                        />
                        ({selectedDangerCount}/{dangerModules.length})
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-[#F6F7F9] border border-[#DDE0E5] rounded-[8px] p-2 space-y-2">
                      {dangerModules.map((item) => {
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
                                <div className="text-[11px] text-gray-400 mb-1">
                                  {item.category}
                                </div>
                                <div className="text-[13px] font-bold text-[#333] leading-tight">
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

              <div className="bg-white rounded-[10px] p-6">
                <h2 className="text-[20px] font-bold mb-5">
                  {t("stream_robot_control")}
                </h2>

                <div className="relative bg-[#788191] rounded-[10px] h-[220px] overflow-hidden">
                  {isStreaming && streamMapUrl ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-lg gap-2">
                      <div>{t("stream_secondary_video_placeholder")}</div>
                      <div className="text-sm text-gray-200 px-4 text-center break-all">
                        {streamMapUrl}
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      <img
                        src={NoVideoIcon}
                        alt="No map"
                        className="w-16 h-16 opacity-90"
                      />
                      <p className="text-white text-[16px]">
                        {t("stream_map_waiting_activation")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CustomModal
        title={t("work_report_title")}
        content={
          <p className="text-[16px] font-medium">
            {t("stream_report_generated_message")}
          </p>
        }
        open={isReportOpen}
        onOk={handleReportOk}
        onCancel={handleReportCancel}
        okText={t("button_ok")}
        cancelText={t("button_close")}
      />
    </>
  );
}