import { Button, Form, Input } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { CompanyFormValue } from "@/stores/companyStore";

interface Props {
  mode: "add" | "edit";
  initialValues?: CompanyFormValue;
  onSubmit: (values: CompanyFormValue) => Promise<{ code?: number | string; message?: string } | void>;
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
          label={<div className="text-[18px] font-semibold text-[#333D4B]">Company Name</div>}
          name="name"
          rules={[{ required: true, message: "Please enter company name" }]}
        >
          <Input placeholder="Company Name" className="h-[41px]" />
        </Form.Item>

        <Form.Item
          label={<div className="text-[18px] font-semibold text-[#333D4B]">Phone Number</div>}
          name="phoneNumber"
          rules={[{ required: true, message: "Please enter phone number" }]}
        >
          <Input placeholder="Phone Number" className="h-[41px]" />
        </Form.Item>

        <Form.Item
          label={<div className="text-[18px] font-semibold text-[#333D4B]">Email</div>}
          name="email"
          rules={[
            { required: true, message: "Please enter email" },
            { type: "email", message: "Please enter valid email" },
          ]}
        >
          <Input placeholder="Email" className="h-[41px]" />
        </Form.Item>

        <Form.Item
          label={<div className="text-[18px] font-semibold text-[#333D4B]">Address</div>}
          name="address"
          rules={[{ required: true, message: "Please enter address" }]}
        >
          <Input placeholder="Address" className="h-[41px]" />
        </Form.Item>

        <Form.Item
          label={<div className="text-[18px] font-semibold text-[#333D4B]">Description</div>}
          name="description"
        >
          <Input.TextArea rows={3} placeholder="Description" />
        </Form.Item>

        <div className="flex justify-end gap-3 pt-4">
          {onCancel && (
            <Button
              onClick={onCancel}
              className="h-[41px] w-[140px] rounded-[7px] bg-white! border! border-[#757575]! text-[#757575]!"
            >
              Cancel
            </Button>
          )}

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="h-[41px] w-[140px] rounded-[7px] bg-primary! hover:bg-primaryDark! border-none text-white!"
          >
            {mode === "add" ? "Save" : "Update"}
          </Button>
        </div>
      </Form>
    </div>
  );
}