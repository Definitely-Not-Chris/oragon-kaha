import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, CreditCard, Building2, ShieldCheck, Users, LogOut, Monitor, Receipt } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="flex h-screen bg-vibepos-base">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-vibepos-surface text-vibepos-dark flex flex-col">
                <div className="p-6 border-b">
                    <div className="flex items-center gap-3">
                        {/* <div className="h-8 w-8 overflow-hidden rounded-lg bg-transparent">
                            <img src="/logo.png" alt="Oragon Kaha" className="h-full w-full object-contain" />
                        </div> */}
                        <h1 className="text-xl font-bold">
                            <span className="text-vibepos-primary">Oragon Kaha</span> Admin
                        </h1>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <NavLink
                        to="/"
                        className={({ isActive }) =>
                            cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-vibepos-accent text-vibepos-primary"
                                    : "text-vibepos-secondary hover:bg-slate-100 hover:text-vibepos-dark"
                            )
                        }
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        Dashboard
                    </NavLink>

                    {isSuperAdmin && (
                        <>
                            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-vibepos-secondary uppercase tracking-wider">
                                Management
                            </div>

                            <NavLink
                                to="/licenses"
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                        isActive
                                            ? "bg-vibepos-accent text-vibepos-primary"
                                            : "text-vibepos-secondary hover:bg-slate-100 hover:text-vibepos-dark"
                                    )
                                }
                            >
                                <ShieldCheck className="w-5 h-5" />
                                Licenses
                            </NavLink>

                            <NavLink
                                to="/payments"
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                        isActive
                                            ? "bg-vibepos-accent text-vibepos-primary"
                                            : "text-vibepos-secondary hover:bg-slate-100 hover:text-vibepos-dark"
                                    )
                                }
                            >
                                <CreditCard className="w-5 h-5" />
                                Payments
                            </NavLink>

                            <NavLink
                                to="/users"
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                        isActive
                                            ? "bg-vibepos-accent text-vibepos-primary"
                                            : "text-vibepos-secondary hover:bg-slate-100 hover:text-vibepos-dark"
                                    )
                                }
                            >
                                <Users className="w-5 h-5" />
                                Users
                            </NavLink>

                            <NavLink
                                to="/organizations"
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                        isActive
                                            ? "bg-vibepos-accent text-vibepos-primary"
                                            : "text-vibepos-secondary hover:bg-slate-100 hover:text-vibepos-dark"
                                    )
                                }
                            >
                                <Building2 className="w-5 h-5" />
                                Organizations
                            </NavLink>

                            <NavLink
                                to="/terminals"
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                        isActive
                                            ? "bg-vibepos-accent text-vibepos-primary"
                                            : "text-vibepos-secondary hover:bg-slate-100 hover:text-vibepos-dark"
                                    )
                                }
                            >
                                <Monitor className="w-5 h-5" />
                                Terminals
                            </NavLink>
                        </>
                    )}

                    {!isSuperAdmin && (
                        <>
                            <div className="pt-4 pb-2 px-3 text-xs font-semibold text-vibepos-secondary uppercase tracking-wider">
                                My Store
                            </div>

                            <NavLink
                                to="/my-licenses"
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                        isActive
                                            ? "bg-vibepos-accent text-vibepos-primary"
                                            : "text-vibepos-secondary hover:bg-slate-100 hover:text-vibepos-dark"
                                    )
                                }
                            >
                                <ShieldCheck className="w-5 h-5" />
                                My Subscription
                            </NavLink>

                            <NavLink
                                to="/my-payments"
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                        isActive
                                            ? "bg-vibepos-accent text-vibepos-primary"
                                            : "text-vibepos-secondary hover:bg-slate-100 hover:text-vibepos-dark"
                                    )
                                }
                            >
                                <CreditCard className="w-5 h-5" />
                                Payments
                            </NavLink>

                            <NavLink
                                to="/my-transactions"
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                        isActive
                                            ? "bg-vibepos-accent text-vibepos-primary"
                                            : "text-vibepos-secondary hover:bg-slate-100 hover:text-vibepos-dark"
                                    )
                                }
                            >
                                <Receipt className="w-5 h-5" />
                                Transactions
                            </NavLink>

                            <NavLink
                                to="/sync-logs"
                                className={({ isActive }) =>
                                    cn(
                                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                        isActive
                                            ? "bg-vibepos-accent text-vibepos-primary"
                                            : "text-vibepos-secondary hover:bg-slate-100 hover:text-vibepos-dark"
                                    )
                                }
                            >
                                <Monitor className="w-5 h-5" />
                                Sync Logs
                            </NavLink>
                        </>
                    )}
                </nav>

                <div className="p-4 border-t text-xs text-vibepos-secondary text-center">
                    Oragon Kaha Cloud v0.1.0
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="h-16 border-b bg-vibepos-surface px-8 flex items-center justify-between shadow-sm">
                    <h2 className="text-lg font-semibold text-vibepos-dark">Admin Console</h2>
                    <div className="flex items-center gap-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                                    <div className="h-8 w-8 rounded-full flex items-center justify-center font-bold shadow-sm overflow-hidden bg-transparent">
                                        <img src="/logo.png" alt="Oragon Kaha" className="w-full h-full object-cover" />
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user?.username}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={handleLogout}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Log out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
