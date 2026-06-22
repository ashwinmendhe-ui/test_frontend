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
import { TOPIC } from "@/constants/topic";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useUserStore } from "@/stores/userStore";
import { filterByQuery } from "@/utils/filterByQuery";
import { Input, Spin } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const { Search } = Input;

type DashboardRow = {
  deviceId: string;
  deviceSn?: string;
  deviceName: string;

  companyId?: string;
  companyName: string;

  siteId?: string;
  siteName: string;

  status: string | boolean;

  missionId?: string;
  missionName?: string;
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
  const [deviceStatusMap, setDeviceStatusMap] = useState<Record<string, any>>(
    {}
  );

  const userRole = detailUserLogin?.roles?.[0];

  // const handleStatusMessage = useCallback((message: any) => {
  //   const key = message.deviceSn || message.deviceId;
  //   if (!key) return;

  //   setDeviceStatusMap((prev) => ({
  //     ...prev,
  //     [key]: message,
  //   }));
  // }, []);

  const handleDashboardDeviceMessage = useCallback(
  (message: any) => {
    console.log("[WS][Dashboard] received", message);

    getDashboard();
    getDashboardStat();
  },
  [getDashboard, getDashboardStat]
);

  useWebSocket(
    import.meta.env.VITE_WS_URL,
    TOPIC.DASHBOARD_DEVICES,
    handleDashboardDeviceMessage,
    true
  );


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
    ...(userRole === 1 || userRole === 2
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

  const mergedDashboard = useMemo(() => {
    return dashboard.map((item) => {
      const live =
        deviceStatusMap[item.deviceSn] || deviceStatusMap[item.deviceId];

      if (!live) return item;

      return {
        ...item,
        status: live.status ?? item.status,
        missionId: live.missionId ?? item.missionId,
        missionName: live.missionName ?? item.missionName,
      };
    });
  }, [dashboard, deviceStatusMap]);

  const filteredData = useMemo(() => {
    return filterByQuery(mergedDashboard, searchKeyword, [
      "deviceName",
      "companyName",
      "siteName",
      "status",
      "missionName",
      "deviceId",
      "deviceSn",
    ]);
  }, [mergedDashboard, searchKeyword]);

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
        const currentStatus = String(record.status || "").toLowerCase();

        const isBlocked =
          currentStatus === "offline" || currentStatus === "inactive";

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
          <Link
            // to="/stream"
            to={`/stream/${record.deviceId}`}
            state={{
              fromDashboard: true,
              openLiveStream: currentStatus === "working",

              companyId: record.companyId,
              companyName: record.companyName,

              siteId: record.siteId,
              siteName: record.siteName,

              deviceId: record.deviceId,
              deviceSn: record.deviceSn,
              deviceName: record.deviceName,

              missionId: record.missionId,
              missionName: record.missionName,

              status: record.status,
            }}
          >
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