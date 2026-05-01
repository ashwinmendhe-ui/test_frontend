import { Modal, Button, Table } from "antd";
import React from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type {
  ReportData,
  HistoryManagementTable,
} from "@/stores/historyStore";

interface Props {
  open: boolean;
  onClose: () => void;
  detail: ReportData;
  reportMeta?: HistoryManagementTable | null;
  autoDownload?: boolean;
}

const WorkReportModal: React.FC<Props> = ({
  open,
  onClose,
  detail,
  reportMeta,
}) => {
  const navigate = useNavigate();

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

  const handleDownload = () => {
    console.log("Download PDF");
  };

  const handleViewDetail = (record: {
  label: string;
  mdisplay: string;
  duration?: string;
}) => {
  console.log("reportMeta before navigate:", reportMeta);

  navigate("/playback", {
    state: {
      playbackUrl: detail.playbackUrl,
      timestamp: record.duration || "00:00:00",
      displayTime: record.mdisplay,
      label: record.label,

      companyId: reportMeta!.companyId,
      siteId: reportMeta!.siteId,
      missionId: reportMeta!.missionId,
      deviceSn: detail.deviceSn,

      historyDetail: detail,
      historyMeta: reportMeta,
    },
  });
};

  return (
    <Modal open={open} onCancel={onClose} footer={null} width={1250}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-end gap-4">
          <h2 className="text-2xl font-semibold">Work Report</h2>
          <p className="text-sm text-gray-500">
            Report Created: {detail.reportCreatedAt}
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={onClose}>Close</Button>
          <Button type="primary" onClick={handleDownload}>
            Download PDF
          </Button>
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded-xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="bg-white rounded-xl p-6">
              <h3 className="font-semibold mb-5">Operation Information</h3>

              <div className="grid grid-cols-4 gap-y-4 text-sm">
                <span className="text-gray-500">Start work</span>
                <span>{detail.startTime}</span>

                <span className="text-gray-500">Site name</span>
                <span>{detail.siteName}</span>

                <span className="text-gray-500">End task</span>
                <span>{detail.endTime}</span>

                <span className="text-gray-500">Robot name</span>
                <span>{detail.deviceName}</span>

                <span className="text-gray-500">Travel distance</span>
                <span>{detail.distance || "-"}</span>

                <span className="text-gray-500">Mission Name</span>
                <span>{detail.missionName}</span>

                <span className="text-gray-500">time taken</span>
                <span>{detail.totalTime}</span>

                <span className="text-gray-500">worker</span>
                <span>{detail.userName}</span>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 mt-4">
              <h3 className="font-semibold mb-4">
                Summary of AI Detection Results
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
                    <span className="text-[11px] text-gray-500">Total</span>
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
              AI detection results by time period
            </h3>

            <div className="max-h-[500px] overflow-auto">
              <Table
                dataSource={detail.bookmarks}
                pagination={false}
                size="small"
                rowKey={(r) => `${r.label}-${r.mdisplay}-${r.duration ?? ""}`}
                columns={[
                  {
                    title: "number",
                    render: (_, __, index) => index + 1,
                    width: 70,
                  },
                  {
                    title: "Timestamp",
                    dataIndex: "mdisplay",
                  },
                  {
                    title: "Recognition content",
                    dataIndex: "label",
                  },
                  {
                    title: "Detection types",
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
                          {isDanger ? "danger" : "common"}
                        </span>
                      );
                    },
                  },
                  {
                    title: "View details",
                    render: (_, record) => (
                      <button
                        type="button"
                        className="text-lg hover:text-blue-500"
                        onClick={() => handleViewDetail(record)}
                      >
                        ↗
                      </button>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default WorkReportModal;