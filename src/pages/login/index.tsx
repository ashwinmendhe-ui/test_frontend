import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useUserStore } from "../../stores/userStore";


export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login);
  const setUser = useUserStore((state) => state.setUser);

  const handleLogin = () => {
    login();
    setUser({
      username: "Ashwin",
      role: "UserOne"
    });
    navigate("/dashboard")
  };  

  return (
    <div className="flex h-screen items-center justify-center">
      <button
        onClick={handleLogin}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Login
      </button>
    </div>
  );
}