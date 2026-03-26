import { useRoutes } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";

import PrivateLayout from "./components/privateLayout";
import Dashboard from "./pages/dashboard";
import User from "./pages/settings/user";
import Login from "./pages/login";
import UserCreateForm from "./pages/settings/user/create";
import UserEditForm from "./pages/settings/user/[id]/edit";

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
      ],
    },
  ]);
}