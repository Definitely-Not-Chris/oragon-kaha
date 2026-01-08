import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDownCircle, AlertTriangle, ShoppingBag, History } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { RetailProduct } from '@vibepos/shared-types';

interface StockHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: RetailProduct | null;
}

export const StockHistoryModal = ({ isOpen, onClose, product }: StockHistoryModalProps) => {
    // Only query if open and product exists
    const history = useLiveQuery(
        () => isOpen && product
            ? db.stock_movements
                .where('product_id')
                .equals(product.id as string)
                .reverse()
                .sortBy('timestamp')
            : [],
        [isOpen, product]
    );

    if (!isOpen || !product) return null;

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
                    className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[85vh]"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <History size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Stock History</h2>
                                <p className="text-sm text-gray-500 font-medium">{product.name} (Current: {product.stock_level})</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-0">
                        {!history || history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                <History size={48} className="mb-4 opacity-20" />
                                <p>No movement history found.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Date</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Action</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase">Reason</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase text-right">Change</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {history.map(log => (
                                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-gray-900">
                                                    {log.timestamp.toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold
                                                    ${log.type === 'PURCHASE' ? 'bg-green-50 text-green-700' :
                                                        log.type === 'SALE' ? 'bg-blue-50 text-blue-700' :
                                                            'bg-orange-50 text-orange-700'
                                                    }
                                                `}>
                                                    {log.type === 'PURCHASE' && <ArrowDownCircle size={14} />}
                                                    {log.type === 'SALE' && <ShoppingBag size={14} />}
                                                    {log.type === 'ADJUSTMENT' && <AlertTriangle size={14} />}
                                                    {log.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {log.reason || '-'}
                                            </td>
                                            <td className={`px-6 py-4 text-right font-bold font-mono text-sm
                                                ${log.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}
                                            `}>
                                                {log.quantity_change > 0 ? '+' : ''}{log.quantity_change}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
