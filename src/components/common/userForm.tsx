import { Button, Form, Input, Select , Dropdown, Checkbox} from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomModal from "./customModal";
import { SortableTable, type SortableTableColumn } from "./table"; 
import ActionMenu from "./actionMenu";
import ActionIcon from "@/assets/table-action-icon.svg"
import { useUserStore } from "@/stores/userStore";

export interface UserFormValue {
  role?: number;
  email: string;
  password?: string;
  confirmPassword?: string;
  companyId?: string;
  companyName?: string;
  username: string;
  phone: string;
  description?: string;
}

interface Props {
  mode: "add" | "edit";
  initialValues?: UserFormValue;
  onSubmit: (values: UserFormValue) => Promise<{ code?: number | string; message?: string } | void>;
  onCancel?: () => void;
  loading: boolean;
}

const roleOptions = [
  { value: 1, label: "System Administrator" },
  { value: 2, label: "Company Admin" },
  { value: 3, label: "Company User" },
];

const companyOptions = [
  { value: "1", label: "Dhive" },
  { value: "2", label: "Test Company" },
];
type SiteOption = {
  value: string;
  label: string;
};
export default function UserForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  loading,
}: Props) {
  const [form] = Form.useForm<UserFormValue>();
  const values = Form.useWatch([], form);
  const navigate = useNavigate();
  const [isChangePassOpen, setIsChangePassOpen] = useState(false)
  const [formChangePass] =Form.useForm()
  const [isAssignSiteOpen, setIsAssignSiteOpen] = useState(false);
  const [formAssign] = Form.useForm();
  type AssignedSiteRow = {
    id: number;
    siteName: string;
    createdAt: string;
    missionList: string[];
    deviceList: string[];
  };
  const { detailUserLogin } = useUserStore();
  const userRole = detailUserLogin?.roles?.[0];

const [sites, setSites] = useState<AssignedSiteRow[]>([]);

  const [selectedSiteRecord, setSelectedSiteRecord] = useState<AssignedSiteRow | null>(null);

  const [isDeleteSiteOpen, setIsDeleteSiteOpen] = useState(false);
  const [isEditSiteOpen, setIsEditSiteOpen] = useState(false);
  const [formEditSite] = Form.useForm();

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  const handleFinish = async (values: UserFormValue) => {
    const res = await onSubmit(values);

    if (res && (res.code === -1 || res.code === "BAD_REQUEST")) {
      return;
    }

    navigate("/settings/user");
  };
const siteColumns = [
  {
    title: "ID",
    dataIndex: "id",
    key: "id",
    enableSort: false,
    width: "10%",
  },
  {
    title: "Site Name",
    dataIndex: "siteName",
    key: "siteName",
    enableSort: true,
    width: "30%",
  },
  {
    title: "Assigned Missions",
    key: "missionCount",
    enableSort: false,
    width: "20%",
    render: (_: unknown, record: AssignedSiteRow) => record.missionList.length,
  },
  {
    title: "Assigned Robots",
    key: "deviceCount",
    enableSort: false,
    width: "20%",
    render: (_: unknown, record: AssignedSiteRow) => record.deviceList.length,
  },
  {
    title: "Created At",
    dataIndex: "createdAt",
    key: "createdAt",
    enableSort: true,
    width: "15%",
  },
  {
  title: "",
  key: "action",
  width: 240,
  render: (_: unknown, record: AssignedSiteRow) => (
    <Dropdown
      className="relative"
      trigger={["hover"]}
      popupRender={() => (
        <ActionMenu
          onEdit={() => handleEditSite(record)}
          onDelete={() => handleDeleteSite(record)}
        />
      )}
    >
      <a
        onClick={(e) => e.preventDefault()}
        className="flex items-center justify-center min-w-[48px] min-h-[48px]"
      >
        <img src={ActionIcon} alt="ActionIcon" className="w-12 h-12" />
      </a>
    </Dropdown>
  ),
},
] satisfies SortableTableColumn<AssignedSiteRow>[];

const missionOptions = [
  { value: "mission-1", label: "Mission 1" },
  { value: "mission-2", label: "Mission 2" },
  { value: "mission-3", label: "Mission 3" },
];

const deviceOptions = [
  { value: "device-1", label: "Robot 1" },
  { value: "device-2", label: "Robot 2" },
  { value: "device-3", label: "Robot 3" },
];
const siteOptions: SiteOption[] = [
  { value: "site-1", label: "Site 1" },
  { value: "site-2", label: "Site 2" },
  { value: "site-3", label: "Site 3" },
];

    const handleAssignSiteSubmit = async (values: { siteName: string }) => {
    const selectedSite = siteOptions.find(
        (site) => site.value === values.siteName
      );
  if (!selectedSite) return;

  const alreadyExists = sites.some((site) => site.siteName === selectedSite.label);
  if (alreadyExists) {
    setIsAssignSiteOpen(false);
    formAssign.resetFields();
    return;
  }

  setSites((prev) => [
    ...prev,
    {
      id: prev.length + 1,
      siteName: selectedSite.label,
      createdAt: new Date().toLocaleString(),
      missionList: [],
      deviceList: [],
    },
      ]);

  setIsAssignSiteOpen(false);
  formAssign.resetFields();
};

  const handleEditSite = (record: AssignedSiteRow) => {
  setSelectedSiteRecord(record);

  formEditSite.setFieldsValue({
    missionList: record.missionList,
    deviceList: record.deviceList,
  });

  setIsEditSiteOpen(true);
}

  const handleDeleteSite = (record: AssignedSiteRow) => {
    setSelectedSiteRecord(record);
    setIsDeleteSiteOpen(true);
  };

  const confirmDeleteSite = () => {
    if (!selectedSiteRecord) return;

    setSites((prev) => prev.filter((item) => item.id !== selectedSiteRecord.id));
    setIsDeleteSiteOpen(false);
    setSelectedSiteRecord(null);
  };

  const confirmEditSite = (values: {
  missionList?: string[];
  deviceList?: string[];
}) => {
  if (!selectedSiteRecord) return;

  setSites((prev) =>
    prev.map((item) =>
      item.id === selectedSiteRecord.id
        ? {
            ...item,
            missionList: values.missionList || [],
            deviceList: values.deviceList || [],
          }
        : item
    )
  );

  setIsEditSiteOpen(false);
  setSelectedSiteRecord(null);
  formEditSite.resetFields();
};

  return (
    <div className="w-full mx-auto py-6 overflow-hidden">
      <Form
        layout="vertical"
        form={form}
        onFinish={handleFinish}
        initialValues={initialValues}
      >
        <div className="grid grid-cols-2 gap-x-16">
          {/* LEFT COLUMN */}
          <div>
            <Form.Item
              label={<div className="text-[18px] font-semibold text-[#333D4B]">Role</div>}
              name="role"
              rules={[{ required: true, message: "Please select role" }]}
            >
              <Select
                placeholder="Select role"
                className="h-[41px]"
                options={roleOptions.map((role) => ({
                  ...role,
                  disabled: userRole !== 1 && role.value === 1,
                }))}
              />
            </Form.Item>

            <div className="flex gap-2">
              <Form.Item
                label={<div className="text-[18px] font-semibold text-[#333D4B]">Email</div>}
                name="email"
                rules={[
                  { required: true, message: "Please enter email" },
                  { type: "email", message: "Please enter valid email" },
                ]}
                className="flex-1 mb-0"
              >
                <Input placeholder="email@example.com" className="h-[41px]" />
              </Form.Item>

              {mode === "edit" && (
                <Button
                  onClick={() => setIsChangePassOpen(true)}
                  className="h-[41px]! w-[180px] rounded-[7px] mt-9 bg-[#AEAEB2]! border-none text-white!"
                >
                  Change Password
                </Button>
              )}
            </div>

            {mode === "add" && (
              <>
                <Form.Item
                  label={<div className="text-[18px] font-semibold text-[#333D4B]">Password</div>}
                  name="password"
                  rules={[{ required: true, message: "Please enter password" }]}
                >
                  <Input.Password placeholder="******" className="h-[41px]" />
                </Form.Item>

                <Form.Item
                  label={<div className="text-[18px] font-semibold text-[#333D4B]">Confirm Password</div>}
                  name="confirmPassword"
                  dependencies={["password"]}
                  rules={[
                    { required: true, message: "Please confirm password" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("password") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error("Passwords do not match"));
                      },
                    }),
                  ]}
                >
                  <Input.Password placeholder="******" className="h-[41px]" />
                </Form.Item>

              </>
            )}

            <Form.Item
              label={<div className="text-[18px] font-semibold text-[#333D4B]">Company</div>}
              name="companyId"
              rules={[{ required: true, message: "Please select company" }]}
            >
              <Select
                placeholder="Select company"
                className="h-[41px]"
                options={companyOptions}
              />
            </Form.Item>

            <Form.Item
              label={<div className="text-[18px] font-semibold text-[#333D4B]">Name</div>}
              name="username"
              rules={[{ required: true, message: "Please enter name" }]}
            >
              <Input placeholder="User name" className="h-[41px]" />
            </Form.Item>

            <Form.Item
              label={<div className="text-[18px] font-semibold text-[#333D4B]">Phone Number</div>}
              name="phone"
              rules={[{ required: true, message: "Please enter phone number" }]}
            >
              <Input placeholder="+91-9876543210" className="h-[41px]" />
            </Form.Item>

            <Form.Item
              label={<div className="text-[18px] font-semibold text-[#333D4B]">Description</div>}
              name="description"
            >
              <Input placeholder="Description" className="h-[41px]" />
            </Form.Item>
          </div>

          {/* RIGHT COLUMN */}
            {values?.role === 3 ? (
              <div>
                <div className="text-[18px] font-semibold text-[#333D4B] mb-2">
                  Assigned Sites
                </div>

                <SortableTable columns={siteColumns} data={sites} />

                <Button
                  onClick={() => setIsAssignSiteOpen(true)}
                  className="mt-2.5 h-[57px]! w-full px-6 bg-[#E9ECF0]! rounded-[7px] border-none text-[#333D4B]! font-medium! text-[15px]!"
                >
                  Add Record
                </Button>
              </div>
            ) : (
              <div />
            )}
        </div>

        {/* BUTTONS */}
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
      <CustomModal
        title="Assign Site"
        open={isAssignSiteOpen}
        onOk={() => formAssign.submit()}
        onCancel={() => {
          setIsAssignSiteOpen(false);
          formAssign.resetFields();
        }}
        content={
          <Form layout="vertical" form={formAssign} onFinish={handleAssignSiteSubmit}>
            <Form.Item
              label={<div className="text-[18px] font-semibold text-[#333D4B]">Select Site</div>}
              name="siteName"
              rules={[{ required: true, message: "Please select a site" }]}
            >
              <Select
                placeholder="Select site"
                className="h-[41px]"
                options={siteOptions}
              />
            </Form.Item>
          </Form>
        }
      />
      <CustomModal
        title="Change Password"
        open={isChangePassOpen}
        onOk={() => formChangePass.submit()}
        onCancel={() => setIsChangePassOpen(false)}
        content={
          <Form
            layout="vertical"
            form={formChangePass}
            onFinish={(values) => {
              console.log("Password changed:", values);
              setIsChangePassOpen(false);
            }}
          >
            <Form.Item
              label="Current Password"
              name="oldPassword"
              rules={[{ required: true, message: "Enter current password" }]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              label="New Password"
              name="password"
              rules={[{ required: true, message: "Enter new password" }]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              label="Confirm Password"
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Confirm password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match"));
                  },
                }),
              ]}
            >
              <Input.Password />
            </Form.Item>
          </Form>
        }
      />
      <CustomModal
        title={`Delete ${selectedSiteRecord?.siteName ?? "Site"}`}
        content={
          <p className="whitespace-pre-line font-medium text-[16px]">
            Are you sure you want to delete this assigned site?
          </p>
        }
        open={isDeleteSiteOpen}
        onOk={confirmDeleteSite}
        onCancel={() => {
          setIsDeleteSiteOpen(false);
          setSelectedSiteRecord(null);
        }}
        okText="Delete"
        cancelText="Cancel"
      />

      <CustomModal
  title="Edit Assigned Site"
  open={isEditSiteOpen}
  onOk={() => formEditSite.submit()}
  onCancel={() => {
    setIsEditSiteOpen(false);
    setSelectedSiteRecord(null);
    formEditSite.resetFields();
  }}
  content={
    <Form layout="vertical" form={formEditSite} onFinish={confirmEditSite}>
      <div className="flex gap-4">
        <Form.Item
          className="w-1/2"
          label={<div className="text-[18px] font-semibold text-[#333D4B]">Mission List</div>}
          name="missionList"
        >
          <Checkbox.Group className="w-full">
            <div className="w-full max-h-[196px] overflow-y-auto bg-[#F6F7F9] px-5 py-2.5 rounded-[7px] border border-[#DDE0E5]">
              <div className="flex flex-col gap-2">
                {missionOptions.map((mission) => (
                  <Checkbox key={mission.value} value={mission.value}>
                    {mission.label}
                  </Checkbox>
                ))}
              </div>
            </div>
          </Checkbox.Group>
        </Form.Item>

        <Form.Item
          className="w-1/2"
          label={<div className="text-[18px] font-semibold text-[#333D4B]">Robot List</div>}
          name="deviceList"
        >
          <Checkbox.Group className="w-full">
            <div className="w-full max-h-[196px] overflow-y-auto bg-[#F6F7F9] px-5 py-2.5 rounded-[7px] border border-[#DDE0E5]">
              <div className="flex flex-col gap-2">
                {deviceOptions.map((device) => (
                  <Checkbox key={device.value} value={device.value}>
                    {device.label}
                  </Checkbox>
                ))}
              </div>
            </div>
          </Checkbox.Group>
        </Form.Item>
      </div>
    </Form>
  }
/>
    </div>
  );
}