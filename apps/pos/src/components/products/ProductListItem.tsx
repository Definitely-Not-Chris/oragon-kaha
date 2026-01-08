import { RetailProduct, ServiceProduct } from '@vibepos/shared-types';
import { motion } from 'framer-motion';
import { Plus, Package, Clock } from 'lucide-react';
import { useCurrency } from '../../lib/useCurrency';

interface ProductListItemProps {
    product: RetailProduct | ServiceProduct;
    onClick: (product: RetailProduct | ServiceProduct) => void;
}

export const ProductListItem = ({ product, onClick }: ProductListItemProps) => {
    const { formatPrice } = useCurrency();
    const isService = product.type === 'SERVICE';

    return (
        <motion.div
            layoutId={product.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
                group flex items-center gap-4 p-3
                bg-white border-b border-gray-100 last:border-b-0
                hover:bg-blue-50/50 cursor-pointer
                transition-colors
            `}
            onClick={() => onClick(product)}
        >
            {/* Thumbnail */}
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden shrink-0">
                {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    isService ? <Clock size={20} /> : <Package size={20} />
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="uppercase tracking-wide">{product.category}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    {isService ? (
                        <span className="flex items-center gap-1 text-blue-600">
                            <Clock size={10} /> {product.duration_minutes}m
                        </span>
                    ) : (
                        <span className={`flex items-center gap-1 ${product.stock_level > 0 ? 'text-gray-600' : 'text-red-500'}`}>
                            <Package size={10} /> {product.stock_level} Stock
                        </span>
                    )}
                </div>
            </div>

            {/* Price & Action */}
            <div className="flex items-center gap-4">
                <span className="font-bold text-gray-900 w-16 text-right">
                    {formatPrice(product.price)}
                </span>
                <button className="
                    w-8 h-8 rounded-lg flex items-center justify-center
                    bg-gray-50 text-vibepos-primary
                    group-hover:bg-vibepos-primary group-hover:text-white
                    transition-colors
                ">
                    <Plus size={16} />
                </button>
            </div>
        </motion.div>
    );
};
