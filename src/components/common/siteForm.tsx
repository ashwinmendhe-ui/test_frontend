import { useCompanyStore } from "@/stores/companyStore";
import { useUserStore } from "@/stores/userStore";
import type { SiteFormValue } from "@/stores/siteStore";
import { Button, Form, Input, Select, message } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface Props {
  mode: "add" | "edit";
  initialValues?: SiteFormValue;
  onSubmit: (
    values: SiteFormValue
  ) => Promise<{ code?: number | string; message?: string } | void>;
  onCancel?: () => void;
  loading: boolean;
}

export default function SiteForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  loading,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm<SiteFormValue>();

  const { list: listCompany, getList: getListCompany } = useCompanyStore();
  const { detailUserLogin } = useUserStore();

  const userRole = detailUserLogin?.roles?.[0];

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
    if (userRole !== 1) {
      form.setFieldValue("companyName", detailUserLogin?.user?.companyName);
      form.setFieldValue("companyId", detailUserLogin?.user?.companyId);
    }
  }, [detailUserLogin, form, userRole]);

  const handleSubmit = async (values: SiteFormValue) => {
  const newValues = {
    ...values,
    companyId:
      userRole !== 1 ? detailUserLogin?.user?.companyId : values.companyId,
    companyName:
      userRole !== 1 ? detailUserLogin?.user?.companyName : values.companyName,
  };

  console.log("site form submit values:", JSON.stringify(newValues, null, 2));

  const res = await onSubmit(newValues);

  console.log("site form submit response:", JSON.stringify(res, null, 2));

  if (!res) return;

  if (
    res.code === -1 ||
    res.code === "BAD_REQUEST" ||
    res.code === "ERROR" ||
    res.code === 400 ||
    res.code === 403 ||
    res.code === 500
  ) {
    message.error(res.message || t("common_save_failed"));
    return;
  }

  await message.success(
    mode === "add"
      ? t("site_create_success", "Site created successfully")
      : t("site_update_success", "Site updated successfully"),2
  );
    navigate("/settings/site");
};

  return (
    <div className="w-full mx-auto py-6 overflow-hidden">
      <Form
        layout="vertical"
        form={form}
        onFinish={handleSubmit}
        initialValues={initialValues}
        className="space-y-6"
      >
        <Form.Item
          label={
            <div className="text-[18px] font-semibold text-[#333D4B]">
              {t("site_form_name")}
            </div>
          }
          name="name"
          rules={[
            {
              required: true,
              message: t("site_validation_enter_name"),
            },
          ]}
        >
          <Input
            placeholder={t("site_placeholder_name")}
            className="h-[41px]"
          />
        </Form.Item>

        <Form.Item
          label={
            <div className="text-[18px] font-semibold text-[#333D4B]">
              {t("site_form_company")}
            </div>
          }
          name={userRole !== 1 ? "companyName" : "companyId"}
          rules={[
            {
              required: true,
              message: t("site_validation_select_company"),
            },
          ]}
        >
          <Select
            className="h-[41px]"
            options={listCompany.map((item) => ({
              value: item.companyId,
              label: item.name,
            }))}
            disabled={userRole !== 1 || mode === "edit"}
            placeholder={t("site_placeholder_select_company")}
          />
        </Form.Item>

        <Form.Item
          label={
            <div className="text-[18px] font-semibold text-[#333D4B]">
              {t("site_form_phone")}
            </div>
          }
          name="phoneNumber"
          rules={[
            {
              required: true,
              message: t("site_validation_enter_phone"),
            },
          ]}
        >
          <Input
            placeholder={t("site_placeholder_phone")}
            className="h-[41px]"
          />
        </Form.Item>

        <Form.Item
          label={
            <div className="text-[18px] font-semibold text-[#333D4B]">
              {t("site_form_email")}
            </div>
          }
          name="email"
          rules={[
            {
              required: true,
              message: t("site_validation_enter_email"),
            },
            {
              type: "email",
              message: t("site_validation_valid_email"),
            },
          ]}
        >
          <Input
            placeholder={t("site_placeholder_email")}
            className="h-[41px]"
          />
        </Form.Item>

        <Form.Item
          label={
            <div className="text-[18px] font-semibold text-[#333D4B]">
              {t("site_form_address")}
            </div>
          }
          name="address"
          rules={[
            {
              required: true,
              message: t("site_validation_enter_address"),
            },
          ]}
        >
          <Input
            placeholder={t("site_placeholder_address")}
            className="h-[41px]"
          />
        </Form.Item>

        <Form.Item
          label={
            <div className="text-[18px] font-semibold text-[#333D4B]">
              {t("site_form_description")}
            </div>
          }
          name="description"
        >
          <Input.TextArea
            rows={3}
            placeholder={t("site_placeholder_description")}
          />
        </Form.Item>

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