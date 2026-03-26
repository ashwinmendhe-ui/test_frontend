import { create } from "zustand";
import type { UserFormValue } from "@/components/common/userForm";

export interface UserManagementTable {
  id: string;
  username: string;
  companyName: string;
  phone: string;
  email: string;
  createdAt: string;
  role: string;
  isActive: boolean;
}

interface UserDetail {
  user: UserFormValue & {
    id: string;
    createdAt?: string;
    isActive?: boolean;
  };
}

interface RoleOption {
  id: number;
  description: string;
  roleKey: string;
}

interface UserLoginDetail {
  roles: number[];
  user: {
    id: string;
    username: string;
    email: string;
    companyId?: string;
    companyName?: string;
    phone?: string;
    description?: string;
    isActive?: boolean;
  };
}

interface Store {
  loading: boolean;
  list: UserManagementTable[];
  listRole: RoleOption[];
  detail: UserDetail | null;
  detailUserLogin: UserLoginDetail | null;

  getListRole: () => void;
  getList: (param?: string, from?: string, to?: string) => void;
  getDetail: (id: string) => void;
  getDetailUserLogin: (id?: string) => void;
  createUser: (
    param: UserFormValue
  ) => Promise<{ code?: number | string; message?: string }>;
  updateUser: (
    id: string,
    param: UserFormValue
  ) => Promise<{ code?: number | string; message?: string }>;
  deleteUser: (
    id: string
  ) => Promise<{ code?: number | string; message?: string }>;
}

const mockDetailUserLogin: UserLoginDetail = {
  roles: [2],
  user: {
    id: "login-user-1",
    username: "AshwinM",
    email: "ashwin@test.com",
    companyId: "1",
    companyName: "Dhive",
    phone: "9876543210",
    description: "Admin user",
    isActive: true,
  },
};

const mockRoles: RoleOption[] = [
  { id: 1, description: "Admin", roleKey: "admin" },
  { id: 2, description: "Company Admin", roleKey: "company_admin" },
  { id: 3, description: "Operator", roleKey: "operator" },
];

const mockUsers: UserManagementTable[] = [
  {
    id: "1",
    username: "Ashwin",
    companyName: "Dhive",
    phone: "9876543210",
    email: "ashwin@test.com",
    createdAt: "2026-03-24 10:00",
    role: "Admin",
    isActive: true,
  },
  {
    id: "2",
    username: "John",
    companyName: "Dhive",
    phone: "9123456780",
    email: "john@test.com",
    createdAt: "2026-03-20 14:30",
    role: "Operator",
    isActive: false,
  },
];

const roleIdToLabel = (role?: number) => {
  if (role === 1) return "Admin";
  if (role === 2) return "Company Admin";
  if (role === 3) return "Operator";
  return "";
};

const companyIdToLabel = (companyId?: string) => {
  if (companyId === "1") return "Dhive";
  if (companyId === "2") return "Test Company";
  return "";
};

export const useUserStore = create<Store>((set, get) => ({
  loading: false,
  list: mockUsers,
  listRole: mockRoles,
  detail: null,
  detailUserLogin: mockDetailUserLogin,

  getDetailUserLogin: () => {
    set({ detailUserLogin: mockDetailUserLogin });
  },

  getListRole: () => {
    set({ listRole: mockRoles });
  },

  getList: (param, from, to) => {
    set({ loading: true });

    const allUsers = get().list;
    let filtered = [...allUsers];

    if (param?.trim()) {
      const q = param.trim().toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.username.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          item.companyName.toLowerCase().includes(q) ||
          item.phone.toLowerCase().includes(q) ||
          item.role.toLowerCase().includes(q)
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

    const found = get().list.find((item) => item.id === id);

    if (!found) {
      set({ loading: false, detail: null });
      return;
    }

    const roleId =
      found.role === "Admin" ? 1 : found.role === "Company Admin" ? 2 : 3;

    set({
      loading: false,
      detail: {
        user: {
          id: found.id,
          role: roleId,
          email: found.email,
          companyId: found.companyName === "Dhive" ? "1" : "2",
          username: found.username,
          phone: found.phone,
          description: "",
          createdAt: found.createdAt,
          isActive: found.isActive,
        },
      },
    });
  },

  createUser: async (param) => {
    set({ loading: true });

    const newUser: UserManagementTable = {
      id: Date.now().toString(),
      username: param.username,
      companyName: companyIdToLabel(param.companyId),
      phone: param.phone,
      email: param.email,
      createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      role: roleIdToLabel(param.role),
      isActive: true,
    };

    set((state) => ({
      loading: false,
      list: [newUser, ...state.list],
    }));

    return { code: 0 };
  },

  updateUser: async (id, param) => {
    set({ loading: true });

    set((state) => ({
      loading: false,
      list: state.list.map((item) =>
        item.id === id
          ? {
              ...item,
              username: param.username,
              companyName: companyIdToLabel(param.companyId),
              phone: param.phone,
              email: param.email,
              role: roleIdToLabel(param.role),
            }
          : item
      ),
    }));

    return { code: 0 };
  },

  deleteUser: async (id) => {
    set({ loading: true });

    set((state) => ({
      loading: false,
      list: state.list.filter((item) => item.id !== id),
    }));

    return { code: 0 };
  },
}));