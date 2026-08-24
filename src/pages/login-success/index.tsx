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

  mqttHost: "mqttHost",
  mqttPort: "mqttPort",
  mqttUseSsl: "mqttUseSsl",
  mqttUsername: "mqttUsername",
} as const;



function clearDjiStorage() {
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

export default function LoginSuccessPage() {
  const navigate = useNavigate();

  const initializedRef = useRef(false);
  const connectedInitRef = useRef(false);

  const [initializing, setInitializing] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;

    apiPilot.init();
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

      localStorage.setItem(
        "djiStopPlatformTriggered",
        new Date().toISOString()
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
      const mqttHost =
  localStorage.getItem(STORAGE_KEYS.mqttHost) ?? "";

const mqttPort = Number(
  localStorage.getItem(STORAGE_KEYS.mqttPort) ?? "0"
);

const mqttUseSsl =
  localStorage.getItem(STORAGE_KEYS.mqttUseSsl) === "true";

const mqttUsername =
  localStorage.getItem(STORAGE_KEYS.mqttUsername) ?? "";

const initializeConnectedSession = () => {
  if (connectedInitRef.current) {
    return;
  }

  connectedInitRef.current = true;

  console.info(
    "[DJI] Initializing connected native session."
  );

  apiPilot.setWorkspaceId(workspaceId);

  apiPilot.setPlatformMessage(
    "ROBOPILOT",
    "ROBOPILOT",
    ""
  );

  const liveshareConfig = JSON.stringify({
    videoPublishType:
      "video-demand-aux-manual",
    statusCallback:
      "liveStatusCallback",
  });

  const liveShareLoaded =
    apiPilot.isComponentLoaded(
      ComponentName.LiveShare
    );

  console.info(
    "[DJI] LiveShare already loaded:",
    liveShareLoaded
  );

  if (!liveShareLoaded) {
    apiPilot.loadComponent(
      ComponentName.LiveShare,
      liveshareConfig
    );
  }

  setConnected(true);
  setInitializing(false);
};



   window.reg_callback = (...args: any[]) => {
  console.info(
    "[DJI][THING_CALLBACK]",
    ...args
  );

  const thingConnected =
    apiPilot.thingGetConnectState();

  console.info(
    "[DJI] Thing connected after callback:",
    thingConnected
  );

  if (thingConnected) {
    initializeConnectedSession();

    message.success(
      "DJI Pilot connected successfully."
    );
  }
};
window.liveStatusCallback = (arg: any) => {
  console.info(
    "DJI LiveShare status callback:",
    arg
  );
};
    const startConnection = async () => {
      if (
        !token ||
        !workspaceId ||
        !username ||
        !deviceSn ||
        !mqttHost ||
        !mqttPort ||
        !mqttUsername
      ) {
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

      const pilotStoredToken =
  apiPilot.getToken();

console.info(
  "[DJI] Token stored in Pilot:",
  Boolean(pilotStoredToken)
);

console.info(
  "[DJI] onStopPlatform marker:",
  localStorage.getItem(
    "djiStopPlatformTriggered"
  )
);


  const mqttProtocol = mqttUseSsl
  ? "ssl"
  : "tcp";

const mqttAddress =
  mqttHost.includes("://")
    ? mqttHost
    : `${mqttProtocol}://${mqttHost}:${mqttPort}`;

const thingConfig = JSON.stringify({
  host: mqttAddress,
  connectCallback: "reg_callback",
  username: mqttUsername,
  password: token,
});

 const thingLoaded =
  apiPilot.isComponentLoaded(
    ComponentName.Thing
  );

const thingConnected =
  thingLoaded &&
  apiPilot.thingGetConnectState();

console.info(
  "[DJI] Thing state before init:",
  {
    loaded: thingLoaded,
    connected: thingConnected,
  }
);

if (thingConnected) {
  console.info(
    "[DJI] Reusing existing native Thing connection."
  );

  initializeConnectedSession();
  return;
}

apiPilot.loadComponent(
  ComponentName.Thing,
  thingConfig
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