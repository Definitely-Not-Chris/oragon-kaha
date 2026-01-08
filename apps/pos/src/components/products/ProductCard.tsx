import { RetailProduct, ServiceProduct } from '@vibepos/shared-types';
import { motion } from 'framer-motion';
import { Plus, Package, Clock } from 'lucide-react';
import { useCurrency } from '../../lib/useCurrency';

interface ProductCardProps {
    product: RetailProduct | ServiceProduct;
    onClick: (product: RetailProduct | ServiceProduct) => void;
}

export const ProductCard = ({ product, onClick }: ProductCardProps) => {
    const { formatPrice } = useCurrency();
    const isService = product.type === 'SERVICE';
    // Check if service is disabled (no assigned staff)
    const isServiceUnavailable = isService && (!product.assigned_staff_id);

    return (
        <motion.div
            layoutId={product.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`
                group relative flex flex-col justify-between
                bg-white rounded-xl border border-gray-200
                hover:border-vibepos-primary hover:shadow-md
                transition-all duration-200 overflow-hidden cursor-pointer
                ${isServiceUnavailable ? 'opacity-50 pointer-events-none grayscale' : ''}
            `}
            onClick={() => !isServiceUnavailable && onClick(product)}
        >
            {/* Status / Type Indicator */}
            <div className="absolute top-3 right-3 z-10">
                {isService ? (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md border
                        ${isServiceUnavailable
                            ? 'bg-gray-200 text-gray-500 border-gray-300'
                            : 'bg-blue-50 text-blue-700 border-blue-100'}
                    `}>
                        <Clock size={12} />
                        {isServiceUnavailable ? 'No Staff' : `${product.duration_minutes}m`}
                    </span>
                ) : (
                    <span className={`
                        inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md border
                        ${product.stock_level > 0
                            ? 'bg-gray-100 text-gray-600 border-gray-200'
                            : 'bg-red-50 text-red-600 border-red-100'}
                    `}>
                        <Package size={12} />
                        {product.stock_level > 0 ? `Stock: ${product.stock_level}` : 'Out of Stock'}
                    </span>
                )}
            </div>

            {/* Image / Placeholder */}
            <div className="h-32 bg-gray-50 relative flex items-center justify-center overflow-hidden">
                {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="text-gray-300">
                        {isService ? <Clock size={32} /> : <Package size={32} />}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 leading-tight mb-1 line-clamp-2">
                        {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide">
                        {product.category}
                    </p>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <span className="text-lg font-bold text-gray-900">
                        {formatPrice(product.price)}
                    </span>

                    <button className="
                        w-8 h-8 rounded-full flex items-center justify-center
                        border border-vibepos-primary text-vibepos-primary
                        hover:bg-vibepos-primary hover:text-white
                        transition-colors
                    ">
                        <Plus size={16} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
