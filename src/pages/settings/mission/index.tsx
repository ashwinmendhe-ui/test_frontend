import DeleteIcon from "@/assets/delete-modal-icon.svg";
import ActionIcon from "@/assets/table-action-icon.svg";
import ActionMenu from "@/components/common/actionMenu";
import CustomModal from "@/components/common/customModal";
import { SortableTable, type SortableTableColumn } from "@/components/common/table";
import { useMissionStore, type MissionManagementTable } from "@/stores/missionStore";
import { useUserStore } from "@/stores/userStore";
import { Button, DatePicker, Dropdown, Input , message} from "antd";
import type { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import HighlightText from "@/components/common/HighlightText";
import { filterByQuery } from "@/utils/filterByQuery";
import { useTranslation } from "react-i18next";

const { Search } = Input;
const { RangePicker } = DatePicker;

export default function Mission() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loading, list, getList, deleteMission } = useMissionStore();
  const { detailUserLogin } = useUserStore();

  const userRole = detailUserLogin?.roles?.[0];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<MissionManagementTable | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");

  const handleEdit = (record: MissionManagementTable) => {
    navigate(`/settings/mission/${record.missionId}/edit`);
  };

  const handleDownload = (record: MissionManagementTable) => {
    if (record.downloadUrl) {
      window.open(record.downloadUrl, "_blank");
    }
  };

  const handleDelete = (record: MissionManagementTable) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };
  const [messageApi, contextHolder] = message.useMessage();

  const confirmDelete = async () => {
    if (!selectedRecord) return;

    try {
      await deleteMission(selectedRecord.missionId);
      messageApi.success(t("mission_delete_success"));
      setIsModalOpen(false);
      setSelectedRecord(null);
    } catch (error: any) {
      messageApi.error(
        error?.response?.data?.message || t("mission_delete_failed")
      );
    }
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
      render: (_: unknown, __: MissionManagementTable, index: number) => index + 1,
    },
    {
      title: t("mission_table_name"),
      dataIndex: "missionName",
      key: "missionName",
      enableSort: true,
      render: (value: string) => (
        <HighlightText text={value} query={searchKeyword} />
      ),
    },
    {
      title: t("mission_table_company"),
      dataIndex: "companyName",
      key: "companyName",
      enableSort: true,
      render: (value: string) => (
        <HighlightText text={value} query={searchKeyword} />
      ),
    },
    {
      title: t("mission_table_site"),
      dataIndex: "siteName",
      key: "siteName",
      enableSort: true,
      render: (value: string) => (
        <HighlightText text={value} query={searchKeyword} />
      ),
    },
    {
      title: t("mission_table_device_type"),
      dataIndex: "deviceType",
      key: "deviceType",
      enableSort: true,
      render: (value: string) => (
        <HighlightText text={value} query={searchKeyword} />
      ),
    },
    {
      title: t("mission_table_mission_type"),
      dataIndex: "missionType",
      key: "missionType",
      enableSort: true,
      render: (value: string) => (
        <HighlightText text={value} query={searchKeyword} />
      ),
    },
    {
      title: t("mission_table_file"),
      dataIndex: "file",
      key: "file",
      enableSort: true,
      render: (value: string) => (
        <div className="truncate max-w-[300px]" title={value}>
          <HighlightText text={value} query={searchKeyword} />
        </div>
      ),
    },
    {
      title: t("mission_table_created_date"),
      dataIndex: "createdAt",
      key: "createdAt",
      enableSort: true,
    },
    {
      title: "",
      key: "action",
      render: (_: unknown, record: MissionManagementTable) =>
        userRole !== 3 ? (
          <Dropdown
            className="relative"
            trigger={["hover"]}
            popupRender={() => (
              <ActionMenu
                isShowDownload={!!record.downloadUrl}
                onEdit={() => handleEdit(record)}
                onDelete={() => handleDelete(record)}
                onDownload={() => handleDownload(record)}
              />
            )}
          >
            <a onClick={(e) => e.preventDefault()}>
              <img src={ActionIcon} alt="ActionIcon" />
            </a>
          </Dropdown>
        ) : null,
    },
  ] satisfies SortableTableColumn<MissionManagementTable>[];

  const searchFilteredList = filterByQuery(list, searchKeyword, [
    "missionName",
    "companyName",
    "siteName",
    "deviceType",
    "missionType",
    "file",
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
    {contextHolder}
      <div className="w-full relative">
        {loading && (
          <div className="mb-3 text-sm text-gray-500">{t("common_loading")}</div>
        )}

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
              placeholder={t("mission_search_placeholder")}
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
                to="/settings/mission/create"
              >
                {t("button_add_mission")}
              </Link>
            </Button>
          )}
        </div>

        <SortableTable columns={columns} data={filteredList} rowKey="missionId" />
      </div>

      <CustomModal
        title={`${t("mission_delete_title")} ${
          selectedRecord?.missionName ?? t("page_mission")
        }`}
        content={
          <p className="whitespace-pre-line font-medium text-[16px]">
            {t("mission_delete_confirm")}
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