import React from "react";

interface StatusBadgeProps {
  status: string | boolean;
  onlineColor?: string;
  offlineColor?: string;
  defaultColor?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  onlineColor = "bg-[#34C759]",
  offlineColor = "bg-[#FF3B30]",
  defaultColor = "bg-[#FFCC00]",
}) => {
  const getStatusColor = () => {
    if (status === "online" || status === "active" || status === true) {
      return onlineColor;
    }
    if (status === "offline" || status === false || status === undefined || status === null || status === "") {
      return offlineColor;
    }
    return defaultColor;
  };

  const getStatusLabel = () => {
    if (status === true || status === "active") return "Active";
    if (status === false || status === "offline") return "Inactive";
    return String(status);
  };

  return (
    <div className="flex items-center">
      <span className={`${getStatusColor()} rounded-full w-2 h-2 inline-block mr-2`} />
      <span>{getStatusLabel()}</span>
    </div>
  );
};

export default StatusBadge;