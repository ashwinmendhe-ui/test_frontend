import DeleteIcon from "@/assets/delete-modal-icon.svg";
import ActionIcon from "@/assets/table-action-icon.svg";
import ActionMenu from "@/components/common/actionMenu";
import CustomModal from "@/components/common/customModal";
import StatusBadge from "@/components/common/statusBadge";
import { SortableTable, type SortableTableColumn } from "@/components/common/table";
import { Button, DatePicker, Dropdown, Input } from "antd";
import type { GetProps } from "antd";
import type { Dayjs } from "dayjs";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type SearchProps = GetProps<typeof Input.Search>;
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
  const navigate = useNavigate();

  const [list, setList] = useState<UserRow[]>([
    {
      id: "1",
      username: "Ashwin",
      companyName: "Dhive",
      phone: "9876543210",
      email: "ashwin@test.com",
      createdAt: "2026-03-24 10:00",
      role: "Admin",
      isActive: true,
    },
    {
      id: "2",
      username: "John",
      companyName: "Dhive",
      phone: "9123456780",
      email: "john@test.com",
      createdAt: "2026-03-20 14:30",
      role: "Operator",
      isActive: false,
    },
  ]);

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

  const confirmDelete = () => {
    if (!selectedRecord) return;
    setList((prev) => prev.filter((item) => item.id !== selectedRecord.id));
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  const columns = [
    {
      title: "ID",
      key: "rowIndex",
      enableSort: false,
      render: (_: unknown, __: UserRow, index: number) => index + 1,
    },
    {
      title: "Name",
      dataIndex: "username",
      key: "username",
      enableSort: true,
    },
    {
      title: "Company",
      dataIndex: "companyName",
      key: "companyName",
      enableSort: true,
    },
    {
      title: "Phone Number",
      dataIndex: "phone",
      key: "phone",
      enableSort: true,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      enableSort: true,
    },
    {
      title: "Created Date",
      dataIndex: "createdAt",
      key: "createdAt",
      enableSort: true,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      enableSort: true,
    },
    {
      title: "Status",
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

  const filteredList = list.filter((item) => {
    const matchesSearch =
      searchKeyword.trim() === "" ||
      item.username.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      item.email.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      item.companyName.toLowerCase().includes(searchKeyword.toLowerCase());

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

    return matchesSearch && matchesDate;
  });

  const onSearch: SearchProps["onSearch"] = (value) => {
    setSearchKeyword(value);
  };

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates);
  };

  return (
    <>
      <div className="w-full relative">
        <div className="flex justify-between items-center mt-[26px] mb-[22px]">
          <div className="flex gap-4 w-1/2">
            <RangePicker
              size="large"
              className="min-w-[300px]"
              onChange={handleDateRangeChange}
              value={dateRange}
              placeholder={["From", "To"]}
            />

            <Search
              size="large"
              placeholder="Search User"
              onSearch={onSearch}
              className="flex-1 rounded-[7px]"
            />
          </div>

          <Button className="bg-primary! hover:bg-primaryDark! hover:text-white! w-40! h-[51px]! rounded-[7px]! text-white! text-xl! font-bold! flex! items-center! justify-center!">
            <span
              className="text-white! hover:text-white! text-[20px]! font-bold! cursor-pointer"
              onClick={() => navigate("/settings/user/create")}
            >
              Add User
            </span>
          </Button>
        </div>

        <SortableTable columns={columns} data={filteredList} />
      </div>

      <CustomModal
        title={`Delete ${selectedRecord?.username ?? "User"}`}
        content={
          <p className="whitespace-pre-line font-medium text-[16px]">
            Are you sure you want to delete this user?
          </p>
        }
        open={isModalOpen}
        onOk={confirmDelete}
        onCancel={handleCancel}
        icon={DeleteIcon}
        useIcon
        okText="Delete"
        cancelText="Cancel"
      />
    </>
  );
}