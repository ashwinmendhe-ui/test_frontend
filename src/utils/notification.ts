import { notification } from "antd";

type NotificationType = "success" | "error" | "info" | "warning";

interface NotificationConfig {
  title: string;
  description: string;
  placement?: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
  duration?: number;
}

export const showNotification = (
  type: NotificationType,
  title: string,
  description: string,
  placement: NotificationConfig["placement"] = "topRight",
  duration: number = 3
) => {
  notification[type]({
    title,
    description,
    placement,
    duration,
  });
};