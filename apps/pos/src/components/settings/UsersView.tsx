import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Trash2, UserPlus, Shield, User as UserIcon, Key } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { hashPin } from '../../lib/security';
import { ChangePinModal } from './ChangePinModal';

export const UsersView = () => {
    const { currentUser, can } = useAuth();
    const { showToast } = useToast();
    const users = useLiveQuery(() => db.users.toArray());

    const [isAdding, setIsAdding] = useState(false);
    const [userToChangePin, setUserToChangePin] = useState<{ id: string; username: string } | null>(null);

    // Form State
    const [newUser, setNewUser] = useState({
        username: '',
        full_name: '',
        role: 'CASHIER' as const,
        password: ''
    });

    const handleAddUser = async () => {
        if (!newUser.username || !newUser.password) {
            showToast('Username and PIN are required', 'error');
            return;
        }

        if (newUser.password.length !== 4) {
            showToast('PIN must be exactly 4 digits', 'error');
            return;
        }

        try {
            // Check for duplicate Username
            const existingUser = await db.users.where('username').equals(newUser.username).first();
            if (existingUser) {
                showToast('Username already exists', 'error');
                return;
            }

            const hashedPin = await hashPin(newUser.password);

            await db.users.add({
                id: crypto.randomUUID(),
                username: newUser.username,
                full_name: newUser.full_name || newUser.username,
                role: newUser.role as any,
                password: hashedPin,
            });

            showToast('User created successfully', 'success');
            setIsAdding(false);
            setNewUser({
                username: '',
                full_name: '',
                role: 'CASHIER',
                password: ''
            });
        } catch (error) {
            console.error('Failed to add user', error);
            showToast('Failed to create user', 'error');
        }
    };

    const handleResetUsers = async () => {
        if (!confirm('WARNING: This will delete ALL users and reset to the default "admin" (1234). Are you sure?')) return;

        try {
            await db.users.clear();
            await db.users.add({
                id: crypto.randomUUID(),
                username: 'admin',
                password: await hashPin('1234'),
                role: 'ADMIN',
                full_name: 'Administrator'
            });
            showToast('User database reset to default', 'success');
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            showToast('Failed to reset users', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this user?')) return;
        try {
            await db.users.delete(id);
            showToast('User removed', 'success');
        } catch (error) {
            showToast('Failed to remove user', 'error');
        }
    };

    if (!can('MANAGE_USERS')) {
        return (
            <div className="p-8 text-center bg-gray-50 rounded-xl">
                <p className="text-red-500 font-bold">Access Denied</p>
                <p className="text-gray-500">You do not have permission to manage users.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">User Management</h2>
                    <p className="text-sm text-gray-500">Manage staff access and roles.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleResetUsers}
                        className="px-4 py-2 bg-red-100 text-red-700 font-bold text-xs rounded-lg hover:bg-red-200 transition-all uppercase tracking-wider"
                    >
                        Reset All Users
                    </button>
                    {!isAdding && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="px-4 py-2 bg-gray-900 text-white font-bold text-sm rounded-lg hover:bg-black transition-all flex items-center gap-2"
                        >
                            <UserPlus size={16} /> Add User
                        </button>
                    )}
                </div>
            </div>

            {isAdding && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-900">New User</h3>
                        <button
                            onClick={() => setIsAdding(false)}
                            className="text-sm text-gray-500 hover:text-gray-900"
                        >
                            Cancel
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Username</label>
                            <input
                                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newUser.username}
                                onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                                placeholder="e.g. johndoe"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name</label>
                            <input
                                className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newUser.full_name}
                                onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
                                placeholder="e.g. John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Role</label>
                            <select
                                className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newUser.role}
                                onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}
                            >
                                <option value="CASHIER">Cashier</option>
                                <option value="MANAGER">Manager</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">PIN Code</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                className="w-full p-2 text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newUser.password}
                                onChange={e => setNewUser({ ...newUser, password: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                placeholder="4 digits"
                                maxLength={4}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={handleAddUser}
                            className="px-6 py-2 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 shadow-sm"
                        >
                            Create Account
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users?.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                                            ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}
                                        `}>
                                            {user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? <Shield size={14} /> : <UserIcon size={14} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{user.full_name || user.username} {user.id === currentUser?.id && '(You)'}</p>
                                            <p className="text-xs text-gray-500">{user.username}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-block px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide
                                        ${user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}
                                    `}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => setUserToChangePin({ id: user.id!, username: user.username })}
                                            className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                            title="Change PIN"
                                        >
                                            <Key size={16} />
                                        </button>
                                        {user.id !== currentUser?.id && user.username !== 'admin' && (
                                            <button
                                                onClick={() => handleDelete(user.id!)}
                                                className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                title="Delete User"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users?.length === 0 && (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        No users found.
                    </div>
                )}
            </div>

            {userToChangePin && (
                <ChangePinModal
                    userId={userToChangePin.id}
                    username={userToChangePin.username}
                    onClose={() => setUserToChangePin(null)}
                />
            )}
        </div>
    );
};
