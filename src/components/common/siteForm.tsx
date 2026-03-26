import { useCompanyStore } from "@/stores/companyStore";
import { useUserStore } from "@/stores/userStore";
import type { SiteFormValue } from "@/stores/siteStore";
import { Button, Form, Input, Select } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  mode: "add" | "edit";
  initialValues?: SiteFormValue;
  onSubmit: (values: SiteFormValue) => Promise<{ code?: number | string; message?: string } | void>;
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
      companyId: userRole !== 1 ? detailUserLogin?.user?.companyId : values.companyId,
      companyName: userRole !== 1 ? detailUserLogin?.user?.companyName : values.companyName,
    };

    const res = await onSubmit(newValues);

    if (res?.code === -1 || res?.code === "BAD_REQUEST") {
      return;
    }

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
          label={<div className="text-[18px] font-semibold text-[#333D4B]">Site Name</div>}
          name="name"
          rules={[{ required: true, message: "Please enter site name" }]}
        >
          <Input placeholder="Enter site name" className="h-[41px]" />
        </Form.Item>

        <Form.Item
          label={<div className="text-[18px] font-semibold text-[#333D4B]">Company</div>}
          name={userRole !== 1 ? "companyName" : "companyId"}
          rules={[{ required: true, message: "Please select company" }]}
        >
          <Select
            className="h-[41px]"
            options={listCompany.map((item) => ({
              value: item.companyId,
              label: item.name,
            }))}
            disabled={userRole !== 1 || mode === "edit"}
            placeholder="Select company"
          />
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