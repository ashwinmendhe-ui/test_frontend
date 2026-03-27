import HomeCompany from "@/assets/home-company.svg";
import HomeRobot from "@/assets/home-robot.svg";
import HomeSite from "@/assets/home-site.svg";
import HomeViewer from "@/assets/home-viewer.svg";
import ViewDrone from "@/assets/view-drone.svg";
import HighlightText from "@/components/common/HighlightText";
import StatusBadge from "@/components/common/statusBadge";
import { SortableTable, type SortableTableColumn } from "@/components/common/table";
import { useUserStore } from "@/stores/userStore";
import { Input } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { filterByQuery } from "@/utils/filterByQuery";

const { Search } = Input;

type DashboardRow = {
  id: number;
  deviceId: string;
  deviceName: string;
  companyName: string;
  siteName: string;
  status: string | boolean;
  missionName: string;
};

type DashboardCard = {
  key: string;
  label: string;
  value: number;
  bgClass: string;
  icon: string;
};

export default function Dashboard() {
  const { t } = useTranslation();
  const { detailUserLogin } = useUserStore();
  const [searchKeyword, setSearchKeyword] = useState("");

  const userRole = detailUserLogin?.roles?.[0];

  const tableData: DashboardRow[] = [
    {
      id: 1,
      deviceId: "DR-1001",
      deviceName: "Drone Alpha",
      companyName: "Dhive",
      siteName: "Seoul Site A",
      status: "active",
      missionName: "Patrol Mission - Sector 01",
    },
    {
      id: 2,
      deviceId: "RB-2001",
      deviceName: "Robot Bravo",
      companyName: "Dhive",
      siteName: "Busan Site B",
      status: "offline",
      missionName: "Monitoring Mission - Plant Area",
    },
    {
      id: 3,
      deviceId: "DR-1002",
      deviceName: "Drone Charlie",
      companyName: "Test Company",
      siteName: "Incheon Site C",
      status: "active",
      missionName: "Delivery Mission - Warehouse Route",
    },
    {
      id: 4,
      deviceId: "RB-2002",
      deviceName: "Robot Delta",
      companyName: "Dhive",
      siteName: "Daegu Site D",
      status: "working",
      missionName: "Cleaning Mission - Main Hall",
    },
  ];

  const stats = {
    totalCompanies: 2,
    totalSites: 8,
    totalUsers: 14,
    totalDevices: 23,
  };

  const cards: DashboardCard[] = [
    ...(userRole === 1
      ? [
          {
            key: "company",
            label: t("dashboard_card_company"),
            value: stats.totalCompanies,
            bgClass: "bg-[#EBFFFB]",
            icon: HomeCompany,
          },
        ]
      : []),
    {
      key: "site",
      label: t("dashboard_card_site"),
      value: stats.totalSites,
      bgClass: "bg-[#FBF6FF]",
      icon: HomeSite,
    },
    ...((userRole === 1 || userRole === 2)
      ? [
          {
            key: "user",
            label: t("dashboard_card_user"),
            value: stats.totalUsers,
            bgClass: "bg-[#FFF5ED]",
            icon: HomeViewer,
          },
        ]
      : []),
    {
      key: "robot",
      label: t("dashboard_card_robot"),
      value: stats.totalDevices,
      bgClass: "bg-[#F0F6FF]",
      icon: HomeRobot,
    },
  ];

  const filteredData = useMemo(() => {
    return filterByQuery(tableData, searchKeyword, [
      "deviceName",
      "companyName",
      "siteName",
      "status",
      "missionName",
      "deviceId",
    ]);
  }, [searchKeyword]);

  const columns = [
    {
      title: t("table_id"),
      key: "rowIndex",
      enableSort: false,
      render: (_: unknown, __: DashboardRow, index: number) => index + 1,
      width: 80,
    },
    {
      title: t("dashboard_table_name"),
      dataIndex: "deviceName",
      key: "deviceName",
      enableSort: true,
      render: (value: string) => (
        <HighlightText text={value || "-"} query={searchKeyword} />
      ),
    },
    {
      title: t("dashboard_table_company"),
      dataIndex: "companyName",
      key: "companyName",
      enableSort: true,
      render: (value: string) => (
        <HighlightText text={value || "-"} query={searchKeyword} />
      ),
    },
    {
      title: t("dashboard_table_site"),
      dataIndex: "siteName",
      key: "siteName",
      enableSort: true,
      render: (value: string) => (
        <HighlightText text={value || "-"} query={searchKeyword} />
      ),
    },
    {
      title: t("dashboard_table_status"),
      dataIndex: "status",
      key: "status",
      enableSort: true,
      render: (value: string | boolean) => <StatusBadge status={value} />,
      width: 140,
    },
    {
      title: t("dashboard_table_mission"),
      dataIndex: "missionName",
      key: "missionName",
      enableSort: true,
      render: (value: string) => (
        <div className="truncate max-w-[320px]" title={value}>
          <HighlightText text={value || "-"} query={searchKeyword} />
        </div>
      ),
    },
    {
      title: "",
      key: "action",
      width: 100,
      render: (_: unknown, record: DashboardRow) => {
        const isBlocked =
          record.status === "offline" || record.status === "working";

        if (isBlocked) {
          return <img src={ViewDrone} alt="view" className="opacity-40 cursor-not-allowed" />;
        }

        return (
          <Link to={`/stream/${record.deviceId}`}>
            <img src={ViewDrone} alt="view" />
          </Link>
        );
      },
    },
  ] satisfies SortableTableColumn<DashboardRow>[];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-[11px]">
        {cards.map((item) => (
          <div
            key={item.key}
            className={`${item.bgClass} min-h-[180px] rounded-[10px] px-[28px] py-[24px] flex justify-between items-center`}
          >
            <div className="flex flex-col">
              <span className="text-[60px] font-bold leading-none text-[#333D4B]">
                {item.value}
              </span>
              <span className="mt-4 bg-white rounded-full py-1 px-4 text-[12px] text-[#333D4B] font-semibold w-fit">
                {item.label}
              </span>
            </div>

            <img src={item.icon} alt={item.label} className="w-24 h-24 object-contain" />
          </div>
        ))}
      </div>

      <div className="mt-[26px] mb-[22px]">
        <Search
          size="large"
          placeholder={t("dashboard_search_placeholder")}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="w-full rounded-[7px]"
          allowClear
        />
      </div>

      <SortableTable columns={columns} data={filteredData} rowKey="deviceId" />
    </div>
  );
}