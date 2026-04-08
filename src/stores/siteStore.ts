import { create } from "zustand";
import { siteApi } from "@/api";

export interface SiteManagementTable {
  siteId: string;
  name: string;
  companyId: string;
  companyName: string;
  phoneNumber: string;
  email: string;
  address: string;
  createdAt: string;
  deviceCount: number;
  deviceOnlineCount: number;
  status: string;
}

export interface SiteFormValue {
  id?: string;
  siteId?: string;
  name: string;
  address: string;
  description?: string;
  companyId?: string;
  companyName?: string;
  phoneNumber: string;
  email: string;
}

interface Store {
  loading: boolean;
  list: SiteManagementTable[];
  detail: SiteFormValue;
  getList: (param?: string, from?: string, to?: string) => Promise<void>;
  getListByCompany: (companyId?: string) => Promise<void>;
  getDetail: (id: string) => Promise<SiteFormValue | void>;
  createSite: (
    param: SiteFormValue
  ) => Promise<{ code?: number | string; message?: string }>;
  updateSite: (
    id: string,
    param: SiteFormValue
  ) => Promise<{ code?: number | string; message?: string }>;
  deleteSite: (
    id: string
  ) => Promise<{ code?: number | string; message?: string }>;
}

const mapSiteListItem = (item: any): SiteManagementTable => ({
  siteId: item.siteId ?? item.id ?? "",
  name: item.name ?? "",
  companyId: item.companyId ?? "",
  companyName: item.companyName ?? "",
  phoneNumber: item.phoneNumber ?? "",
  email: item.email ?? "",
  address: item.address ?? "",
  createdAt: item.createdAt ?? "",
  deviceCount: Number(item.deviceCount ?? item.registeredDroneCount ?? 0),
  deviceOnlineCount: Number(item.deviceOnlineCount ?? item.onlineDroneCount ?? 0),
  status:
    typeof item.status === "string"
      ? item.status
      : item.isActive
      ? "active"
      : "inactive",
});

const mapSiteDetail = (item: any): SiteFormValue => ({
  id: item.id ?? item.siteId ?? "",
  siteId: item.siteId ?? item.id ?? "",
  name: item.name ?? "",
  address: item.address ?? "",
  description: item.description ?? "",
  companyId: item.companyId ?? "",
  companyName: item.companyName ?? "",
  phoneNumber: item.phoneNumber ?? "",
  email: item.email ?? "",
});

export const useSiteStore = create<Store>((set) => ({
  loading: false,
  list: [],
  detail: {
    id: "",
    siteId: "",
    name: "",
    address: "",
    description: "",
    companyId: "",
    companyName: "",
    phoneNumber: "",
    email: "",
  },

  getList: async (param, from, to) => {
    set({ loading: true });
    try {
      const data = await siteApi.getList(param, from, to);
      const mappedList = Array.isArray(data) ? data.map(mapSiteListItem) : [];
      set({ loading: false, list: mappedList });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  getListByCompany: async (companyId) => {
    set({ loading: true });
    try {
      const data = await siteApi.getListByCompany(companyId);
      const mappedList = Array.isArray(data) ? data.map(mapSiteListItem) : [];
      set({ loading: false, list: mappedList });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  getDetail: async (id) => {
    set({ loading: true });
    try {
      const res = await siteApi.getDetail(id);
      const mapped = mapSiteDetail(res);
      set({ loading: false, detail: mapped });
      return mapped;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  createSite: async (param) => {
    set({ loading: true });
    try {
      const res = await siteApi.createSite(param);
      set({ loading: false });
      return res;
    } catch (error: any) {
      set({ loading: false });
      throw error;
    }
  },

  updateSite: async (id, param) => {
    set({ loading: true });
    try {
      const res = await siteApi.updateSite(id, param);
      set({ loading: false });
      return res;
    } catch (error: any) {
      set({ loading: false });
      throw error;
    }
  },

  deleteSite: async (id) => {
    set({ loading: true });
    try {
      const res = await siteApi.deleteSite(id);
      set((state) => ({
        loading: false,
        list: state.list.filter((item) => item.siteId !== id),
      }));
      return res;
    } catch (error: any) {
      set({ loading: false });
      throw error;
    }
  },
}));