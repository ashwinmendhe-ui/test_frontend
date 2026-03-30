import NoVideoIcon from "@/assets/no-video-icon.svg";
import PlayIcon from "@/assets/play-button-icon.svg";
import PauseIcon from "@/assets/pause-button-icon.svg";
import PrevIcon from "@/assets/prev-button-icon.svg";
import NextIcon from "@/assets/next-button-icon.svg";
import CustomModal from "@/components/common/customModal";
import { Button, Form, Select, Switch } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserStore } from "@/stores/userStore";
import { useNavigate } from "react-router-dom";

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

export default function StreamIndex() {
  const { t } = useTranslation();
   const navigate = useNavigate();
  const { detailUserLogin } = useUserStore();
  const [form] = Form.useForm<StreamFormValues>();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

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

  const handleSelectChange = (fieldName: keyof StreamFormValues, value: string) => {
    form.setFieldValue(fieldName, value);

    if (fieldName === "company") {
      form.setFieldsValue({
        site: undefined,
        device: undefined,
        mission: undefined,
      });
      setIsStreaming(false);
      setIsPlaying(false);
    } else if (fieldName === "site") {
      form.setFieldsValue({
        device: undefined,
        mission: undefined,
      });
      setIsStreaming(false);
      setIsPlaying(false);
    } else if (fieldName === "device") {
      form.setFieldValue("mission", undefined);
      setIsStreaming(false);
      setIsPlaying(false);
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

  const handleStartWork = async () => {
    try {
      await form.validateFields();
      setIsStreaming(true);
      setIsPlaying(true);
    } catch {
      // validation errors are already shown by antd form
    }
  };

  const handleStopWork = () => {
    setIsStreaming(false);
    setIsPlaying(false);
    setIsReportOpen(true);
  };

  const selectedCompanyLabel =
    companyOptions.find((item) => item.value === values?.company)?.label ||
    detailUserLogin?.user?.companyName ||
    "-";

  const selectedSiteLabel =
    siteOptions.find((item) => item.value === values?.site)?.label || "-";

  const selectedDeviceLabel =
    deviceOptions.find((item) => item.value === values?.device)?.label || "-";

  const selectedMissionLabel =
    missionOptions.find((item) => item.value === values?.mission)?.label || "-";
 
  
  const handleReportOk = () => {
      setIsReportOpen(false);
      navigate("/history");
    };

const handleReportCancel = () => {
  setIsReportOpen(false);
};
  return (
    <>
      <div className="w-full flex gap-[11px]">
        <div className="w-2/3 bg-[#F6F7F9] px-6 py-7 rounded-[10px]">
          <div className="flex flex-col gap-4">
            <Form form={form} layout="vertical">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
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
                    options={
                      userRole === 1
                        ? companyOptions
                        : [
                            {
                              value: detailUserLogin?.user?.companyId || "company-1",
                              label:
                                detailUserLogin?.user?.companyName || "Dhive",
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

                <div className="flex items-center">
                  {!isStreaming ? (
                    <Button
                      type="primary"
                      onClick={handleStartWork}
                      className="w-full h-[48px] rounded-[8px] bg-primary! border-none text-white! font-bold! text-[18px]!"
                    >
                      {t("stream_start_work")}
                    </Button>
                  ) : (
                    <Button
                      danger
                      onClick={handleStopWork}
                      className="w-full h-[48px] rounded-[8px] font-bold! text-[18px]!"
                    >
                      {t("stream_stop_work")}
                    </Button>
                  )}
                </div>
              </div>
            </Form>

            <div className="relative bg-[#364152] rounded-[10px] min-h-[500px] overflow-hidden">
              <div className="absolute top-4 left-5 flex items-center gap-2 text-white text-[14px] font-bold z-10">
                <span className="w-2 h-2 rounded-full bg-[#9CA3AF]" />
                {isStreaming ? t("status_active").toUpperCase() : "OFFLINE"}
              </div>

              {isStreaming ? (
                <div className="absolute inset-0 flex items-center justify-center text-white text-xl">
                  {t("stream_video_placeholder")}
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
                  <img src={NoVideoIcon} alt="No video" className="w-28 h-28 opacity-90" />
                  <p className="text-white text-[18px]">
                    {t("stream_waiting_activation")}
                  </p>
                </div>
              )}
            </div>

            <div className="relative bg-[#364152] rounded-[10px] min-h-[210px] overflow-hidden w-1/2">
              <div className="absolute top-4 left-5 flex items-center gap-2 text-white text-[14px] font-bold z-10">
                <span className="w-2 h-2 rounded-full bg-[#9CA3AF]" />
                {isStreaming ? t("status_active").toUpperCase() : "OFFLINE"}
              </div>

              {isStreaming ? (
                <div className="absolute inset-0 flex items-center justify-center text-white text-lg">
                  {t("stream_secondary_video_placeholder")}
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <img src={NoVideoIcon} alt="No video" className="w-20 h-20 opacity-90" />
                  <p className="text-white text-[16px]">
                    {t("stream_waiting_activation")}
                  </p>
                </div>
              )}
            </div>

            <div className="w-full mt-1 rounded-[10px] bg-white px-6 py-4 flex items-center justify-between">
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
          </div>
        </div>

        <div className="w-1/3 bg-[#F6F7F9] px-6 py-7 rounded-[10px] flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-[10px] p-6 min-h-[220px]">
              <h2 className="text-[20px] font-bold text-[#222] leading-[1.05]">
                {t("stream_robot_status")}
              </h2>

              <div className="mt-8 space-y-6 text-[16px] text-[#333]">
                <div className="flex justify-between">
                  <span>{t("stream_robot_situation")}</span>
                  <span>-</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("stream_robot_battery")}</span>
                  <span>-</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("stream_robot_network")}</span>
                  <span>-</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("stream_robot_gps")}</span>
                  <span>-</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[10px] p-6 min-h-[220px]">
              <h2 className="text-[20px] font-bold text-[#222] leading-[1.05]">
                {t("stream_operation_information")}
              </h2>

              <div className="mt-8 space-y-6 text-[16px] text-[#333]">
                <div className="flex justify-between gap-2">
                  <span>{t("stream_info_altitude")}</span>
                  <span>-</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>{t("stream_info_speed")}</span>
                  <span>-</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>{t("stream_info_operating_hours")}</span>
                  <span>-</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>{t("stream_info_start_time")}</span>
                  <span>-</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[10px] p-6 flex-1 min-h-[350px]">
            <h2 className="text-[20px] font-bold mb-5">{t("stream_ai_module")}</h2>

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
            <h2 className="text-[20px] font-bold mb-4">{t("stream_device_info")}</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-[#F6F7F9] rounded-[8px] p-3">
                <div className="text-[#8E8E93]">{t("stream_preview_company")}</div>
                <div className="font-medium mt-1">{selectedCompanyLabel}</div>
              </div>
              <div className="bg-[#F6F7F9] rounded-[8px] p-3">
                <div className="text-[#8E8E93]">{t("stream_preview_site")}</div>
                <div className="font-medium mt-1">{selectedSiteLabel}</div>
              </div>
              <div className="bg-[#F6F7F9] rounded-[8px] p-3">
                <div className="text-[#8E8E93]">{t("stream_preview_device")}</div>
                <div className="font-medium mt-1">{selectedDeviceLabel}</div>
              </div>
              <div className="bg-[#F6F7F9] rounded-[8px] p-3">
                <div className="text-[#8E8E93]">{t("stream_info_mission")}</div>
                <div className="font-medium mt-1">{selectedMissionLabel}</div>
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