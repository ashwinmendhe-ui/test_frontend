import DeleteIcon from "@/assets/delete-modal-icon.svg";
import ActionIcon from "@/assets/table-action-icon.svg";
import ActionMenu from "@/components/common/actionMenu";
import CustomModal from "@/components/common/customModal";
import StatusBadge from "@/components/common/statusBadge";
import { SortableTable, type SortableTableColumn } from "@/components/common/table";
import { useRobotStore, type RobotManagementTable } from "@/stores/robotStore";
import { useUserStore } from "@/stores/userStore";
import { Button, DatePicker, Dropdown, Input } from "antd";
import type { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import HighlightText from "@/components/common/HighlightText";
import { filterByQuery } from "@/utils/filterByQuery";
import { useTranslation } from "react-i18next";

const { Search } = Input;
const { RangePicker } = DatePicker;

export default function Robot() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loading, list, getList, deleteRobot } = useRobotStore();
  const { detailUserLogin } = useUserStore();

  const userRole = detailUserLogin?.roles?.[0];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RobotManagementTable | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");

  const handleEdit = (record: RobotManagementTable) => {
    navigate(`/settings/robot/${record.deviceId}/edit`);
  };

  const handleDelete = (record: RobotManagementTable) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedRecord) return;

    await deleteRobot(selectedRecord.deviceId);
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  const columns = [
    {
      title: t("table_id"),
      key: "rowIndex",
      enableSort: false,
      render: (_: unknown, __: RobotManagementTable, index: number) => index + 1,
    },
    {
      title: t("robot_table_name"),
      dataIndex: "deviceName",
      key: "deviceName",
      enableSort: true,
      render: (value: string) => <HighlightText text={value} query={searchKeyword} />,
    },
    {
      title: t("robot_table_company"),
      dataIndex: "companyName",
      key: "companyName",
      enableSort: true,
      render: (value: string) => <HighlightText text={value} query={searchKeyword} />,
    },
    {
      title: t("robot_table_site"),
      dataIndex: "siteName",
      key: "siteName",
      enableSort: true,
      render: (value: string) => (
        <div className="truncate max-w-[200px]" title={value}>
          <HighlightText text={value} query={searchKeyword} />
        </div>
      ),
    },
    {
      title: t("robot_table_type"),
      dataIndex: "deviceType",
      key: "deviceType",
      enableSort: true,
      render: (value: string) => <HighlightText text={value} query={searchKeyword} />,
    },
    {
      title: t("robot_table_brand"),
      dataIndex: "brandName",
      key: "brandName",
      enableSort: true,
      render: (value?: string) => <>{value || "-"}</>,
    },
    {
      title: t("robot_table_model"),
      dataIndex: "model",
      key: "model",
      enableSort: true,
      render: (value?: string) => <>{value || "-"}</>,
    },
    {
      title: t("robot_table_serial_number"),
      dataIndex: "deviceSn",
      key: "deviceSn",
      enableSort: true,
      render: (value?: string) => <>{value || "-"}</>,
    },
    {
      title: t("robot_table_identifier"),
      dataIndex: "deviceId",
      key: "deviceId",
      enableSort: true,
      render: (value: string) => <HighlightText text={value} query={searchKeyword} />,
    },
    {
      title: t("robot_table_created_date"),
      dataIndex: "createdAt",
      key: "createdAt",
      enableSort: true,
    },
    {
      title: t("table_status"),
      dataIndex: "status",
      key: "status",
      enableSort: true,
      render: (item: string) => <StatusBadge status={item} />,
    },
    {
      title: "",
      key: "action",
      render: (_: unknown, record: RobotManagementTable) =>
        userRole !== 3 ? (
          <Dropdown
            className="relative"
            trigger={["hover"]}
            popupRender={() => (
              <ActionMenu
                onEdit={() => handleEdit(record)}
                onDelete={() => handleDelete(record)}
              />
            )}
          >
            <a onClick={(e) => e.preventDefault()}>
              <img src={ActionIcon} alt="ActionIcon" />
            </a>
          </Dropdown>
        ) : null,
    },
  ] satisfies SortableTableColumn<RobotManagementTable>[];

  const searchFilteredList = filterByQuery(list, searchKeyword, [
    "deviceName",
    "companyName",
    "siteName",
    "deviceType",
    "brandName",
    "model",
    "deviceSn",
    "deviceId",
  ]);

  const filteredList = searchFilteredList.filter((item) => {
    const matchesDate =
      !dateRange ||
      !dateRange[0] ||
      !dateRange[1] ||
      (() => {
        const itemDate = new Date(item.createdAt).getTime();
        const from = dateRange[0]?.startOf("day").valueOf() ?? 0;
        const to = dateRange[1]?.endOf("day").valueOf() ?? 0;
        return itemDate >= from && itemDate <= to;
      })();

    return matchesDate;
  });

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates);
  };

  useEffect(() => {
    getList();
  }, [getList]);

  return (
    <>
      <div className="w-full relative">
        {loading && <div className="mb-3 text-sm text-gray-500">{t("common_loading")}</div>}

        <div className="flex justify-between items-center mt-[26px] mb-[22px]">
          <div className="flex gap-4 w-1/2">
            <RangePicker
              size="large"
              className="min-w-[300px]"
              onChange={handleDateRangeChange}
              value={dateRange}
              placeholder={[t("common_from"), t("common_to")]}
            />
            <Search
              size="large"
              placeholder={t("robot_search_placeholder")}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="flex-1 rounded-[7px]"
              allowClear
            />
          </div>

          {userRole !== 3 && (
            <Button className="bg-primary! hover:bg-primaryDark! hover:text-white! w-40! h-[51px]! rounded-[7px]! text-white! text-xl! font-bold! flex! items-center! justify-center!">
              <Link
                className="text-white! hover:text-white! text-[20px]! font-bold!"
                to="/settings/robot/create"
              >
                {t("button_add_robot")}
              </Link>
            </Button>
          )}
        </div>

        <SortableTable columns={columns} data={filteredList} rowKey="deviceId" />
      </div>

      <CustomModal
        title={`${t("robot_delete_title")} ${selectedRecord?.deviceName ?? t("page_robot")}`}
        content={
          <p className="whitespace-pre-line font-medium text-[16px]">
            {t("robot_delete_confirm")}
          </p>
        }
        open={isModalOpen}
        onOk={confirmDelete}
        onCancel={handleCancel}
        icon={DeleteIcon}
        useIcon
        okText={t("table_delete")}
        cancelText={t("button_cancel")}
      />
    </>
  );
}