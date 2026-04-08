import { missionApi } from "@/api";
import { create } from "zustand";

export interface MissionManagementTable {
  missionId: string;
  missionName: string;
  companyId: string;
  companyName: string;
  siteId: string;
  siteName: string;
  deviceType: string;
  missionType: string;
  file: string;
  createdAt: string;
  downloadUrl?: string;
}

export interface MissionFormValue {
  companyId?: string;
  companyName?: string;
  siteId: string;
  missionName: string;
  missionType: string;
  file?: string;
  downloadUrl?: string;
  deviceType: string;
  description?: string;
}

interface Store {
  loading: boolean;
  list: MissionManagementTable[];
  listBySite: MissionManagementTable[];
  detail: MissionFormValue;
  getList: (param?: string, from?: string, to?: string) => Promise<void>;
  getListByCompany: (companyId?: string) => Promise<void>;
  getListBySite: (siteId?: string) => Promise<void>;
  getDetail: (id: string) => Promise<MissionFormValue | void>;
  createMission: (
    param: MissionFormValue
  ) => Promise<{ code?: number; uploadUrl?: string; objectKey?: string } | void>;
  updateMission: (
    id: string,
    param: MissionFormValue
  ) => Promise<{ code?: number; uploadUrl?: string; objectKey?: string } | void>;
  deleteMission: (
    id: string
  ) => Promise<{ code?: number | string; message?: string } | undefined>;
}

const defaultDetail: MissionFormValue = {
  companyId: "",
  companyName: "",
  siteId: "",
  missionName: "",
  missionType: "",
  file: "",
  downloadUrl: "",
  deviceType: "",
  description: "",
};

const mapMissionListItem = (item: any): MissionManagementTable => ({
  missionId: item.missionId || item.id || "",
  missionName: item.missionName || item.name || "",
  companyId: item.companyId || item.company?.companyId || item.company?.id || "",
  companyName: item.companyName || item.company?.name || "",
  siteId: item.siteId || item.site?.siteId || item.site?.id || "",
  siteName: item.siteName || item.site?.name || "",
  deviceType: item.deviceType || "",
  missionType: item.missionType || item.category || "",
  file: item.file || item.fileName || "",
  createdAt: item.createdAt || item.createdDate || "",
  downloadUrl: item.downloadUrl || "",
});

const mapMissionDetail = (item: any): MissionFormValue => ({
  companyId: item.companyId || item.company?.companyId || item.company?.id || "",
  companyName: item.companyName || item.company?.name || "",
  siteId: item.siteId || item.site?.siteId || item.site?.id || "",
  missionName: item.missionName || item.name || "",
  missionType: item.missionType || item.category || "",
  file: item.file || item.fileName || "",
  downloadUrl: item.downloadUrl || "",
  deviceType: item.deviceType || "",
  description: item.description || "",
});

export const useMissionStore = create<Store>((set, get) => ({
  loading: false,
  list: [],
  listBySite: [],
  detail: defaultDetail,

    getList: async (param, from, to) => {
      set({ loading: true });
      try {
        const res = await missionApi.getList(param, from, to);
        const data = Array.isArray(res) ? res : res?.data || res?.content || [];
        set({
          loading: false,
          list: data.map(mapMissionListItem),
        });
      } catch (error) {
        console.error("Mission list fetch failed:", error);
        set({ loading: false, list: [] });
      }
    },

  getListByCompany: async (companyId) => {
    set({ loading: true });
    try {
      const res = await missionApi.getListByCompany(companyId);
      const data = Array.isArray(res) ? res : res?.data || res?.content || [];
      set({
        loading: false,
        list: data.map(mapMissionListItem),
      });
    } catch (error) {
      set({ loading: false, list: [] });
      throw error;
    }
  },

  getListBySite: async (siteId) => {
    set({ loading: true });
    try {
      const res = await missionApi.getListBySite(siteId);
      const data = Array.isArray(res) ? res : res?.data || res?.content || [];
      set({
        loading: false,
        listBySite: data.map(mapMissionListItem),
      });
    } catch (error) {
      set({ loading: false, listBySite: [] });
      throw error;
    }
  },

  getDetail: async (id) => {
    set({ loading: true });
    try {
      const res = await missionApi.getDetail(id);
      const mapped = mapMissionDetail(res?.data || res);
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

  createMission: async (param) => {
  set({ loading: true });
  try {
    const payload = {
      companyId: param.companyId || "",
      siteId: param.siteId,
      missionName: param.missionName,
      missionType: param.missionType,
      file: param.file || "",
      downloadUrl: param.downloadUrl || "",
      deviceType: param.deviceType,
      description: param.description || "",
    };

    const res = await missionApi.createMission(payload);
    await get().getList();
    return res;
  } catch (error) {
    set({ loading: false });
    throw error;
  }
},

  updateMission: async (id, param) => {
  set({ loading: true });
  try {
    const payload = {
      companyId: param.companyId || "",
      siteId: param.siteId,
      missionName: param.missionName,
      missionType: param.missionType,
      file: param.file || "",
      downloadUrl: param.downloadUrl || "",
      deviceType: param.deviceType,
      description: param.description || "",
    };

    const res = await missionApi.updateMission(id, payload);
    await get().getList();
    return res;
  } catch (error) {
    set({ loading: false });
    throw error;
  }
},

  deleteMission: async (id) => {
  set({ loading: true });
  try {
    const res = await missionApi.deleteMission(id);
    await get().getList();
    return res;
  } catch (error) {
    set({ loading: false });
    throw error;
  }
},
}));