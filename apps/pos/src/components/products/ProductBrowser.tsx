import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { ProductCard } from './ProductCard';
import { ProductListItem } from './ProductListItem';
import { RetailProduct, ServiceProduct } from '@vibepos/shared-types';
import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { LayoutGrid, List as ListIcon, Search } from 'lucide-react';
import { useCart } from '../../lib/useCart';
import { FilterTabs } from '../ui/FilterTabs';
import { Skeleton } from '../ui/skeleton';

export const ProductBrowser = () => {
    const products = useLiveQuery(() => db.products.toArray());
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'RETAIL' | 'SERVICE'>('ALL');
    const [search, setSearch] = useState('');

    // MOCK SEED FUNCTION
    const seedData = async () => {
        await db.products.clear();
        await db.products.bulkAdd([
            {
                id: crypto.randomUUID(),
                name: 'Espresso (Double Shot)',
                price: 3.50,
                category: 'Coffee',
                type: 'SERVICE',
                duration_minutes: 5,
            } as ServiceProduct,
            {
                id: crypto.randomUUID(),
                name: 'Premium Coffee Beans (1kg)',
                price: 25.00,
                category: 'Retail',
                type: 'RETAIL',
                stock_level: 12,
                sku: 'BEAN-001'
            } as RetailProduct,
            {
                id: crypto.randomUUID(),
                name: 'Avocado Toast',
                price: 8.50,
                category: 'Food',
                type: 'SERVICE',
                duration_minutes: 10,
            } as ServiceProduct,
            {
                id: crypto.randomUUID(),
                name: 'VibePOS T-Shirt',
                price: 18.00,
                category: 'Merch',
                type: 'RETAIL',
                stock_level: 45,
                sku: 'TSHIRT-001'
            } as RetailProduct,
        ]);
    };

    // START: VIBEPOS CART INTEGRATION
    const { addToCart } = useCart();
    // END: VIBEPOS CART INTEGRATION

    if (!products) {
        return (
            <div className="flex flex-col h-full p-4 md:p-6 lg:p-8 space-y-4">
                <div className="flex justify-between items-center mb-4">
                    <Skeleton className="h-8 w-48" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <Skeleton key={i} className="h-64 w-full rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    const filteredProducts = products.filter(p => {
        const matchesType = typeFilter === 'ALL' || p.type === typeFilter;
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        return matchesType && matchesSearch;
    });

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Header: Search & Controls */}
            <div className="sticky top-0 z-10 bg-vibepos-base pb-4 pt-2">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">Products</h1>

                    <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200 p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-vibepos-primary text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-vibepos-primary text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <ListIcon size={20} />
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vibepos-primary/20 focus:border-vibepos-primary text-sm"
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
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <p className="text-gray-500 mb-4">No products found locally.</p>
                        <button
                            onClick={seedData}
                            className="px-4 py-2 bg-vibepos-primary text-white rounded-lg shadow hover:bg-blue-600 transition-colors"
                        >
                            Generate Demo Items
                        </button>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pb-20">
                                {filteredProducts.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onClick={() => addToCart(product)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col pb-20">
                                {filteredProducts.map((product) => (
                                    <ProductListItem
                                        key={product.id}
                                        product={product}
                                        onClick={() => addToCart(product)}
                                    />
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};
