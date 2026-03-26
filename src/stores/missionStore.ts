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

  getList: (param?: string, from?: string, to?: string) => void;
  getListByCompany: (companyId?: string) => void;
  getListBySite: (siteId?: string) => void;
  getDetail: (id: string) => void;
  createMission: (param: MissionFormValue) => Promise<{ code?: number; uploadUrl?: string; objectKey?: string } | void>;
  updateMission: (id: string, param: MissionFormValue) => Promise<{ code?: number; uploadUrl?: string; objectKey?: string } | void>;
  deleteMission: (id: string) => Promise<{ code?: number | string; message?: string }>;
}

const mockMissions: MissionManagementTable[] = [
  {
    missionId: "1",
    missionName: "Alpha Patrol",
    companyId: "1",
    companyName: "Dhive",
    siteId: "1",
    siteName: "Site Alpha",
    deviceType: "Drone",
    missionType: "Patrol",
    file: "alpha-plan.zip",
    createdAt: "2026-03-21 10:00",
    downloadUrl: "https://example.com/file-1",
  },
  {
    missionId: "2",
    missionName: "Beta Monitoring",
    companyId: "2",
    companyName: "Test Company",
    siteId: "2",
    siteName: "Site Beta",
    deviceType: "Robot",
    missionType: "Monitoring",
    file: "beta-plan.zip",
    createdAt: "2026-03-23 14:20",
  },
];

export const useMissionStore = create<Store>((set, get) => ({
  loading: false,
  list: mockMissions,
  listBySite: [],
  detail: {
    companyId: "",
    companyName: "",
    siteId: "",
    missionName: "",
    missionType: "",
    file: "",
    deviceType: "",
    description: "",
  },

  getList: (param, from, to) => {
    set({ loading: true });

    let filtered = [...get().list];

    if (param?.trim()) {
      const q = param.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.missionName.toLowerCase().includes(q) ||
          item.companyName.toLowerCase().includes(q) ||
          item.siteName.toLowerCase().includes(q) ||
          item.deviceType.toLowerCase().includes(q) ||
          item.missionType.toLowerCase().includes(q) ||
          item.file.toLowerCase().includes(q)
      );
    }

    if (from && to) {
      const fromTime = new Date(from).getTime();
      const toTime = new Date(to).getTime();

      filtered = filtered.filter((item) => {
        const itemTime = new Date(item.createdAt).getTime();
        return itemTime >= fromTime && itemTime <= toTime;
      });
    }

    set({ loading: false, list: filtered });
  },

  getListByCompany: (companyId) => {
    set({ loading: true });

    const filtered = companyId
      ? mockMissions.filter((item) => item.companyId === companyId)
      : mockMissions;

    set({ loading: false, list: filtered });
  },

  getListBySite: (siteId) => {
    set({ loading: true });

    const filtered = siteId
      ? mockMissions.filter((item) => item.siteId === siteId)
      : [];

    set({ loading: false, listBySite: filtered });
  },

  getDetail: (id) => {
    set({ loading: true });

    const found = get().list.find((item) => item.missionId === id);

    if (!found) {
      set({ loading: false });
      return;
    }

    set({
      loading: false,
      detail: {
        companyId: found.companyId,
        companyName: found.companyName,
        siteId: found.siteId,
        missionName: found.missionName,
        missionType: found.missionType,
        file: found.file,
        downloadUrl: found.downloadUrl,
        deviceType: found.deviceType,
        description: "",
      },
    });
  },

  createMission: async (param) => {
    set({ loading: true });

    const newMission: MissionManagementTable = {
      missionId: Date.now().toString(),
      missionName: param.missionName,
      companyId: param.companyId || "",
      companyName: param.companyName || "Dhive",
      siteId: param.siteId,
      siteName: param.siteId === "1" ? "Site Alpha" : param.siteId === "2" ? "Site Beta" : "Selected Site",
      deviceType: param.deviceType,
      missionType: param.missionType,
      file: param.file || "",
      createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      downloadUrl: param.downloadUrl,
    };

    set((state) => ({
      loading: false,
      list: [newMission, ...state.list],
    }));

    return { code: 0 };
  },

  updateMission: async (id, param) => {
    set({ loading: true });

    set((state) => ({
      loading: false,
      list: state.list.map((item) =>
        item.missionId === id
          ? {
              ...item,
              companyId: param.companyId || item.companyId,
              companyName: param.companyName || item.companyName,
              siteId: param.siteId,
              missionName: param.missionName,
              missionType: param.missionType,
              file: param.file || item.file,
              downloadUrl: param.downloadUrl || item.downloadUrl,
              deviceType: param.deviceType,
            }
          : item
      ),
    }));

    return { code: 0 };
  },

  deleteMission: async (id) => {
    set({ loading: true });

    set((state) => ({
      loading: false,
      list: state.list.filter((item) => item.missionId !== id),
    }));

    return { code: 0 };
  },
}));