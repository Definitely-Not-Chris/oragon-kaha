import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
    allowedRoles?: ("SUPER_ADMIN" | "ADMIN" | "CASHIER" | "STORE_OWNER" | "MANAGER")[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // User is logged in but doesn't have permission
        // For now, redirect to dashboard which might show a limited view or 403
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
