import { useAuth } from '../contexts/AuthContext';
import { useShift } from '../contexts/ShiftContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Link, useNavigate } from 'react-router-dom';
import {
    ShoppingBag,
    Package,
    Settings,
    FileText,
    LogOut,
    Play,
    History,
    TrendingUp,
    Users,
    ShoppingCart
} from 'lucide-react';
import { format } from 'date-fns';
import { useEffect } from 'react';
import { api } from '../lib/api';

export const DashboardPage = () => {
    const { currentUser, isAdmin, logout } = useAuth();
    const { currentShift } = useShift();
    const navigate = useNavigate();

    // Auto-Register Terminal if missing (Migration Logic)
    useEffect(() => {
        const checkTerminal = async () => {
            const hasTerminal = localStorage.getItem('vibepos_terminal_id');
            const hasLicense = localStorage.getItem('vibepos_license_key');

            if (!hasTerminal && hasLicense) {
                try {

                    const license = await api.licensing.getMyLicense();
                    if (license && license.organizationId) {
                        const terminal = await api.terminals.register(license.organizationId);
                        localStorage.setItem("vibepos_terminal_id", terminal.terminal_id);
                        localStorage.setItem("vibepos_terminal_name", terminal.name);

                    }
                } catch (e) {
                    console.error("Failed to auto-register terminal", e);
                }
            }
        };
        checkTerminal();
    }, []);

    // Data for Admin Stats (Today)
    const stats = useLiveQuery(async () => {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todaySales = await db.sales
            .where('timestamp')
            .aboveOrEqual(startOfDay)
            .toArray();

        // Calculate Gross Sales (Total Amount)
        // Adjust for refunds/voids if necessary, but basic sum for now
        const grossSales = todaySales
            .filter(s => s.status === 'COMPLETED')
            .reduce((sum, s) => sum + s.total_amount, 0);

        return {
            count: todaySales.length,
            gross: grossSales
        };
    });

    // Recent Transactions for Everyone
    const recentSales = useLiveQuery(() =>
        db.sales.orderBy('timestamp').reverse().limit(5).toArray()
    );

    const menuItems = [
        { label: 'POS Terminal', icon: ShoppingBag, path: '/pos', color: 'bg-blue-500', desc: 'Process Sales' },
        { label: 'Reports', icon: FileText, path: '/reports', color: 'bg-purple-500', desc: 'View Analytics', adminOnly: true },
        { label: 'Inventory', icon: Package, path: '/inventory', color: 'bg-emerald-500', desc: 'Manage Stock', adminOnly: true },
        { label: 'Customers', icon: Users, path: '/customers', color: 'bg-indigo-500', desc: 'CRM Database' },
        { label: 'Settings', icon: Settings, path: '/settings', color: 'bg-gray-500', desc: 'System Config', adminOnly: true },
    ];

    const filteredMenu = menuItems.filter(item => !item.adminOnly || isAdmin);

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Welcome back, {currentUser?.username}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-gray-500">
                            {format(new Date(), 'EEEE, MMMM d, yyyy')}
                        </p>
                        <span className="text-gray-300">•</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {localStorage.getItem('vibepos_terminal_name') || 'Terminal'}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => { logout(); navigate('/login'); }}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors shadow-sm"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>

            {/* Admin Stats Row */}
            {isAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Today's Sales</p>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    ₱{(stats?.gross || 0).toLocaleString()}
                                </h3>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                <ShoppingCart size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Transactions</p>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {stats?.count || 0}
                                </h3>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cashier Focus / Shift Status */}
            {!isAdmin && (
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold mb-1">Shift Status</h2>
                            {currentShift ? (
                                <div className="flex items-center gap-2 text-green-400">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                    Active since {format(new Date(currentShift.start_time), 'h:mm a')}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-gray-400">
                                    <span className="w-2 h-2 bg-gray-500 rounded-full" />
                                    Shift Closed
                                </div>
                            )}
                        </div>
                        <Link
                            to="/pos"
                            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                        >
                            <Play size={20} className="fill-current" />
                            {currentShift ? 'Go to Register' : 'Open Shift'}
                        </Link>
                    </div>
                    {/* Decorative Circle */}
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                </div>
            )}

            {/* Main Action Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {filteredMenu.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all flex flex-col items-center text-center gap-3"
                    >
                        <div className={`w-12 h-12 rounded-xl text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform ${item.color}`}>
                            <item.icon size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{item.label}</h3>
                            <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Recent Activity List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <History size={18} className="text-gray-400" />
                        Recent Transactions
                    </h3>
                    <Link to="/sales" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        View All
                    </Link>
                </div>

                <div className="space-y-4">
                    {recentSales?.map((sale) => (
                        <div key={sale.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${sale.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                    }`}>
                                    <ShoppingBag size={18} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">{sale.invoice_number}</p>
                                    <p className="text-xs text-gray-500">
                                        {format(new Date(sale.timestamp), 'h:mm a')} • {sale.items.length} items
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-900">₱{sale.total_amount.toLocaleString()}</p>
                                <p className="text-xs text-gray-500 uppercase">{sale.payment_method}</p>
                            </div>
                        </div>
                    ))}
                    {recentSales?.length === 0 && (
                        <p className="text-center text-gray-400 text-sm py-4">No recent transactions</p>
                    )}
                </div>
            </div>
        </div>
    );
};
