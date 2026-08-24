import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Spin,
  Typography,
  message,
} from "antd";
import { useNavigate } from "react-router-dom";

import { authApi } from "@/api";
import type {
  DeviceLoginRequest,
  DeviceLoginResponse,
} from "@/api";
import { apiPilot } from "@/api/pilot-bridge";

const { Title, Text } = Typography;

interface DroneLoginFormValues {
  username: string;
  password: string;
}

interface NormalizedDeviceLoginResponse {
  token: string;
  workspaceId: string;
  username: string;
  userId: string;
  deviceSn: string;

  mqttHost: string;
  mqttPort: number;
  mqttUseSsl: boolean;
  mqttUsername: string;
}

const DJI_APP_ID =
  import.meta.env.VITE_DRONE_APP_ID ?? "";

const DJI_APP_KEY =
  import.meta.env.VITE_DRONE_APP_KEY ?? "";

const DJI_APP_LICENSE =
  import.meta.env.VITE_DRONE_APP_LICENSE ?? "";

const STORAGE_KEYS = {
  token: "token",
  workspaceId: "workspaceId",
  username: "username",
  userId: "userId",
  deviceSn: "deviceSn",

  mqttHost: "mqttHost",
  mqttPort: "mqttPort",
  mqttUseSsl: "mqttUseSsl",
  mqttUsername: "mqttUsername",
} as const;

function normalizeDeviceLoginResponse(
  response: DeviceLoginResponse,
  fallbackUsername: string,
  fallbackDeviceSn: string
): NormalizedDeviceLoginResponse | null {
  const responseData = response.data;

  const token =
    response.token ||
    response.accessToken ||
    responseData?.token ||
    responseData?.accessToken ||
    "";

  const workspaceId =
    response.workspaceId ||
    response.workspace_id ||
    responseData?.workspaceId ||
    responseData?.workspace_id ||
    "";

  const username =
    response.username ||
    responseData?.username ||
    fallbackUsername;

  const userId =
    response.userId ||
    response.user_id ||
    responseData?.userId ||
    responseData?.user_id ||
    "";

  const deviceSn =
    response.deviceSn ||
    response.device_sn ||
    responseData?.deviceSn ||
    responseData?.device_sn ||
    fallbackDeviceSn;

    const mqttHost =
  response.mqttHost ||
  responseData?.mqttHost ||
  "";

const mqttPort =
  response.mqttPort ??
  responseData?.mqttPort ??
  0;

const mqttUseSsl =
  response.mqttUseSsl ??
  responseData?.mqttUseSsl ??
  false;

const mqttUsername =
  response.mqttUsername ||
  responseData?.mqttUsername ||
  "";

  if (
  !token ||
  !workspaceId ||
  !userId ||
  !deviceSn ||
  !mqttHost ||
  !mqttPort ||
  !mqttUsername
) {
  return null;
}

  return {
  token,
  workspaceId,
  username,
  userId,
  deviceSn,
  mqttHost,
  mqttPort,
  mqttUseSsl,
  mqttUsername,
};
}

function storeDeviceLoginData(
  loginData: NormalizedDeviceLoginResponse
) {
  localStorage.setItem(STORAGE_KEYS.token, loginData.token);
  localStorage.setItem(
    STORAGE_KEYS.workspaceId,
    loginData.workspaceId
  );
  localStorage.setItem(
    STORAGE_KEYS.username,
    loginData.username
  );
  localStorage.setItem(STORAGE_KEYS.userId, loginData.userId);
  localStorage.setItem(
    STORAGE_KEYS.deviceSn,
    loginData.deviceSn
  );

  localStorage.setItem(
  STORAGE_KEYS.mqttHost,
  loginData.mqttHost
);

localStorage.setItem(
  STORAGE_KEYS.mqttPort,
  String(loginData.mqttPort)
);

localStorage.setItem(
  STORAGE_KEYS.mqttUseSsl,
  String(loginData.mqttUseSsl)
);

localStorage.setItem(
  STORAGE_KEYS.mqttUsername,
  loginData.mqttUsername
);
}

function clearDeviceLoginData() {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.workspaceId);
  localStorage.removeItem(STORAGE_KEYS.username);
  localStorage.removeItem(STORAGE_KEYS.userId);
  localStorage.removeItem(STORAGE_KEYS.deviceSn);
  localStorage.removeItem(STORAGE_KEYS.mqttHost);
  localStorage.removeItem(STORAGE_KEYS.mqttPort);
  localStorage.removeItem(STORAGE_KEYS.mqttUseSsl);
  localStorage.removeItem(STORAGE_KEYS.mqttUsername);
}

