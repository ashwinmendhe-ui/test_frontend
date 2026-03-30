import FolderIcon from "@/assets/folder-icon.svg";
import NoVideoIcon from "@/assets/no-video-icon.svg";
import PlayIcon from "@/assets/play-button-icon.svg";
import PauseIcon from "@/assets/pause-button-icon.svg";
import PrevIcon from "@/assets/prev-button-icon.svg";
import NextIcon from "@/assets/next-button-icon.svg";
import SelectIcon from "@/assets/playback-select-icon.svg";
import XIcon from "@/assets/x-icon.svg";
import { Button, Form, Select, Slider, Switch } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserStore } from "@/stores/userStore";

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

type VideoOption = {
  value: string;
  label: string;
  duration: number;
};

const formatSeconds = (value: number) => {
  const total = Math.max(0, Math.floor(value));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

export default function Playback() {
  const { t } = useTranslation();
  const { detailUserLogin } = useUserStore();
  const [form] = Form.useForm<PlaybackFormValues>();

  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const userRole = detailUserLogin?.roles?.[0];
  const values = Form.useWatch([], form);

  const companyOptions = useMemo(
    () => [
      { value: "company-1", label: "Dhive" },
      { value: "company-2", label: "Test Company" },
    ],
    []
  );

  const siteOptions = useMemo(
    () => [
      { value: "site-1", label: "Seoul Site A" },
      { value: "site-2", label: "Busan Site B" },
      { value: "site-3", label: "Incheon Site C" },
    ],
    []
  );

  const deviceOptions = useMemo(
    () => [
      { value: "device-1", label: "Drone Alpha" },
      { value: "device-2", label: "Robot Bravo" },
      { value: "device-3", label: "Drone Charlie" },
    ],
    []
  );

  const missionOptions = useMemo(
    () => [
      { value: "mission-1", label: "Patrol Mission" },
      { value: "mission-2", label: "Monitoring Mission" },
      { value: "mission-3", label: "Delivery Mission" },
    ],
    []
  );

  const videoOptions: VideoOption[] = useMemo(
    () => [
      {
        value: "video-1",
        label: "2026-03-27 10:15 Patrol Mission",
        duration: 180,
      },
      {
        value: "video-2",
        label: "2026-03-27 11:10 Monitoring Mission",
        duration: 240,
      },
      {
        value: "video-3",
        label: "2026-03-27 13:45 Delivery Mission",
        duration: 210,
      },
    ],
    []
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

  const mainDuration = useMemo(() => {
    if (selectedVideoItems.length === 0) return 0;
    return Math.max(...selectedVideoItems.map((item) => item.duration));
  }, [selectedVideoItems]);

  const playbackDeviceInfo: DeviceInfo = {
    deviceName:
      deviceOptions.find((item) => item.value === values?.device)?.label || "Drone Alpha",
    companyName:
      companyOptions.find((item) => item.value === values?.company)?.label || "Dhive",
    siteName:
      siteOptions.find((item) => item.value === values?.site)?.label || "Seoul Site A",
    missionName:
      missionOptions.find((item) => item.value === values?.mission)?.label || "Patrol Mission",
    status: selectedVideos.length > 0 ? "active" : "offline",
    deviceSn: "SN-001-A1",
    startTime: "2026-03-27 10:15:00",
    operatingHour: formatSeconds(currentTime),
    latitude: "37.5665",
    longitude: "126.9780",
  };

  const handleSelectChange = (fieldName: keyof PlaybackFormValues, value: string) => {
    form.setFieldValue(fieldName, value);

    if (fieldName === "company") {
      form.setFieldsValue({
        site: undefined,
        device: undefined,
        mission: undefined,
      });
      setSelectedVideos([]);
      setCurrentTime(0);
      setIsPlaying(false);
    } else if (fieldName === "site") {
      form.setFieldsValue({
        device: undefined,
        mission: undefined,
      });
      setSelectedVideos([]);
      setCurrentTime(0);
      setIsPlaying(false);
    } else if (fieldName === "device") {
      form.setFieldsValue({
        mission: undefined,
      });
      setSelectedVideos([]);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  const handleVideoSelectionChange = (value: string[]) => {
    const limited = value.slice(0, 2);
    setSelectedVideos(limited);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleRemoveVideo = (index: number) => {
    setSelectedVideos((prev) => prev.filter((_, i) => i !== index));
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    if (selectedVideos.length === 0) return;
    setIsPlaying((prev) => !prev);
  };

  const handlePrevious = () => {
    setCurrentTime((prev) => Math.max(0, prev - 10));
  };

  const handleNext = () => {
    setCurrentTime((prev) => Math.min(mainDuration, prev + 10));
  };

  const handleSliderChange = (value: number) => {
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

  const selectedCommonCount = selectedModules.filter((value) =>
    aiModules.find((item) => item.value === value)?.type === "common"
  ).length;

  const selectedDangerCount = selectedModules.filter((value) =>
    aiModules.find((item) => item.value === value)?.type === "danger"
  ).length;

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
                options={
                  userRole === 1
                    ? companyOptions
                    : [
                        {
                          value: detailUserLogin?.user?.companyId || "company-1",
                          label: detailUserLogin?.user?.companyName || "Dhive",
                        },
                      ]
                }
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
                disabled={!values?.mission}
                maxTagCount="responsive"
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
          ) : (
            <div
              className={`grid gap-2 p-2 h-full ${
                selectedVideos.length === 1 ? "grid-cols-1" : "grid-cols-2"
              }`}
            >
              {selectedVideoItems.map((video, index) => (
                <div
                  key={video.value}
                  className="relative rounded-[8px] bg-black overflow-hidden flex items-center justify-center"
                >
                  <div className="absolute top-3 left-3 z-10 bg-white/90 rounded-full px-3 py-1 text-xs font-semibold text-[#333D4B]">
                    {index === 0
                      ? t("playback_primary_video")
                      : t("playback_secondary_video")}
                  </div>

                  <div className="text-white text-lg text-center px-4">
                    {video.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full rounded-[10px] bg-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="w-10 h-10 rounded-full bg-[#F6F7F9] flex items-center justify-center"
              type="button"
              onClick={handlePrevious}
              disabled={selectedVideos.length === 0}
            >
              <img src={PrevIcon} alt="Previous" className="w-4 h-4" />
            </button>

            <button
              className="w-12 h-12 rounded-full bg-primary flex items-center justify-center"
              type="button"
              onClick={handlePlayPause}
              disabled={selectedVideos.length === 0}
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
              onClick={handleNext}
              disabled={selectedVideos.length === 0}
            >
              <img src={NextIcon} alt="Next" className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 px-6">
            <Slider
              value={currentTime}
              min={0}
              max={mainDuration || 0}
              onChange={handleSliderChange}
              disabled={selectedVideos.length === 0}
              tooltip={{
                formatter: (value) => formatSeconds(value || 0),
              }}
            />
          </div>

          <div className="text-sm text-[#333D4B] font-medium min-w-[110px] text-right">
            {formatSeconds(currentTime)} / {formatSeconds(mainDuration)}
          </div>
        </div>

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
                      <div className="text-sm font-semibold text-gray-800 truncate max-w-[210px]">
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