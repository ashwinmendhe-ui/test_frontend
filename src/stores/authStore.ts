import { create } from "zustand";
import { authApi } from "@/api";
import type { LoginRequest } from "@/api/authApi";

interface Store {
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<{ code?: string | number; message?: string; token?: string; userId?: string }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<Store>((set) => ({
  loading: false,
  isAuthenticated: !!localStorage.getItem("token"),

  login: async (data) => {
    set({ loading: true });

    const result = await authApi.login(data);

    const success = !!result?.token;

    set({
      loading: false,
      isAuthenticated: success,
    });

    return result;
  },

  logout: async () => {
    set({ loading: true });

    await authApi.logout();

    set({
      loading: false,
      isAuthenticated: false,
    });
  },
}));