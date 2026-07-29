import React from "react";
import { Table } from "antd";
import { useTranslation } from "react-i18next";
import { PieChart, Pie, Cell } from "recharts";

import type {
  ReportData,
  HistoryManagementTable,
} from "@/stores/historyStore";

interface Props {
  detail: ReportData;
  reportMeta?: HistoryManagementTable | null;
  isExportingPdf?: boolean;
  reportRef?: React.RefObject<HTMLDivElement | null>;
  onViewDetail?: (record: {
    label: string;
    mdisplay: string;
    duration?: string;
  }) => void;
}

export default function WorkReportContent({
  detail,
  isExportingPdf = false,
  reportRef,
  onViewDetail,
}: Props) {
  const { t } = useTranslation();

  const chartColors = [
    "#1890ff",
    "#c2185b",
    "#fadb14",
    "#fa541c",
    "#fa8c16",
    "#13c2c2",
    "#ff4d4f",
    "#faad14",
    "#52c41a",
  ];

  const generatedLabelCounts = (detail.bookmarks || []).reduce<
    Record<string, number>
  >((acc, item) => {
    const label = item.label || "Unknown";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  const finalLabelCounts =
    detail.labelCounts && Object.keys(detail.labelCounts).length > 0
      ? detail.labelCounts
      : generatedLabelCounts;

  const chartData = Object.entries(finalLabelCounts).map(
    ([name, value], index) => ({
      name,
      value,
      color: chartColors[index % chartColors.length],
    })
  );

  const totalRecognition =
    chartData.reduce((sum, item) => sum + item.value, 0) ||
    detail.totalRecognition ||
    0;

  return (
    <div ref={reportRef} className="bg-gray-100 p-4 rounded-xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="bg-white rounded-xl p-6">
            <h3 className="font-semibold mb-5">
              {t("work_report_operation_info")}
            </h3>

            <div className="grid grid-cols-4 gap-y-4 text-sm">
              <span className="text-gray-500">
                {t("work_report_start_work")}
              </span>
              <span>{detail.startTime}</span>

              <span className="text-gray-500">
                {t("work_report_site_name")}
              </span>
              <span>{detail.siteName}</span>

              <span className="text-gray-500">
                {t("work_report_end_task")}
              </span>
              <span>{detail.endTime}</span>

              <span className="text-gray-500">
                {t("work_report_robot_name")}
              </span>
              <span>{detail.deviceName}</span>

              <span className="text-gray-500">
                {t("work_report_travel_distance")}
              </span>
              <span>{detail.distance || "-"}</span>

              <span className="text-gray-500">
                {t("work_report_mission_name")}
              </span>
              <span>{detail.missionName}</span>

              <span className="text-gray-500">
                {t("work_report_time_taken")}
              </span>
              <span>{detail.totalTime}</span>

              <span className="text-gray-500">
                {t("work_report_worker")}
              </span>
              <span>{detail.userName}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 mt-4">
            <h3 className="font-semibold mb-4">
              {t("work_report_ai_summary")}
            </h3>

            <div className="flex items-center justify-between">
              <div className="relative w-[230px] h-[230px]">
                <PieChart width={230} height={230}>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={1}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[11px] text-gray-500">
                    {t("work_report_total")}
                  </span>
                  <span className="text-2xl font-semibold">
                    {totalRecognition}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm w-[50%]">
                {chartData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                    </div>

                    <span className="font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 h-full">
          <h3 className="font-semibold mb-4">
            {t("work_report_ai_by_time")}
          </h3>

          <div
            className={
              isExportingPdf
                ? "max-h-none overflow-visible"
                : "max-h-[500px] overflow-auto"
            }
          >
            <Table
              dataSource={detail.bookmarks}
              pagination={false}
              size="small"
              locale={{
                emptyText: t("table_no_data"),
              }}
              rowKey={(record, index) =>
                `${record.label || "unknown"}-${
                  record.duration || record.mdisplay || "unknown"
                }-${index}`
              }
              columns={[
                {
                  title: t("work_report_number"),
                  render: (_, __, index) => index + 1,
                  width: 70,
                },
                {
                  title: t("work_report_timestamp"),
                  render: (_, record) =>
                    record.mdisplay || record.duration || "-",
                },
                {
                  title: t("work_report_recognition_content"),
                  dataIndex: "label",
                },
                {
                  title: t("work_report_detection_types"),
                  render: (_, record) => {
                    const isDanger =
                      record.label?.includes("NO") ||
                      record.label?.includes("No");

                    return (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isDanger
                            ? "bg-red-100 text-red-500"
                            : "bg-green-100 text-green-500"
                        }`}
                      >
                        {isDanger
                          ? t("work_report_danger")
                          : t("work_report_common")}
                      </span>
                    );
                  },
                },
                {
                  title: t("work_report_view_details"),
                  render: (_, record) =>
                    onViewDetail ? (
                      <button
                        type="button"
                        className="text-lg hover:text-blue-500"
                        onClick={() => onViewDetail(record)}
                      >
                        ↗
                      </button>
                    ) : null,
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}