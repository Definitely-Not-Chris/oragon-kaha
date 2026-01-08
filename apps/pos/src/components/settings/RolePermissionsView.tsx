import { useState, useEffect } from 'react';
import { db } from '../../db';
import { useToast } from '../ui/Toast';
import { Permission } from '@vibepos/shared-types';
import { Shield, Save, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Switch } from '../ui/switch';

type PermissionGroup = {
    title: string;
    description: string;
    permissions: { id: Permission; label: string; description: string }[];
};

const PERMISSION_GROUPS: PermissionGroup[] = [
    {
        title: 'Sales Operations',
        description: 'Control point-of-sale activities and transaction handling.',
        permissions: [
            { id: 'PROCESS_SALE', label: 'Process Sales', description: 'Can access the POS screen and complete transactions.' },
            { id: 'VOID_SALE', label: 'Void Transactions', description: 'Can void items or full orders (High Risk).' },
            { id: 'REFUND_SALE', label: 'Refunds & Returns', description: 'Can process refunds for past transactions.' },
        ]
    },
    {
        title: 'Shift Management',
        description: 'Manage cash drawers and daily closing procedures.',
        permissions: [
            { id: 'OPEN_SHIFT', label: 'Open Shift', description: 'Can start a new shift and count opening float.' },
            { id: 'CLOSE_SHIFT', label: 'Close Shift & Z-Read', description: 'Can close shifts and view daily summaries.' },
            { id: 'VIEW_OWN_HISTORY', label: 'View Own History', description: 'Can see history of sales processed by themselves.' },
        ]
    },
    {
        title: 'Inventory & Products',
        description: 'Manage stock levels and product catalog.',
        permissions: [
            { id: 'MANAGE_INVENTORY', label: 'Manage Inventory', description: 'Can add/edit products and update stock levels.' },
            { id: 'MANAGE_DISCOUNTS', label: 'Manage Discounts', description: 'Can create and modify discount rules.' },
        ]
    },
    {
        title: 'Administration',
        description: 'System-wide settings and user management.',
        permissions: [
            { id: 'VIEW_REPORTS', label: 'View Financial Reports', description: 'Access to Z-Reading and advanced analytics.' },
            { id: 'MANAGE_SETTINGS', label: 'System Settings', description: 'Configure taxes, hardware, and store settings.' },
            { id: 'MANAGE_USERS', label: 'User Management', description: 'Create and edit user accounts and roles.' },
        ]
    }
];

export const RolePermissionsView = () => {
    const { refreshPermissions } = useAuth();
    const { showToast } = useToast();
    const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
    const [selectedRole, setSelectedRole] = useState<'MANAGER' | 'CASHIER'>('MANAGER');
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadPermissions();
    }, []);

    const loadPermissions = async () => {
        try {
            const settings = await db.settings.get('device_settings');
            if (settings && settings.role_permissions) {
                setPermissions(settings.role_permissions);
            }
        } catch (error) {
            console.error('Failed to load permissions', error);
        }
    };

    const handleToggle = (permId: Permission) => {
        const currentRolePerms = permissions[selectedRole] || [];
        const hasPerm = currentRolePerms.includes(permId);

        let newRolePerms;
        if (hasPerm) {
            newRolePerms = currentRolePerms.filter(p => p !== permId);
        } else {
            newRolePerms = [...currentRolePerms, permId];
        }

        setPermissions({
            ...permissions,
            [selectedRole]: newRolePerms
        });
        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            await db.settings.update('device_settings', { role_permissions: permissions });
            await refreshPermissions();
            showToast('Role permissions updated', 'success');
            setHasChanges(false);
        } catch (error) {
            showToast('Failed to save permissions', 'error');
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                        <Shield className="text-vibepos-primary" />
                        Role Access Control
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Define granular access rights for staff roles.</p>
                </div>

                {/* Role Tabs */}
                <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                    {(['MANAGER', 'CASHIER'] as const).map(role => (
                        <button
                            key={role}
                            onClick={() => setSelectedRole(role)}
                            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${selectedRole === role
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-0">
                {PERMISSION_GROUPS.map((group, idx) => (
                    <div key={group.title} className={`p-6 ${idx !== PERMISSION_GROUPS.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <div className="mb-4">
                            <h4 className="font-bold text-gray-900">{group.title}</h4>
                            <p className="text-xs text-gray-500">{group.description}</p>
                        </div>
                        <div className="space-y-4">
                            {group.permissions.map((perm) => {
                                const isEnabled = permissions[selectedRole]?.includes(perm.id);
                                return (
                                    <div key={perm.id} className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-800 text-sm">{perm.label}</p>
                                            <p className="text-xs text-gray-400">{perm.description}</p>
                                        </div>
                                        <Switch
                                            checked={isEnabled}
                                            onCheckedChange={() => handleToggle(perm.id)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer / Save Action */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                    Changes apply immediately after saving. Admins always have full access.
                </p>
                <button
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className={`
                        flex items-center gap-2 px-6 py-2.5 font-bold rounded-xl transition-all shadow-lg
                        ${hasChanges
                            ? 'bg-gray-900 text-white hover:bg-black shadow-gray-200'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                        }
                    `}
                >
                    {hasChanges ? <Save size={18} /> : <Check size={18} />}
                    {hasChanges ? 'Save Changes' : 'Saved'}
                </button>
            </div>
        </div>
    );
};
