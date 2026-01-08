
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useState } from 'react';
import { Search, Plus, AlertTriangle, Package, Tag, Clock, ArrowRightLeft } from 'lucide-react';
import { StockMovementModal } from './StockMovementModal';
import { StockHistoryModal } from './StockHistoryModal';
import { RetailProduct } from '@vibepos/shared-types';
import { FilterTabs } from '../ui/FilterTabs';
import { useNavigate } from 'react-router-dom'; // Added useNavigate
import { useCurrency } from '../../lib/useCurrency';

export const InventoryDashboard = () => {
    const navigate = useNavigate(); // Initialized useNavigate
    const products = useLiveQuery(() => db.products.toArray()) || []; // Added || [] for initial empty array
    const { formatPrice } = useCurrency();
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'RETAIL' | 'SERVICE'>('ALL');

    // Modal State - Removed isModalOpen and editingProduct
    // const [isModalOpen, setIsModalOpen] = useState(false);
    // const [editingProduct, setEditingProduct] = useState<ProductOrService | null>(null);

    // Stock Modal State
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [stockActionProduct, setStockActionProduct] = useState<RetailProduct | null>(null);

    // History Modal State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyProduct, setHistoryProduct] = useState<RetailProduct | null>(null);

    // Removed handleEdit and handleAddNew functions
    // const handleEdit = (product: ProductOrService) => {
    //     setEditingProduct(product);
    //     setIsModalOpen(true);
    // };

    const handleStockAction = (product: RetailProduct) => {
        setStockActionProduct(product);
        setIsStockModalOpen(true);
    };

    const handleViewHistory = (product: RetailProduct) => {
        setHistoryProduct(product);
        setIsHistoryModalOpen(true);
    };

    // Removed handleAddNew function
    // const handleAddNew = () => {
    //     setEditingProduct(null);
    //     setIsModalOpen(true);
    // };

    if (!products) return <div className="p-8">Loading inventory...</div>;

    // Filter Logic
    const filteredProducts = products.filter(p => {
        const matchesType = typeFilter === 'ALL' || p.type === typeFilter;
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.type === 'RETAIL' && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesType && matchesSearch;
    });

    const lowStockCount = products.filter(p => p.type === 'RETAIL' && p.stock_level <= (p.low_stock_threshold || 5)).length;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
                    <p className="text-gray-500">Track stock, manage products, and services.</p>
                </div>
                {/* Updated Add Product button to navigate */}
                <button
                    onClick={() => navigate('/inventory/new')}
                    className="flex items-center gap-2 px-4 py-2.5 bg-vibepos-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200"
                >
                    <Plus size={20} />
                    Add Product
                </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <Package size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total Items</p>
                        <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Low Stock Alerts</p>
                        <p className="text-2xl font-bold text-gray-900">{lowStockCount}</p>
                    </div>
                </div>
                {/* Placeholder for Total Value */}
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-t-2xl border border-gray-200 border-b-0 flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search products, SKUs..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-vibepos-primary"
                    />
                </div>
                <FilterTabs
                    value={typeFilter}
                    onChange={setTypeFilter}
                    options={[
                        { label: 'All', value: 'ALL' },
                        { label: 'Products', value: 'RETAIL' },
                        { label: 'Services', value: 'SERVICE' },
                    ]}
                    className="flex-shrink-0"
                />
            </div>

            {/* Table */}
            <div className="flex-1 bg-white rounded-b-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Product</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Type</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase">Details</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Price</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase text-center">Stock</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.map(p => (
                                <tr key={p.id} className="group hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <p className="font-bold text-gray-900">{p.name}</p>
                                        <p className="text-xs text-gray-500">{p.category}</p>
                                    </td>
                                    <td className="p-4">
                                        {p.type === 'RETAIL' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                                                <Tag size={12} /> Retail
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold">
                                                <Clock size={12} /> Service
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm text-gray-500 font-mono">
                                        {p.type === 'RETAIL' ? (
                                            <span title="SKU">{p.sku}</span>
                                        ) : (
                                            <span>{p.duration_minutes} min</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right font-bold text-gray-900">{formatPrice(p.price)}</td>
                                    <td className="p-4 text-center">
                                        {p.type === 'RETAIL' ? (
                                            p.is_composite ? (
                                                <div className="inline-flex flex-col items-center">
                                                    {(() => {
                                                        const maxYield = p.ingredients?.reduce((min, ing) => {
                                                            const source = products.find(src => src.id === ing.product_id) as RetailProduct;
                                                            if (!source) return 0;
                                                            const yieldCount = Math.floor(source.stock_level / ing.quantity);
                                                            return Math.min(min, yieldCount);
                                                        }, Infinity) || 0;

                                                        const isLow = maxYield === 0;

                                                        return (
                                                            <>
                                                                <span className={`font-bold ${isLow ? 'text-red-500' : 'text-blue-600'}`}>
                                                                    {maxYield === Infinity ? 0 : maxYield}
                                                                </span>
                                                                <span className="text-[10px] text-gray-400">Yield</span>
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            ) : (
                                                <div className={`inline-flex flex-col items-center ${p.stock_level <= (p.low_stock_threshold || 5) ? 'text-red-600' : 'text-gray-900'}`}>
                                                    <span className="font-bold">{p.stock_level}</span>
                                                    {p.stock_level <= (p.low_stock_threshold || 5) && (
                                                        <span className="text-[10px] bg-red-100 px-1.5 rounded-sm">Low</span>
                                                    )}
                                                </div>
                                            )
                                        ) : (
                                            <span className="text-gray-300">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {p.type === 'RETAIL' && !p.is_composite && (
                                                <>
                                                    <button
                                                        onClick={() => handleStockAction(p as RetailProduct)}
                                                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Manage Stock"
                                                    >
                                                        <ArrowRightLeft size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleViewHistory(p as RetailProduct)}
                                                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                        title="View History"
                                                    >
                                                        <Clock size={16} />
                                                    </button>
                                                </>
                                            )}
                                            {/* Updated Edit button to navigate */}
                                            <button
                                                onClick={() => navigate(`/inventory/edit/${p.id}`)}
                                                className="text-sm font-medium text-vibepos-primary hover:text-blue-700"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Removed ProductFormModal */}
            {/* <ProductFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                productToEdit={editingProduct}
            /> */}

            <StockMovementModal
                isOpen={isStockModalOpen}
                onClose={() => setIsStockModalOpen(false)}
                product={stockActionProduct}
            />

            <StockHistoryModal
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                product={historyProduct}
            />
        </div>
    );
};
