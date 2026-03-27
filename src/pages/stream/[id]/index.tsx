import NoVideoIcon from "@/assets/no-video-icon.svg";
import PlayIcon from "@/assets/play-button-icon.svg";
import PauseIcon from "@/assets/pause-button-icon.svg";
import PrevIcon from "@/assets/prev-button-icon.svg";
import NextIcon from "@/assets/next-button-icon.svg";
import CustomModal from "@/components/common/customModal";
import { Button, Switch } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

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

export default function StreamDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

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

  const deviceInfo: DeviceInfo = {
    deviceName: searchParams.get("deviceLabel") || "Drone Alpha",
    companyName: searchParams.get("companyLabel") || "Dhive",
    siteName: searchParams.get("siteLabel") || "Seoul Site A",
    missionName: searchParams.get("missionLabel") || "Patrol Mission",
    status: isStreaming ? "active" : "offline",
    deviceSn: "SN-001-A1",
    startTime: "2026-03-27 10:15:00",
    operatingHour: "00:45:12",
    latitude: "37.5665",
    longitude: "126.9780",
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
      setSelectedModules((prev) => [
        ...new Set([...prev, ...categoryValues]),
      ]);
    }
  };

  const commonCount = aiModules.filter((item) => item.type === "common").length;
  const dangerCount = aiModules.filter((item) => item.type === "danger").length;
  const selectedCommonCount = selectedModules.filter((value) =>
    aiModules.find((item) => item.value === value)?.type === "common"
  ).length;
  const selectedDangerCount = selectedModules.filter((value) =>
    aiModules.find((item) => item.value === value)?.type === "danger"
  ).length;

  const handleStartStream = () => {
    setIsStreaming(true);
    setIsPlaying(true);
  };

  const handleStopStream = () => {
    setIsStreaming(false);
    setIsPlaying(false);
    setIsReportOpen(true);
  };

  return (
    <>
      <div className="flex gap-[11px] w-full">
        <div className="flex w-2/3 bg-[#F6F7F9] px-6 py-7 flex-col rounded-[10px]">
          <div className="w-full flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[22px] font-semibold text-[#333D4B]">
                {t("stream_live_title")}
              </h2>
              <p className="text-sm text-[#757575] mt-1">
                {deviceInfo.deviceName} / {deviceInfo.missionName}
              </p>
            </div>

            <div className="flex gap-2">
              {!isStreaming ? (
                <Button
                  type="primary"
                  onClick={handleStartStream}
                  className="min-w-[140px] h-[41px] rounded-[7px] bg-primary! text-white! font-semibold!"
                >
                  {t("stream_select_button")}
                </Button>
              ) : (
                <Button
                  danger
                  onClick={handleStopStream}
                  className="min-w-[140px] h-[41px] rounded-[7px] font-semibold!"
                >
                  {t("stream_stop_button")}
                </Button>
              )}

              <Button
                onClick={() => navigate("/stream")}
                className="min-w-[140px] h-[41px] rounded-[7px] font-semibold!"
              >
                {t("stream_back_to_select")}
              </Button>
            </div>
          </div>

          <div className="w-full relative mt-2 rounded-[10px] bg-black min-h-[420px] overflow-hidden">
            {isStreaming ? (
              <div className="absolute inset-0 flex items-center justify-center text-white text-lg">
                {t("stream_video_placeholder")}
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <img src={NoVideoIcon} alt="No video" className="w-16 h-16 opacity-80" />
                <span className="text-white text-sm">
                  {t("stream_no_video")}
                </span>
              </div>
            )}
          </div>

          <div className="w-full mt-3 rounded-[10px] bg-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                className="w-10 h-10 rounded-full bg-[#F6F7F9] flex items-center justify-center"
                type="button"
              >
                <img src={PrevIcon} alt="Previous" className="w-4 h-4" />
              </button>

              <button
                className="w-12 h-12 rounded-full bg-primary flex items-center justify-center"
                type="button"
                onClick={() => setIsPlaying((prev) => !prev)}
                disabled={!isStreaming}
              >
                <img
                  src={isPlaying ? PauseIcon : PlayIcon}
                  alt="Play pause"
                  className="w-4 h-4"
                />
              </button>

              <button
                className="w-10 h-10 rounded-full bg-[#F6F7F9] flex items-center justify-center"
                type="button"
              >
                <img src={NextIcon} alt="Next" className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 px-6">
              <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: isStreaming ? "45%" : "0%" }}
                />
              </div>
            </div>

            <div className="text-sm text-[#333D4B] font-medium min-w-[90px] text-right">
              {isStreaming ? "00:12 / 00:30" : "00:00 / 00:00"}
            </div>
          </div>

          <div className="flex w-full relative mt-3 gap-3">
            <div className="w-1/2 min-h-[250px] bg-white rounded-[10px] p-6">
              <h3 className="text-[18px] font-semibold text-[#333D4B] mb-3">
                {t("stream_secondary_video")}
              </h3>
              <div className="h-[180px] bg-[#F6F7F9] rounded-[8px] flex items-center justify-center text-[#8E8E93]">
                {t("stream_secondary_video_placeholder")}
              </div>
            </div>

            <div className="w-1/2 min-h-[250px] bg-white rounded-[10px] p-6">
              <h3 className="text-[18px] font-semibold text-[#333D4B] mb-3">
                {t("stream_live_map")}
              </h3>
              <div className="h-[180px] bg-[#F6F7F9] rounded-[8px] flex items-center justify-center text-[#8E8E93]">
                {t("stream_map_placeholder")}
              </div>
            </div>
          </div>
        </div>

        <div className="w-1/3 bg-[#F6F7F9] px-6 py-7 rounded-[10px]">
          <div className="w-full flex gap-3 flex-wrap">
            <div className="w-full bg-white rounded-[10px] p-6">
              <h2 className="text-[20px] font-bold mb-4">{t("stream_device_info")}</h2>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-[#F6F7F9] rounded-[8px] p-3">
                  <div className="text-[#8E8E93]">{t("stream_info_device")}</div>
                  <div className="font-medium mt-1">{deviceInfo.deviceName}</div>
                </div>
                <div className="bg-[#F6F7F9] rounded-[8px] p-3">
                  <div className="text-[#8E8E93]">{t("stream_info_status")}</div>
                  <div className="font-medium mt-1">
                    {isStreaming ? t("status_active") : t("status_inactive")}
                  </div>
                </div>
                <div className="bg-[#F6F7F9] rounded-[8px] p-3">
                  <div className="text-[#8E8E93]">{t("stream_info_mission")}</div>
                  <div className="font-medium mt-1">{deviceInfo.missionName}</div>
                </div>
                <div className="bg-[#F6F7F9] rounded-[8px] p-3">
                  <div className="text-[#8E8E93]">{t("stream_info_serial")}</div>
                  <div className="font-medium mt-1">{deviceInfo.deviceSn}</div>
                </div>
                <div className="bg-[#F6F7F9] rounded-[8px] p-3">
                  <div className="text-[#8E8E93]">{t("stream_info_start_time")}</div>
                  <div className="font-medium mt-1">{deviceInfo.startTime}</div>
                </div>
                <div className="bg-[#F6F7F9] rounded-[8px] p-3">
                  <div className="text-[#8E8E93]">{t("stream_info_operating_hour")}</div>
                  <div className="font-medium mt-1">{deviceInfo.operatingHour}</div>
                </div>
                <div className="bg-[#F6F7F9] rounded-[8px] p-3">
                  <div className="text-[#8E8E93]">{t("stream_info_latitude")}</div>
                  <div className="font-medium mt-1">{deviceInfo.latitude}</div>
                </div>
                <div className="bg-[#F6F7F9] rounded-[8px] p-3">
                  <div className="text-[#8E8E93]">{t("stream_info_longitude")}</div>
                  <div className="font-medium mt-1">{deviceInfo.longitude}</div>
                </div>
              </div>
            </div>

            <div className="w-full p-6 h-[360px] bg-white rounded-[10px]">
              <h2 className="text-[20px] font-bold mb-6">{t("stream_ai_module")}</h2>

              <div className="flex gap-3 h-[calc(100%-50px)]">
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[16px] font-semibold">
                      {t("stream_ai_common")}
                    </span>
                    <span className="text-[14px] text-gray-500">
                      <Switch
                        size="small"
                        checked={selectedCommonCount === commonCount}
                        onChange={() => toggleAllModules("common")}
                        className="mr-1!"
                      />
                      ({selectedCommonCount}/{commonCount})
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 border border-[#DDE0E5] bg-[#F6F7F9] p-2 rounded-[8px]">
                    {aiModules
                      .filter((item) => item.type === "common")
                      .map((item) => {
                        const isChecked = selectedModules.includes(item.value);

                        return (
                          <div
                            key={item.value}
                            className="relative bg-white border border-gray-200 rounded-lg p-3"
                          >
                            <div className="absolute top-0 right-2">
                              <svg width="10" height="22" viewBox="0 0 10 22" fill="none">
                                <path d="M0 0H10V16L5 22L0 16V0Z" fill={item.color} />
                              </svg>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="text-[10px] text-gray-500 mb-1">
                                  {item.category}
                                </div>
                                <div className="text-[12px] font-semibold text-gray-800">
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
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[16px] font-semibold">
                      {t("stream_ai_danger")}
                    </span>
                    <span className="text-[14px] text-gray-500">
                      <Switch
                        size="small"
                        checked={selectedDangerCount === dangerCount}
                        onChange={() => toggleAllModules("danger")}
                        className="mr-1!"
                      />
                      ({selectedDangerCount}/{dangerCount})
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 border border-[#DDE0E5] bg-[#F6F7F9] p-2 rounded-[8px]">
                    {aiModules
                      .filter((item) => item.type === "danger")
                      .map((item) => {
                        const isChecked = selectedModules.includes(item.value);

                        return (
                          <div
                            key={item.value}
                            className="relative bg-white border border-gray-200 rounded-lg p-3"
                          >
                            <div className="absolute top-0 right-2">
                              <svg width="10" height="22" viewBox="0 0 10 22" fill="none">
                                <path d="M0 0H10V16L5 22L0 16V0Z" fill={item.color} />
                              </svg>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="text-[10px] text-gray-500 mb-1">
                                  {item.category}
                                </div>
                                <div className="text-[12px] font-semibold text-gray-800">
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
              <h2 className="text-[20px] font-bold">{t("stream_device_control")}</h2>

              {!isStreaming ? (
                <div className="mt-6 bg-[#F6F7F9] px-5 py-3 rounded-[7px] border border-[#DDE0E5] text-[#555]">
                  {t("stream_device_notice")}
                </div>
              ) : (
                <div className="mt-6 flex flex-col gap-3">
                  <Button className="w-full h-[47px]! bg-primary! rounded-[7px] border-0! text-white! font-bold! text-[17px]!">
                    {t("stream_take_off")}
                  </Button>
                  <Button className="w-full h-[47px]! bg-[#0D6FFF]! rounded-[7px] border-0! text-white! font-bold! text-[17px]!">
                    {t("stream_return_to_base")}
                  </Button>
                  <Button className="w-full h-[47px]! bg-[#FF9500]! rounded-[7px] border-0! text-white! font-bold! text-[17px]!">
                    {t("stream_emergency_landing")}
                  </Button>
                </div>
              )}
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
        onOk={() => setIsReportOpen(false)}
        onCancel={() => setIsReportOpen(false)}
      />
    </>
  );
}