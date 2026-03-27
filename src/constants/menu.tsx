import HomeIcon from "../assets/home.svg";
import StreamIcon from "../assets/stream.svg";
import PlaybackIcon from "../assets/playback.svg";
import SettingIcon from "../assets/setting.svg";
import UserIcon from "../assets/user-icon.svg";
import CompanyIcon from "../assets/company.svg";
import SiteIcon from "../assets/site.svg";
import MissionIcon from "../assets/mission.svg";
import RobotIcon from "../assets/robot-icon.svg";
import HistoryIcon from "../assets/file-icon.svg";

export const menuItems = [
  {
    key: "/dashboard",
    icon: <img src={HomeIcon} alt="" className="w-5" />,
    labelKey: "menu_home",
  },
  {
    key: "/stream",
    icon: <img src={StreamIcon} alt="" className="w-5" />,
    labelKey: "menu_work",
  },
  {
    key: "/playback",
    icon: <img src={PlaybackIcon} alt="" className="w-5" />,
    labelKey: "menu_playback",
  },
  {
    key: "/history",
    icon: <img src={HistoryIcon} alt="" className="w-5" />,
    labelKey: "menu_history",
  },
  {
    key: "/settings",
    icon: <img src={SettingIcon} alt="" className="w-5" />,
    labelKey: "menu_settings",
    children: [
      {
        key: "/settings/company",
        icon: <img src={CompanyIcon} alt="" className="w-4" />,
        labelKey: "menu_settings_company",
      },
      {
        key: "/settings/site",
        icon: <img src={SiteIcon} alt="" className="w-4" />,
        labelKey: "menu_settings_site",
      },
      {
        key: "/settings/mission",
        icon: <img src={MissionIcon} alt="" className="w-4" />,
        labelKey: "menu_settings_mission",
      },
      {
        key: "/settings/robot",
        icon: <img src={RobotIcon} alt="" className="w-4" />,
        labelKey: "menu_settings_robot",
      },
      {
        key: "/settings/user",
        icon: <img src={UserIcon} alt="" className="w-4" />,
        labelKey: "menu_settings_user",
      },
    ],
  },
];