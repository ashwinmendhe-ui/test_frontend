import { useRoutes } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";

import PrivateLayout from "./components/privateLayout";
import Dashboard from "./pages/dashboard";
import User from "./pages/settings/user";
import Login from "./pages/login";

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
      ],
    },
  ]);
}