import { robotApi } from "@/api";
import { create } from "zustand";

export interface DetailDevice {
  companyAddress?: string;
  companyEmail?: string;
  companyId?: string;
  companyName?: string;
  companyPhoneNumber?: string;
  createdAt?: string;
  description?: string;
  deviceId: string;
  deviceSn?: string;
  deviceType: string;
  firmware?: string;
  id?: number;
  model?: string;
  siteId?: string;
  siteName?: string;
  status?: string;
  updatedAt?: string;
  droneSn?: string;
  deviceName?: string;
  brandName?: string;
  subDeviceInfo?: {
    sn: string;
    type: number;
    subType: number;
    model: string;
  };
}

export interface RobotManagementTable {
  id: number;
  deviceId: string;
  deviceName: string;
  companyId: string;
  companyName: string;
  siteId: string;
  siteName: string;
  deviceType: string;
  brandName?: string;
  model?: string;
  deviceSn?: string;
  createdAt: string;
  status: string;
}

interface Store {
  loading: boolean;
  list: RobotManagementTable[];
  detail: DetailDevice;
  getList: (param?: string, from?: string, to?: string) => Promise<void>;
  getListBySite: (siteId?: string) => Promise<void>;
  getDetail: (id: string) => Promise<DetailDevice | void>;
  createRobot: (
    param: DetailDevice
  ) => Promise<{ code?: number | string; message?: string } | void>;
  updateRobot: (
    id: string,
    param: DetailDevice
  ) => Promise<{ code?: number | string; message?: string } | void>;
  deleteRobot: (
    id: string
  ) => Promise<{ code?: number | string; message?: string } | undefined>;
}

const defaultDetail: DetailDevice = {
  companyAddress: "",
  companyEmail: "",
  companyId: "",
  companyName: "",
  companyPhoneNumber: "",
  createdAt: "",
  description: "",
  deviceId: "",
  deviceSn: "",
  deviceType: "",
  firmware: "",
  id: 0,
  model: "",
  siteId: "",
  siteName: "",
  status: "",
  updatedAt: "",
  droneSn: "",
  deviceName: "",
  brandName: "",
  subDeviceInfo: {
    sn: "",
    type: 0,
    subType: 0,
    model: "",
  },
};

const mapRobotListItem = (item: any): RobotManagementTable => ({
  id: item.id || 0,
  deviceId: item.deviceId || "",
  deviceName: item.deviceName || item.name || "",
  companyId: item.companyId || item.company?.companyId || item.company?.id || "",
  companyName: item.companyName || item.company?.name || "",
  siteId: item.siteId || item.site?.siteId || item.site?.id || "",
  siteName: item.siteName || item.site?.name || "",
  deviceType: item.deviceType || "",
  brandName: item.brandName || "",
  model: item.model || "",
  deviceSn: item.deviceSn || "",
  createdAt: item.createdAt || item.createdDate || "",
  status: item.status || "",
});

const mapRobotDetail = (item: any): DetailDevice => ({
  companyAddress: item.companyAddress || item.company?.address || "",
  companyEmail: item.companyEmail || item.company?.email || "",
  companyId: item.companyId || item.company?.companyId || item.company?.id || "",
  companyName: item.companyName || item.company?.name || "",
  companyPhoneNumber: item.companyPhoneNumber || item.company?.phoneNumber || "",
  createdAt: item.createdAt || "",
  description: item.description || "",
  deviceId: item.deviceId || "",
  deviceSn: item.deviceSn || "",
  deviceType: item.deviceType || "",
  firmware: item.firmware || "",
  id: item.id || 0,
  model: item.model || "",
  siteId: item.siteId || item.site?.siteId || item.site?.id || "",
  siteName: item.siteName || item.site?.name || "",
  status: item.status || "",
  updatedAt: item.updatedAt || "",
  droneSn: item.droneSn || "",
  deviceName: item.deviceName || item.name || "",
  brandName: item.brandName || "",
  subDeviceInfo: item.subDeviceInfo || {
    sn: "",
    type: 0,
    subType: 0,
    model: "",
  },
});

export const useRobotStore = create<Store>((set, get) => ({
  loading: false,
  list: [],
  detail: defaultDetail,

  getList: async (param, from, to) => {
    set({ loading: true });
    try {
      const res = await robotApi.getList(param, from, to);
      const data = Array.isArray(res) ? res : res?.data || res?.content || [];
      set({
        loading: false,
        list: data.map(mapRobotListItem),
      });
    } catch (error) {
      console.error("Robot list fetch failed:", error);
      set({ loading: false, list: [] });
    }
  },

  getListBySite: async (siteId) => {
    set({ loading: true });
    try {
      const res = await robotApi.getListBySite(siteId);
      const data = Array.isArray(res) ? res : res?.data || res?.content || [];
      set({
        loading: false,
        list: data.map(mapRobotListItem),
      });
    } catch (error) {
      console.error("Robot list by site fetch failed:", error);
      set({ loading: false, list: [] });
      throw error;
    }
  },

  getDetail: async (id) => {
    set({ loading: true });
    try {
      const res = await robotApi.getDetail(id);
      const mapped = mapRobotDetail(res?.data || res);
      set({
        loading: false,
        detail: mapped,
      });
      return mapped;
    } catch (error) {
      set({ loading: false, detail: defaultDetail });
      throw error;
    }
  },

  createRobot: async (param) => {
    set({ loading: true });
    try {
      const payload = {
        ...param,
      };

      const res = await robotApi.createRobot(payload);
      await get().getList();
      return res;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  updateRobot: async (id, param) => {
    set({ loading: true });
    try {
      const payload = {
        ...param,
      };

      const res = await robotApi.updateRobot(id, payload);
      await get().getList();
      return res;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  deleteRobot: async (id) => {
    set({ loading: true });
    try {
      const res = await robotApi.deleteRobot(id);
      await get().getList();
      return res;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
}));