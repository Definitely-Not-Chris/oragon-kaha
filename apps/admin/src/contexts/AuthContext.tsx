import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";

interface User {
    id: string;
    username: string;
    role: "SUPER_ADMIN" | "ADMIN" | "CASHIER";
    organizationId: string | null;
    fullName: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem("vibepos_admin_token");
            const storedUser = localStorage.getItem("vibepos_admin_user");

            if (storedToken) {
                setToken(storedToken);
                if (storedUser) {
                    setUser(JSON.parse(storedUser)); // Optimistic load
                }

                try {
                    // Refresh Profile from Server (to get latest Organization Link)
                    const freshUser = await api.getMe();
                    setUser(freshUser);
                    localStorage.setItem("vibepos_admin_user", JSON.stringify(freshUser));
                } catch (error) {
                    console.error("Session expired or invalid", error);
                    // If simple network error, maybe don't logout?
                    // But if 401, we should. For now, let's keep logged in but warn,
                    // unless catch logic in api.ts throws specifically.
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem("vibepos_admin_token", newToken);
        localStorage.setItem("vibepos_admin_user", JSON.stringify(newUser));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("vibepos_admin_token");
        localStorage.removeItem("vibepos_admin_user");
    };

    if (loading) return null; // Or a splash screen

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
