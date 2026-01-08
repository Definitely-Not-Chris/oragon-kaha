import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDownCircle, AlertTriangle, Save } from 'lucide-react';
import { db } from '../../db';
import { useToast } from '../ui/Toast';
import { RetailProduct, StockMovement } from '@vibepos/shared-types';

interface StockMovementModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: RetailProduct | null;
}

export const StockMovementModal = ({ isOpen, onClose, product }: StockMovementModalProps) => {
    const { showToast } = useToast();
    const [type, setType] = useState<'PURCHASE' | 'ADJUSTMENT'>('PURCHASE');
    const [quantity, setQuantity] = useState<string>('');
    const [reason, setReason] = useState('');

    // Reset form on open
    useEffect(() => {
        if (isOpen) {
            setType('PURCHASE');
            setQuantity('');
            setReason('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product || !product.id) return;

        const qty = parseInt(quantity);
        if (isNaN(qty) || qty <= 0) return showToast('Invalid quantity', 'error');

        // Logic for adjustment (can clear negative inventory if needed)
        const newStockLevel = type === 'PURCHASE'
            ? product.stock_level + qty
            : product.stock_level - qty; // Deduct for adjustment (e.g. spoilage) usually

        // Optional: Block negative stock on adjustment?
        // if (type === 'ADJUSTMENT' && newStockLevel < 0) return showToast('Insufficient stock for adjustment', 'error');

        try {
            await db.transaction('rw', db.products, db.stock_movements, async () => {
                // 1. Log Movement
                const movement: StockMovement = {
                    id: crypto.randomUUID(),
                    product_id: product.id!,
                    type: type,
                    quantity_change: type === 'PURCHASE' ? qty : -qty,
                    reason: reason || (type === 'PURCHASE' ? 'Stock Received' : 'Inventory Correction'),
                    timestamp: new Date(),
                    synced: false
                };
                await db.stock_movements.add(movement);

                // 2. Update Product
                await db.products.update(product.id!, {
                    stock_level: newStockLevel
                });
            });

            showToast('Stock updated successfully', 'success');
            onClose();
        } catch (err) {
            console.error(err);
            showToast('Failed to update stock', 'error');
        }
    };

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
                    className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col"
                >
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Manage Stock</h2>
                            <p className="text-sm text-gray-500 font-medium">{product.name}</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Action Type Toggle */}
                        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                            <button
                                type="button"
                                onClick={() => setType('PURCHASE')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${type === 'PURCHASE' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <ArrowDownCircle size={18} /> Receive
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('ADJUSTMENT')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${type === 'ADJUSTMENT' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <AlertTriangle size={18} /> Adjust/Spoilage
                            </button>
                        </div>

                        {/* Current Status Box */}
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                            <span className="text-blue-700 font-medium text-sm">Current Stock</span>
                            <span className="text-2xl font-bold text-blue-900">{product.stock_level}</span>
                        </div>

                        {/* Input Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                    Quantity to {type === 'PURCHASE' ? 'Add' : 'Remove'}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={e => setQuantity(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vibepos-primary focus:outline-none bg-gray-50 focus:bg-white text-lg font-bold"
                                    placeholder="0"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason / Notes</label>
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vibepos-primary focus:outline-none bg-gray-50 focus:bg-white"
                                    placeholder={type === 'PURCHASE' ? 'e.g. Weekly Order' : 'e.g. Expired / Damaged'}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`w-full py-4 rounded-xl text-white font-bold shadow-lg transition-all flex items-center justify-center gap-2
                                ${type === 'PURCHASE'
                                    ? 'bg-green-600 hover:bg-green-700 shadow-green-200'
                                    : 'bg-orange-600 hover:bg-orange-700 shadow-orange-200'
                                }
                            `}
                        >
                            <Save size={20} />
                            Confirm {type === 'PURCHASE' ? 'Receipt' : 'Adjustment'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
