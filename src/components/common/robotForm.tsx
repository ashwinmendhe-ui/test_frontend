import { useCompanyStore } from "@/stores/companyStore";
import { useSiteStore } from "@/stores/siteStore";
import { useUserStore } from "@/stores/userStore";
import type { DetailDevice } from "@/stores/robotStore";
import { Button, Form, Input, Select } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  mode: "add" | "edit";
  initialValues?: DetailDevice;
  onSubmit: (values: DetailDevice) => Promise<{ code?: number | string; message?: string } | void>;
  onCancel?: () => void;
  loading: boolean;
}

const robotTypeOptions = [
  { value: "Drone", label: "Drone" },
  { value: "Quadruped Robot", label: "Quadruped Robot" },
];

export default function RobotForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  loading,
}: Props) {
  const navigate = useNavigate();
  const [form] = Form.useForm<DetailDevice>();

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
    const newValues = {
      ...values,
      companyId: userRole !== 1 ? detailUserLogin?.user?.companyId || "" : values.companyId,
      companyName: userRole !== 1 ? detailUserLogin?.user?.companyName || "" : values.companyName,
      siteName: listSite.find((site) => site.siteId === values.siteId)?.name || values.siteName,
    };

    const res = await onSubmit(newValues);

    if (res?.code === -1 || res?.code === "BAD_REQUEST") {
      return;
    }

    navigate("/settings/robot");
  };

  return (
    <div className="w-full mx-auto py-6 overflow-hidden">
      <Form layout="vertical" form={form} onFinish={handleSubmit} initialValues={initialValues}>
        <div className="grid grid-cols-2 gap-x-16">
          <Form.Item
            label={<div className="text-[18px] font-semibold text-[#333D4B]">Robot Name</div>}
            name="deviceName"
          >
            <Input placeholder="Enter robot name" className="h-[41px]" />
          </Form.Item>

          <Form.Item
            label={<div className="text-[18px] font-semibold text-[#333D4B]">Robot Type</div>}
            name="deviceType"
            rules={[{ required: true, message: "Please select robot type" }]}
          >
            <Select className="h-[41px]" options={robotTypeOptions} placeholder="Select robot type" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-x-16">
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
              disabled={userRole !== 1}
              onChange={() => form.setFieldValue("siteId", undefined)}
              placeholder="Select company"
            />
          </Form.Item>

          <Form.Item
            label={<div className="text-[18px] font-semibold text-[#333D4B]">Site</div>}
            name="siteId"
          >
            <Select
              className="h-[41px]"
              options={listSite.map((item) => ({
                value: item.siteId,
                label: item.name,
              }))}
              placeholder="Select site"
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-x-16">
          <Form.Item
            label={<div className="text-[18px] font-semibold text-[#333D4B]">Robot Brand</div>}
            name="brandName"
          >
            <Input placeholder="Enter brand name" className="h-[41px]" />
          </Form.Item>

          <Form.Item
            label={<div className="text-[18px] font-semibold text-[#333D4B]">Model Name</div>}
            name="model"
          >
            <Input placeholder="Enter model name" className="h-[41px]" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-x-16">
          <Form.Item
            label={<div className="text-[18px] font-semibold text-[#333D4B]">Serial Number</div>}
            name="deviceSn"
          >
            <Input placeholder="Enter serial number" className="h-[41px]" />
          </Form.Item>

          <Form.Item
            label={<div className="text-[18px] font-semibold text-[#333D4B]">Robot Identifier</div>}
            name="deviceId"
          >
            <Input placeholder="Enter robot identifier" className="h-[41px]" />
          </Form.Item>
        </div>

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