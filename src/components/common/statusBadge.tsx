import React from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  const getStatusColor = () => {
    if (status === "online" || status === "active" || status === true) {
      return onlineColor;
    }
    if (
      status === "offline" ||
      status === false ||
      status === undefined ||
      status === null ||
      status === ""
    ) {
      return offlineColor;
    }
    return defaultColor;
  };

  const getStatusLabel = () => {
  const normalizedStatus = String(status).toLowerCase();

  if (
    status === true ||
    normalizedStatus === "active" ||
    normalizedStatus === "online"
  ) {
    return t("status_active");
  }

  if (
    status === false ||
    normalizedStatus === "offline" ||
    normalizedStatus === "inactive" ||
    normalizedStatus === "disable"
  ) {
    return t("status_inactive");
  }

  if (normalizedStatus === "working") {
    return t("status_working");
  }

  return String(status);
};

  return (
    <div className="flex items-center">
      <span
        className={`${getStatusColor()} rounded-full w-2 h-2 inline-block mr-2`}
      />
      <span>{getStatusLabel()}</span>
    </div>
  );
};

export default StatusBadge;