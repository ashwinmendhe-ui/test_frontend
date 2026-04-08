import axiosClient from "./axiosClient";
import type { CompanyFormValue } from "@/stores/companyStore";

export const companyApi = {
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
      `/v1/companies/search${queryString ? `?${queryString}` : ""}`
    );
    return res.data;
  },

  getDetail: async (id: string) => {
    const res = await axiosClient.get(`/v1/companies/${id}`);
    return res.data;
  },

  createCompany: async (data: CompanyFormValue) => {
    const payload = {
      name: data.name,
      phoneNumber: data.phoneNumber,
      email: data.email,
      address: data.address,
      description: data.description ?? "",
    };

    const res = await axiosClient.post("/v1/companies", payload);
    return res.data;
  },

  updateCompany: async (id: string, data: CompanyFormValue) => {
    const payload = {
      name: data.name,
      phoneNumber: data.phoneNumber,
      email: data.email,
      address: data.address,
      description: data.description ?? "",
    };

    const res = await axiosClient.post(`/v1/companies/update/${id}`, payload);
    return res.data;
  },

  deleteCompany: async (id: string) => {
    const res = await axiosClient.post(`/v1/companies/delete/${id}`);
    return res.data;
  },
};