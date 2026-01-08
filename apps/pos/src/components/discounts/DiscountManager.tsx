import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Tag, X, Percent, DollarSign, Check, Edit } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useToast } from '../../components/ui/Toast';
import { Discount } from '@vibepos/shared-types';

export const DiscountManager = () => {
    const discounts = useLiveQuery(() => db.discounts.toArray()) || [];
    const { showToast } = useToast();

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Discount>>({
        name: '',
        type: 'PERCENTAGE',
        value: 0,
        target: 'CART',
        trigger: 'MANUAL',
        is_statutory: false,
        valid_from: undefined,
        valid_until: undefined,
        is_active: true
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!formData.name) return showToast('Name is required', 'error');
            if (!formData.value || formData.value < 0) return showToast('Value must be positive', 'error');

            if (editingId) {
                // Update
                await db.discounts.update(editingId, {
                    ...formData,
                    is_active: true // Keep active or use existing? Resetting to active for now as per simple flow
                });
                showToast('Discount updated successfully', 'success');
            } else {
                // Create
                await db.discounts.add({
                    ...formData as Discount,
                    id: crypto.randomUUID(),
                    is_active: true
                });
                showToast('Discount created successfully', 'success');
            }

            setIsModalOpen(false);
            setEditingId(null);
            setFormData({
                name: '',
                type: 'PERCENTAGE',
                value: 0,
                target: 'CART',
                trigger: 'MANUAL',
                is_statutory: false,
                valid_from: undefined,
                valid_until: undefined,
                is_active: true
            });
        } catch (err) {
            console.error(err);
            showToast('Failed to save discount', 'error');
        }
    };

    const handleEdit = (discount: Discount) => {
        setEditingId(discount.id!);
        setFormData({
            name: discount.name,
            type: discount.type,
            value: discount.value,
            target: discount.target,
            trigger: discount.trigger,
            is_statutory: discount.is_statutory,
            valid_from: discount.valid_from,
            valid_until: discount.valid_until,
            is_active: discount.is_active
        });
        setIsModalOpen(true);
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        await db.discounts.update(id, { is_active: !currentStatus });
        showToast(`Discount ${currentStatus ? 'deactivated' : 'activated'}`, 'info');
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Discounts & Promotions</h1>
                    <p className="text-gray-500">Manage statutory discounts, coupons, and happy hour specials</p>
                </div>
                <button
                    className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-all font-medium shadow-lg shadow-gray-200"
                    onClick={() => {
                        setEditingId(null);
                        setFormData({
                            name: '',
                            type: 'PERCENTAGE',
                            value: 0,
                            target: 'CART',
                            trigger: 'MANUAL',
                            is_statutory: false,
                            valid_from: undefined,
                            valid_until: undefined,
                            is_active: true
                        });
                        setIsModalOpen(true);
                    }}
                >
                    <Plus size={18} />
                    <span>New Discount</span>
                </button>
            </div>

            {/* List */}
            {discounts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Tag size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Active Discounts</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">Create discounts for Senior Citizens/PWDs, or set up automated happy hour promotions.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Discount Name</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Type</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Value</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {discounts.map(d => (
                                <tr key={d.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4">
                                        <p className="font-bold text-gray-900">{d.name}</p>
                                        {d.is_statutory && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">Statutory</span>}
                                    </td>
                                    <td className="p-4 text-gray-600 text-sm">
                                        {d.type === 'PERCENTAGE' ? 'Percentage (%)' : 'Fixed Amount ($)'}
                                    </td>
                                    <td className="p-4 text-gray-900 font-bold">
                                        {d.type === 'PERCENTAGE' ? `${d.value}%` : `$${d.value.toFixed(2)}`}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${d.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {d.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(d)}
                                            className="p-2 text-gray-400 hover:text-vibepos-primary hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => toggleStatus(d.id!, d.is_active)}
                                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${d.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                                        >
                                            {d.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden"
                        >
                            <form onSubmit={handleSave}>
                                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Discount' : 'Create Discount'}</h3>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-6 space-y-5">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Discount Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vibepos-primary focus:outline-none bg-gray-50 focus:bg-white text-lg font-medium"
                                            placeholder="e.g. Summer Sale"
                                            autoFocus
                                        />
                                    </div>

                                    {/* Type & Value */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Type</label>
                                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, type: 'PERCENTAGE' })}
                                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.type === 'PERCENTAGE' ? 'bg-white text-vibepos-primary shadow-sm' : 'text-gray-500'}`}
                                                >
                                                    <Percent size={16} className="inline mr-1" /> %
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, type: 'FIXED' })}
                                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.type === 'FIXED' ? 'bg-white text-vibepos-primary shadow-sm' : 'text-gray-500'}`}
                                                >
                                                    <DollarSign size={16} className="inline mr-1" /> Fixed
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Value</label>
                                            <input
                                                type="number"
                                                value={formData.value}
                                                onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vibepos-primary focus:outline-none bg-gray-50 focus:bg-white text-right font-mono"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    {/* Options */}
                                    <div className="space-y-3 pt-2">
                                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_statutory}
                                                onChange={e => setFormData({ ...formData, is_statutory: e.target.checked })}
                                                className="w-5 h-5 text-vibepos-primary rounded border-gray-300 focus:ring-vibepos-primary"
                                            />
                                            <div>
                                                <span className="block font-bold text-sm text-gray-900">Statutory Discount</span>
                                                <span className="block text-xs text-gray-500">For Senior Citizens / PWD (exempts VAT)</span>
                                            </div>
                                        </label>
                                    </div>

                                    {/* Date Range */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valid From</label>
                                            <input
                                                type="date"
                                                value={formData.valid_from ? new Date(formData.valid_from).toISOString().split('T')[0] : ''}
                                                onChange={e => setFormData({ ...formData, valid_from: e.target.value ? new Date(e.target.value) : undefined })}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vibepos-primary focus:outline-none bg-gray-50 focus:bg-white text-sm font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valid Until</label>
                                            <input
                                                type="date"
                                                value={formData.valid_until ? new Date(formData.valid_until).toISOString().split('T')[0] : ''}
                                                onChange={e => setFormData({ ...formData, valid_until: e.target.value ? new Date(e.target.value) : undefined })}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vibepos-primary focus:outline-none bg-gray-50 focus:bg-white text-sm font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 bg-vibepos-primary text-white font-bold rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                                    >
                                        <Check size={18} />
                                        {editingId ? 'Update Discount' : 'Create Discount'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