export default function DroneLoginPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm<DroneLoginFormValues>();

  const [initializing, setInitializing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deviceSn, setDeviceSn] = useState("");
  const [bridgeError, setBridgeError] = useState("");

  const licenceConfigured = useMemo(
    () =>
      Boolean(
        DJI_APP_ID &&
          DJI_APP_KEY &&
          DJI_APP_LICENSE
      ),
    []
  );

  useEffect(() => {
    const initializeDjiPilot = () => {
      try {
        apiPilot.init();
        

        if (!window.djiBridge) {
          setBridgeError(
            "DJI Pilot bridge is unavailable. Open this page inside DJI Pilot."
          );
          return;
        }

        if (!licenceConfigured) {
          setBridgeError(
            "DJI licence configuration is missing."
          );
          return;
        }

        const verified = apiPilot.platformVerifyLicense(
          DJI_APP_ID,
          DJI_APP_KEY,
          DJI_APP_LICENSE
        );

        if (!verified) {
          setBridgeError(
            "DJI licence verification failed."
          );
          return;
        }

        const verificationSuccess =
          apiPilot.isPlatformVerifySuccess();

        if (!verificationSuccess) {
          setBridgeError(
            "DJI Pilot platform is not verified."
          );
          return;
        }

        const remoteControllerSn =
          apiPilot.getRemoteControllerSN();

        if (!remoteControllerSn) {
          setBridgeError(
            "Unable to get the remote-controller serial number."
          );
          return;
        }

        setDeviceSn(remoteControllerSn);
        setBridgeError("");
      } catch (error) {
        console.error(
          "DJI Pilot initialization failed:",
          error
        );

        setBridgeError(
          "Failed to initialize DJI Pilot."
        );
      } finally {
        setInitializing(false);
      }
    };

    initializeDjiPilot();
  }, [licenceConfigured]);

  const handleLogin = async (
    values: DroneLoginFormValues
  ) => {
    if (!deviceSn) {
      message.error(
        "Remote-controller serial number is unavailable."
      );
      return;
    }

    setSubmitting(true);
    clearDeviceLoginData();

    try {
      const request: DeviceLoginRequest = {
        username: values.username.trim(),
        password: values.password,
        flag: 0,
        deviceSn,
      };

      const response = await authApi.deviceLogin(request);

      const responseCode = response.code;

      const loginFailed =
        responseCode === "UNAUTHORIZED" ||
        responseCode === "ERROR" ||
        (typeof responseCode === "number" &&
          responseCode >= 400);

      if (loginFailed) {
        message.error(
          response.message ||
            "DJI device login failed."
        );
        return;
      }

      const loginData = normalizeDeviceLoginResponse(
        response,
        request.username,
        deviceSn
      );

      if (!loginData) {
        console.error(
          "Invalid DJI device login response:",
          response
        );

        message.error(
          response.message ||
            "Invalid response from the device-login API."
        );
        return;
      }

      storeDeviceLoginData(loginData);

      message.success("Login successful.");

      navigate("/login-success", {
        replace: true,
      });
    } catch (error) {
      console.error("DJI device login failed:", error);

      clearDeviceLoginData();
      message.error("DJI device login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#f5f5f5",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 440,
        }}
      >
        <div
          style={{
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          <Title level={3} style={{ marginBottom: 8 }}>
            ROBOPILOT
          </Title>

          <Text type="secondary">
            DJI Pilot Login
          </Text>
        </div>

        {initializing ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "40px 0",
            }}
          >
            <Spin tip="Initializing DJI Pilot..." />
          </div>
        ) : (
          <>
            {bridgeError && (
              <Alert
                type="error"
                showIcon
                message="DJI Pilot initialization failed"
                description={bridgeError}
                style={{ marginBottom: 24 }}
              />
            )}

            {!bridgeError && (
              <Alert
                type="success"
                showIcon
                message="DJI Pilot connected"
                description={`Remote controller: ${deviceSn}`}
                style={{ marginBottom: 24 }}
              />
            )}

            <Form<DroneLoginFormValues>
              form={form}
              layout="vertical"
              onFinish={handleLogin}
              autoComplete="off"
            >
              <Form.Item
                label="Username"
                name="username"
                rules={[
                  {
                    required: true,
                    message: "Please enter your username.",
                  },
                  {
                    whitespace: true,
                    message:
                      "Username cannot be empty.",
                  },
                ]}
              >
                <Input
                  placeholder="Enter username"
                  disabled={Boolean(bridgeError)}
                />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[
                  {
                    required: true,
                    message: "Please enter your password.",
                  },
                ]}
              >
                <Input.Password
                  placeholder="Enter password"
                  disabled={Boolean(bridgeError)}
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                block
                loading={submitting}
                disabled={
                  initializing ||
                  Boolean(bridgeError) ||
                  !deviceSn
                }
              >
                Login
              </Button>
            </Form>
          </>
        )}
      </Card>
    </div>
  );
}