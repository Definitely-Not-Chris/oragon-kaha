import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Permission } from '@vibepos/shared-types';
import { Lock } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    permission: Permission;
}

export const ProtectedRoute = ({ children, permission }: ProtectedRouteProps) => {
    const { can, currentUser } = useAuth();
    const location = useLocation();

    if (!currentUser) {
        // Redirect to login, but save the location we were trying to go to
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Admin override is handled inside can(), but explicit check here is fine too
    if (!can(permission)) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <Lock className="text-red-500" size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
                <p className="text-gray-500 max-w-sm mb-6">
                    You don't have permission to access this area. Please contact your manager.
                </p>
                <a href="/pos" className="px-6 py-2 bg-gray-900 text-white rounded-lg font-bold hover:bg-black transition-colors">
                    Back to POS
                </a>
            </div>
        );
    }

    return <>{children}</>;
};
