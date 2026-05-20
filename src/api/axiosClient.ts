import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

const ACCESS_TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refreshToken";

type TokenResponse = {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  data?: {
    token?: string;
    accessToken?: string;
    refreshToken?: string;
  };
};

interface RetryRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshTokenPromise: Promise<{
  token: string;
  refreshToken: string;
}> | null = null;

const clearAuthAndRedirect = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("userId");

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

const getTokenFromResponse = (responseData: TokenResponse) => {
  const token =
    responseData.token ||
    responseData.accessToken ||
    responseData.data?.token ||
    responseData.data?.accessToken;

  const refreshToken =
    responseData.refreshToken ||
    responseData.data?.refreshToken;

  return {
    token,
    refreshToken,
  };
};

const refreshAccessToken = async () => {
  const currentRefreshToken = localStorage.getItem(
    REFRESH_TOKEN_KEY
  );

  if (!currentRefreshToken) {
    throw new Error("Missing refresh token");
  }

  const response = await refreshClient.post<TokenResponse>(
    "/v1/auth/refresh-token",
    {
      refreshToken: currentRefreshToken,
    }
  );

  const { token, refreshToken } = getTokenFromResponse(
    response.data
  );

  if (!token || !refreshToken) {
    throw new Error("Invalid refresh response");
  }

  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

  return {
    token,
    refreshToken,
  };
};

// ===== REQUEST INTERCEPTOR =====
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ===== RESPONSE INTERCEPTOR =====
axiosClient.interceptors.response.use(
  (response) => response,

  async (
    error: AxiosError<{
      code?: string;
      message?: string;
    }>
  ) => {
    const originalRequest =
      error.config as RetryRequestConfig;

    const status = error.response?.status;
    const code = error.response?.data?.code;

    const isTokenExpired =
      status === 401 && code === "TOKEN_EXPIRED";

    const isRefreshApi =
      originalRequest?.url?.includes(
        "/v1/auth/refresh-token"
      );

    const isLoginApi =
      originalRequest?.url?.includes(
        "/v1/auth/login"
      );

    if (
      isTokenExpired &&
      originalRequest &&
      !originalRequest._retry &&
      !isRefreshApi
    ) {
      originalRequest._retry = true;

      try {
        if (!refreshTokenPromise) {
          refreshTokenPromise = refreshAccessToken();
        }

        const { token } =
          await refreshTokenPromise;

        originalRequest.headers =
          originalRequest.headers ?? {};

        originalRequest.headers.Authorization =
          `Bearer ${token}`;

        return axiosClient(originalRequest);
      } catch (refreshError) {
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        refreshTokenPromise = null;
      }
    }

    // invalid token / forbidden / refresh failed
    if (
      (status === 401 || status === 403) &&
      !isLoginApi
    ) {
      clearAuthAndRedirect();
    }

    return Promise.reject(error);
  }
);

export default axiosClient;