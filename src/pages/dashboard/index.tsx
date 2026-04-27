import HomeCompany from "@/assets/home-company.svg";
import HomeRobot from "@/assets/home-robot.svg";
import HomeSite from "@/assets/home-site.svg";
import HomeViewer from "@/assets/home-viewer.svg";
import ViewDrone from "@/assets/view-drone.svg";
import HighlightText from "@/components/common/HighlightText";
import StatusBadge from "@/components/common/statusBadge";
import {
  SortableTable,
  type SortableTableColumn,
} from "@/components/common/table";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useUserStore } from "@/stores/userStore";
import { filterByQuery } from "@/utils/filterByQuery";
import { Input, Spin } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const { Search } = Input;

type DashboardRow = {
  deviceId: string;
  deviceName: string;
  companyName: string;
  siteName: string;
  status: string | boolean;
  activeMissionName?: string;
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
  const { dashboard, stat, loading, getDashboard, getDashboardStat } =
    useDashboardStore();

  const [searchKeyword, setSearchKeyword] = useState("");

  const userRole = detailUserLogin?.roles?.[0];

  useEffect(() => {
    getDashboard();
    getDashboardStat();
  }, [getDashboard, getDashboardStat]);

  const cards: DashboardCard[] = [
    ...(userRole === 1
      ? [
          {
            key: "company",
            label: t("dashboard_card_company"),
            value: stat.totalCompanies,
            bgClass: "bg-[#EBFFFB]",
            icon: HomeCompany,
          },
        ]
      : []),
    {
      key: "site",
      label: t("dashboard_card_site"),
      value: stat.totalSites,
      bgClass: "bg-[#FBF6FF]",
      icon: HomeSite,
    },
    ...((userRole === 1 || userRole === 2)
      ? [
          {
            key: "user",
            label: t("dashboard_card_user"),
            value: stat.totalUsers,
            bgClass: "bg-[#FFF5ED]",
            icon: HomeViewer,
          },
        ]
      : []),
    {
      key: "robot",
      label: t("dashboard_card_robot"),
      value: stat.totalDevices,
      bgClass: "bg-[#F0F6FF]",
      icon: HomeRobot,
    },
  ];

  const filteredData = useMemo(() => {
    return filterByQuery(dashboard, searchKeyword, [
      "deviceName",
      "companyName",
      "siteName",
      "status",
      "activeMissionName",
      "deviceId",
    ]);
  }, [dashboard, searchKeyword]);

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
      dataIndex: "activeMissionName",
      key: "activeMissionName",
      enableSort: true,
      render: (value?: string) => (
        <div className="truncate max-w-[320px]" title={value || "-"}>
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
          return (
            <img
              src={ViewDrone}
              alt="view"
              className="opacity-40 cursor-not-allowed"
            />
          );
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

            <img
              src={item.icon}
              alt={item.label}
              className="w-24 h-24 object-contain"
            />
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

      <Spin spinning={loading}>
        <SortableTable
          columns={columns}
          data={filteredData}
          rowKey="deviceId"
        />
      </Spin>
    </div>
  );
}