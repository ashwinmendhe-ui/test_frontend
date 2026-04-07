import { Button, Form, Input, Select, Dropdown, Checkbox, message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomModal from "./customModal";
import { SortableTable, type SortableTableColumn } from "./table";
import ActionMenu from "./actionMenu";
import ActionIcon from "@/assets/table-action-icon.svg";
import { useUserStore } from "@/stores/userStore";
import { useTranslation } from "react-i18next";
import { companyApi } from "@/api";

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
  onSubmit: (
    values: UserFormValue
  ) => Promise<{ code?: number | string; message?: string } | void>;
  onCancel?: () => void;
  loading: boolean;
}

type SiteOption = {
  value: string;
  label: string;
};

type AssignedSiteRow = {
  id: number;
  siteName: string;
  createdAt: string;
  missionList: string[];
  deviceList: string[];
};

export default function UserForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  loading,
}: Props) {
  const { t } = useTranslation();
  const [form] = Form.useForm<UserFormValue>();
  const values = Form.useWatch([], form);
  const navigate = useNavigate();

  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [formChangePass] = Form.useForm();
  const [isAssignSiteOpen, setIsAssignSiteOpen] = useState(false);
  const [formAssign] = Form.useForm();
  const [sites, setSites] = useState<AssignedSiteRow[]>([]);
  const [selectedSiteRecord, setSelectedSiteRecord] =
    useState<AssignedSiteRow | null>(null);
  const [isDeleteSiteOpen, setIsDeleteSiteOpen] = useState(false);
  const [isEditSiteOpen, setIsEditSiteOpen] = useState(false);
  const [formEditSite] = Form.useForm();

  const { detailUserLogin } = useUserStore();
  const userRole = detailUserLogin?.roles?.[0];

  const roleOptions = [
    { value: 1, label: t("role_system_administrator") },
    { value: 2, label: t("role_company_admin") },
    { value: 3, label: t("role_company_user") },
  ];

  const [companyOptions, setCompanyOptions] = useState<
    { value: string; label: string }[]
    >([]);
  const [companyLoading, setCompanyLoading] = useState(mode === "edit");
  const [companyReady, setCompanyReady] = useState(mode === "add");
  

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

useEffect(() => {
  let isMounted = true;

  const fetchCompanies = async () => {
    if (mode === "edit") {
      setCompanyLoading(true);
      setCompanyReady(false);
    }

    try {
      const res = await companyApi.getList();

      const mapped = Array.isArray(res)
        ? res
            .map((item: any) => ({
              value: item.companyId ?? item.id ?? "",
              label: item.companyName ?? item.name ?? "",
            }))
            .filter((item) => item.value && item.label)
        : [];

      const currentSelected =
        initialValues?.companyId && initialValues?.companyName
          ? [
              {
                value: initialValues.companyId,
                label: initialValues.companyName,
              },
            ]
          : [];

      const merged = [...currentSelected, ...mapped].filter(
        (item, index, self) =>
          self.findIndex((x) => x.value === item.value) === index
      );

      if (!isMounted) return;

      setCompanyOptions(merged);
    } catch (error) {
      console.error("Failed to load companies:", error);

      if (!isMounted) return;

      if (initialValues?.companyId && initialValues?.companyName) {
        setCompanyOptions([
          {
            value: initialValues.companyId,
            label: initialValues.companyName,
          },
        ]);
      } else {
        setCompanyOptions([]);
      }
    } finally {
      if (!isMounted) return;

      setCompanyLoading(false);
      setCompanyReady(true);
    }
  };

  fetchCompanies();

  return () => {
    isMounted = false;
  };
}, [mode, initialValues?.companyId, initialValues?.companyName]);


useEffect(() => {
  if (!initialValues) return;

  if (mode === "edit" && !companyReady) return;

  form.setFieldsValue(initialValues);
}, [initialValues, mode, companyReady, form]);


const handleFinish = async (values: UserFormValue) => {
  console.log("user form submit values:", JSON.stringify(values, null, 2));

  const res = await onSubmit(values);

  console.log("user form submit response:", JSON.stringify(res, null, 2));

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

  message.success(
    mode === "add"
      ? t("user_create_success", "User created successfully")
      : t("user_update_success", "User updated successfully")
  );

  setTimeout(() => {
    navigate("/settings/user");
  }, 500);
};

  const handleAssignSiteSubmit = async (values: { siteName: string }) => {
    const selectedSite = siteOptions.find(
      (site) => site.value === values.siteName
    );

    if (!selectedSite) return;

    const alreadyExists = sites.some(
      (site) => site.siteName === selectedSite.label
    );

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
  };

  const handleDeleteSite = (record: AssignedSiteRow) => {
    setSelectedSiteRecord(record);
    setIsDeleteSiteOpen(true);
  };

  const confirmDeleteSite = () => {
    if (!selectedSiteRecord) return;

    setSites((prev) =>
      prev.filter((item) => item.id !== selectedSiteRecord.id)
    );
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

  const siteColumns = [
    {
      title: t("table_id"),
      dataIndex: "id",
      key: "id",
      enableSort: false,
      width: "10%",
    },
    {
      title: t("user_assigned_site_name"),
      dataIndex: "siteName",
      key: "siteName",
      enableSort: true,
      width: "30%",
    },
    {
      title: t("user_assigned_missions"),
      key: "missionCount",
      enableSort: false,
      width: "20%",
      render: (_: unknown, record: AssignedSiteRow) => record.missionList.length,
    },
    {
      title: t("user_assigned_robots"),
      key: "deviceCount",
      enableSort: false,
      width: "20%",
      render: (_: unknown, record: AssignedSiteRow) => record.deviceList.length,
    },
    {
      title: t("history_created_at"),
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

  return (
    <div className="w-full mx-auto py-6 overflow-hidden">
      <Form
        layout="vertical"
        form={form}
        onFinish={handleFinish}
        initialValues={initialValues}
      >
        <div className="grid grid-cols-2 gap-x-16">
          <div>
            <Form.Item
              label={
                <div className="text-[18px] font-semibold text-[#333D4B]">
                  {t("user_form_role")}
                </div>
              }
              name="role"
              rules={[
                { required: true, message: t("user_validation_select_role") },
              ]}
            >
              <Select
                placeholder={t("user_placeholder_select_role")}
                className="h-[41px]"
                options={roleOptions.map((role) => ({
                  ...role,
                  disabled: userRole !== 1 && role.value === 1,
                }))}
              />
            </Form.Item>

            <div className="flex gap-2">
              <Form.Item
                label={
                  <div className="text-[18px] font-semibold text-[#333D4B]">
                    {t("user_form_email")}
                  </div>
                }
                name="email"
                rules={[
                  { required: true, message: t("user_validation_enter_email") },
                  { type: "email", message: t("user_validation_valid_email") },
                ]}
                className="flex-1 mb-0"
              >
                <Input
                  placeholder={t("user_placeholder_email")}
                  className="h-[41px]"
                />
              </Form.Item>

              {mode === "edit" && (
                <Button
                  onClick={() => setIsChangePassOpen(true)}
                  className="h-[41px]! w-[180px] rounded-[7px] mt-9 bg-[#AEAEB2]! border-none text-white!"
                >
                  {t("user_change_password")}
                </Button>
              )}
            </div>

            {mode === "add" && (
              <>
                <Form.Item
                  label={
                    <div className="text-[18px] font-semibold text-[#333D4B]">
                      {t("user_form_password")}
                    </div>
                  }
                  name="password"
                  rules={[
                    {
                      required: true,
                      message: t("user_validation_enter_password"),
                    },
                  ]}
                >
                  <Input.Password
                    placeholder={t("user_placeholder_password")}
                    className="h-[41px]"
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <div className="text-[18px] font-semibold text-[#333D4B]">
                      {t("user_form_confirm_password")}
                    </div>
                  }
                  name="confirmPassword"
                  dependencies={["password"]}
                  rules={[
                    {
                      required: true,
                      message: t("user_validation_confirm_password"),
                    },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("password") === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(
                          new Error(t("user_validation_password_mismatch"))
                        );
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    placeholder={t("user_placeholder_password")}
                    className="h-[41px]"
                  />
                </Form.Item>
              </>
            )}

            <Form.Item
              label={
                <div className="text-[18px] font-semibold text-[#333D4B]">
                  {t("user_form_company")}
                </div>
              }
              name="companyId"
              rules={[
                {
                  required: true,
                  message: t("user_validation_select_company"),
                },
              ]}
            >
              {mode === "edit" && !companyReady ? (
              <div className="h-[41px] rounded-[6px] border border-[#d9d9d9] bg-[#fafafa]" />
            ) : (
              <Select
                placeholder={t("user_placeholder_select_company")}
                className="h-[41px]"
                options={companyOptions}
                loading={companyLoading}
              />
            )}
            </Form.Item>

            <Form.Item
              label={
                <div className="text-[18px] font-semibold text-[#333D4B]">
                  {t("user_form_name")}
                </div>
              }
              name="username"
              rules={[
                { required: true, message: t("user_validation_enter_name") },
              ]}
            >
              <Input
                placeholder={t("user_placeholder_name")}
                className="h-[41px]"
              />
            </Form.Item>

            <Form.Item
              label={
                <div className="text-[18px] font-semibold text-[#333D4B]">
                  {t("user_form_phone")}
                </div>
              }
              name="phone"
              rules={[
                {
                  required: true,
                  message: t("user_validation_enter_phone"),
                },
              ]}
            >
              <Input
                placeholder={t("user_placeholder_phone")}
                className="h-[41px]"
              />
            </Form.Item>

            <Form.Item
              label={
                <div className="text-[18px] font-semibold text-[#333D4B]">
                  {t("user_form_description")}
                </div>
              }
              name="description"
            >
              <Input
                placeholder={t("user_placeholder_description")}
                className="h-[41px]"
              />
            </Form.Item>
          </div>

          {values?.role === 3 ? (
            <div>
              <div className="text-[18px] font-semibold text-[#333D4B] mb-2">
                {t("user_assigned_sites")}
              </div>

              <SortableTable columns={siteColumns} data={sites} />

              <Button
                onClick={() => setIsAssignSiteOpen(true)}
                className="mt-2.5 h-[57px]! w-full px-6 bg-[#E9ECF0]! rounded-[7px] border-none text-[#333D4B]! font-medium! text-[15px]!"
              >
                {t("user_add_record")}
              </Button>
            </div>
          ) : (
            <div />
          )}
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

      <CustomModal
        title={t("user_assign_site")}
        open={isAssignSiteOpen}
        onOk={() => formAssign.submit()}
        onCancel={() => {
          setIsAssignSiteOpen(false);
          formAssign.resetFields();
        }}
        content={
          <Form layout="vertical" form={formAssign} onFinish={handleAssignSiteSubmit}>
            <Form.Item
              label={
                <div className="text-[18px] font-semibold text-[#333D4B]">
                  {t("user_select_site")}
                </div>
              }
              name="siteName"
              rules={[
                { required: true, message: t("user_validation_select_site") },
              ]}
            >
              <Select
                placeholder={t("user_placeholder_select_site")}
                className="h-[41px]"
                options={siteOptions}
              />
            </Form.Item>
          </Form>
        }
      />

      <CustomModal
        title={t("user_change_password")}
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
              label={t("user_current_password")}
              name="oldPassword"
              rules={[
                {
                  required: true,
                  message: t("user_validation_enter_current_password"),
                },
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              label={t("user_new_password")}
              name="password"
              rules={[
                {
                  required: true,
                  message: t("user_validation_enter_new_password"),
                },
              ]}
            >
              <Input.Password />
            </Form.Item>

            <Form.Item
              label={t("user_form_confirm_password")}
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                {
                  required: true,
                  message: t("user_validation_confirm_password"),
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(t("user_validation_password_mismatch"))
                    );
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
        title={`${t("user_delete_assigned_site")} ${
          selectedSiteRecord?.siteName ?? t("user_site")
        }`}
        content={
          <p className="whitespace-pre-line font-medium text-[16px]">
            {t("user_delete_assigned_site_confirm")}
          </p>
        }
        open={isDeleteSiteOpen}
        onOk={confirmDeleteSite}
        onCancel={() => {
          setIsDeleteSiteOpen(false);
          setSelectedSiteRecord(null);
        }}
        okText={t("table_delete")}
        cancelText={t("button_cancel")}
      />

      <CustomModal
        title={t("user_edit_assigned_site")}
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
                label={
                  <div className="text-[18px] font-semibold text-[#333D4B]">
                    {t("user_mission_list")}
                  </div>
                }
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
                label={
                  <div className="text-[18px] font-semibold text-[#333D4B]">
                    {t("user_robot_list")}
                  </div>
                }
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