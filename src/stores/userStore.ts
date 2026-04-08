import { create } from "zustand";
import { userApi } from "@/api";
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

  getListRole: () => Promise<void>;
  getList: (param?: string, from?: string, to?: string) => Promise<void>;
  getDetail: (id: string) => Promise<UserDetail | null>;
  getDetailUserLogin: (id?: string) => Promise<UserLoginDetail | null>;
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




const roleIdToLabel = (role?: number | string) => {
  if (role === 1 || role === "1" ) return "System Administrator";
  if (role === 2 || role === "2" ) return "Company Admin";
  if (role === 3 || role === "3" ) return "Company User";
  return "";
};

const roleNameToLabel = (roleName?: string) => {
  if (!roleName) return "";

  const upper = roleName.toUpperCase();

  if (upper === "SYS_ADMIN" || upper === "SYSTEM_ADMIN" || upper === "SYSTEM ADMINISTRATOR") {
    return "System Administrator";
  }
  if (upper === "COMP_ADMIN" || upper === "COMPANY_ADMIN" || upper === "COMPANY ADMIN") {
    return "Company Admin";
  }
  if (upper === "USER" || upper === "COMP_USER" || upper === "COMPANY_USER") {
    return "Company User";
  }

  return roleName;
};

const mapRoleLabel = (item: any) => {
  if (Array.isArray(item.roleNames) && item.roleNames.length > 0) {
    return roleNameToLabel(item.roleNames[0]);
  }

  if (Array.isArray(item.roleIds) && item.roleIds.length > 0) {
    return roleIdToLabel(item.roleIds[0]);
  }

  return "";
};

const mapUserListItem = (item: any): UserManagementTable => ({
  id: item.userId ?? String(item.id ?? ""),
  username: item.username ?? "",
  companyName: item.companyName ?? "",
  phone: item.phone ?? "",
  email: item.email ?? "",
  createdAt: item.createdAt ?? "",
  role: mapRoleLabel(item),
  isActive: Boolean(item.isActive),
});







export const useUserStore = create<Store>((set) => ({
  loading: false,
  list: [],
  listRole: [],
  detail: null,
  detailUserLogin: null,

  getListRole: async () => {
    set({ loading: true });
    try {
      const data = await userApi.getListRole();
      
      
      set({
        listRole: Array.isArray(data) ? data : [],
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  getList: async (param, from, to) => {
    set({ loading: true });
    try {
      const data = await userApi.getList(param, from, to);
      
      const mappedList = Array.isArray(data) ? data.map(mapUserListItem) : [];
      console.log("191 in userStore - get list: ", data[0], "mapped: ", mappedList[0]);
      
      set({
        list: mappedList,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  getDetail: async (id) => {
    set({ loading: true });
    try {
      const res = await userApi.getDetail(id);
      // console.log("169 in userStore - user detail api response: ", JSON.stringify(res, null, 2));
      
      const mapped: UserDetail = {
  user: {
    id: res?.user?.userId ?? res?.user?.id ?? "",
    role:
      Array.isArray(res?.roles) && typeof res.roles[0] === "number"
        ? res.roles[0]
            : Array.isArray(res?.user?.roleIds) && typeof res.user.roleIds[0] === "number"
            ? res.user.roleIds[0]
            : undefined,
        email: res?.user?.email ?? "",
        companyId: res?.user?.companyId ?? "",
        companyName: res?.user?.companyName ?? "",
        username: res?.user?.username ?? "",
        phone: res?.user?.phone ?? "",
        description: res?.user?.description ?? "",
        createdAt: res?.user?.createdAt ?? "",
        isActive: res?.user?.isActive ?? false,
      },
    };
      console.log("mapped detail: ", mapped);
      

      set({ detail: mapped, loading: false });
      return mapped;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  getDetailUserLogin: async (id) => {
    const userId = id || localStorage.getItem("userId");
    if (!userId) return null;

    set({ loading: true });
    try {
      const res = await userApi.getDetail(userId);

      const mapped: UserLoginDetail = {
        roles: Array.isArray(res?.roles) ? res.roles : [],
        user: {
          id: res?.user?.userId ?? res?.user?.id ?? "",
          username: res?.user?.username ?? "",
          email: res?.user?.email ?? "",
          companyId: res?.user?.companyId ?? "",
          companyName: res?.user?.companyName ?? "",
          phone: res?.user?.phone ?? "",
          description: res?.user?.description ?? "",
          isActive: res?.user?.isActive ?? false,
        },
      };

      set({ detailUserLogin: mapped, loading: false });
      return mapped;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  createUser: async (param) => {
    set({ loading: true });
    try {
      const res = await userApi.createUser(param);
      set({ loading: false });
      return res;
    } catch (error: any) {
      set({ loading: false });
      throw error;
    }
  },

  updateUser: async (id, param) => {
    set({ loading: true });
    try {
      console.log("updateUser payload:", JSON.stringify(param, null, 2));
      const res = await userApi.updateUser(id, param);
      console.log("updateUser response:", JSON.stringify(res, null, 2));
      set({ loading: false });
      return res;
    } catch (error: any) {
      console.error("updateUser error:", error?.response?.data || error);
      set({ loading: false });
      throw error;
    }
  },

  deleteUser: async (id) => {
    set({ loading: true });
    try {
      const res = await userApi.deleteUser(id);

      set((state) => ({
        loading: false,
        list: state.list.filter((item) => item.id !== id),
      }));

      return res;
    } catch (error: any) {
      set({ loading: false });
      throw error;
    }
  },
}));