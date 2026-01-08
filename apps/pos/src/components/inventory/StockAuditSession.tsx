import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Save, Search, AlertTriangle } from 'lucide-react';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { useToast } from '../ui/Toast';
import { StockAudit, StockAuditItem, RetailProduct } from '@vibepos/shared-types';

interface StockAuditSessionProps {
    onExit: () => void;
}

export const StockAuditSession = ({ onExit }: StockAuditSessionProps) => {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [counts, setCounts] = useState<Record<string, number>>({});

    // Confirmation State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // Only fetch RETAIL products
    const products = useLiveQuery(() =>
        db.products.where('type').equals('RETAIL').toArray()
    ) as RetailProduct[] | undefined;

    const filteredProducts = products?.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

    const handleCountChange = (productId: string, val: string) => {
        const num = parseInt(val);
        if (!isNaN(num)) {
            setCounts(prev => ({ ...prev, [productId]: num }));
        }
    };

    const handleFinalizeClick = () => {
        if (!products) return;

        // Strict Validation: Must count at least one item
        if (Object.keys(counts).length === 0) {
            showToast('You must count at least one item to finalize.', 'error');
            return;
        }

        setIsConfirmOpen(true);
    };

    const handleConfirmFinalize = async () => {
        if (!products) return;
        try {
            const auditItems: StockAuditItem[] = [];

            await db.transaction('rw', db.products, db.stock_movements, db.stock_audits, async () => {
                for (const p of products) {
                    // Only process items that were counted or explicitly 0
                    if (counts[p.id!] !== undefined) {
                        const counted = counts[p.id!];
                        const expected = p.stock_level;
                        const discrepancy = counted - expected;

                        auditItems.push({
                            product_id: p.id!,
                            expected_stock: expected,
                            counted_stock: counted,
                            discrepancy
                        });

                        // If discrepancy, log adjustment & update product
                        if (discrepancy !== 0) {
                            // 1. Log Audit Adjustment
                            await db.stock_movements.add({
                                id: crypto.randomUUID(),
                                product_id: p.id!,
                                type: 'ADJUSTMENT',
                                quantity_change: discrepancy,
                                reason: 'Stock Audit Correction',
                                timestamp: new Date(),
                                synced: false
                            });

                            // 2. Update Product Stock
                            await db.products.update(p.id!, {
                                stock_level: counted
                            });
                        }
                    }
                }

                // Save Audit Record
                const audit: StockAudit = {
                    id: crypto.randomUUID(),
                    timestamp: new Date(),
                    status: 'COMPLETED',
                    items: auditItems,
                    notes: 'Manual Stocktake'
                };
                await db.stock_audits.add(audit);
            });

            showToast('Stocktake completed successfully', 'success');
            onExit();
        } catch (err) {
            console.error(err);
            showToast('Failed to complete stocktake', 'error');
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                        Audit In Progress
                    </h2>
                    <p className="text-gray-500 text-sm">Enter counted quantities below</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onExit}
                        className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleFinalizeClick}
                        className="px-6 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-all flex items-center gap-2"
                    >
                        <Save size={18} />
                        Finalize & Adjust
                    </button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmFinalize}
                title="Finalize Stocktake?"
                message="This will update inventory levels for all counted items. Any discrepancies will be logged as adjustments. This action cannot be undone."
                confirmLabel="Finalize & Update Stock"
                isDangerous={false}
            />

            {/* Filter */}
            <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Search product to count..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:border-vibepos-primary text-lg"
                    autoFocus
                />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-200 shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase w-1/2">Product</th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase text-center">System Stock</th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Counted</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredProducts.map(p => {
                            const countStr = counts[p.id!] !== undefined ? String(counts[p.id!]) : '';
                            const countNum = counts[p.id!];

                            // Only show diff if count is a valid number
                            const isDiscrepancy = countStr !== '' && countNum !== p.stock_level;

                            return (
                                <tr key={p.id} className="group hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <p className="font-bold text-gray-900 text-lg">{p.name}</p>
                                        <p className="text-gray-400 text-sm">{p.sku}</p>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="inline-block px-3 py-1 bg-gray-100 rounded-lg font-mono font-bold text-gray-600">
                                            {p.stock_level}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end items-center gap-4">
                                            {isDiscrepancy && (
                                                <div className="flex items-center gap-1 text-orange-600 font-bold text-sm bg-orange-50 px-2 py-1 rounded">
                                                    <AlertTriangle size={14} />
                                                    Diff: {countNum - p.stock_level}
                                                </div>
                                            )}
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="Enter Count"
                                                value={countStr}
                                                onChange={(e) => handleCountChange(p.id!, e.target.value)}
                                                className={`w-32 px-4 py-2 border-2 rounded-xl text-right font-mono font-bold text-lg focus:outline-none focus:border-vibepos-primary ${isDiscrepancy ? 'border-orange-300 bg-orange-50/50' : 'border-gray-200'
                                                    }`}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
