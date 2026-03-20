import { useAuthStore } from "../../stores/authStore";

export default function Login(){
    const login = useAuthStore((state) => state.login);
    return (
        <div className="flex-h-screen items-center justify-center">
            <button
            onClick={login}
            className="bg-blue-500 text-white px-4 py-2">
                Login
            </button>
        </div>
    );
}