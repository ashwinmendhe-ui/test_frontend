/* eslint-disable @typescript-eslint/no-explicit-any */
// pilot-bridge.ts
import { message } from "antd";

declare global {
  interface Window {
    djiBridge?: any;
    reg_callback?: (...args: any[]) => void;
    connectCallback?: (arg: any) => void;
    liveStatusCallback?: (arg: any) => void;
  }
}

interface JsResponse {
  code: number;
  message: string;
  data: any;
}

function parseResponse(value: unknown): JsResponse | null {
  if (typeof value !== "string" || !value) {
    console.error("Invalid DJI bridge response:", value);
    return null;
  }

  try {
    return JSON.parse(value) as JsResponse;
  } catch (error) {
    console.error("Failed to parse DJI bridge response:", value, error);
    return null;
  }
}

function errorHint(response: JsResponse | null): boolean {
  if (!response) {
    message.error("Invalid response from DJI Pilot");
    return false;
  }

  if (response.code !== 0) {
    message.error(response.message || "DJI Pilot request failed");
    console.error(response.message);
    return false;
  }

  return true;
}

function returnBool(value: unknown): boolean {
  const response = parseResponse(value);

  if (!errorHint(response)) {
    return false;
  }

  return Boolean(response?.data);
}

function returnString(value: unknown): string {
  const response = parseResponse(value);

  if (!errorHint(response)) {
    return "";
  }

  return typeof response?.data === "string"
    ? response.data
    : String(response?.data ?? "");
}

export const ComponentName = {
  Api: "api",
  Thing: "thing",
  LiveShare: "liveshare",
} as const;

export type ComponentName =
  (typeof ComponentName)[keyof typeof ComponentName];

const components = new Map<ComponentName, string>();

function getBridge() {
  if (!window.djiBridge) {
    console.warn("djiBridge not found");
    return null;
  }

  return window.djiBridge;
}

export const apiPilot = {
  init() {
    return components;
  },

  getComponentParam(name: ComponentName) {
    return components.get(name);
  },

  setComponentParam(name: ComponentName, value: string) {
    components.set(name, value);
  },

  loadComponent(name: ComponentName, param: string): string {
    const bridge = getBridge();

    if (!bridge) {
      return "";
    }

    return returnString(
      bridge.platformLoadComponent(name, param)
    );
  },

  unloadComponent(name: ComponentName): string {
    const bridge = getBridge();

    if (!bridge) {
      return "";
    }

    return returnString(
      bridge.platformUnloadComponent(name)
    );
  },

  isComponentLoaded(name: ComponentName): boolean {
    const bridge = getBridge();

    if (!bridge) {
      return false;
    }

    return returnBool(
      bridge.platformIsComponentLoaded(name)
    );
  },

  setPlatformMessage(
    platformName: string,
    title: string,
    description: string
  ): boolean {
    const bridge = getBridge();

    if (!bridge) {
      return false;
    }

    return returnBool(
      bridge.platformSetInformation(
        platformName,
        title,
        description
      )
    );
  },

  platformVerifyLicense(
    appId: string,
    appKey: string,
    appLicense: string
  ): boolean {
    const bridge = getBridge();

    if (!bridge) {
      return false;
    }

    return returnBool(
      bridge.platformVerifyLicense(
        appId,
        appKey,
        appLicense
      )
    );
  },

  isPlatformVerifySuccess(): boolean {
    const bridge = getBridge();

    if (!bridge) {
      return false;
    }

    return returnBool(
      bridge.platformIsVerified()
    );
  },

  getRemoteControllerSN(): string {
    const bridge = getBridge();

    if (!bridge) {
      return "";
    }

    return returnString(
      bridge.platformGetRemoteControllerSN()
    );
  },

  setWorkspaceId(workspaceId: string): string {
    const bridge = getBridge();

    if (!bridge) {
      return "";
    }

    return returnString(
      bridge.platformSetWorkspaceId(workspaceId)
    );
  },

  setToken(token: string): string {
    const bridge = getBridge();

    if (!bridge) {
      return "";
    }

    return returnString(
      bridge.apiSetToken(token)
    );
  },

  getToken(): string {
  const bridge = getBridge();

  if (
    !bridge ||
    typeof bridge.apiGetToken !== "function"
  ) {
    console.warn(
      "DJI apiGetToken is unavailable."
    );
    return "";
  }

  return returnString(
    bridge.apiGetToken()
  );
},

  thingConnect(
    username: string,
    password: string,
    callback: string
  ): unknown {
    const bridge = getBridge();

    if (!bridge) {
      return false;
    }

    return bridge.thingConnect(
      username,
      password,
      callback
    );
  },

  thingGetConnectState(): boolean {
    const bridge = getBridge();

    if (!bridge) {
      return false;
    }

    return returnBool(
      bridge.thingGetConnectState()
    );
  },

  setVideoPublishType(type: string): boolean {
    const bridge = getBridge();

    if (!bridge) {
      return false;
    }

    return returnBool(
      bridge.liveshareSetVideoPublishType(type)
    );
  },

  setLiveshareConfig(
    type: number,
    params: string
  ): string {
    const bridge = getBridge();

    if (!bridge) {
      return "";
    }

    return returnString(
      bridge.liveshareSetConfig(type, params)
    );
  },

  startLiveshare(): boolean {
    const bridge = getBridge();

    if (!bridge) {
      return false;
    }

    return returnBool(
      bridge.liveshareStartLive()
    );
  },

  getLiveshareStatus(): unknown {
    const bridge = getBridge();

    if (!bridge) {
      return null;
    }

    const response = parseResponse(
      bridge.liveshareGetStatus()
    );

    if (!errorHint(response)) {
      return null;
    }

    if (typeof response?.data !== "string") {
      return response?.data ?? null;
    }

    try {
      return JSON.parse(response.data);
    } catch {
      return response.data;
    }
  },

  getLiveshareConfig(): string {
    const bridge = getBridge();

    if (!bridge) {
      return "";
    }

    return returnString(
      bridge.liveshareGetConfig()
    );
  },

  getPlatformVersion(): string {
  const bridge = getBridge();

  if (
    !bridge ||
    typeof bridge.platformGetVersion !== "function"
  ) {
    console.warn(
      "DJI platformGetVersion is unavailable."
    );
    return "";
  }

  return returnString(
    bridge.platformGetVersion()
  );
},

getLogPath(): string {
  const bridge = getBridge();

  if (
    !bridge ||
    typeof bridge.platformGetLogPath !== "function"
  ) {
    console.warn(
      "DJI platformGetLogPath is unavailable."
    );
    return "";
  }

  return returnString(
    bridge.platformGetLogPath()
  );
},

registerBackClick(
  callback: () => boolean
): void {
  const bridge = getBridge();

  if (!bridge) {
    return;
  }

  bridge.onBackClick = callback;
},

  registerStopPlatform(
    callback: () => void
  ): void {
    const bridge = getBridge();

    if (!bridge) {
      return;
    }

    bridge.onStopPlatform = callback;
  },
};