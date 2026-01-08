import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "@/layouts/AdminLayout";
import Dashboard from "@/pages/Dashboard";
import Licenses from "@/pages/Licenses";
import Payments from "@/pages/Payments";
import Stores from "@/pages/Stores";
import Users from "@/pages/Users";
import Terminals from "@/pages/Terminals";
import ClientLicenses from "@/pages/ClientLicenses";
import ClientPayments from "@/pages/ClientPayments";
import ClientTransactions from "@/pages/ClientTransactions";
import SyncLogs from "./pages/SyncLogs";

import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "@/pages/Login";

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route element={<ProtectedRoute />}>
                        <Route element={<AdminLayout />}>
                            <Route path="/" element={<Dashboard />} />

                            <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
                                <Route path="/licenses" element={<Licenses />} />
                                <Route path="/payments" element={<Payments />} />
                                <Route path="/organizations" element={<Stores />} />
                                <Route path="/users" element={<Users />} />
                                <Route path="/terminals" element={<Terminals />} />
                            </Route>

                            {/* Store Owner Routes */}
                            <Route element={<ProtectedRoute allowedRoles={["ADMIN", "SUPER_ADMIN", "STORE_OWNER"]} />}>
                                <Route path="/my-licenses" element={<ClientLicenses />} />
                                <Route path="/my-payments" element={<ClientPayments />} />
                                <Route path="/my-transactions" element={<ClientTransactions />} />
                                <Route path="/sync-logs" element={<SyncLogs />} />
                            </Route>

                            {/* Admin Diagnostics */}
                            <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
                            </Route>

                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Route>
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
