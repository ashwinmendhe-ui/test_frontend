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
  getList: (param?: string, from?: string, to?: string) => void;
  getDetail: (id: string) => void;
  createRobot: (param: DetailDevice) => Promise<{ code?: number | string; message?: string }>;
  updateRobot: (id: string, param: DetailDevice) => Promise<{ code?: number | string; message?: string }>;
  deleteRobot: (id: string) => Promise<{ code?: number | string; message?: string }>;
}

const mockRobots: RobotManagementTable[] = [
  {
    id: 1,
    deviceId: "RB-1001",
    deviceName: "Robot Alpha",
    companyId: "1",
    companyName: "Dhive",
    siteId: "1",
    siteName: "Site Alpha",
    deviceType: "Drone",
    brandName: "DJI",
    model: "M300",
    deviceSn: "SN1001",
    createdAt: "2026-03-21 09:00",
    status: "active",
  },
  {
    id: 2,
    deviceId: "RB-2001",
    deviceName: "Robot Beta",
    companyId: "2",
    companyName: "Test Company",
    siteId: "2",
    siteName: "Site Beta",
    deviceType: "Quadruped Robot",
    brandName: "Unitree",
    model: "B2",
    deviceSn: "SN2001",
    createdAt: "2026-03-23 11:30",
    status: "offline",
  },
];

const companyIdToLabel = (companyId?: string) => {
  if (companyId === "1") return "Dhive";
  if (companyId === "2") return "Test Company";
  return "";
};

const siteIdToLabel = (siteId?: string) => {
  if (siteId === "1") return "Site Alpha";
  if (siteId === "2") return "Site Beta";
  return "";
};

export const useRobotStore = create<Store>((set, get) => ({
  loading: false,
  list: mockRobots,
  detail: {
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
  },

  getList: (param, from, to) => {
    set({ loading: true });

    let filtered = [...get().list];

    if (param?.trim()) {
      const q = param.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.deviceName.toLowerCase().includes(q) ||
          item.companyName.toLowerCase().includes(q) ||
          item.siteName.toLowerCase().includes(q) ||
          item.deviceType.toLowerCase().includes(q) ||
          String(item.brandName || "").toLowerCase().includes(q) ||
          String(item.model || "").toLowerCase().includes(q) ||
          String(item.deviceSn || "").toLowerCase().includes(q) ||
          item.deviceId.toLowerCase().includes(q)
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

  getDetail: (id) => {
    set({ loading: true });

    const found = get().list.find((item) => item.deviceId === id);

    if (!found) {
      set({ loading: false });
      return;
    }

    set({
      loading: false,
      detail: {
        companyId: found.companyId,
        companyName: found.companyName,
        createdAt: found.createdAt,
        description: "",
        deviceId: found.deviceId,
        deviceSn: found.deviceSn || "",
        deviceType: found.deviceType,
        id: found.id,
        model: found.model || "",
        siteId: found.siteId,
        siteName: found.siteName,
        status: found.status,
        deviceName: found.deviceName,
        brandName: found.brandName || "",
        subDeviceInfo: {
          sn: "",
          type: 0,
          subType: 0,
          model: "",
        },
      },
    });
  },

  createRobot: async (param) => {
    set({ loading: true });

    const newRobot: RobotManagementTable = {
      id: Date.now(),
      deviceId: param.deviceId,
      deviceName: param.deviceName || "",
      companyId: param.companyId || "",
      companyName: param.companyName || companyIdToLabel(param.companyId),
      siteId: param.siteId || "",
      siteName: param.siteName || siteIdToLabel(param.siteId),
      deviceType: param.deviceType,
      brandName: param.brandName || "",
      model: param.model || "",
      deviceSn: param.deviceSn || "",
      createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      status: "active",
    };

    set((state) => ({
      loading: false,
      list: [newRobot, ...state.list],
    }));

    return { code: 0 };
  },

  updateRobot: async (id, param) => {
    set({ loading: true });

    set((state) => ({
      loading: false,
      list: state.list.map((item) =>
        item.deviceId === id
          ? {
              ...item,
              deviceName: param.deviceName || item.deviceName,
              companyId: param.companyId || item.companyId,
              companyName: param.companyName || companyIdToLabel(param.companyId) || item.companyName,
              siteId: param.siteId || item.siteId,
              siteName: param.siteName || siteIdToLabel(param.siteId) || item.siteName,
              deviceType: param.deviceType || item.deviceType,
              brandName: param.brandName || item.brandName,
              model: param.model || item.model,
              deviceSn: param.deviceSn || item.deviceSn,
              deviceId: param.deviceId || item.deviceId,
            }
          : item
      ),
    }));

    return { code: 0 };
  },

  deleteRobot: async (id) => {
    set({ loading: true });

    set((state) => ({
      loading: false,
      list: state.list.filter((item) => item.deviceId !== id),
    }));

    return { code: 0 };
  },
}));