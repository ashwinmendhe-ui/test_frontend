import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);

  const handleLogin = async () => {
    const result = await login({
      email: "sysadmin@dhive.vn",
      password: "123456",
    });

    if (result?.token) {
      navigate("/dashboard");
    } else {
      alert(result?.message || "Login failed");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <button
        onClick={handleLogin}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </div>
  );
}