import "antd/dist/reset.css"
import HomeIcon from "../assets/home.svg";
import StreamIcon from "../assets/stream.svg";
import SettingIcon from "../assets/setting.svg";
import UserIcon from "../assets/user-icon.svg";


export const menuItems = [
  {
    key: "/dashboard",
    icon: <img src={HomeIcon} className="w-5" />,
    label: "Dashboard",
  },
  {
    key: "/stream",
    icon: <img src={StreamIcon} className="w-5" />,
    label: "Stream",
  },
  {
    key: "/settings",
    icon: <img src={SettingIcon} className="w-5" />,
    label: "Settings",
    children: [
      {
        key: "/settings/user",
        icon: <img src={UserIcon} className="w-4" />,
        label: "User Management",
      },
    ],
  },
];