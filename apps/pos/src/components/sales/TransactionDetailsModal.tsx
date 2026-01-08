import { Sale } from '@vibepos/shared-types';
import { X, Printer, CheckCircle, Clock, XCircle, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../db';
import { useToast } from '../ui/Toast';
import { useCurrency } from '../../lib/useCurrency';

interface TransactionDetailsModalProps {
    sale: Sale | null;
    onClose: () => void;
}

export const TransactionDetailsModal = ({ sale, onClose }: TransactionDetailsModalProps) => {
    const { showToast } = useToast();
    const { formatPrice } = useCurrency();

    if (!sale) return null;

    const isToday = new Date(sale.timestamp).toDateString() === new Date().toDateString();

    const handleVoid = async () => {
        if (!sale.id) return;
        if (confirm('Are you sure you want to VOID this transaction? This cannot be undone.')) {
            await db.sales.update(sale.id, { status: 'VOIDED', synced: false });
            showToast('Transaction voided successfully', 'success');
            onClose();
        }
    };

    const handleRefund = async () => {
        if (!sale.id) return;
        if (confirm('Process full refund for this transaction?')) {
            await db.sales.update(sale.id, { status: 'REFUNDED', synced: false });
            showToast('Refund processed successfully', 'success');
            onClose();
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="bg-gray-50 border-b border-gray-200 p-6 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Transaction Details</h2>
                            <p className="text-sm text-gray-500 font-mono">Invoice #{sale.invoice_number || sale.id?.substring(0, 8)}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content (Scrollable) */}
                    <div className="flex-1 overflow-y-auto p-8 bg-gray-100 flex gap-8">
                        {/* Digital Receipt Preview */}
                        <div className="w-full max-w-sm mx-auto bg-white shadow-md p-6 text-sm font-mono relative">
                            {/* Receipt Edge Effect (Top) */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-gray-200 to-transparent opacity-50" />

                            {/* Store Header */}
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 flex items-center justify-center rounded-lg mx-auto mb-3 overflow-hidden">
                                    <img src="/logo.png" alt="Oragon Kaha Logo" className="w-full h-full object-cover" />
                                </div>
                                <h3 className="font-bold text-lg uppercase">Oragon Kaha Store</h3>
                                <p className="text-gray-500 text-xs">Based in New York, NY</p>
                                <p className="text-gray-500 text-xs">{new Date(sale.timestamp).toLocaleString()}</p>
                            </div>

                            {/* Divider */}
                            <div className="border-b-2 border-dashed border-gray-300 my-4" />

                            {/* Items */}
                            <div className="space-y-2 mb-4">
                                {sale.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between">
                                        <span>{item.quantity}x {item.name}</span>
                                        <span>{formatPrice(item.price_at_sale * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Divider */}
                            <div className="border-b-2 border-dashed border-gray-300 my-4" />

                            {/* Subtotals & Tax */}
                            {/* Subtotals */}
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Subtotal</span>
                                <span>{formatPrice(sale.subtotal_amount || (sale.total_amount - (sale.tax_amount || 0)))}</span>
                            </div>

                            {sale.discount_amount && (
                                <div className="flex justify-between text-xs text-green-600 font-bold mb-1">
                                    <span>Discount ({sale.discount_name})</span>
                                    <span>-{formatPrice(sale.discount_amount)}</span>
                                </div>
                            )}

                            {/* Tax */}
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>{sale.tax_name || 'Tax'} {sale.tax_rate_snapshot ? `(${sale.tax_rate_snapshot}%)` : ''}</span>
                                <span>{formatPrice(sale.tax_amount || 0)}</span>
                            </div>

                            {/* Service Charge */}
                            {(sale.service_charge_amount || 0) > 0 && (
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>Service Charge</span>
                                    <span>{formatPrice(sale.service_charge_amount || 0)}</span>
                                </div>
                            )}

                            {/* Statutory Details */}
                            {sale.discount_info?.id_number && (
                                <div className="mb-4 bg-gray-50 p-2 rounded border border-gray-200 text-xs">
                                    <p className="font-bold text-gray-700">Statutory Details</p>
                                    <p>ID: {sale.discount_info.id_number}</p>
                                    <p>Name: {sale.discount_info.holder_name}</p>
                                </div>
                            )}

                            {/* Totals */}
                            <div className="flex justify-between font-bold text-lg">
                                <span>TOTAL</span>
                                <span>{formatPrice(sale.total_amount)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500 text-xs mt-1">
                                <span>Payment Method</span>
                                <span>{sale.payment_method}</span>
                            </div>

                            <div className="flex justify-between text-gray-500 text-xs mt-1">
                                <span>Customer</span>
                                <span>{sale.customer_name || 'Walk-in'}</span>
                            </div>

                            {/* Footer */}
                            <div className="mt-8 text-center text-xs text-gray-400">
                                <p>Invoice #: {sale.invoice_number}</p>
                                <p className="mt-2">Thank you for vibing with us!</p>
                            </div>

                            {/* Receipt Edge Effect (Bottom) */}
                            <div className="absolute bottom-0 left-0 right-0 h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCAxMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+PHBhdGggZD0iTTAgMTBMMTAgMEwyMCAxMEgwWiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=')] bg-repeat-x bg-[length:20px_10px]" />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-white p-6 border-t border-gray-200 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            {sale.synced ? (
                                <span className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold">
                                    <CheckCircle size={14} /> Synced to Cloud
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-xs font-bold">
                                    <Clock size={14} /> Saved Offline (Pending Sync)
                                </span>
                            )}
                        </div>
                        <button className="flex items-center gap-2 px-6 py-3 bg-vibepos-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200">
                            <Printer size={18} />
                            Print Receipt
                        </button>

                        {/* Actions for valid sales only (not already voided/refunded) */}
                        {(sale.status !== 'VOIDED' && sale.status !== 'REFUNDED') && (
                            <div className="flex gap-2">
                                {isToday && (
                                    <button
                                        onClick={handleVoid}
                                        className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
                                    >
                                        <XCircle size={18} />
                                        Void
                                    </button>
                                )}
                                <button
                                    onClick={handleRefund}
                                    className="flex items-center gap-2 px-4 py-3 bg-orange-50 text-orange-600 font-bold rounded-xl hover:bg-orange-100 transition-colors"
                                >
                                    <RefreshCcw size={18} />
                                    Refund
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
