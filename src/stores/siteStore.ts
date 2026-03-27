import { create } from "zustand";

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
  getList: (param?: string, from?: string, to?: string) => void;
  getListByCompany: (companyId?: string) => void;
  getDetail: (id: string) => void;
  createSite: (param: SiteFormValue) => Promise<{ code?: number | string; message?: string }>;
  updateSite: (id: string, param: SiteFormValue) => Promise<{ code?: number | string; message?: string }>;
  deleteSite: (id: string) => Promise<{ code?: number | string; message?: string }>;
}

const mockSites: SiteManagementTable[] = [
  {
    siteId: "1",
    name: "Site Alpha",
    companyId: "1",
    companyName: "Dhive",
    phoneNumber: "9876543210",
    email: "alpha@dhive.com",
    address: "Seoul",
    createdAt: "2026-03-20 10:00",
    deviceCount: 8,
    deviceOnlineCount: 5,
    status: "active",
  },
  {
    siteId: "2",
    name: "Site Beta",
    companyId: "2",
    companyName: "Test Company",
    phoneNumber: "9123456780",
    email: "beta@test.com",
    address: "India",
    createdAt: "2026-03-22 12:00",
    deviceCount: 4,
    deviceOnlineCount: 1,
    status: "offline",
  },
];

const companyIdToLabel = (companyId?: string) => {
  if (companyId === "1") return "Dhive";
  if (companyId === "2") return "Test Company";
  return "";
};

export const useSiteStore = create<Store>((set, get) => ({
  loading: false,
  list: mockSites,
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

  getList: (param, from, to) => {
    set({ loading: true });

    let filtered = [...mockSites];

    if (param?.trim()) {
      const q = param.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.companyName.toLowerCase().includes(q) ||
          item.phoneNumber.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          item.address.toLowerCase().includes(q)
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
      ? mockSites.filter((item) => item.companyId === companyId)
      : mockSites;

    set({ loading: false, list: filtered });
  },

  getDetail: (id) => {
  set({ loading: true });

  const found = get().list.find((item) => item.siteId === id);

      if (!found) {
        set({ loading: false });
        return;
      }

      set({
        loading: false,
        detail: {
          id: found.siteId,
          siteId: found.siteId,
          name: found.name,
          address: found.address,
          description: "",
          companyId: found.companyId,
          companyName: found.companyName,
          phoneNumber: found.phoneNumber,
          email: found.email,
        },
      });
    },

  createSite: async (param) => {
    set({ loading: true });

    const newSite: SiteManagementTable = {
      siteId: Date.now().toString(),
      name: param.name,
      companyId: param.companyId || "",
      companyName: param.companyName || companyIdToLabel(param.companyId),
      phoneNumber: param.phoneNumber,
      email: param.email,
      address: param.address,
      createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      deviceCount: 0,
      deviceOnlineCount: 0,
      status: "active",
    };

    set((state) => ({
      loading: false,
      list: [newSite, ...state.list],
    }));

    return { code: 0 };
  },

  updateSite: async (id, param) => {
    set({ loading: true });

    set((state) => ({
      loading: false,
      list: state.list.map((item) =>
        item.siteId === id
          ? {
              ...item,
              name: param.name,
              companyId: param.companyId || item.companyId,
              companyName: param.companyName || companyIdToLabel(param.companyId) || item.companyName,
              phoneNumber: param.phoneNumber,
              email: param.email,
              address: param.address,
            }
          : item
      ),
    }));

    return { code: 0 };
  },

  deleteSite: async (id) => {
    set({ loading: true });

    set((state) => ({
      loading: false,
      list: state.list.filter((item) => item.siteId !== id),
    }));

    return { code: 0 };
  },
}));