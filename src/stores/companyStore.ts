import { create } from "zustand";

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

  getList: (param?: string, from?: string, to?: string) => void;
  getDetail: (id: string) => void;
  createCompany: (param: CompanyFormValue) => Promise<any>;
  updateCompany: (id: string, param: CompanyFormValue) => Promise<any>;
  deleteCompany: (id: string) => Promise<any>;
}

const mockCompanies: CompanyManagementTable[] = [
  {
    companyId: "1",
    name: "Dhive",
    phoneNumber: "9876543210",
    email: "dhive@test.com",
    address: "Seoul",
    createdAt: "2026-03-20 10:00",
    status: true,
  },
  {
    companyId: "2",
    name: "Test Corp",
    phoneNumber: "9123456780",
    email: "test@test.com",
    address: "India",
    createdAt: "2026-03-22 12:00",
    status: false,
  },
];

export const useCompanyStore = create<Store>((set, get) => ({
  loading: false,
  list: mockCompanies,
  detail: {
    name: "",
    phoneNumber: "",
    email: "",
    address: "",
    description: "",
  },

  getList: (param, from, to) => {
    set({ loading: true });

    let filtered = [...get().list];

    if (param?.trim()) {
      const q = param.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          item.phoneNumber.includes(q)
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
    const found = get().list.find((c) => c.companyId === id);

    if (!found) return;

    set({
      detail: {
        companyId: found.companyId,
        name: found.name,
        phoneNumber: found.phoneNumber,
        email: found.email,
        address: found.address,
        description: "",
      },
    });
  },

  createCompany: async (param) => {
    set({ loading: true });

    const newCompany: CompanyManagementTable = {
      companyId: Date.now().toString(),
      name: param.name,
      phoneNumber: param.phoneNumber,
      email: param.email,
      address: param.address,
      createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      status: true,
    };

    set((state) => ({
      loading: false,
      list: [newCompany, ...state.list],
    }));

    return { code: 0 };
  },

  updateCompany: async (id, param) => {
    set({ loading: true });

    set((state) => ({
      loading: false,
      list: state.list.map((item) =>
        item.companyId === id
          ? { ...item, ...param }
          : item
      ),
    }));

    return { code: 0 };
  },

  deleteCompany: async (id) => {
    set({ loading: true });

    set((state) => ({
      loading: false,
      list: state.list.filter((item) => item.companyId !== id),
    }));

    return { code: 0 };
  },
}));