import { Button, Form, Select } from "antd";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUserStore } from "@/stores/userStore";

type StreamFormValues = {
  company?: string;
  site?: string;
  device?: string;
  mission?: string;
};

export default function StreamIndex() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { detailUserLogin } = useUserStore();
  const [form] = Form.useForm<StreamFormValues>();

  const userRole = detailUserLogin?.roles?.[0];

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

  const values = Form.useWatch([], form);

  const handleSelectChange = (fieldName: keyof StreamFormValues, value: string) => {
    form.setFieldValue(fieldName, value);

    if (fieldName === "company") {
      form.setFieldsValue({
        site: undefined,
        device: undefined,
        mission: undefined,
      });
    } else if (fieldName === "site") {
      form.setFieldsValue({
        device: undefined,
        mission: undefined,
      });
    } else if (fieldName === "device") {
      form.setFieldValue("mission", undefined);
    }
  };

  const handleSubmit = async () => {
    const formValues = await form.validateFields();

    const params = new URLSearchParams({
      company: formValues.company || "",
      site: formValues.site || "",
      mission: formValues.mission || "",
      missionLabel:
        missionOptions.find((item) => item.value === formValues.mission)?.label || "",
      companyLabel:
        companyOptions.find((item) => item.value === formValues.company)?.label || "",
      siteLabel:
        siteOptions.find((item) => item.value === formValues.site)?.label || "",
      deviceLabel:
        deviceOptions.find((item) => item.value === formValues.device)?.label || "",
    });

    navigate(`/stream/${formValues.device}?${params.toString()}`);
  };

  return (
    <div className="w-full bg-[#F6F7F9] rounded-[10px] p-6">
      <div className="mb-6">
        <h2 className="text-[24px] font-semibold text-[#333D4B]">
          {t("stream_page_title")}
        </h2>
        <p className="text-sm text-[#757575] mt-2">
          {t("stream_page_description")}
        </p>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Form.Item
            name="company"
            label={t("stream_select_company")}
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
                        label: detailUserLogin?.user?.companyName || "Dhive",
                      },
                    ]
              }
              disabled={userRole !== 1}
              className="h-[41px]"
              onChange={(value) => handleSelectChange("company", value)}
            />
          </Form.Item>

          <Form.Item
            name="site"
            label={t("stream_select_site")}
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
              className="h-[41px]"
              onChange={(value) => handleSelectChange("site", value)}
            />
          </Form.Item>

          <Form.Item
            name="device"
            label={t("stream_select_device")}
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
              className="h-[41px]"
              onChange={(value) => handleSelectChange("device", value)}
            />
          </Form.Item>

          <Form.Item
            name="mission"
            label={t("stream_select_mission")}
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
              className="h-[41px]"
              onChange={(value) => handleSelectChange("mission", value)}
            />
          </Form.Item>
        </div>

        <div className="flex justify-end mt-2">
          <Button
            type="primary"
            htmlType="submit"
            className="min-w-[180px] h-[45px] rounded-[7px] bg-primary! border-none text-white! font-semibold!"
          >
            {t("stream_select_button")}
          </Button>
        </div>
      </Form>

      <div className="mt-8 bg-white rounded-[10px] p-6 border border-[#E5E7EB]">
        <h3 className="text-[18px] font-semibold text-[#333D4B] mb-3">
          {t("stream_preview_title")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-[#555]">
          <div className="bg-[#F6F7F9] rounded-[8px] p-4">
            <div className="text-[#8E8E93] mb-1">{t("stream_preview_company")}</div>
            <div>{values?.company || "-"}</div>
          </div>
          <div className="bg-[#F6F7F9] rounded-[8px] p-4">
            <div className="text-[#8E8E93] mb-1">{t("stream_preview_site")}</div>
            <div>{values?.site || "-"}</div>
          </div>
          <div className="bg-[#F6F7F9] rounded-[8px] p-4">
            <div className="text-[#8E8E93] mb-1">{t("stream_preview_device")}</div>
            <div>{values?.device || "-"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}