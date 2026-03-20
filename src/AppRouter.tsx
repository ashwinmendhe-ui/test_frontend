import { useRoutes } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import PrivateLayout from "./components/PrivateLayout";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";


export default function AppRouter() {
    return useRoutes([
        {
            path: "/login",
            element: <Login/>,
        },
        {
            element: (
                <ProtectedRoute>
                    <PrivateLayout/>
                </ProtectedRoute>
            ),
            children: [
                {
                    path: "/dashboard",
                    element: <Dashboard/>
                },
            ]
        }
    ]);
}