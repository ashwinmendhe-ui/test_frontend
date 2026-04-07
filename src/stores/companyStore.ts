import { create } from "zustand";
import { companyApi } from "@/api";

export interface CompanyManagementTable {
  companyId: string;
  name: string;
  phoneNumber: string;
  email: string;
  address: string;
  createdAt: string;
  status: boolean;
}

export interface CompanyFormValue {
  companyId?: string;
  name: string;
  phoneNumber: string;
  email: string;
  address: string;
  description?: string;
}

interface Store {
  loading: boolean;
  list: CompanyManagementTable[];
  detail: CompanyFormValue;

  getList: (param?: string, from?: string, to?: string) => Promise<void>;
  getDetail: (id: string) => Promise<CompanyFormValue | void>;
  createCompany: (
    param: CompanyFormValue
  ) => Promise<{ code?: number | string; message?: string }>;
  updateCompany: (
    id: string,
    param: CompanyFormValue
  ) => Promise<{ code?: number | string; message?: string }>;
  deleteCompany: (
    id: string
  ) => Promise<{ code?: number | string; message?: string }>;
}

const mapCompanyListItem = (item: any): CompanyManagementTable => ({
  companyId: item.companyId ?? item.id ?? "",
  name: item.name ?? item.companyName ?? "",
  phoneNumber: item.phoneNumber ?? "",
  email: item.email ?? "",
  address: item.address ?? "",
  createdAt: item.createdAt ?? "",
  status: Boolean(item.status ?? item.isActive),
});

const mapCompanyDetail = (item: any): CompanyFormValue => ({
  companyId: item.companyId ?? item.id ?? "",
  name: item.name ?? item.companyName ?? "",
  phoneNumber: item.phoneNumber ?? "",
  email: item.email ?? "",
  address: item.address ?? "",
  description: item.description ?? "",
});

export const useCompanyStore = create<Store>((set) => ({
  loading: false,
  list: [],
  detail: {
    companyId: "",
    name: "",
    phoneNumber: "",
    email: "",
    address: "",
    description: "",
  },

  getList: async (param, from, to) => {
    set({ loading: true });
    try {
      const data = await companyApi.getList(param, from, to);
      const mappedList = Array.isArray(data) ? data.map(mapCompanyListItem) : [];

      set({
        loading: false,
        list: mappedList,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  getDetail: async (id) => {
    set({ loading: true });
    try {
      const res = await companyApi.getDetail(id);
      const mapped = mapCompanyDetail(res);

      set({
        loading: false,
        detail: mapped,
      });

      return mapped;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  createCompany: async (param) => {
    set({ loading: true });
    try {
      const res = await companyApi.createCompany(param);
      set({ loading: false });
      return res;
    } catch (error: any) {
      set({ loading: false });
      throw error;
    }
  },

  updateCompany: async (id, param) => {
    set({ loading: true });
    try {
      const res = await companyApi.updateCompany(id, param);
      set({ loading: false });
      return res;
    } catch (error: any) {
      set({ loading: false });
      throw error;
    }
  },

  deleteCompany: async (id) => {
    set({ loading: true });
    try {
      const res = await companyApi.deleteCompany(id);

      set((state) => ({
        loading: false,
        list: state.list.filter((item) => item.companyId !== id),
      }));

      return res;
    } catch (error: any) {
      set({ loading: false });
      throw error;
    }
  },
}));