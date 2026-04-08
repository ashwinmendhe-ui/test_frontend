import axiosClient from "./axiosClient";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  code?: string | number;
  message?: string;
}

export const authApi = {
  login: async (data: LoginRequest) => {
    try {
      const response = await axiosClient.post<LoginResponse>("/v1/auth/login", data);

      const { token, userId } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);

      return response.data;
    } catch (error: any) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");

      return {
        code: error?.response?.status === 401 ? "UNAUTHORIZED" : "ERROR",
        message: error?.response?.data?.message || error?.message || "Login failed",
      };
    }
  },

  logout: async () => {
    try {
      await axiosClient.post("/v1/auth/logout").catch(() => {});
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
    }
  },
};