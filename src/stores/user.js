// Import create dari zustand
import { create } from "zustand";

// Import layanan API
import Api from "../services/api";

// Import js-cookie
import Cookies from "js-cookie";

export const useStore = create((set, get) => ({
    // State
    user: Cookies.get("user") ? JSON.parse(Cookies.get("user")) : {}, // Parse JSON jika cookie ada
    token: Cookies.get("token") || "",

    // Action login
    login: async(credentials) => {
        // Fetch API
        const response = await Api.post("/api/login", credentials);

        // Set state user
        set({ user: response.data.data.user });
        // Set state token
        set({ token: response.data.data.token });

        // Set cookies
        Cookies.set("user", JSON.stringify(response.data.data.user));
        Cookies.set("token", response.data.data.token);
    },

    //action logout
    logout: () => {
        // Clear cookies
        Cookies.remove("user");
        Cookies.remove("token");
        // Clear state
        set({ user: {}, token: "" });
    },

    // Helper: Get user role name
    getUserRoleName: () => {
        const { user } = get();
        return user.role?.name || "";
    },

    // Helper: Get user role ID
    getUserRoleId: () => {
        const { user } = get();
        return user.role?.id || null;
    },

    // Helper: Check if user has specific role
    hasRole: (roleName) => {
        const { user } = get();
        return user.role?.name === roleName;
    },

    // Helper: Check if user is authenticated
    isAuthenticated: () => {
        const { token, user } = get();
        return !!token && Object.keys(user).length > 0;
    },

    // Helper: Get user info
    getUserInfo: () => {
        const { user } = get();
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role?.name,
            roleId: user.role?.id,
            nik: user.nik,
            phone: user.phone,
            gender: user.gender,
            alamat: user.alamat,
            isActive: user.is_active
        };
    }
}));