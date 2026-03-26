import { useRoutes } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";

import PrivateLayout from "./components/privateLayout";
import Dashboard from "./pages/dashboard";
import User from "./pages/settings/user";
import Login from "./pages/login";
import UserCreateForm from "./pages/settings/user/create";
import UserEditForm from "./pages/settings/user/[id]/edit";
import Company from "@/pages/settings/company";
import CompanyCreateForm from "@/pages/settings/company/create";
import CompanyEditForm from "@/pages/settings/company/[id]/edit";
import Site from "@/pages/settings/site";
import SiteCreateForm from "@/pages/settings/site/create";
import SiteEditForm from "@/pages/settings/site/[id]/edit";
import Mission from "@/pages/settings/mission";
import MissionCreateForm from "@/pages/settings/mission/create";
import MissionEditForm from "@/pages/settings/mission/[id]/edit";
import Robot from "@/pages/settings/robot";
import RobotCreateForm from "@/pages/settings/robot/create";
import RobotEditForm from "@/pages/settings/robot/[id]/edit";

export default function AppRouter() {
  return useRoutes([
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/",
      element: (
        <ProtectedRoute>
          <PrivateLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          path: "dashboard",
          element: <Dashboard />,
        },
        {
          path: "settings/user",
          element: <User />,
        },
        {
          path: "settings/user/create",
          element: <UserCreateForm />,
        },
        {
          path: "settings/user/:id/edit",
          element: <UserEditForm />,
        },
        { path: "settings/company", element: <Company /> },
        { path: "settings/company/create", element: <CompanyCreateForm /> },
        { path: "settings/company/:id/edit", element: <CompanyEditForm /> },
        { path: "settings/site", element: <Site /> },
        { path: "settings/site/create", element: <SiteCreateForm /> },
        { path: "settings/site/:id/edit", element: <SiteEditForm /> },
        { path: "settings/mission", element: <Mission /> },
        { path: "settings/mission/create", element: <MissionCreateForm /> },
        { path: "settings/mission/:id/edit", element: <MissionEditForm /> },
        { path: "settings/robot", element: <Robot /> },
        { path: "settings/robot/create", element: <RobotCreateForm /> },
        { path: "settings/robot/:id/edit", element: <RobotEditForm /> },
      ],
    },
  ]);
}