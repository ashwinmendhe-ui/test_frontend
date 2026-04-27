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

    stompClient.current.connect(
      { Authorization: `Bearer ${token}` },
      () => {
        stompClient.current?.subscribe(topic, (message) => {
          if (message.body) {
            onMessage(JSON.parse(message.body));
          }
        });
      },
      (error: unknown) => {
        console.error("WebSocket connection error:", error);
      }
    );

    return () => {
      stompClient.current?.disconnect();
    };
  }, [endpoint, topic, token, onMessage, isStart]);
};