import DeleteIcon from "@/assets/delete-modal-icon.svg";
import ActionIcon from "@/assets/table-action-icon.svg";
import ActionMenu from "@/components/common/actionMenu";
import CustomModal from "@/components/common/customModal";
import StatusBadge from "@/components/common/statusBadge";
import { SortableTable, type SortableTableColumn } from "@/components/common/table";
import { Button, DatePicker, Dropdown, Input } from "antd";
import type { Dayjs } from "dayjs";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HighlightText from "@/components/common/HighlightText";
import { filterByQuery } from "@/utils/filterByQuery";
import { useUserStore } from "@/stores/userStore";
import { useTranslation } from "react-i18next";

const { Search } = Input;
const { RangePicker } = DatePicker;

interface UserRow {
  id: string;
  username: string;
  companyName: string;
  phone: string;
  email: string;
  createdAt: string;
  role: string;
  isActive: boolean;
}

export default function User() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loading, list, getList, deleteUser } = useUserStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<UserRow | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");

  const handleEdit = (record: UserRow) => {
    navigate(`/settings/user/${record.id}/edit`);
  };

  const handleDelete = (record: UserRow) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedRecord) return;

    await deleteUser(selectedRecord.id);
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
      render: (_: unknown, __: UserRow, index: number) => index + 1,
    },
    {
      title: t("user_table_name"),
      dataIndex: "username",
      key: "username",
      enableSort: true,
      render: (value: string) => (
        <HighlightText text={value} query={searchKeyword} />
      ),
    },
    {
      title: t("user_table_company"),
      dataIndex: "companyName",
      key: "companyName",
      enableSort: true,
      render: (value: string) => (
        <HighlightText text={value} query={searchKeyword} />
      ),
    },
    {
      title: t("user_table_phone"),
      dataIndex: "phone",
      key: "phone",
      enableSort: true,
      render: (value: string) => (
        <HighlightText text={value} query={searchKeyword} />
      ),
    },
    {
      title: t("user_form_email"),
      dataIndex: "email",
      key: "email",
      enableSort: true,
      render: (value: string) => (
        <HighlightText text={value} query={searchKeyword} />
      ),
    },
    {
      title: t("user_table_created_date"),
      dataIndex: "createdAt",
      key: "createdAt",
      enableSort: true,
    },
    {
      title: t("user_form_role"),
      dataIndex: "role",
      key: "role",
      enableSort: true,
      render: (value: string) => (
        <HighlightText text={value} query={searchKeyword} />
      ),
    },
    {
      title: t("table_status"),
      dataIndex: "isActive",
      key: "isActive",
      enableSort: true,
      render: (item: boolean) => <StatusBadge status={item} />,
    },
    {
      title: "",
      key: "action",
      render: (_: unknown, record: UserRow) => (
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
      ),
    },
  ] satisfies SortableTableColumn<UserRow>[];

  const searchFilteredList = filterByQuery(list, searchKeyword, [
    "username",
    "email",
    "companyName",
    "phone",
    "role",
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
              placeholder={t("user_search_placeholder")}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="flex-1 rounded-[7px]"
              allowClear
            />
          </div>

          <Button
            className="bg-primary! hover:bg-primaryDark! hover:text-white! w-40! h-[51px]! rounded-[7px]! text-white! text-xl! font-bold! flex! items-center! justify-center!"
            onClick={() => navigate("/settings/user/create")}
          >
            <span className="text-white! hover:text-white! text-[20px]! font-bold! cursor-pointer">
              {t("button_add_user")}
            </span>
          </Button>
        </div>

        <SortableTable columns={columns} data={filteredList} />
      </div>

      <CustomModal
        title={`${t("user_delete_title")} ${selectedRecord?.username ?? t("page_user")}`}
        content={
          <p className="whitespace-pre-line font-medium text-[16px]">
            {t("user_delete_confirm")}
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