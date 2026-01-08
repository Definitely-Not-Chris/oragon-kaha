import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ShiftProvider, useShift } from './contexts/ShiftContext';
import { MainLayout } from './components/layout/MainLayout';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { Toaster } from 'sonner';
import ActivationPage from './pages/ActivationPage';
import LicenseGuard from './components/LicenseGuard';
import { ProductBrowser } from './components/products/ProductBrowser';
import { CheckoutView } from './components/checkout/CheckoutView';
import { SalesHistory } from './components/sales/SalesHistory';
import { InventoryDashboard } from './components/inventory/InventoryDashboard';
import { StockAuditView } from './components/inventory/StockAuditView';
import { ReportsDashboard } from './components/reports/ReportsDashboard';
import { CustomersView } from './components/customers/CustomersView';
import { DashboardPage } from './pages/DashboardPage';
import { Lock } from 'lucide-react';

import { ProductFormPage } from './pages/inventory/ProductFormPage';
import { ShiftHistoryPage } from './pages/finance/ShiftHistoryPage';
import { DiscountManager } from './components/discounts/DiscountManager';
import { SettingsView } from './components/settings/SettingsView';
import { CartProvider } from './lib/useCart';
import { ProtectedRoute } from './components/auth/ProtectedRoute';


const POSRoute = () => {
    const [view, setView] = useState<'BROWSE' | 'CHECKOUT'>('BROWSE');
    const { currentShift, openShift, isShiftEnabled } = useShift();
    const [floatInput, setFloatInput] = useState('');

    // Block access IF shifts are enabled AND no shift is currently open
    if (isShiftEnabled && !currentShift) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="text-amber-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Shift is Closed</h2>
                    <p className="text-gray-500 mb-8">
                        You must open a new shift to start processing sales.
                    </p>

                    <div className="text-left mb-6">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Opening Float Amount</label>
                        <input
                            type="number"
                            value={floatInput}
                            onChange={(e) => setFloatInput(e.target.value)}
                            className="w-full text-xl font-bold p-3 border rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                            placeholder="0.00"
                        />
                    </div>

                    <button
                        onClick={() => openShift(parseFloat(floatInput) || 0)}
                        className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-200"
                    >
                        Open Shift
                    </button>

                    <p className="text-xs text-gray-400 mt-6">
                        Want to view history? <a href="/shifts" className="underline hover:text-gray-600">Go to Shift History</a>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <MainLayout
            onCheckout={() => setView('CHECKOUT')}
            isCheckoutMode={view === 'CHECKOUT'}
            hideRightPanel={view === 'CHECKOUT'}
        >
            {view === 'BROWSE' ? (
                <ProductBrowser />
            ) : (
                <CheckoutView
                    onBack={() => setView('BROWSE')}
                />
            )}
        </MainLayout>
    );
};

// Simple wrapper for other routes that use MainLayout but no hidden panel logic
const DefaultRoute = ({ children }: { children: React.ReactNode }) => {
    return (
        <MainLayout onCheckout={() => { }} hideRightPanel={true}>
            {children}
        </MainLayout>
    );
};

// Wrapper to handle Auth State inside the Provider
const AuthenticatedApp = () => {
    return (
        <ShiftProvider>
            <CartProvider>
                <Routes>
                    <Route path="/activate" element={<ActivationPage />} />
                    <Route path="/*" element={
                        <LicenseGuard>
                            <Routes>
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                <Route path="/dashboard" element={<DefaultRoute><ProtectedRoute permission="VIEW_OWN_HISTORY"><DashboardPage /></ProtectedRoute></DefaultRoute>} />
                                <Route path="/pos" element={<ProtectedRoute permission="PROCESS_SALE"><POSRoute /></ProtectedRoute>} />
                                <Route path="/sales" element={<DefaultRoute><ProtectedRoute permission="VIEW_OWN_HISTORY"><SalesHistory /></ProtectedRoute></DefaultRoute>} />
                                <Route path="/inventory" element={<DefaultRoute><ProtectedRoute permission="MANAGE_INVENTORY"><InventoryDashboard /></ProtectedRoute></DefaultRoute>} />
                                <Route path="/inventory/new" element={<DefaultRoute><ProtectedRoute permission="MANAGE_INVENTORY"><ProductFormPage /></ProtectedRoute></DefaultRoute>} />
                                <Route path="/inventory/edit/:id" element={<DefaultRoute><ProtectedRoute permission="MANAGE_INVENTORY"><ProductFormPage /></ProtectedRoute></DefaultRoute>} />
                                <Route path="/discounts" element={<DefaultRoute><ProtectedRoute permission="MANAGE_DISCOUNTS"><DiscountManager /></ProtectedRoute></DefaultRoute>} />
                                <Route path="/audit" element={<DefaultRoute><ProtectedRoute permission="MANAGE_INVENTORY"><StockAuditView /></ProtectedRoute></DefaultRoute>} />
                                <Route path="/reports" element={<DefaultRoute><ProtectedRoute permission="VIEW_REPORTS"><ReportsDashboard /></ProtectedRoute></DefaultRoute>} />
                                <Route path="/shifts" element={<DefaultRoute><ProtectedRoute permission="OPEN_SHIFT"><ShiftHistoryPage /></ProtectedRoute></DefaultRoute>} />
                                <Route path="/customers" element={<DefaultRoute><ProtectedRoute permission="PROCESS_SALE"><CustomersView /></ProtectedRoute></DefaultRoute>} />
                                <Route path="/settings" element={<DefaultRoute><ProtectedRoute permission="MANAGE_SETTINGS"><SettingsView /></ProtectedRoute></DefaultRoute>} />
                                <Route path="*" element={<Navigate to="/dashboard" replace />} />
                            </Routes>
                        </LicenseGuard>
                    } />
                </Routes>
            </CartProvider>
        </ShiftProvider>
    );
};

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AuthenticatedApp />
                <Toaster />
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App
