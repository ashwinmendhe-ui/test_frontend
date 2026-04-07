import axiosClient from "./axiosClient";

export interface CompanyOption {
  companyId?: string;
  id?: string;
  name?: string;
  companyName?: string;
}

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
};