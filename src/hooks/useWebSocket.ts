/* eslint-disable @typescript-eslint/no-explicit-any */
import { CompatClient, Stomp } from "@stomp/stompjs";
import { useEffect, useRef } from "react";
import SockJS from "sockjs-client";

type CallbackType = (message: any) => void;

export const useWebSocket = (
  endpoint: string,
  topic: string,
  onMessage: CallbackType,
  isStart: boolean,
  onReconnect?: () => void
) => {
  const stompClient = useRef<CompatClient | null>(null);
  const reconnectTimer = useRef<number | null>(null);
  const isUnmounted = useRef(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!isStart || !endpoint || !topic) return;

    isUnmounted.current = false;

    const clearReconnectTimer = () => {
      if (reconnectTimer.current) {
        window.clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (isUnmounted.current || reconnectTimer.current) return;

      reconnectTimer.current = window.setTimeout(() => {
        reconnectTimer.current = null;
        connect();
      }, 5000);
    };

    const connect = () => {
      if (isUnmounted.current) return;

      try {
        const socket = new SockJS(endpoint);
        const client = Stomp.over(socket);

        client.debug = () => {};
        stompClient.current = client;


        client.connect(
          { Authorization: `Bearer ${token}` },
          () => {

            clearReconnectTimer();

            // onReconnect?.();

            client.subscribe(topic, (message) => {

              if (message.body) {
                onMessage(JSON.parse(message.body));
              }
            });
          },
          (error: unknown) => {
            console.error("[WS] connection error:", error);
            scheduleReconnect();
          }
        );

        socket.onclose = () => {
          console.warn("[WS] socket closed. reconnecting topic=", topic);
          scheduleReconnect();
        };
      } catch (error) {
        console.error("[WS] connect exception:", error);
        scheduleReconnect();
      }
    };

    connect();

    return () => {
      isUnmounted.current = true;
      clearReconnectTimer();

      try {
        stompClient.current?.disconnect();
      } catch {
        // ignore disconnect errors
      }

      stompClient.current = null;
    };
  }, [endpoint, topic, token, onMessage, isStart, onReconnect]);
};