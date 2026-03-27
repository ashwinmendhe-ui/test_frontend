import { Button, Form, Input } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { CompanyFormValue } from "@/stores/companyStore";
import { useTranslation } from "react-i18next";

interface Props {
  mode: "add" | "edit";
  initialValues?: CompanyFormValue;
  onSubmit: (
    values: CompanyFormValue
  ) => Promise<{ code?: number | string; message?: string } | void>;
  onCancel?: () => void;
  loading: boolean;
}

export default function CompanyForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  loading,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm<CompanyFormValue>();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  const handleSubmit = async (values: CompanyFormValue) => {
    const res = await onSubmit(values);

    if (res?.code === -1 || res?.code === "BAD_REQUEST") {
      return;
    }

    navigate("/settings/company");
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
              {t("company_form_name")}
            </div>
          }
          name="name"
          rules={[
            {
              required: true,
              message: t("company_validation_enter_name"),
            },
          ]}
        >
          <Input
            placeholder={t("company_placeholder_name")}
            className="h-[41px]"
          />
        </Form.Item>

        <Form.Item
          label={
            <div className="text-[18px] font-semibold text-[#333D4B]">
              {t("company_form_phone")}
            </div>
          }
          name="phoneNumber"
          rules={[
            {
              required: true,
              message: t("company_validation_enter_phone"),
            },
          ]}
        >
          <Input
            placeholder={t("company_placeholder_phone")}
            className="h-[41px]"
          />
        </Form.Item>

        <Form.Item
          label={
            <div className="text-[18px] font-semibold text-[#333D4B]">
              {t("company_form_email")}
            </div>
          }
          name="email"
          rules={[
            {
              required: true,
              message: t("company_validation_enter_email"),
            },
            {
              type: "email",
              message: t("company_validation_valid_email"),
            },
          ]}
        >
          <Input
            placeholder={t("company_placeholder_email")}
            className="h-[41px]"
          />
        </Form.Item>

        <Form.Item
          label={
            <div className="text-[18px] font-semibold text-[#333D4B]">
              {t("company_form_address")}
            </div>
          }
          name="address"
          rules={[
            {
              required: true,
              message: t("company_validation_enter_address"),
            },
          ]}
        >
          <Input
            placeholder={t("company_placeholder_address")}
            className="h-[41px]"
          />
        </Form.Item>

        <Form.Item
          label={
            <div className="text-[18px] font-semibold text-[#333D4B]">
              {t("company_form_description")}
            </div>
          }
          name="description"
        >
          <Input.TextArea
            rows={3}
            placeholder={t("company_placeholder_description")}
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