import axiosClient from "./axiosClient";
import type { DetailDevice } from "@/stores/robotStore";

const mapDeviceType = (value?: string) => {
  if (!value) return "";

  const typeMap: Record<string, string> = {
    Drone: "DRONE",
    Robot: "ROBOT",
    Dock: "DOCK",
  };

  return typeMap[value] || value.toUpperCase();
};

export const robotApi = {
  getList: async (param?: string, from?: string, to?: string) => {
    const queryParams = new URLSearchParams();

    if (param !== undefined && param !== null) {
      queryParams.append("keyword", param);
    } else if (from || to) {
      queryParams.append("keyword", "");
    }

    if (from) queryParams.append("from", from);
    if (to) queryParams.append("to", to);

    const queryString = queryParams.toString();
    const res = await axiosClient.get(
      `/v1/devices${queryString ? `?${queryString}` : ""}`
    );
    return res.data;
  },

  getDetail: async (id: string) => {
    const res = await axiosClient.get(`/v1/devices/${id}`);
    return res.data;
  },

  createRobot: async (data: DetailDevice) => {
    const payload = {
      companyId: data.companyId ?? "",
      siteId: data.siteId ?? "",
      deviceId: data.deviceId,
      deviceName: data.deviceName ?? "",
      deviceType: mapDeviceType(data.deviceType),
      brandName: data.brandName ?? "",
      model: data.model ?? "",
      deviceSn: data.deviceSn ?? "",
      description: data.description ?? "",
    };

    const res = await axiosClient.post("/v1/devices", payload);
    return res.data;
  },

  updateRobot: async (deviceId: string, data: DetailDevice) => {
    const payload = {
      companyId: data.companyId ?? "",
      siteId: data.siteId ?? "",
      deviceId: data.deviceId,
      deviceName: data.deviceName ?? "",
      deviceType: mapDeviceType(data.deviceType),
      brandName: data.brandName ?? "",
      model: data.model ?? "",
      deviceSn: data.deviceSn ?? "",
      description: data.description ?? "",
    };

    const res = await axiosClient.post(`/v1/devices/update/${deviceId}`, payload);
    return res.data;
  },

  deleteRobot: async (deviceId: string) => {
    const res = await axiosClient.post(`/v1/devices/delete/${deviceId}`);
    return res.data;
  },
};