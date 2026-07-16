import NoVideoIcon from "@/assets/no-video-icon.svg";
import CustomModal from "@/components/common/customModal";
import { Button, Form, Select, Switch } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserStore } from "@/stores/userStore";
import { useNavigate , useLocation, useParams} from "react-router-dom";
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
import WorkReportModal from "@/components/common/workReportModal";
import { LiveMap } from "@/components/map/liveMap";
import { useDashboardStore } from "@/stores/dashboardStore";



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


  const STREAM_SYNC_CHANNEL = "robopilot-stream-sync";
  const ACTIVE_STREAM_KEY = "robopilot-active-stream";
  const STREAM_OWNER_TAB_KEY = "robopilot-stream-owner-tab";

  const CURRENT_TAB_ID =
    crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  type StreamSyncMessage = {
    type: "STREAM_STARTED" | "STREAM_STOPPED";
    deviceSn: string;
    sessionId?: string | null;
    playbackUrl?: string;
    mapUrl?: string;
    startTime?: string;
    startAtMs?: number;
  };

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

export default function StreamIndex() {
  const [reportDetail, setReportDetail] = useState<any>(null);
const [liveDeviceInfo, setLiveDeviceInfo] = useState<any>(null);
  const [workStartTime, setWorkStartTime] = useState<Date | null>(null);
  const [workStartAtMs, setWorkStartAtMs] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
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
  const location = useLocation();
  const dashboardPrefill = location.state as any;
  const lockSelection = Boolean(dashboardPrefill?.fromDashboard);
  const didDashboardPrefill = useRef(false);
  const { detailUserLogin } = useUserStore();
  const { id: routeDeviceId } = useParams();
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
  const { startStream, heartBeat } = useStreamStore();

  const [form] = Form.useForm<StreamFormValues>();
  const values = Form.useWatch([], form);
  const playerRef = useRef<HLSPlayerRef | null>(null);
  const streamSyncChannelRef = useRef<BroadcastChannel | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [streamPlaybackUrl, setStreamPlaybackUrl] = useState("");
  const [streamMapUrl, setStreamMapUrl] = useState("");

  const userRole = detailUserLogin?.roles?.[0];
  const {
    optimisticStopDevice,
    getDashboardSilent,
    getDashboardStatSilent,
  } = useDashboardStore();

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
    { value: "construction", label: t("stream_ai_construction"), category: "YOLO", type: "common", color: "#8D6E63" },
    { value: "hardhat", label: t("stream_ai_hardhat"), category: "YOLO", type: "common", color: "#F4C20D" },
    { value: "machinery", label: t("stream_ai_machinery"), category: "YOLO", type: "common", color: "#1FB6CF" },
    { value: "mask", label: t("stream_ai_mask"), category: "YOLO", type: "common", color: "#00BCD4" },
    { value: "no_mask_common", label: t("stream_ai_no_mask"), category: "YOLO", type: "common", color: "#C218F3" },
    { value: "person", label: t("stream_ai_person"), category: "YOLO", type: "common", color: "#7C4DFF" },
    { value: "vehicle", label: t("stream_ai_vehicle"), category: "YOLO", type: "common", color: "#607D8B" },
    { value: "safety_vest", label: t("stream_ai_vest"), category: "YOLO", type: "common", color: "#34C759" },

    { value: "no_hardhat", label: t("stream_ai_no_hardhat"), category: "YOLO", type: "danger", color: "#FF2D55" },
    { value: "no_safety_vest", label: t("stream_ai_no_safety_vest"), category: "YOLO", type: "danger", color: "#FF9500" },
    { value: "no_mask", label: t("stream_ai_no_mask"), category: "YOLO", type: "danger", color: "#C218F3" },
    { value: "fire", label: t("stream_ai_fire"), category: "YOLO", type: "danger", color: "#FF3B30" },
    { value: "llm_no_hardhat", label: t("stream_ai_no_hardhat"), category: "LLM", type: "danger", color: "#FF2D55" },
    { value: "llm_no_safety_vest", label: t("stream_ai_no_safety_vest"), category: "LLM", type: "danger", color: "#FF9500" },
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
        droneSn: selectedRobotDetail?.droneSn || selectedRobotDetail?.deviceSn || "",
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


  const getCurrentDeviceSn = useCallback(() => {
    return selectedRobotDetail?.deviceSn || streamPayload.deviceSn || "";
  }, [selectedRobotDetail?.deviceSn, streamPayload.deviceSn]);

  const clearLocalStreamState = useCallback(() => {
  playerRef.current?.pause();

  localStorage.removeItem(ACTIVE_STREAM_KEY);
    setLiveDeviceInfo(null);
  if (localStorage.getItem(STREAM_OWNER_TAB_KEY) === CURRENT_TAB_ID) {
    localStorage.removeItem(STREAM_OWNER_TAB_KEY);
  }
  setIsStreaming(false);
  setIsPlaying(false);
  setCurrentTime(0);
  setDuration(0);
  setSessionId(null);
  setStreamPlaybackUrl("");
  setStreamMapUrl("");
  setPlayerStatus("OFFLINE");
  setHasConnectedOnce(false);
  setMapReady(false);
  setMapRetryKey(0);
  setElapsedSeconds(0);
  setWorkStartTime(null);
  setWorkStartAtMs(null);
}, []);

  const broadcastStreamMessage = useCallback((message: StreamSyncMessage) => {
    if (message.type === "STREAM_STARTED") {
        localStorage.setItem(ACTIVE_STREAM_KEY, JSON.stringify(message));
      }

      if (message.type === "STREAM_STOPPED") {
        localStorage.removeItem(ACTIVE_STREAM_KEY);
      }

      // streamSyncChannelRef.current?.postMessage(message);
      broadcastStreamMessage(message);
        }, []);


  const handleStartWork = async () => {
  try {
    await form.validateFields();
    setIsLoading(true);
    setPlayerStatus("LOADING");

    const res = await streamApi.start(streamPayload);

    if (res?.code === -1) {
  setPlayerStatus("OFFLINE");
  setIsStreaming(false);
  setStreamPlaybackUrl("");
  setStreamMapUrl("");
  setSessionId(null);

  showNotification(
    "error",
    "Start stream failed",
    res?.message || "Unable to start stream."
  );
  return;
}

    if (res?.data?.streamId) {
      const streamInfo = await startStream(res.data.streamId);
      const now = new Date();
      const startAtMs = now.getTime();

      setWorkStartTime(now);
      setWorkStartAtMs(startAtMs);
      setElapsedSeconds(0);

      if (!streamInfo?.playback_url) {
        throw new Error("Stream started, but playback URL was not found.");
      }

      setStreamPlaybackUrl(streamInfo.playback_url || "");
      setStreamMapUrl(streamInfo.map_url || "");

      setMapReady(false);
      setMapRetryKey(0);
      setPlayerStatus("LOADING");
      setHlsRetryCount(0);
      setHlsRetryKey(0);
      setIsStreaming(streamInfo.state === "RUNNING");

      broadcastStreamMessage({
      type: "STREAM_STARTED",
      deviceSn: getCurrentDeviceSn(),
      sessionId: res?.data?.sessionId || null,
      playbackUrl: streamInfo.playback_url || "",
      mapUrl: streamInfo.map_url || "",
      startTime: now.toISOString(),
      startAtMs,
    });
    }

    if (res?.data?.sessionId) {
      setSessionId(res.data.sessionId);
      localStorage.setItem(STREAM_OWNER_TAB_KEY, CURRENT_TAB_ID);      
      await heartBeat(res.data.sessionId);
    }

    showNotification(
      "success",
      "Stream started",
      "Live stream started successfully."
    );
  } catch (error: any) {
  setPlayerStatus("OFFLINE");
  setIsStreaming(false);
  setStreamPlaybackUrl("");
  setStreamMapUrl("");
  setSessionId(null);

  showNotification(
    "error",
    "Start stream failed",
    error?.response?.data?.message ||
      error?.message ||
      "Validation or API error."
  );
} finally {
  setIsLoading(false);
}
};

const handleStopWork = async () => {
  try {
    setIsLoading(true);

    const endTime = new Date();

    await streamApi.stop(streamPayload);

    const stoppedDeviceSn = getCurrentDeviceSn();

    optimisticStopDevice(stoppedDeviceSn);

    window.setTimeout(() => {
      getDashboardSilent();
      getDashboardStatSilent();
    }, 800);

    broadcastStreamMessage({
      type: "STREAM_STOPPED",
      deviceSn: stoppedDeviceSn,
      sessionId,
    });

    clearLocalStreamState();

    const startTimeText = workStartTime
      ? workStartTime.toLocaleString("sv-SE").replace("T", " ")
      : "-";

    const endTimeText = endTime
      .toLocaleString("sv-SE")
      .replace("T", " ");

    const totalTimeText = formatDuration(elapsedSeconds);

    const siteName =
      siteOptions.find((site) => site.value === values?.site)?.label || "-";

    const robotName =
      selectedRobotDetail?.deviceName ||
      selectedRobotDetail?.deviceSn ||
      "-";

    const missionName =
      missionOptions.find(
        (mission) => mission.value === values?.mission
      )?.label || "-";

    const fallbackBookmarks = bookmarks.map(
      (bookmark: any, index: number) => {
        const label =
          bookmark.labels?.[0] ||
          bookmark.label ||
          bookmark.type ||
          "Unknown";

        return {
          label,
          mdisplay: bookmark.timeSec
            ? new Date(bookmark.timeSec * 1000)
                .toISOString()
                .substring(11, 19)
            : "00:00:00",
          m: bookmark.timeSec || 0,
          s: bookmark.s || "",
          o: 0,
          duration: bookmark.timeSec
            ? new Date(bookmark.timeSec * 1000)
                .toISOString()
                .substring(11, 19)
            : "00:00:00",
          id: bookmark.id || `${label}-${index}`,
        };
      }
    );

    const fallbackLabelCounts = fallbackBookmarks.reduce(
      (acc: Record<string, number>, bookmark: any) => {
        acc[bookmark.label] =
          (acc[bookmark.label] || 0) + 1;

        return acc;
      },
      {}
    );

    setReportDetail({
      reportCreatedAt: endTimeText,
      playbackUrl: streamPlaybackUrl,
      companyId: values?.company,
      siteId: values?.site,
      missionId: values?.mission,
      startTime: startTimeText,
      endTime: endTimeText,
      totalTime: totalTimeText,
      distance: "-",
      siteName,
      deviceName: robotName,
      robotName,
      missionName,
      userName: "sysadmin",
      workerName: "sysadmin",
      deviceSn: selectedRobotDetail?.deviceSn || "",
      totalRecognition: fallbackBookmarks.length,
      labelCounts: fallbackLabelCounts,
      bookmarks: fallbackBookmarks,
    });

    remoteSeenActiveRef.current = false;
    inactivePollCountRef.current = 0;

    setIsReportOpen(true);

    showNotification(
      "success",
      "Stream stopped",
      "Work session stopped successfully."
    );
  } catch (error: any) {
    showNotification(
      "error",
      "Stop stream failed",
      error?.response?.data?.message ||
        error?.message ||
        "Unable to stop stream."
    );

    /*
     * Important:
     * Do not clear the active stream UI when the server rejected Stop.
     */
  } finally {
    setIsLoading(false);
  }
};


const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(
    2,
    "0"
  )}:${String(s).padStart(2, "0")}`;
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
const handleDeviceInfoUpdate = useCallback((deviceInfo: any) => {

  setLiveDeviceInfo((previous: any) => {
    const isSame =
      previous?.status === deviceInfo?.status &&
      previous?.battery === deviceInfo?.battery &&
      previous?.network === deviceInfo?.network &&
      previous?.gps === deviceInfo?.gps &&
      previous?.altitude === deviceInfo?.altitude &&
      previous?.speed === deviceInfo?.speed &&
      previous?.latitude === deviceInfo?.latitude &&
      previous?.longitude === deviceInfo?.longitude;

    return isSame ? previous : deviceInfo;
  });
}, []);
const handleTimeChange = (value: number) => {
  setCurrentTime(value);
};

const handleTimeChangeComplete = (value: number) => {
  playerRef.current?.seekTo(value);
};
const [mapRetryKey, setMapRetryKey] = useState(0);
const [mapReady, setMapReady] = useState(false);

const remoteSeenActiveRef = useRef(false);
const inactivePollCountRef = useRef(0);
const STREAM_STATUS_POLL_INTERVAL_MS = 3000;
const STREAM_INACTIVE_CONFIRMATION_POLLS = 10;

useEffect(() => {
  if (
    !selectedRobotDetail?.deviceSn ||
    !streamPlaybackUrl ||
    isReportOpen
  ) {
    return;
  }

  const deviceSn = selectedRobotDetail.deviceSn;

  const timer = window.setInterval(async () => {
    try {
      const statusRes = await streamApi.status(deviceSn);

      const remoteSessionStatus =
        statusRes?.sessionStatus ??
        statusRes?.session_status ??
        statusRes?.status;

      const active =
        statusRes?.active === true ||
        statusRes?.streaming === true ||
        remoteSessionStatus === "ACTIVE" ||
        remoteSessionStatus === "RUNNING" ||
        remoteSessionStatus === "LIVE" ||
        remoteSessionStatus === "WORKING";

      if (active) {
        remoteSeenActiveRef.current = true;
        inactivePollCountRef.current = 0;
        return;
      }

      if (!remoteSeenActiveRef.current) {
        return;
      }

      inactivePollCountRef.current += 1;

      console.warn("[StreamStatus] Inactive response", {
        deviceSn,
        inactivePollCount: inactivePollCountRef.current,
        remoteSessionStatus,
        active: statusRes?.active,
        streaming: statusRes?.streaming,
      });

      if (
        inactivePollCountRef.current <
        STREAM_INACTIVE_CONFIRMATION_POLLS
      ) {
        return;
      }

      const confirmationRes = await streamApi.status(deviceSn);

      const confirmationStatus =
        confirmationRes?.sessionStatus ??
        confirmationRes?.session_status ??
        confirmationRes?.status;

      const confirmedActive =
        confirmationRes?.active === true ||
        confirmationRes?.streaming === true ||
        confirmationStatus === "ACTIVE" ||
        confirmationStatus === "RUNNING" ||
        confirmationStatus === "LIVE" ||
        confirmationStatus === "WORKING";

      if (confirmedActive) {
        remoteSeenActiveRef.current = true;
        inactivePollCountRef.current = 0;
        return;
      }

      console.warn("[StreamStatus] Confirmed inactive", {
        deviceSn,
        statusRes,
        confirmationRes,
      });

      const endTime = new Date();
      const endTimeText = endTime
        .toLocaleString("sv-SE")
        .replace("T", " ");

      playerRef.current?.pause();

      setReportDetail({
        reportCreatedAt: endTimeText,
        playbackUrl: streamPlaybackUrl,
        companyId: values?.company,
        siteId: values?.site,
        missionId: values?.mission,
        startTime: workStartTime
          ? workStartTime.toLocaleString("sv-SE").replace("T", " ")
          : "-",
        endTime: endTimeText,
        totalTime: formatDuration(elapsedSeconds),
        distance: "-",
        siteName:
          siteOptions.find((site) => site.value === values?.site)?.label ||
          "-",
        deviceName:
          selectedRobotDetail.deviceName ||
          selectedRobotDetail.deviceSn ||
          "-",
        robotName:
          selectedRobotDetail.deviceName ||
          selectedRobotDetail.deviceSn ||
          "-",
        missionName:
          missionOptions.find(
            (mission) => mission.value === values?.mission
          )?.label || "-",
        userName: "sysadmin",
        workerName: "sysadmin",
        deviceSn,
        totalRecognition: bookmarks.length,
        bookmarks: [],
        labelCounts: {},
      });

      setIsReportOpen(true);
      setIsStreaming(false);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setSessionId(null);
      setStreamPlaybackUrl("");
      setStreamMapUrl("");
      setPlayerStatus("OFFLINE");
      setHasConnectedOnce(false);
      setMapReady(false);
      setMapRetryKey(0);

      remoteSeenActiveRef.current = false;
      inactivePollCountRef.current = 0;
    } catch (error) {
      console.error("[StreamStatus] Failed to poll stream status", error);
    }
  }, STREAM_STATUS_POLL_INTERVAL_MS);

  return () => window.clearInterval(timer);
}, [
  selectedRobotDetail?.deviceSn,
  selectedRobotDetail?.deviceName,
  streamPlaybackUrl,
  isReportOpen,
  values?.company,
  values?.site,
  values?.mission,
  workStartTime,
  elapsedSeconds,
  bookmarks.length,
  siteOptions,
  missionOptions,
]);

useEffect(() => {
  if (!isStreaming || !streamMapUrl || mapReady) return;

  const checkMapReady = async () => {
    try {
      const res = await fetch(streamMapUrl, {
        method: "GET",
        cache: "no-store",
      });

      if (res.ok) {
        setMapReady(true);
        return;
      }

      setMapRetryKey((prev) => prev + 1);
    } catch {
      setMapRetryKey((prev) => prev + 1);
    }
  };

  checkMapReady();

  const timer = setInterval(checkMapReady, 3000);

  return () => clearInterval(timer);
}, [isStreaming, streamMapUrl, mapReady]);


useEffect(() => {
  if (!streamPlaybackUrl || !isStreaming) {
    return;
  }

  let cancelled = false;
  let timeoutId: number | null = null;
  let controller: AbortController | null = null;

  const fetchBookmarks = async () => {
    if (cancelled) {
      return;
    }

    controller = new AbortController();

    try {
      const bookmarkUrl = streamPlaybackUrl.replace(
        "index.m3u8",
        "bookmark.ndjson"
      );

      const response = await fetch(bookmarkUrl, {
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok || cancelled) {
        return;
      }

      const text = await response.text();

      if (cancelled) {
        return;
      }

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
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      console.error("Failed to fetch bookmarks:", error);
    } finally {
      if (!cancelled) {
        timeoutId = window.setTimeout(fetchBookmarks, 3000);
      }
    }
  };

  fetchBookmarks();

  return () => {
    cancelled = true;

    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }

    controller?.abort();
  };
}, [streamPlaybackUrl, isStreaming]);

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

  const claimOwnershipIfNeeded = () => {
    const currentOwner =
      localStorage.getItem(STREAM_OWNER_TAB_KEY);

    if (!currentOwner) {
      localStorage.setItem(
        STREAM_OWNER_TAB_KEY,
        CURRENT_TAB_ID
      );

      return true;
    }

    return currentOwner === CURRENT_TAB_ID;
  };

  const sendHeartbeat = async () => {
    const isOwner = claimOwnershipIfNeeded();

    if (!isOwner) {
      return;
    }

    try {
      await heartBeat(sessionId);
    } catch (error) {
      console.error("Heartbeat failed:", error);
    }
  };

  sendHeartbeat();

  const interval = window.setInterval(
    sendHeartbeat,
    30000
  );

  return () => {
    window.clearInterval(interval);

    if (
      localStorage.getItem(STREAM_OWNER_TAB_KEY) ===
      CURRENT_TAB_ID
    ) {
      localStorage.removeItem(STREAM_OWNER_TAB_KEY);
    }
  };
}, [heartBeat, isStreaming, sessionId]);


useEffect(() => {
  const channel = new BroadcastChannel(STREAM_SYNC_CHANNEL);
  streamSyncChannelRef.current = channel;

  const applyActiveStream = (message: StreamSyncMessage) => {
    if (!message?.deviceSn || !message.playbackUrl) return;

    const currentDeviceSn = getCurrentDeviceSn();
    if (!currentDeviceSn || currentDeviceSn !== message.deviceSn) return;

    const startedAtMs =
      message.startAtMs ||
      (message.startTime ? new Date(message.startTime).getTime() : Date.now());

    const startedAt = new Date(startedAtMs);

    setSessionId(message.sessionId || null);
    setStreamPlaybackUrl(message.playbackUrl);
    setStreamMapUrl(message.mapUrl || "");
    setWorkStartTime(startedAt);
    setWorkStartAtMs(startedAtMs);
    setElapsedSeconds(
      Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000))
    );
    setIsStreaming(true);
    setIsPlaying(false);
    setPlayerStatus("LOADING");
    setHlsRetryCount(0);
    setHlsRetryKey((prev) => prev + 1);
    setMapReady(false);
    setMapRetryKey(0);
  };

  const savedActiveStream = localStorage.getItem(ACTIVE_STREAM_KEY);

if (savedActiveStream) {
  try {
    const parsed = JSON.parse(savedActiveStream);

    if (!parsed?.deviceSn) {
      localStorage.removeItem(ACTIVE_STREAM_KEY);
    } else {
      streamApi
        .status(parsed.deviceSn)
        .then((statusResponse) => {
          const streamStatus =
            statusResponse?.status ||
            statusResponse?.sessionStatus ||
            statusResponse?.session_status;

          if (
            streamStatus === "ACTIVE" ||
            streamStatus === "LIVE" ||
            streamStatus === "WORKING"
          ) {
            applyActiveStream(parsed);
          } else {
            localStorage.removeItem(ACTIVE_STREAM_KEY);
            clearLocalStreamState();
          }
        })
        .catch(() => {
          localStorage.removeItem(ACTIVE_STREAM_KEY);
          clearLocalStreamState();
        });
    }
  } catch {
    localStorage.removeItem(ACTIVE_STREAM_KEY);
  }
}

  channel.onmessage = (event: MessageEvent<StreamSyncMessage>) => {
    const message = event.data;
    if (!message?.type || !message.deviceSn) return;

    if (message.type === "STREAM_STARTED") {
      applyActiveStream(message);
    }

    if (message.type === "STREAM_STOPPED") {
      const currentDeviceSn = getCurrentDeviceSn();

      if (currentDeviceSn && currentDeviceSn === message.deviceSn) {
        clearLocalStreamState();
      }
    }
  };

  return () => {
    channel.close();
    streamSyncChannelRef.current = null;
  };
}, [clearLocalStreamState, getCurrentDeviceSn]);


useEffect(() => {
  return () => {
    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current);
    }
  };
}, []);

useEffect(() => {
  if (!isStreaming || !workStartAtMs) return;

  const updateElapsed = () => {
    const nextElapsed = Math.max(
      0,
      Math.floor((Date.now() - workStartAtMs) / 1000)
    );

    setElapsedSeconds(nextElapsed);
  };

  updateElapsed();

  const timer = window.setInterval(updateElapsed, 1000);

  return () => window.clearInterval(timer);
}, [isStreaming, workStartAtMs]);


useEffect(() => {
  if (!dashboardPrefill?.fromDashboard) return;
  if (didDashboardPrefill.current) return;

  const companyId =
    dashboardPrefill.companyId || detailUserLogin?.user?.companyId;
  const siteId = dashboardPrefill.siteId;
  const deviceId = dashboardPrefill.deviceId || routeDeviceId;
  const deviceSn = dashboardPrefill.deviceSn;

  if (!companyId || !siteId || !deviceId) return;

  didDashboardPrefill.current = true;

  const applyDashboardPrefill = async () => {
    form.setFieldsValue({
      company: companyId,
      site: undefined,
      device: undefined,
      mission: undefined,
    });

    await getSiteListByCompany(companyId);

    form.setFieldsValue({
      site: siteId,
      device: undefined,
      mission: undefined,
    });

    await Promise.all([
      getRobotListBySite(siteId),
      getMissionListBySite(siteId),
    ]);

    form.setFieldsValue({
      device: deviceId,
      mission: undefined,
    });

    await getRobotDetail(deviceId);

    const matchedMission = missionList.find(
      (item: any) =>
        item.missionId === dashboardPrefill.missionId ||
        item.missionName === dashboardPrefill.missionName
    );

    if (matchedMission?.missionId) {
      form.setFieldValue("mission", matchedMission.missionId);
    }

    if (dashboardPrefill.openLiveStream && deviceSn) {
      const statusRes = await streamApi.status(deviceSn);

      if (!statusRes?.streaming) return;

      if (statusRes?.missionId) {
        form.setFieldValue("mission", statusRes.missionId);
      }

      const streamInfo = await startStream(deviceSn);

      setSessionId(deviceSn);

      setStreamPlaybackUrl(
        streamInfo.playback_url || streamInfo.playbackUrl || ""
      );

      setStreamMapUrl(streamInfo.map_url || streamInfo.mapUrl || "");

      setMapReady(false);
      setMapRetryKey(0);

      setPlayerStatus("LOADING");
      setHlsRetryCount(0);
      setHlsRetryKey(0);

      setIsStreaming(true);
    }
  };

  applyDashboardPrefill();
}, [
  dashboardPrefill,
  detailUserLogin?.user?.companyId,
  form,
  getSiteListByCompany,
  getRobotListBySite,
  getMissionListBySite,
  getRobotDetail,
  routeDeviceId,
  missionList,
  startStream,
]);



  const showCommonDetection =
  selectedModules.some((m) =>
    commonModules.some((c) => c.value === m)
  );

const showDangerDetection =
  selectedModules.some((m) =>
    dangerModules.some((d) => d.value === m)
  );

const liveMapGpsData = useMemo(() => {
  if (
    typeof liveDeviceInfo?.latitude === "number" &&
    typeof liveDeviceInfo?.longitude === "number"
  ) {
    return [
      {
        lat: liveDeviceInfo.latitude,
        lng: liveDeviceInfo.longitude,
        time: currentTime,
      },
    ];
  }

  return [];
}, [liveDeviceInfo?.latitude, liveDeviceInfo?.longitude, currentTime]);


const SmallStatusBadge = ({
  label,
  status,
}: {
  label: string;
  status: "idle" | "loading" | "live";
}) => (
  <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-2 rounded-full bg-[#374151] px-3 py-1 text-white text-[12px] font-bold">
    <span
      className={`w-2 h-2 rounded-full ${
        status === "live"
          ? "bg-[#22C55E]"
          : status === "loading"
          ? "bg-[#F59E0B]"
          : "bg-[#9CA3AF]"
      }`}
    />
    {status === "idle" ? label : status === "live" ? "LIVE" : "Loading..."}
  </div>
);

  return (
  <div className="w-full h-full overflow-auto">
    <div className="w-full min-w-[1120px] xl:min-w-0 min-h-full rounded-[10px] bg-[#F6F7F9] p-6">
      <Form form={form} layout="vertical">
        <div className="grid grid-cols-[minmax(700px,1fr)_390px] gap-5 items-start">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-[repeat(4,minmax(120px,1fr))_160px] gap-3 items-center">
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
                  disabled={userRole !== 1 || lockSelection}
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
                  disabled={!values?.company || lockSelection}
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
                  disabled={!values?.site || lockSelection}
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
                    className="w-[150px]! h-[56px]! rounded-[10px]! bg-[#16A34A]! border-[#16A34A]! text-white! font-bold! text-[18px]!"
                  >
                    {t("stream_start_work")}
                  </Button>
                ) : (
                  <Button
                    loading={isLoading}
                    onClick={handleStopWork}
                    className="w-[150px]! h-[56px]! rounded-[10px]! bg-[#FF3B3B]! border-[#FF3B3B]! text-white! font-bold! text-[18px]!"
                  >
                    {t("stream_stop_work")}
                  </Button>
                )}
              </div>
            </div>

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
                  onDeviceInfoUpdate={(deviceInfo) => {
                    handleDeviceInfoUpdate(deviceInfo);
                  }}
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
            {/* Vector Space + Travel Route Map */}
          <div className="grid grid-cols-2 gap-3 min-w-0">
            {/* Vector Space */}
            <div className="relative bg-[#788191] rounded-[10px] h-[220px] overflow-hidden">
              <SmallStatusBadge
                label={t("stream_vector_space")}
                status={!isStreaming ? "idle" : mapReady ? "live" : "loading"}
              />

              {isStreaming && streamMapUrl && mapReady ? (
                <HLSPlayer
                  key={`vector-${streamMapUrl}`}
                  src={streamMapUrl}
                  metadataBaseUrl={streamMapUrl.replace("/map.m3u8", "")}
                  className="w-full h-full object-contain bg-black"
                  autoPlay
                  muted
                  controls={false}
                  selectedClassIds={[]}
                  showCommonDetection={false}
                  showDangerDetection={false}
                  disableBackgroundTasks={true}
                  type="vector"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white text-[15px]">
                  {isStreaming
                    ? t("stream_vector_space_loading")
                    : t("stream_active_after_start")}
                </div>
              )}
            </div>

            {/* Travel Route Map */}
            <div className="relative bg-[#788191] rounded-[10px] h-[220px] overflow-hidden">
              <SmallStatusBadge
                label={t("stream_travel_route_map")}
                status={
                  !isStreaming
                    ? "idle"
                    : liveDeviceInfo?.latitude !== undefined &&
                      liveDeviceInfo?.longitude !== undefined
                    ? "live"
                    : "loading"
                }
              />

              {isStreaming &&
              liveDeviceInfo?.latitude !== undefined &&
              liveDeviceInfo?.longitude !== undefined ? (
                <LiveMap
                  currentTime={currentTime}
                  latitude={liveDeviceInfo.latitude}
                  longitude={liveDeviceInfo.longitude}
                  videoUrl={streamPlaybackUrl}
                  gpsData={liveMapGpsData}
                  streamStatus={{
                    error: null,
                    isLoading:
                      playerStatus === "LOADING" ||
                      playerStatus === "CONNECTING",
                    videoConnected: playerStatus === "LIVE",
                    isPaused: !isPlaying,
                    isReconnecting: playerStatus === "RECONNECTING",
                  }}
                  mode="stream"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white text-[15px]">
                  {t("stream_active_after_start")}
                </div>
              )}
            </div>
          </div>
          </div>
          <div className="flex flex-col gap-4 w-[390px] shrink-0">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-[10px] p-6 min-h-[220px]">
                <h2 className="text-[20px] font-bold mb-8">
                  {t("stream_robot_status")}
                </h2>

                <div className="space-y-6 text-sm">
                  <div className="flex justify-between">
                    <span>{t("stream_situation")}</span>
                    <span className="px-3 py-1 rounded-full bg-green-200 text-green-700 font-bold">
                      {playerStatus === "LIVE"
                        ? "working"
                        : playerStatus === "LOADING" ||
                          playerStatus === "CONNECTING"
                        ? "loading"
                        : playerStatus === "RECONNECTING"
                        ? "reconnecting"
                        : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>{t("stream_battery")}</span>
                    <span className="px-3 py-1 rounded-full bg-green-200 text-green-700 font-bold">
                      {isStreaming && liveDeviceInfo?.battery != null
                        ? `${liveDeviceInfo.battery}%`
                        : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>{t("stream_network_century")}</span>
                    <span className="px-3 py-1 rounded-full bg-green-200 text-green-700 font-bold">
                      {isStreaming && liveDeviceInfo?.network
                        ? liveDeviceInfo.network
                        : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>{t("stream_gps_century")}</span>
                    <span className="px-3 py-1 rounded-full bg-green-200 text-green-700 font-bold">
                      {isStreaming && liveDeviceInfo?.gps != null
                        ? liveDeviceInfo.gps
                        : "-"}
                    </span>
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
                    <span className="font-bold text-[#6B7280]">
                      {isStreaming && liveDeviceInfo?.altitude != null
                        ? `${Number(liveDeviceInfo.altitude).toFixed(2)} m`
                        : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>{t("stream_speed")}</span>
                    <span className="font-bold text-[#6B7280]">
                      {isStreaming && liveDeviceInfo?.speed != null
                        ? `${liveDeviceInfo.speed}m/s`
                        : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>{t("stream_operating_hours")}</span>
                    <span className="font-bold text-[#6B7280]">
                      {isStreaming ? formatDuration(elapsedSeconds) : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>{t("stream_start_time")}</span>
                    <span className="font-bold text-[#6B7280]">
                      {isStreaming && workStartTime
                        ? workStartTime.toLocaleString("sv-SE").replace("T", " ")
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[10px] p-6 h-[330px] overflow-hidden">
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
                              <path
                                d="M0 0H10V16L5 22L0 16V0Z"
                                fill={item.color}
                              />
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
                              <path
                                d="M0 0H10V16L5 22L0 16V0Z"
                                fill={item.color}
                              />
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
            {/* Robot Control */}
            <div className="bg-white rounded-[10px] p-6 min-h-[180px]">
            <h2 className="text-[20px] font-bold mb-5">
              {t("stream_robot_control")}
            </h2>

            {isStreaming ? (
              <Button
                onClick={handleStopWork}
                loading={isLoading}
                className="w-full h-[52px]! rounded-[6px]! bg-[#FF3B3B]! border-[#FF3B3B]! text-white! font-bold! text-[18px]!"
              >
                {t("stream_emergency_stop")}
              </Button>
            ) : (
              <div className="w-full rounded-[6px] border border-[#D9DEE7] bg-[#F6F7F9] px-4 py-3 text-[14px] text-[#374151]">
                {t("stream_active_after_start")}
              </div>
            )}
          </div>
          </div>
        </div>

        
      </Form>

      {reportDetail && (
        <WorkReportModal
          open={isReportOpen}
          onClose={handleReportCancel}
          detail={reportDetail}
          reportMeta={reportDetail}
        />
      )}
    </div>
  </div>
);
}