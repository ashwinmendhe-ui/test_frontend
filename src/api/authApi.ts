import axiosClient from "./axiosClient";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  accessToken?: string;
  refreshToken?: string;
  userId: string;
  code?: string | number;
  message?: string;
  data?: {
    token?: string;
    accessToken?: string;
    refreshToken?: string;
    userId?: string;
  };
}

/**
 * DJI Pilot device authentication request.
 *
 * flag is retained because it is required by the existing
 * DJI/FPT device-login contract.
 */
export interface DeviceLoginRequest {
  username: string;
  password: string;
  flag: number;
  deviceSn: string;
}

/**
 * DJI device-login responses may be returned either directly
 * or inside the data property.
 */
export interface DeviceLoginResponse {
  token?: string;
  accessToken?: string;
  workspaceId?: string;
  workspace_id?: string;
  username?: string;
  userId?: string;
  user_id?: string;
  deviceSn?: string;
  device_sn?: string;
  code?: string | number;
  message?: string;
  data?: {
    token?: string;
    accessToken?: string;
    workspaceId?: string;
    workspace_id?: string;
    username?: string;
    userId?: string;
    user_id?: string;
    deviceSn?: string;
    device_sn?: string;
  };
}

const ACCESS_TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";

const getLoginTokens = (responseData: LoginResponse) => {
  const token =
    responseData.token ||
    responseData.accessToken ||
    responseData.data?.token ||
    responseData.data?.accessToken;

  const refreshToken =
    responseData.refreshToken ||
    responseData.data?.refreshToken;

  const userId =
    responseData.userId ||
    responseData.data?.userId;

  return {
    token,
    refreshToken,
    userId,
  };
};

const clearAuthStorage = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("userId");
};

export const authApi = {
  login: async (data: LoginRequest) => {
    try {
      const response = await axiosClient.post<LoginResponse>(
        "/v1/auth/login",
        data
      );

      const { token, refreshToken, userId } = getLoginTokens(
        response.data
      );

      if (!token || !refreshToken || !userId) {
        throw new Error("Invalid login response");
      }

      localStorage.setItem(ACCESS_TOKEN_KEY, token);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      localStorage.setItem("userId", userId);

      return response.data;
    } catch (error: any) {
      clearAuthStorage();

      return {
        code:
          error?.response?.status === 401
            ? "UNAUTHORIZED"
            : "ERROR",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Login failed",
      };
    }
  },

  /**
   * Authenticates DJI Pilot using the remote-controller serial number.
   *
   * Storage is intentionally not handled here. The /dronelogin page
   * will validate and store the DJI-specific token, workspace ID,
   * username, user ID and device serial number.
   */
  deviceLogin: async (
    data: DeviceLoginRequest
  ): Promise<DeviceLoginResponse> => {
    try {
      const response = await axiosClient.post<DeviceLoginResponse>(
        "/v1/device/auth/login",
        data
      );

      return response.data;
    } catch (error: any) {
      return {
        code:
          error?.response?.status === 401
            ? "UNAUTHORIZED"
            : error?.response?.status || "ERROR",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "DJI device login failed",
      };
    }
  },

  logout: async () => {
    try {
      await axiosClient.post("/v1/auth/logout").catch(() => {});
    } finally {
      clearAuthStorage();
    }
  },
};