import axiosClient from "./axiosClient";
import type { MissionFormValue } from "@/stores/missionStore";

export const missionApi = {
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
      `/v1/missions/search${queryString ? `?${queryString}` : ""}`
    );
    return res.data;
  },

  getListByCompany: async (companyId?: string) => {
    const res = await axiosClient.get(
      `/v1/missions${companyId ? `?companyId=${companyId}` : ""}`
    );
    return res.data;
  },

  getListBySite: async (siteId?: string) => {
    const res = await axiosClient.get(
      `/v1/missions${siteId ? `?siteId=${siteId}` : ""}`
    );
    return res.data;
  },

  getDetail: async (id: string) => {
    const res = await axiosClient.get(`/v1/missions/${id}`);
    return res.data;
  },

  createMission: async (data: MissionFormValue) => {
    const payload = {
      companyId: data.companyId ?? "",
      siteId: data.siteId,
      missionName: data.missionName,
      missionType: data.missionType,
      file: data.file ?? "",
      downloadUrl: data.downloadUrl ?? "",
      deviceType: data.deviceType,
      description: data.description ?? "",
    };

    const res = await axiosClient.post("/v1/missions", payload);
    return res.data;
  },

  updateMission: async (id: string, data: MissionFormValue) => {
    const payload = {
      companyId: data.companyId ?? "",
      siteId: data.siteId,
      missionName: data.missionName,
      missionType: data.missionType,
      file: data.file ?? "",
      downloadUrl: data.downloadUrl ?? "",
      deviceType: data.deviceType,
      description: data.description ?? "",
    };

    const res = await axiosClient.post(`/v1/missions/update/${id}`, payload);
    return res.data;
  },

  deleteMission: async (id: string) => {
    const res = await axiosClient.post(`/v1/missions/delete/${id}`);
    return res.data;
  },
};