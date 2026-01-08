import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Box, Clock, Trash2, Search } from 'lucide-react';
import { RetailProduct, ServiceProduct } from '@vibepos/shared-types';
import { db } from '../../db';
import { useToast } from '../../components/ui/Toast';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';

const DEFAULT_RETAIL: Partial<RetailProduct> = {
    type: 'RETAIL',
    name: '',
    price: 0,
    category: 'General',
    stock_level: 0,
    sku: '',
    low_stock_threshold: 5,
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

export const ProductFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Fetch product if editing
    // Fetch product if editing
    const productToEdit = useLiveQuery(async () => {
        if (!id) return null;
        return await db.products.get(id);
    }, [id]);

    const [type, setType] = useState<'RETAIL' | 'SERVICE'>('RETAIL');
    const [formData, setFormData] = useState<any>(DEFAULT_RETAIL);

    // Ingredient Search State
    const [ingredientSearch, setIngredientSearch] = useState('');
    const [isIngredientSelectorOpen, setIsIngredientSelectorOpen] = useState(false);

    // For Recipe Builder
    const allProducts = useLiveQuery(() => db.products.toArray()) || [];
    // Potential ingredients are other retail products (prevent self-reference if editing)
    const potentialIngredients = allProducts.filter(p => p.id !== id && p.type === 'RETAIL');

    // Load data on load/change
    useEffect(() => {
        if (productToEdit) {
            setType(productToEdit.type);
            setFormData({
                ...productToEdit,
                ingredients: (productToEdit as RetailProduct).ingredients || []
            });
        }
    }, [productToEdit]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const product = {
                ...formData,
                id: id || crypto.randomUUID(), // Use existing ID if editing
                type: type,
                price: parseFloat(formData.price),
                stock_level: type === 'RETAIL' ? parseInt(formData.stock_level || '0') : undefined,
                low_stock_threshold: type === 'RETAIL' ? parseInt(formData.low_stock_threshold || '5') : undefined,
                duration_minutes: type === 'SERVICE' ? parseInt(formData.duration_minutes || '0') : undefined,
                is_composite: type === 'RETAIL' ? !!formData.is_composite : false,
                ingredients: type === 'RETAIL' && formData.is_composite ? formData.ingredients : undefined,
            };

            // Basic Validation
            if (!product.name) return showToast('Name is required', 'error');
            if (product.price < 0) return showToast('Price cannot be negative', 'error');
            if (type === 'RETAIL' && !product.sku) return showToast('SKU is required', 'error');

            await db.products.put(product);
            showToast(`Product ${id ? 'updated' : 'created'} successfully`, 'success');
            navigate('/inventory');
        } catch (err) {
            console.error(err);
            showToast('Failed to save product', 'error');
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        if (confirm('Are you sure you want to delete this product?')) {
            await db.products.delete(id);
            showToast('Product deleted', 'info');
            navigate('/inventory');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto pb-20"
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/inventory')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {id ? 'Edit Product' : 'New Product'}
                    </h1>
                    <p className="text-gray-500 text-sm">
                        {id ? `Editing ${formData.name || 'product'}` : 'Add a new item to your inventory'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* Type Selection (Only if New) */}
                {!id && (
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => { setType('RETAIL'); setFormData(DEFAULT_RETAIL); }}
                            className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all ${type === 'RETAIL'
                                ? 'border-vibepos-primary bg-blue-50/50 text-vibepos-primary'
                                : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                                }`}
                        >
                            <Box size={32} />
                            <div className="text-center">
                                <p className="font-bold">Retail Product</p>
                                <p className="text-xs opacity-70">Physical item with stock</p>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => { setType('SERVICE'); setFormData(DEFAULT_SERVICE); }}
                            className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all ${type === 'SERVICE'
                                ? 'border-purple-500 bg-purple-50/50 text-purple-600'
                                : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                                }`}
                        >
                            <Clock size={32} />
                            <div className="text-center">
                                <p className="font-bold">Service</p>
                                <p className="text-xs opacity-70">Time-based offering</p>
                            </div>
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Main Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Basic Information</h3>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Name</label>
                                <input
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={e => handleChange('name', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vibepos-primary focus:outline-none bg-gray-50 focus:bg-white text-lg font-medium"
                                    placeholder="e.g. Signature Latte"
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
                        </div>

                        {/* Recipe Builder (Full Width) */}
                        {type === 'RETAIL' && formData.is_composite && (
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Recipe / Ingredients</h3>
                                        <p className="text-xs text-gray-500">Define what raw materials are consumed when this is sold.</p>
                                    </div>
                                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">Composite Item</span>
                                </div>

                                <div className="space-y-3">
                                    {formData.ingredients?.map((ing: any, idx: number) => {
                                        const product = allProducts.find(p => p.id === ing.product_id);
                                        return (
                                            <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200 text-gray-400">
                                                    <Box size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-gray-900">{product?.name || 'Unknown Item'}</p>
                                                    <p className="text-xs text-gray-500">Current Stock: {product ? (product as RetailProduct).stock_level : 0}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col items-end">
                                                        <input
                                                            type="number"
                                                            value={ing.quantity}
                                                            onChange={e => {
                                                                const newIngs = [...(formData.ingredients || [])];
                                                                newIngs[idx].quantity = parseFloat(e.target.value);
                                                                handleChange('ingredients', newIngs);
                                                            }}
                                                            className="w-20 px-2 py-1 text-right font-medium bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                                                        />
                                                        <span className="text-[10px] text-gray-400 uppercase font-bold mt-0.5">{ing.unit || 'units'}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newIngs = [...(formData.ingredients || [])];
                                                            newIngs.splice(idx, 1);
                                                            handleChange('ingredients', newIngs);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {(!formData.ingredients || formData.ingredients.length === 0) && (
                                        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                            <p className="text-gray-400 font-medium">No ingredients added yet.</p>
                                            <p className="text-sm text-gray-400">Select an item below to add it to the recipe.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <Popover open={isIngredientSelectorOpen} onOpenChange={setIsIngredientSelectorOpen}>
                                        <PopoverTrigger asChild>
                                            <button
                                                type="button"
                                                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white hover:border-gray-300 transition-all text-sm text-gray-500"
                                            >
                                                <span>+ Add Ingredient from Inventory...</span>
                                                <Search size={16} />
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[300px] p-0 bg-white" align="start">
                                            <div className="p-2 border-b border-gray-100">
                                                <div className="flex items-center px-2 bg-gray-50 rounded-md">
                                                    <Search size={14} className="text-gray-400" />
                                                    <input
                                                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-2"
                                                        placeholder="Search items..."
                                                        value={ingredientSearch}
                                                        onChange={e => setIngredientSearch(e.target.value)}
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                            <div className="max-h-[200px] overflow-y-auto p-1">
                                                {potentialIngredients
                                                    .filter(p => p.name.toLowerCase().includes(ingredientSearch.toLowerCase()))
                                                    .map(p => (
                                                        <button
                                                            key={p.id}
                                                            type="button"
                                                            className="w-full text-left px-2 py-2 text-sm hover:bg-blue-50 rounded-md flex items-center justify-between group"
                                                            onClick={() => {
                                                                const newIng = {
                                                                    product_id: p.id,
                                                                    quantity: 1,
                                                                    unit: 'pcs'
                                                                };
                                                                handleChange('ingredients', [...(formData.ingredients || []), newIng]);
                                                                setIsIngredientSelectorOpen(false);
                                                                setIngredientSearch('');
                                                            }}
                                                        >
                                                            <span>{p.name}</span>
                                                            <span className="text-xs text-gray-400 group-hover:text-blue-500">
                                                                Stock: {(p as RetailProduct).stock_level}
                                                            </span>
                                                        </button>
                                                    ))}
                                                {potentialIngredients.filter(p => p.name.toLowerCase().includes(ingredientSearch.toLowerCase())).length === 0 && (
                                                    <div className="p-4 text-center text-gray-400 text-xs">
                                                        No matching items found.
                                                    </div>
                                                )}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Settings & Stock */}
                    <div className="space-y-6">
                        {/* Type Specific Fields */}
                        {type === 'RETAIL' && (
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Inventory Control</h3>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">SKU / Barcode</label>
                                    <input
                                        type="text"
                                        value={formData.sku || ''}
                                        onChange={e => handleChange('sku', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vibepos-primary focus:outline-none bg-gray-50 focus:bg-white font-mono text-sm"
                                        placeholder="PROD-001"
                                    />
                                </div>

                                {!formData.is_composite && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Stock</label>
                                            <input
                                                type="number"
                                                value={formData.stock_level || ''}
                                                onChange={e => handleChange('stock_level', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vibepos-primary focus:outline-none bg-gray-50 focus:bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Low Stock Alert</label>
                                            <input
                                                type="number"
                                                value={formData.low_stock_threshold || ''}
                                                onChange={e => handleChange('low_stock_threshold', e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vibepos-primary focus:outline-none bg-gray-50 focus:bg-white"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="pt-4 border-t border-gray-100">
                                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_composite || false}
                                            onChange={e => handleChange('is_composite', e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 text-vibepos-primary focus:ring-vibepos-primary"
                                        />
                                        <div>
                                            <span className="block text-sm font-bold text-gray-900">Composite Product</span>
                                            <span className="block text-xs text-gray-500">Made from other ingredients</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}

                        {type === 'SERVICE' && (
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Service Details</h3>
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
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 pt-6">
                            <button
                                type="submit"
                                className="w-full py-4 bg-vibepos-primary text-white font-bold rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                            >
                                <Save size={20} />
                                Save Product
                            </button>

                            {id && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="w-full py-3 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={18} />
                                    Delete Product
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </motion.div>
    );
};
