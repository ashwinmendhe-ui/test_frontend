import HomeIcon from "../assets/home.svg";
import StreamIcon from "../assets/stream.svg";
import PlaybackIcon from "../assets/playback.svg";
import SettingIcon from "../assets/setting.svg";
import UserIcon from "../assets/user-icon.svg";
import CompanyIcon from "../assets/company.svg";
import SiteIcon from "../assets/site.svg";
import MissionIcon from "../assets/mission.svg";
import RobotIcon from "../assets/robot-icon.svg";
import HistoryIcon from "../assets/log.svg";
import KPIIcon from "../assets/dashboard.svg";

const menuIcon = (src: string) => (
  <span
    style={{
      width: 18,
      height: 18,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <img
      src={src}
      alt=""
      style={{
        width: 16,
        height: 16,
        display: "block",
        objectFit: "contain",
      }}
    />
  </span>
);

const subMenuIcon = (src: string) => (
  <span
    style={{
      width: 18,
      height: 18,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <img
      src={src}
      alt=""
      style={{
        width: 15,
        height: 15,
        display: "block",
        objectFit: "contain",
      }}
    />
  </span>
);

export const menuItems = [
  {
    key: "/dashboard",
    icon: menuIcon(HomeIcon),
    labelKey: "menu_home",
  },
  {
    key: "/stream",
    icon: menuIcon(StreamIcon),
    labelKey: "menu_work",
  },
  {
    key: "/playback",
    icon: menuIcon(PlaybackIcon),
    labelKey: "menu_playback",
  },
  {
    key: "/kpi",
    icon: menuIcon(KPIIcon),
    labelKey: "menu_kpi_dashboard",
  },
  {
    key: "/history",
    icon: menuIcon(HistoryIcon),
    labelKey: "menu_history",
  },
  {
    key: "/settings",
    icon: menuIcon(SettingIcon),
    labelKey: "menu_settings",
    children: [
      {
        key: "/settings/company",
        icon: subMenuIcon(CompanyIcon),
        labelKey: "menu_settings_company",
      },
      {
        key: "/settings/site",
        icon: subMenuIcon(SiteIcon),
        labelKey: "menu_settings_site",
      },
      {
        key: "/settings/mission",
        icon: subMenuIcon(MissionIcon),
        labelKey: "menu_settings_mission",
      },
      {
        key: "/settings/robot",
        icon: subMenuIcon(RobotIcon),
        labelKey: "menu_settings_robot",
      },
      {
        key: "/settings/user",
        icon: subMenuIcon(UserIcon),
        labelKey: "menu_settings_user",
      },
    ],
  },
];