import HomeIcon from "../assets/home.svg";
import StreamIcon from "../assets/stream.svg";
import SettingIcon from "../assets/setting.svg";
import UserIcon from "../assets/user-icon.svg";
import CompanyIcon from "../assets/company.svg";
import SiteIcon from "../assets/site.svg";
import MissionIcon from "../assets/mission.svg";
import RobotIcon from "../assets/robot-icon.svg";

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
        key: "/settings/company",
        icon: <img src={CompanyIcon} className="w-4" />,
        label: "Company Management",
      },
      {
        key: "/settings/site",
        icon: <img src={SiteIcon} className="w-4" />,
        label: "Site Management",
      },
      {
        key: "/settings/mission",
        icon: <img src={MissionIcon} className="w-4" />,
        label: "Mission Management",
      },
      {
        key: "/settings/robot",
        icon: <img src={RobotIcon} className="w-4" />,
        label: "Robot Management",
      },
      {
        key: "/settings/user",
        icon: <img src={UserIcon} className="w-4" />,
        label: "User Management",
      },
    ],
  },
];