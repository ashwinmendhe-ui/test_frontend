import {create} from "zustand"
interface UserState {
    user: {
        username: string;
        role: string;
    } | null;
    setUser: (user: {username: string; role: string}) => void;
    clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    setUser: (user) => set({user}),
    clearUser: () => set({user:null}),
}
));
