import { useCompanyStore } from "@/stores/companyStore";
import { useSiteStore } from "@/stores/siteStore";
import { useUserStore } from "@/stores/userStore";
import type { DetailDevice } from "@/stores/robotStore";
import { Button, Form, Input, Select, message } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface Props {
  mode: "add" | "edit";
  initialValues?: DetailDevice;
  onSubmit: (
    values: DetailDevice
  ) => Promise<{ code?: number | string; message?: string } | void>;
  onCancel?: () => void;
  loading: boolean;
}

export default function RobotForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  loading,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm<DetailDevice>();
  const [messageApi, contextHolder] = message.useMessage();

  const robotTypeOptions = [
    { value: "Drone", label: t("robot_type_drone") },
    { value: "Quadruped Robot", label: t("robot_type_quadruped") },
  ];

  const { list: listCompany, getList: getListCompany } = useCompanyStore();
  const { list: listSite, getListByCompany: getListSite } = useSiteStore();
  const { detailUserLogin } = useUserStore();

  const userRole = detailUserLogin?.roles?.[0];
  const values = Form.useWatch([], form);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  useEffect(() => {
    if (userRole === 1) {
      getListCompany();
    }
  }, [getListCompany, userRole]);

  useEffect(() => {
    if (values?.companyId) {
      getListSite(values.companyId);
    }
  }, [getListSite, values?.companyId]);

  useEffect(() => {
    if (userRole !== 1) {
      form.setFieldValue("companyName", detailUserLogin?.user?.companyName);
      form.setFieldValue("companyId", detailUserLogin?.user?.companyId);

      if (detailUserLogin?.user?.companyId) {
        getListSite(detailUserLogin.user.companyId);
      }
    }
  }, [detailUserLogin, form, getListSite, userRole]);

  const handleSubmit = async (values: DetailDevice) => {
    try {
      const newValues = {
        ...values,
        companyId:
          userRole !== 1
            ? detailUserLogin?.user?.companyId || ""
            : values.companyId,
        companyName:
          userRole !== 1
            ? detailUserLogin?.user?.companyName || ""
            : values.companyName,
        siteName:
          listSite.find((site) => site.siteId === values.siteId)?.name ||
          values.siteName,
      };
      console.log("in robotForm 89 - robot create/update payload", newValues);
      
      const res = await onSubmit(newValues);

      if (res?.code === -1 || res?.code === "BAD_REQUEST") {
        messageApi.error(
          mode === "add"
            ? t("robot_create_failed")
            : t("robot_update_failed")
        );
        return;
      }

      await messageApi.success(
        mode === "add"
          ? t("robot_create_success")
          : t("robot_update_success"),
        2
      );

      navigate("/settings/robot");
    } catch (error: any) {
      messageApi.error(
        error?.response?.data?.message ||
          (mode === "add"
            ? t("robot_create_failed")
            : t("robot_update_failed"))
      );
    }
  };

  return (
    <div className="w-full mx-auto py-6 overflow-hidden">
      {contextHolder}

      <Form
        layout="vertical"
        form={form}
        onFinish={handleSubmit}
        initialValues={initialValues}
      >
        <div className="grid grid-cols-2 gap-x-16">
          <Form.Item
            label={
              <div className="text-[18px] font-semibold text-[#333D4B]">
                {t("robot_form_name")}
              </div>
            }
            name="deviceName"
          >
            <Input
              placeholder={t("robot_placeholder_name")}
              className="h-[41px]"
            />
          </Form.Item>

          <Form.Item
            label={
              <div className="text-[18px] font-semibold text-[#333D4B]">
                {t("robot_form_type")}
              </div>
            }
            name="deviceType"
            rules={[
              {
                required: true,
                message: t("robot_validation_select_type"),
              },
            ]}
          >
            <Select
              className="h-[41px]"
              options={robotTypeOptions}
              placeholder={t("robot_placeholder_select_type")}
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-x-16">
          <Form.Item
            label={
              <div className="text-[18px] font-semibold text-[#333D4B]">
                {t("robot_form_company")}
              </div>
            }
            name={userRole !== 1 ? "companyName" : "companyId"}
            rules={[
              {
                required: true,
                message: t("robot_validation_select_company"),
              },
            ]}
          >
            <Select
              className="h-[41px]"
              options={listCompany.map((item) => ({
                value: item.companyId,
                label: item.name,
              }))}
              disabled={userRole !== 1}
              onChange={() => form.setFieldValue("siteId", undefined)}
              placeholder={t("robot_placeholder_select_company")}
            />
          </Form.Item>

          <Form.Item
            label={
              <div className="text-[18px] font-semibold text-[#333D4B]">
                {t("robot_form_site")}
              </div>
            }
            name="siteId"
          >
            <Select
              className="h-[41px]"
              options={listSite.map((item) => ({
                value: item.siteId,
                label: item.name,
              }))}
              placeholder={t("robot_placeholder_select_site")}
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-x-16">
          <Form.Item
            label={
              <div className="text-[18px] font-semibold text-[#333D4B]">
                {t("robot_form_brand")}
              </div>
            }
            name="brandName"
          >
            <Input
              placeholder={t("robot_placeholder_brand")}
              className="h-[41px]"
            />
          </Form.Item>

          <Form.Item
            label={
              <div className="text-[18px] font-semibold text-[#333D4B]">
                {t("robot_form_model")}
              </div>
            }
            name="model"
          >
            <Input
              placeholder={t("robot_placeholder_model")}
              className="h-[41px]"
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-x-16">
          <Form.Item
            label={
              <div className="text-[18px] font-semibold text-[#333D4B]">
                {t("robot_form_serial_number")}
              </div>
            }
            name="deviceSn"
          >
            <Input
              placeholder={t("robot_placeholder_serial_number")}
              className="h-[41px]"
            />
          </Form.Item>

          <Form.Item
            label={
              <div className="text-[18px] font-semibold text-[#333D4B]">
                {t("robot_form_identifier")}
              </div>
            }
            name="deviceId"
          >
            <Input
              placeholder={t("robot_placeholder_identifier")}
              className="h-[41px]"
            />
          </Form.Item>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button
              onClick={onCancel}
              className="h-[41px] w-[140px] rounded-[7px] bg-white! border! border-[#757575]! text-[#757575]!"
            >
              {t("button_cancel")}
            </Button>
          )}

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="h-[41px] w-[140px] rounded-[7px] bg-primary! hover:bg-primaryDark! border-none text-white!"
          >
            {mode === "add" ? t("button_save") : t("button_update")}
          </Button>
        </div>
      </Form>
    </div>
  );
}