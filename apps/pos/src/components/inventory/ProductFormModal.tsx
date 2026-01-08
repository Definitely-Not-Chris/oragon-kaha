import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Box, Clock, Trash2 } from 'lucide-react';
import { ProductOrService, RetailProduct, ServiceProduct } from '@vibepos/shared-types';
import { db } from '../../db';
import { useToast } from '../ui/Toast';

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    productToEdit?: ProductOrService | null;
}

const DEFAULT_RETAIL: Partial<RetailProduct> = {
    type: 'RETAIL',
    name: '',
    price: 0,
    category: 'General',
    stock_level: 0,
    sku: '',
    low_stock_threshold: 5,
    cost_price: 0,
    is_composite: false,
    ingredients: []
};

const DEFAULT_SERVICE: Partial<ServiceProduct> = {
    type: 'SERVICE',
    name: '',
    price: 0,
    category: 'Service',
    duration_minutes: 30
};

export const ProductFormModal = ({ isOpen, onClose, productToEdit }: ProductFormModalProps) => {
    const { showToast } = useToast();
    const [type, setType] = useState<'RETAIL' | 'SERVICE'>('RETAIL');
    const [formData, setFormData] = useState<any>(DEFAULT_RETAIL);

    // For Recipe Builder
    const allProducts = useLiveQuery(() => db.products.toArray()) || [];
    const potentialIngredients = allProducts.filter(p => p.id !== productToEdit?.id && p.type === 'RETAIL');

    // Load data on open
    useEffect(() => {
        if (isOpen) {
            if (productToEdit) {
                setType(productToEdit.type);
                setFormData({
                    ...productToEdit,
                    // Ensure ingredients is array if missing
                    ingredients: (productToEdit as RetailProduct).ingredients || []
                });
            } else {
                setType('RETAIL');
                setFormData(DEFAULT_RETAIL);
            }
        }
    }, [isOpen, productToEdit]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    // Calculate Theoretical Cost for Composite Items
    const theoreticalCost = formData.is_composite && formData.ingredients?.length > 0
        ? formData.ingredients.reduce((total: number, ing: any) => {
            const product = allProducts.find(p => p.id === ing.product_id) as RetailProduct | undefined;
            return total + ((product?.cost_price || 0) * ing.quantity);
        }, 0)
        : 0;


    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const product = {
                ...formData,
                id: productToEdit?.id || crypto.randomUUID(),
                type: type, // Ensure type is set
                // Number conversions
                price: parseFloat(formData.price),
                stock_level: type === 'RETAIL' ? parseInt(formData.stock_level || '0') : undefined,
                low_stock_threshold: type === 'RETAIL' ? parseInt(formData.low_stock_threshold || '5') : undefined,
                duration_minutes: type === 'SERVICE' ? parseInt(formData.duration_minutes || '0') : undefined,
                // Composite Logic
                is_composite: type === 'RETAIL' ? !!formData.is_composite : false,
                ingredients: type === 'RETAIL' && formData.is_composite ? formData.ingredients : undefined,
                cost_price: type === 'RETAIL'
                    ? (formData.is_composite ? theoreticalCost : parseFloat(formData.cost_price || '0'))
                    : undefined,
            };

            // Basic Validation
            if (!product.name) return showToast('Name is required', 'error');
            if (product.price < 0) return showToast('Price cannot be negative', 'error');
            if (type === 'RETAIL' && !product.sku) return showToast('SKU is required for retail items', 'error');

            await db.products.put(product);
            showToast(`Product ${productToEdit ? 'updated' : 'created'} successfully`, 'success');
            onClose();
        } catch (err) {
            console.error(err);
            showToast('Failed to save product', 'error');
        }
    };

    const handleDelete = async () => {
        if (!productToEdit || !productToEdit.id) return;
        if (confirm('Are you sure you want to delete this product?')) {
            await db.products.delete(productToEdit.id);
            showToast('Product deleted', 'info');
            onClose();
        }
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
                    className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900">
                            {productToEdit ? 'Edit Product' : 'New Product'}
                        </h2>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Form Scrollable Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                        {/* Type Toggle (Only if new) */}
                        {!productToEdit && (
                            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => { setType('RETAIL'); setFormData(DEFAULT_RETAIL); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${type === 'RETAIL' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Box size={16} /> Retail Product
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setType('SERVICE'); setFormData(DEFAULT_SERVICE); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${type === 'SERVICE' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Clock size={16} /> Service
                                </button>
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Basic Info */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Name</label>
                                <input
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={e => handleChange('name', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vibepos-primary focus:outline-none bg-gray-50 focus:bg-white transition-colors"
                                    placeholder="e.g. Latte"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.price || ''}
                                        onChange={e => handleChange('price', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vibepos-primary focus:outline-none bg-gray-50 focus:bg-white"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                                    <input
                                        type="text"
                                        value={formData.category || ''}
                                        onChange={e => handleChange('category', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vibepos-primary focus:outline-none bg-gray-50 focus:bg-white"
                                        placeholder="e.g. Coffee"
                                    />
                                </div>
                            </div>

                            {/* Retail Specifics */}
                            {type === 'RETAIL' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">SKU / Code</label>
                                            <input
                                                type="text"
                                                value={formData.sku || ''}
                                                onChange={e => handleChange('sku', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vibepos-primary focus:outline-none bg-gray-50 focus:bg-white font-mono text-sm"
                                                placeholder="PROD-001"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Initial Stock</label>
                                            <input
                                                type="number"
                                                value={formData.stock_level || ''}
                                                onChange={e => handleChange('stock_level', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vibepos-primary focus:outline-none bg-gray-50 focus:bg-white"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Low Stock Alert Limit</label>
                                            <input
                                                type="number"
                                                value={formData.low_stock_threshold || ''}
                                                onChange={e => handleChange('low_stock_threshold', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vibepos-primary focus:outline-none bg-gray-50 focus:bg-white"
                                                placeholder="5"
                                            />
                                        </div>
                                        <div>
                                            {/* Cost Price - Disabled if composite, editable if raw */}
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cost Price ($)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={formData.is_composite ? theoreticalCost.toFixed(2) : (formData.cost_price || '')}
                                                onChange={e => !formData.is_composite && handleChange('cost_price', e.target.value)}
                                                disabled={formData.is_composite}
                                                className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none 
                                                    ${formData.is_composite
                                                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                                        : 'bg-gray-50 focus:border-vibepos-primary focus:bg-white'}`}
                                                placeholder="0.00"
                                            />
                                            {formData.is_composite && (
                                                <p className="text-[10px] text-blue-500 mt-1 font-medium">auto-calculated from ingredients</p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Composite / Recipe Section */}
                            {type === 'RETAIL' && (
                                <div className="space-y-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="is_composite"
                                            checked={formData.is_composite || false}
                                            onChange={e => handleChange('is_composite', e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 text-vibepos-primary focus:ring-vibepos-primary"
                                        />
                                        <label htmlFor="is_composite" className="text-sm font-bold text-gray-700">
                                            This is a Composite Product (Recipe)
                                        </label>
                                    </div>

                                    {formData.is_composite && (
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                                            <h3 className="text-xs font-bold text-gray-500 uppercase">Ingredients / Recipe</h3>

                                            {/* List Existing Ingredients */}
                                            <div className="space-y-2">
                                                {formData.ingredients?.map((ing: any, idx: number) => {
                                                    const product = allProducts.find(p => p.id === ing.product_id);
                                                    return (
                                                        <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                                            <div className="flex-1">
                                                                <p className="font-medium text-sm text-gray-900">{product?.name || 'Unknown Item'}</p>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <input
                                                                    type="number"
                                                                    value={ing.quantity}
                                                                    onChange={e => {
                                                                        const newIngs = [...(formData.ingredients || [])];
                                                                        newIngs[idx].quantity = parseFloat(e.target.value);
                                                                        handleChange('ingredients', newIngs);
                                                                    }}
                                                                    className="w-16 px-2 py-1 text-sm bg-gray-50 border border-gray-200 rounded-md"
                                                                />
                                                                <span className="text-xs text-gray-500">{ing.unit || 'units'}</span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newIngs = [...(formData.ingredients || [])];
                                                                    newIngs.splice(idx, 1);
                                                                    handleChange('ingredients', newIngs);
                                                                }}
                                                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                                {(!formData.ingredients || formData.ingredients.length === 0) && (
                                                    <p className="text-sm text-gray-400 italic text-center py-2">No ingredients added yet.</p>
                                                )}
                                            </div>

                                            {/* Add Ingredient Control */}
                                            <div className="flex gap-2">
                                                <select
                                                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                                                    onChange={e => {
                                                        if (!e.target.value) return;
                                                        const newIng = {
                                                            product_id: e.target.value,
                                                            quantity: 1,
                                                            unit: 'pcs'
                                                        };
                                                        handleChange('ingredients', [...(formData.ingredients || []), newIng]);
                                                        e.target.value = ''; // Reset select
                                                    }}
                                                >
                                                    <option value="">+ Add Ingredient...</option>
                                                    {potentialIngredients.map(p => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name} ({(p as RetailProduct).stock_level} in stock) - ${((p as RetailProduct).cost_price || 0).toFixed(2)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Service Specifics */}
                            {type === 'SERVICE' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duration (Minutes)</label>
                                    <input
                                        type="number"
                                        value={formData.duration_minutes || ''}
                                        onChange={e => handleChange('duration_minutes', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vibepos-primary focus:outline-none bg-gray-50 focus:bg-white"
                                        placeholder="30"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-gray-100 flex justify-between">
                        {productToEdit ? (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
                            >
                                <Trash2 size={18} />
                                Delete
                            </button>
                        ) : (
                            <div /> // Spacer
                        )}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-3 bg-vibepos-primary text-white font-bold rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                            >
                                <Save size={18} />
                                Save Product
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
