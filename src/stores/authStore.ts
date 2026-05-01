import { create } from "zustand";
import { authApi } from "@/api";
import type { LoginRequest } from "@/api/authApi";

interface Store {
  loading: boolean;
  isAuthenticated: boolean;
  login: (
    data: LoginRequest
  ) => Promise<{
    code?: string | number;
    message?: string;
    token?: string;
    userId?: string;
  }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<Store>((set) => ({
  loading: false,
  isAuthenticated: !!localStorage.getItem("token"),

  login: async (data) => {
    set({ loading: true });

    try {
      const result = await authApi.login(data);

      const success = "token" in result && !!result.token;

      set({
        loading: false,
        isAuthenticated: success,
      });

      return result;
    } catch (error: any) {
      set({
        loading: false,
        isAuthenticated: false,
      });

      return {
        code: "LOGIN_FAILED",
        message:
          error?.response?.data?.message ||
          "Invalid email or password. Please try again.",
      };
    }
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