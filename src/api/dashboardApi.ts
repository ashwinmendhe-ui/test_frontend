import axiosClient from "./axiosClient";

export const dashboardApi = {
  getList: async (param?: string) => {
    const res = await axiosClient.get(
      `/v1/devices${param ? `/search?keyword=${param}` : ""}`
    );
    return res.data;
  },

  getDeviceBySite: async (id: string) => {
    const res = await axiosClient.get(`/v1/devices?siteId=${id}`);
    return res.data;
  },

  getListByCompany: async (param?: string) => {
    const res = await axiosClient.get(
      `/v1/devices${param ? `?companyId=${param}` : ""}`
    );
    return res.data;
  },

  getStat: async () => {
    const res = await axiosClient.get(`/v1/dashboard/stats`);
    return res.data;
  },
};