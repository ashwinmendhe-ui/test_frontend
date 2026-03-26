import { useCompanyStore } from "@/stores/companyStore";
import { useSiteStore } from "@/stores/siteStore";
import { useUserStore } from "@/stores/userStore";
import type { MissionFormValue } from "@/stores/missionStore";
import { Button, Form, Input, Select } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  mode: "add" | "edit";
  initialValues?: MissionFormValue;
  onSubmit: (values: MissionFormValue) => Promise<{ code?: number; uploadUrl?: string } | void>;
  onCancel?: () => void;
  loading: boolean;
}

const deviceTypeOptions = [
  { value: "Drone", label: "Drone" },
  { value: "Robot", label: "Robot" },
];

const missionTypeOptions = [
  { value: "Patrol", label: "Patrol" },
  { value: "Monitoring", label: "Monitoring" },
  { value: "Delivery", label: "Delivery" },
  { value: "Cleaning", label: "Cleaning" },
];

export default function MissionForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  loading,
}: Props) {
  const navigate = useNavigate();
  const [form] = Form.useForm<MissionFormValue>();

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
      companyId: userRole !== 1 ? detailUserLogin?.user?.companyId || "" : values.companyId,
      companyName: userRole !== 1 ? detailUserLogin?.user?.companyName || "" : values.companyName,
    };

    const res = await onSubmit(newValues);

    if (res?.code === 1) return;

    navigate("/settings/mission");
  };

  return (
    <div className="w-full mx-auto py-6 overflow-hidden">
      <Form layout="vertical" form={form} onFinish={handleSubmit} initialValues={initialValues}>
        <div className="grid grid-cols-2 gap-x-16">
          <div className="flex flex-col">
            <Form.Item
              label={<div className="text-[18px] font-semibold text-[#333D4B]">Mission Name</div>}
              name="missionName"
              rules={[{ required: true, message: "Please enter mission name" }]}
            >
              <Input placeholder="Enter mission name" className="h-[41px]" />
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
                disabled={userRole !== 1}
                onChange={() => form.setFieldValue("siteId", undefined)}
                placeholder="Select company"
              />
            </Form.Item>

            <Form.Item
              label={<div className="text-[18px] font-semibold text-[#333D4B]">Site</div>}
              name="siteId"
              rules={[{ required: true, message: "Please select site" }]}
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

            <Form.Item
              label={<div className="text-[18px] font-semibold text-[#333D4B]">Device Type</div>}
              name="deviceType"
              rules={[{ required: true, message: "Please select device type" }]}
            >
              <Select className="h-[41px]" options={deviceTypeOptions} placeholder="Select device type" />
            </Form.Item>
          </div>

          <div className="flex flex-col">
            <Form.Item
              label={<div className="text-[18px] font-semibold text-[#333D4B]">File</div>}
              name="file"
            >
              <Input placeholder="File name" className="h-[41px]" />
            </Form.Item>

            <Form.Item
              label={<div className="text-[18px] font-semibold text-[#333D4B]">Mission Type</div>}
              name="missionType"
              rules={[{ required: true, message: "Please select mission type" }]}
            >
              <Select className="h-[41px]" options={missionTypeOptions} placeholder="Select mission type" />
            </Form.Item>

            <Form.Item
              label={<div className="text-[18px] font-semibold text-[#333D4B]">Description</div>}
              name="description"
            >
              <Input placeholder="Description" className="h-[41px]" />
            </Form.Item>
          </div>
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