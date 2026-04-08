import axiosClient from "./axiosClient";
import type { UserFormValue } from "@/components/common/userForm";

export interface RoleOption {
  description: string;
  id: number;
  roleKey: string;
}

export const userApi = {
  getListRole: async () => {
    const res = await axiosClient.get<RoleOption[]>("/v1/roles");
    return res.data;
  },

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
      `/v1/users/search${queryString ? `?${queryString}` : ""}`
    );
    return res.data;
  },

  getDetail: async (id: string) => {
    const res = await axiosClient.get(`/v1/users/${id}`);
    return res.data;
  },

  getRoleByUser: async (id: string) => {
    const res = await axiosClient.get(`/v1/users/${id}/roles`);
    return res.data;
  },

  createUser: async (data: UserFormValue) => {
    const res = await axiosClient.post("/v1/users", data);
    return res.data;
  },

  updateUser: async (id: string, data: UserFormValue) => {
    const payload = {
    role: data.role,
    email: data.email,
    companyId: data.companyId,
    username: data.username,
    phone: data.phone,
    description: data.description ?? "",
    deviceIds: [],
    missionIds: [],
    siteIds: [],
  };
    const res = await axiosClient.post(`/v1/users/update/${id}`, payload);
    return res.data;
  },

  deleteUser: async (id: string) => {
    const res = await axiosClient.post(`/v1/users/delete/${id}`);
    return res.data;
  },
};