/* eslint-disable @typescript-eslint/no-explicit-any */
import { CompatClient, Stomp } from "@stomp/stompjs";
import { useEffect, useRef } from "react";
import SockJS from "sockjs-client";

type CallbackType = (message: any) => void;

export const useWebSocket = (
  endpoint: string,
  topic: string,
  onMessage: CallbackType,
  isStart: boolean
) => {
  const stompClient = useRef<CompatClient | null>(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!isStart || !endpoint || !topic) return;

    const socket = new SockJS(endpoint);
    stompClient.current = Stomp.over(socket);
    stompClient.current.debug = () => {};

    console.log("[WS] connecting endpoint=", endpoint, "topic=", topic);

stompClient.current.connect(
  { Authorization: `Bearer ${token}` },
  () => {
    console.log("[WS] connected topic=", topic);

    stompClient.current?.subscribe(topic, (message) => {
      console.log("[WS] received topic=", topic, "body=", message.body);

      if (message.body) {
        onMessage(JSON.parse(message.body));
      }
    });
  },
  (error: unknown) => {
    console.error("[WS] connection error:", error);
  }
);

    return () => {
      stompClient.current?.disconnect();
    };
  }, [endpoint, topic, token, onMessage, isStart]);
};