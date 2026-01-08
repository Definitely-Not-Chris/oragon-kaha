import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Download } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

interface StockAuditHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const StockAuditHistoryModal = ({ isOpen, onClose }: StockAuditHistoryModalProps) => {
    const audits = useLiveQuery(() =>
        isOpen ? db.stock_audits.reverse().sortBy('timestamp') : [],
        [isOpen]
    );

    const handleExportCsv = (audit: any) => {
        if (!audit) return;
        const csvContent = [
            ['Product ID', 'Expected', 'Counted', 'Discrepancy'],
            ...audit.items.map((i: any) => [
                i.product_id, i.expected_stock, i.counted_stock, i.discrepancy
            ])
        ].map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `audit_${new Date(audit.timestamp).toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
                >
                    <div className="flex justify-between items-center p-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900">Audit History</h2>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-0">
                        {!audits || audits.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                <CheckCircle size={48} className="mb-4 opacity-20" />
                                <p>No completed audits found.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {audits.map(audit => (
                                    <div key={audit.id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <p className="font-bold text-gray-900 text-lg">
                                                    {audit.timestamp.toLocaleDateString()}
                                                    <span className="text-gray-400 text-sm font-normal ml-2">
                                                        {audit.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {audit.items.length} items counted • {audit.items.filter(i => i.discrepancy !== 0).length} discrepancies
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleExportCsv(audit)}
                                                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-vibepos-primary bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                                <Download size={16} /> Export CSV
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
