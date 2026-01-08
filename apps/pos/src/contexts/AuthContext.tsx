import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '../db';
import { User, Permission } from '@vibepos/shared-types';
import { useToast } from '../components/ui/Toast';
import { hashPin, verifyPin } from '../lib/security';

interface AuthContextType {
    currentUser: User | null;
    login: (pin: string) => Promise<boolean>;
    logout: () => void;
    can: (permission: Permission) => boolean;
    isAdmin: boolean;
    hasPin: boolean; // Helper to show generic PIN pad vs "Create Admin" flow
    refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define Default Permissions for Seeding
const DEFAULT_PERMISSIONS: Record<string, Permission[]> = {
    'SUPER_ADMIN': ['*'] as any,
    'ADMIN': ['*'] as any,
    'MANAGER': [
        'VOID_SALE',
        'REFUND_SALE',
        'MANAGE_INVENTORY',
        'MANAGE_DISCOUNTS',
        'VIEW_REPORTS',
        'CLOSE_SHIFT',
        'OPEN_SHIFT',
        'PROCESS_SALE',
        'VIEW_OWN_HISTORY'
    ],
    'CASHIER': [
        'PROCESS_SALE',
        'OPEN_SHIFT',
        'VIEW_OWN_HISTORY'
    ]
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [rolePermissions, setRolePermissions] = useState<Record<string, Permission[]>>(DEFAULT_PERMISSIONS);
    const [hasPin, setHasPin] = useState(true);
    const { showToast } = useToast();

    // Check if any users exist on mount & Load Permissions
    useEffect(() => {
        checkUsersExist();
        loadPermissions();
    }, []);

    const loadPermissions = async () => {
        try {
            const settings = await db.settings.get('device_settings');
            if (settings && settings.role_permissions) {
                setRolePermissions(settings.role_permissions);
            } else {
                // Seed defaults if missing (either no settings or no permissions)
                if (settings) {
                    await db.settings.update('device_settings', { role_permissions: DEFAULT_PERMISSIONS });
                } else {
                    // Create default settings if they don't exist at all (though SettingsView usually handles this, good to be safe)
                    await db.settings.put({
                        id: 'device_settings',
                        enable_shifts: true,
                        enable_tax_automation: false,
                        tax_rate: 0,
                        tax_name: 'Tax',
                        tax_inclusive: true,
                        enable_service_charge: false,
                        service_charge_rate: 0,
                        currency: 'PHP',
                        receipt_header: 'Welcome to VibePOS',
                        receipt_footer: 'Thank you for your business!',
                        role_permissions: DEFAULT_PERMISSIONS
                    });
                }
                setRolePermissions(DEFAULT_PERMISSIONS);
            }
        } catch (error) {
            console.error('Failed to load permissions', error);
        }
    };

    const refreshPermissions = async () => {
        await loadPermissions();
    };

    const checkUsersExist = async () => {
        const count = await db.users.count();
        if (count === 0) {
            setHasPin(false);
            seedDefaultAdmin();
        } else {
            setHasPin(true);
        }
    };

    const seedDefaultAdmin = async () => {
        try {
            // Double check to prevent race conditions
            const existingAdmin = await db.users.where('username').equals('admin').first();
            if (existingAdmin) return;

            await db.users.add({
                id: crypto.randomUUID(),
                username: 'admin',
                password: await hashPin('1234'), // In real app, hash this!
                role: 'ADMIN',
                full_name: 'Administrator'
            });
            setHasPin(true);

        } catch (e) {
            console.error('Failed to seed admin', e);
        }
    };

    const login = async (pin: string): Promise<boolean> => {
        try {
            // Since PINs are hashed, we can't query by password directly.
            // We must fetch users and verify one by one. 
            // Given the small number of staff (usually < 20), this is fine.
            const users = await db.users.toArray();
            let matchedUser: User | null = null;

            for (const user of users) {
                let isValid = await verifyPin(pin, user.password);

                // Fallback for legacy plain-text PINs (during migration phase)
                if (!isValid && user.password === pin) {
                    console.warn(`User ${user.username} has a legacy plain-text PIN. Allowing login.`);
                    isValid = true;
                    // Optional: Auto-migrate here? For now, just allow access.
                }

                if (isValid) {
                    matchedUser = user;
                    break;
                }
            }

            if (matchedUser) {
                setCurrentUser(matchedUser);
                showToast(`Welcome back, ${matchedUser.full_name || matchedUser.username}!`, 'success');
                return true;
            } else {
                showToast('Invalid PIN', 'error');
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            showToast('Login failed', 'error');
            return false;
        }
    };

    const logout = () => {
        setCurrentUser(null);
    };

    const can = (permission: Permission): boolean => {
        if (!currentUser) return false;
        if (currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') return true;

        const permissions = rolePermissions[currentUser.role] || [];
        return permissions.includes(permission);
    };

    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN';

    return (
        <AuthContext.Provider value={{ currentUser, login, logout, can, isAdmin, hasPin, refreshPermissions }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
