import { Store, ShoppingBag, BarChart3, Settings, Users, Receipt, CheckCircle, FileText, Percent, DollarSign, Clock, Lock } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useShift } from '../../contexts/ShiftContext';
import { ShiftManagementModal } from '../finance/ShiftManagementModal';
import { useCurrency } from '../../lib/useCurrency';
import { useAuth } from '../../contexts/AuthContext';

import { Permission } from '@vibepos/shared-types';
import { SyncStatus } from '../common/SyncStatus';

export const SidebarNav = () => {
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const { currentShift, isShiftEnabled } = useShift();
    const { formatPrice } = useCurrency();
    const { currentUser, logout, can } = useAuth();

    const menuItems: { icon: any; label: string; path: string; permission?: Permission }[] = [
        { icon: BarChart3, label: 'Dashboard', path: '/', permission: 'VIEW_REPORTS' },
        { icon: ShoppingBag, label: 'POS', path: '/pos', permission: 'PROCESS_SALE' },
        { icon: Receipt, label: 'Transactions', path: '/sales', permission: 'VIEW_OWN_HISTORY' },
        ...(isShiftEnabled ? [{ icon: Clock, label: 'Shifts', path: '/shifts', permission: 'OPEN_SHIFT' as Permission }] : []),
        { icon: Store, label: 'Inventory', path: '/inventory', permission: 'MANAGE_INVENTORY' },
        { icon: Percent, label: 'Discounts', path: '/discounts', permission: 'MANAGE_DISCOUNTS' },
        { icon: CheckCircle, label: 'Auditing', path: '/audit', permission: 'MANAGE_INVENTORY' },
        { icon: FileText, label: 'Reports', path: '/reports', permission: 'VIEW_REPORTS' },
        { icon: Users, label: 'Customers', path: '/customers', permission: 'PROCESS_SALE' }, // Both can usually view customers
        { icon: Settings, label: 'Settings', path: '/settings', permission: 'MANAGE_SETTINGS' as Permission },
    ];

    const filteredItems = menuItems.filter(item => !item.permission || can(item.permission));

    return (
        <nav className="h-full w-20 sm:w-64 bg-vibepos-surface border-r border-gray-200 flex flex-col justify-between py-6 transition-all duration-300 z-50">
            <div>
                <div className="px-6 mb-8 flex items-center gap-3">
                    {/* <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                        <img src="/logo.png" alt="Oragon Kaha Logo" className="w-full h-full object-cover" />
                    </div> */}
                    <h1 className="text-xl font-bold">
                        <span className="text-vibepos-primary">Oragon Kaha</span> POS
                    </h1>
                </div>

                {/* Terminal Identity */}
                <div className="px-6 mb-6 hidden sm:block">
                    <div className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-1 rounded-md inline-block border border-gray-200 uppercase tracking-wider">
                        {localStorage.getItem('vibepos_terminal_name') || 'Unregistered'}
                    </div>
                </div>

                <ul className="space-y-1">
                    {filteredItems.map((item) => (
                        <li key={item.label}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) => `
                                    w-full px-6 py-3 flex items-center gap-3 transition-colors relative
                                    ${isActive
                                        ? 'text-vibepos-primary bg-blue-50 font-medium'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                    }
                                `}
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-vibepos-primary rounded-r-full" />
                                        )}
                                        <item.icon className={`w-5 h-5 ${isActive ? 'text-vibepos-primary' : 'text-gray-400'}`} />
                                        <span className="hidden sm:block text-sm">{item.label}</span>
                                    </>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </div>


            <div className="px-6 flex flex-col gap-4">

                <SyncStatus />

                {isShiftEnabled && (
                    <button
                        onClick={() => setIsShiftModalOpen(true)}
                        className={`
                        w-full p-3 rounded-xl border flex items-center gap-3 transition-colors text-left
                        ${currentShift
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100'
                            }
                    `}
                    >
                        <div className={`p-1.5 rounded-lg ${currentShift ? 'bg-emerald-200' : 'bg-amber-200'}`}>
                            <DollarSign size={16} className={currentShift ? 'text-emerald-800' : 'text-amber-800'} />
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-xs font-bold uppercase">{currentShift ? 'Shift Open' : 'Shift Closed'}</p>
                            <p className="text-[10px] opacity-80">
                                {currentShift
                                    ? `Exp: ${formatPrice(currentShift.expected_cash || 0)}`
                                    : 'Tap to open'
                                }
                            </p>
                        </div>
                    </button>
                )}

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 relative group">
                    <div className="w-8 h-8 rounded-full bg-vibepos-primary/10 flex items-center justify-center text-vibepos-primary font-bold">
                        {currentUser?.username.charAt(0).toUpperCase()}
                    </div>

                    <div className="hidden sm:block flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{currentUser?.full_name || currentUser?.username}</p>
                        <p className="text-[10px] text-gray-500 capitalize">{currentUser?.role.replace('_', ' ').toLowerCase()}</p>
                    </div>

                    <button
                        onClick={logout}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Lock Screen"
                    >
                        <Lock size={14} />
                    </button>
                </div>
            </div>

            <ShiftManagementModal
                isOpen={isShiftModalOpen}
                onClose={() => setIsShiftModalOpen(false)}
            />
        </nav>
    );
};
