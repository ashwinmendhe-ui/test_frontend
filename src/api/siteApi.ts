import axiosClient from "./axiosClient";
import type { SiteFormValue } from "@/stores/siteStore";

export const siteApi = {
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
      `/v1/sites/search${queryString ? `?${queryString}` : ""}`
    );
    return res.data;
  },

  getListByCompany: async (companyId?: string) => {
    const res = await axiosClient.get(
      `/v1/sites${companyId ? `?companyId=${companyId}` : ""}`
    );
    return res.data;
  },

  getDetail: async (id: string) => {
    const res = await axiosClient.get(`/v1/sites/${id}`);
    return res.data;
  },

  createSite: async (data: SiteFormValue) => {
    const payload = {
      name: data.name,
      address: data.address,
      description: data.description ?? "",
      companyId: data.companyId,
      phoneNumber: data.phoneNumber,
      email: data.email,
    };

    const res = await axiosClient.post("/v1/sites", payload);
    return res.data;
  },

  updateSite: async (id: string, data: SiteFormValue) => {
    const payload = {
      name: data.name,
      address: data.address,
      description: data.description ?? "",
      companyId: data.companyId,
      phoneNumber: data.phoneNumber,
      email: data.email,
    };

    const res = await axiosClient.post(`/v1/sites/update/${id}`, payload);
    return res.data;
  },

  deleteSite: async (id: string) => {
    const res = await axiosClient.post(`/v1/sites/delete/${id}`);
    return res.data;
  },
};