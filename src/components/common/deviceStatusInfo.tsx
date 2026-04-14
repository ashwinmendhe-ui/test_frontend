import { useTranslation } from "react-i18next";

export interface DeviceData {
  status?: string;
  battery?: number;
  network?: string;
  gps?: string;
  altitude?: number;
  latitude?: number;
  longitude?: number;
  speed?: number;
  operatingHour?: string | number;
  startTime?: string | number;
  videoTime?: number;
}

interface DeviceStatusInfoProps {
  isConnected: boolean;
  deviceData: DeviceData;
}

export default function DeviceStatusInfo({
  isConnected,
  deviceData,
}: DeviceStatusInfoProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full bg-[#F6F7F9] flex gap-2 rounded-[10px]">
      <div className="w-1/2 rounded-[10px] h-[300px] bg-white px-8 py-10">
        <h2 className="text-[20px] font-bold">{t("stream_device_status")}</h2>
        <div className="mt-9 flex flex-col gap-5">
          <div className="flex justify-between">
            <span className="text-sm font-medium min-h-6">
              {t("table_status")}
            </span>
            {isConnected ? (
              <span className="text-xs font-bold px-2 py-1 rounded-[23px] bg-[#B7FFC6] text-primary">
                {deviceData?.status || "-"}
              </span>
            ) : (
              "-"
            )}
          </div>

          <div className="flex justify-between">
            <span className="text-sm font-medium min-h-6">
              {t("stream_device_battery")}
            </span>
            {isConnected ? (
              <span className="text-xs font-bold px-2 py-1 rounded-[23px] bg-[#B7FFC6] text-primary">
                {deviceData?.battery ?? "-"}%
              </span>
            ) : (
              "-"
            )}
          </div>

          <div className="flex justify-between">
            <span className="text-sm font-medium min-h-6">
              {t("stream_device_network")}
            </span>
            {isConnected ? (
              <span className="text-xs font-bold px-2 py-1 rounded-[23px] bg-[#B7FFC6] text-primary">
                {deviceData?.network || "-"}
              </span>
            ) : (
              "-"
            )}
          </div>

          <div className="flex justify-between">
            <span className="text-sm font-medium min-h-6">
              {t("stream_device_gps")}
            </span>
            {isConnected ? (
              <span className="text-xs font-bold px-2 py-1 rounded-[23px] bg-[#B7FFC6] text-primary">
                {deviceData?.gps || "-"}
              </span>
            ) : (
              "-"
            )}
          </div>
        </div>
      </div>

      <div className="w-1/2 rounded-[10px] h-[300px] bg-white px-8 py-10">
        <h2 className="text-[20px] font-bold">{t("stream_device_info")}</h2>
        <div className="mt-9 flex flex-col gap-5">
          <div className="flex justify-between">
            <span className="text-sm font-medium">
              {t("stream_device_altitude")}
            </span>
            <span className="text-xs font-bold px-2 py-1 rounded-[23px] max-w-30 text-right text-[#757575]">
              {isConnected ? `${deviceData?.altitude ?? "-"}m` : "-"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm font-medium">
              {t("stream_device_speed")}
            </span>
            <span className="text-xs font-bold px-2 py-1 rounded-[23px] max-w-30 text-right text-[#757575]">
              {isConnected ? `${deviceData?.speed ?? "-"}m/s` : "-"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm font-medium">
              {t("stream_device_operating_hour")}
            </span>
            <span className="text-xs font-bold px-2 py-1 rounded-[23px] max-w-30 text-right text-[#757575]">
              {isConnected ? `${deviceData?.operatingHour ?? "-"}` : "-"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-sm font-medium">
              {t("stream_device_start_time")}
            </span>
            <span className="text-xs font-bold px-2 py-1 rounded-[23px] max-w-30 text-right text-[#757575]">
              {isConnected ? `${deviceData?.startTime ?? "-"}` : "-"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}