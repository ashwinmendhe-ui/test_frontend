import {create} from 'zustand'

interface Store {
    isAuthenticated : boolean;
    login: () => void;
    logout: () => void;
}

export const useAuthStore = create<Store>((set) => ({
    isAuthenticated: !!localStorage.getItem("token"),
    login: () => {
        localStorage.setItem("token", "dummy");
        set({ isAuthenticated: true});
    },
    logout: () => {
        localStorage.removeItem("token");
        set({isAuthenticated: false});
    },
}));