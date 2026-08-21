/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Spin,
  Typography,
  message,
} from "antd";
import { useNavigate } from "react-router-dom";

import {
  apiPilot,
  ComponentName,
} from "@/api/pilot-bridge";

const { Title, Text } = Typography;

const STORAGE_KEYS = {
  token: "token",
  workspaceId: "workspaceId",
  username: "username",
  userId: "userId",
  deviceSn: "deviceSn",
} as const;

const COMPONENT_LOAD_DELAY_MS = 1000;

function delay(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });
}

function clearDjiStorage() {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.workspaceId);
  localStorage.removeItem(STORAGE_KEYS.username);
  localStorage.removeItem(STORAGE_KEYS.userId);
  localStorage.removeItem(STORAGE_KEYS.deviceSn);
}

export default function LoginSuccessPage() {
  const navigate = useNavigate();

  const initializedRef = useRef(false);

  const [initializing, setInitializing] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    const components = apiPilot.init();

    apiPilot.registerBackClick(() => {
      console.info(
        "DJI Pilot Back pressed on ROBOPILOT login-success."
      );

      return false;
    });

    apiPilot.registerStopPlatform(() => {
      console.warn(
        "DJI Pilot onStopPlatform triggered."
      );
    });

    const deviceSn =
      localStorage.getItem(STORAGE_KEYS.deviceSn) ?? "";
    const token =
      localStorage.getItem(STORAGE_KEYS.token) ?? "";

    const username =
      localStorage.getItem(STORAGE_KEYS.username) ?? "";

    const workspaceId =
      localStorage.getItem(STORAGE_KEYS.workspaceId) ?? "";

    window.reg_callback = (...args: any[]) => {
  console.info(
    "DJI Thing registration callback:",
    ...args
  );

  setConnected(true);

  message.success(
    "DJI Pilot connected successfully."
  );
};

window.liveStatusCallback = (arg: any) => {
  console.info(
    "DJI LiveShare status callback:",
    arg
  );
};
    const startConnection = async () => {
      if (!token || !workspaceId || !username || !deviceSn) {
        clearDjiStorage();

        navigate("/dronelogin", {
          replace: true,
        });

        return;
      }

      if (!window.djiBridge) {
        setError(
          "DJI Pilot bridge is unavailable. Open this page inside DJI Pilot."
        );
        setInitializing(false);
        return;
      }

      const droneConnectHost =
        import.meta.env.VITE_DRONE_CONNECT_IP;

      if (!droneConnectHost) {
        setError(
          "DJI connection host is not configured."
        );
        setInitializing(false);
        return;
      }

      try {
      const rawApiHost = import.meta.env.VITE_API_URL;

      if (!rawApiHost) {
        throw new Error(
          "ROBOPILOT API host is not configured."
        );
      }

      const apiHost = rawApiHost.endsWith("/")
        ? rawApiHost
        : `${rawApiHost}/`;

      const apiConfig = JSON.stringify({
        host: apiHost,
        token,
      });

      apiPilot.loadComponent(
        ComponentName.Api,
        apiConfig
      );

      apiPilot.setToken(token);

  apiPilot.setWorkspaceId(workspaceId);

  const thingConfig = JSON.stringify({
    host: droneConnectHost,
    connectCallback: "reg_callback",
    username: deviceSn,
    password: token,
  });

  apiPilot.loadComponent(
    ComponentName.Thing,
    thingConfig
  );

  await delay(COMPONENT_LOAD_DELAY_MS);

  apiPilot.thingConnect(
    deviceSn,
    token,
    "reg_callback"
  );

  await delay(COMPONENT_LOAD_DELAY_MS);

  const liveshareConfig = JSON.stringify({
    videoPublishType:
      "video-demand-aux-manual",
    statusCallback:
      "liveStatusCallback",
  });

  components.set(
    ComponentName.LiveShare,
    liveshareConfig
  );

  await delay(COMPONENT_LOAD_DELAY_MS);

  apiPilot.loadComponent(
    ComponentName.LiveShare,
    components.get(ComponentName.LiveShare) ?? ""
  );
} catch (connectionError: any) {
  console.error(
    "DJI Pilot connection failed:",
    connectionError
  );

  setError(
    connectionError?.message ||
      "DJI Pilot connection failed."
  );

  message.error(
    connectionError?.message ||
      "DJI Pilot connection failed."
  );
} finally {
  setInitializing(false);
}
    };

    void startConnection();

    return () => {};
  }, [navigate]);

  const handleLogout = () => {
    try {
      if (
        apiPilot.isComponentLoaded(
          ComponentName.Thing
        )
      ) {
        apiPilot.unloadComponent(
          ComponentName.Thing
        );
      }

      if (
        apiPilot.isComponentLoaded(
          ComponentName.LiveShare
        )
      ) {
        apiPilot.unloadComponent(
          ComponentName.LiveShare
        );
      }
    } catch (logoutError) {
      console.error(
        "Failed to unload DJI components:",
        logoutError
      );
    } finally {
      clearDjiStorage();

      navigate("/dronelogin", {
        replace: true,
      });
    }
  };

  return (
    <div
      style={{
        width: "100vw",
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
          maxWidth: 460,
          textAlign: "center",
        }}
      >
        <Title level={3}>ROBOPILOT</Title>

        {initializing ? (
          <div style={{ padding: "40px 0" }}>
            <Spin tip="Connecting DJI Pilot..." />
          </div>
        ) : error ? (
          <Alert
            type="error"
            showIcon
            message="DJI Pilot connection failed"
            description={error}
            style={{
              marginBottom: 24,
              textAlign: "left",
            }}
          />
        ) : (
          <Alert
            type={connected ? "success" : "info"}
            showIcon
            message={
              connected
                ? "DJI Pilot connected"
                : "DJI Pilot initialized"
            }
            description={
              connected
                ? "The remote controller is connected to ROBOPILOT."
                : "Waiting for the DJI Thing connection."
            }
            style={{
              marginBottom: 24,
              textAlign: "left",
            }}
          />
        )}

        <Text type="secondary">
          DJI Pilot integration is initialized.
        </Text>

        <Button
          block
          danger
          onClick={handleLogout}
          style={{ marginTop: 24 }}
        >
          Log out
        </Button>
      </Card>
    </div>
  );
}