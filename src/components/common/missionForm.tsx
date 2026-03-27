import { useCompanyStore } from "@/stores/companyStore";
import { useSiteStore } from "@/stores/siteStore";
import { useUserStore } from "@/stores/userStore";
import type { MissionFormValue } from "@/stores/missionStore";
import { Button, Form, Input, Select } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface Props {
  mode: "add" | "edit";
  initialValues?: MissionFormValue;
  onSubmit: (
    values: MissionFormValue
  ) => Promise<{ code?: number; uploadUrl?: string } | void>;
  onCancel?: () => void;
  loading: boolean;
}

export default function MissionForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  loading,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm<MissionFormValue>();

  const deviceTypeOptions = [
    { value: "Drone", label: t("mission_device_type_drone") },
    { value: "Robot", label: t("mission_device_type_robot") },
  ];

  const missionTypeOptions = [
    { value: "Patrol", label: t("mission_type_patrol") },
    { value: "Monitoring", label: t("mission_type_monitoring") },
    { value: "Delivery", label: t("mission_type_delivery") },
    { value: "Cleaning", label: t("mission_type_cleaning") },
  ];

  const { list: listCompany, getList: getListCompany } = useCompanyStore();
  const { list: listSite, getListByCompany } = useSiteStore();
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
      getListByCompany(values.companyId);
    }
  }, [getListByCompany, values?.companyId]);

  useEffect(() => {
    if (userRole !== 1) {
      form.setFieldValue("companyName", detailUserLogin?.user?.companyName);
      form.setFieldValue("companyId", detailUserLogin?.user?.companyId);
      if (detailUserLogin?.user?.companyId) {
        getListByCompany(detailUserLogin.user.companyId);
      }
    }
  }, [detailUserLogin, form, getListByCompany, userRole]);

  const handleSubmit = async (values: MissionFormValue) => {
    const newValues = {
      ...values,
      companyId:
        userRole !== 1 ? detailUserLogin?.user?.companyId || "" : values.companyId,
      companyName:
        userRole !== 1 ? detailUserLogin?.user?.companyName || "" : values.companyName,
    };

    const res = await onSubmit(newValues);

    if (res?.code === 1) return;

    navigate("/settings/mission");
  };

  return (
    <div className="w-full mx-auto py-6 overflow-hidden">
      <Form
        layout="vertical"
        form={form}
        onFinish={handleSubmit}
        initialValues={initialValues}
      >
        <div className="grid grid-cols-2 gap-x-16">
          <div className="flex flex-col">
            <Form.Item
              label={
                <div className="text-[18px] font-semibold text-[#333D4B]">
                  {t("mission_form_name")}
                </div>
              }
              name="missionName"
              rules={[
                {
                  required: true,
                  message: t("mission_validation_enter_name"),
                },
              ]}
            >
              <Input
                placeholder={t("mission_placeholder_name")}
                className="h-[41px]"
              />
            </Form.Item>

            <Form.Item
              label={
                <div className="text-[18px] font-semibold text-[#333D4B]">
                  {t("mission_form_company")}
                </div>
              }
              name={userRole !== 1 ? "companyName" : "companyId"}
              rules={[
                {
                  required: true,
                  message: t("mission_validation_select_company"),
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
                placeholder={t("mission_placeholder_select_company")}
              />
            </Form.Item>

            <Form.Item
              label={
                <div className="text-[18px] font-semibold text-[#333D4B]">
                  {t("mission_form_site")}
                </div>
              }
              name="siteId"
              rules={[
                {
                  required: true,
                  message: t("mission_validation_select_site"),
                },
              ]}
            >
              <Select
                className="h-[41px]"
                options={listSite.map((item) => ({
                  value: item.siteId,
                  label: item.name,
                }))}
                placeholder={t("mission_placeholder_select_site")}
              />
            </Form.Item>

            <Form.Item
              label={
                <div className="text-[18px] font-semibold text-[#333D4B]">
                  {t("mission_form_device_type")}
                </div>
              }
              name="deviceType"
              rules={[
                {
                  required: true,
                  message: t("mission_validation_select_device_type"),
                },
              ]}
            >
              <Select
                className="h-[41px]"
                options={deviceTypeOptions}
                placeholder={t("mission_placeholder_select_device_type")}
              />
            </Form.Item>
          </div>

          <div className="flex flex-col">
            <Form.Item
              label={
                <div className="text-[18px] font-semibold text-[#333D4B]">
                  {t("mission_form_file")}
                </div>
              }
              name="file"
            >
              <Input
                placeholder={t("mission_placeholder_file")}
                className="h-[41px]"
              />
            </Form.Item>

            <Form.Item
              label={
                <div className="text-[18px] font-semibold text-[#333D4B]">
                  {t("mission_form_type")}
                </div>
              }
              name="missionType"
              rules={[
                {
                  required: true,
                  message: t("mission_validation_select_type"),
                },
              ]}
            >
              <Select
                className="h-[41px]"
                options={missionTypeOptions}
                placeholder={t("mission_placeholder_select_type")}
              />
            </Form.Item>

            <Form.Item
              label={
                <div className="text-[18px] font-semibold text-[#333D4B]">
                  {t("mission_form_description")}
                </div>
              }
              name="description"
            >
              <Input
                placeholder={t("mission_placeholder_description")}
                className="h-[41px]"
              />
            </Form.Item>
          </div>
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