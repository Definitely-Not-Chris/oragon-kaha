import { Trash2, X, CreditCard } from 'lucide-react';
import { useCart } from '../../lib/useCart';
import { useCurrency } from '../../lib/useCurrency';

interface CartPanelProps {
    onCheckout: () => void;
    readOnly?: boolean;
}

export const CartPanel = ({ onCheckout, readOnly = false }: CartPanelProps) => {
    const { items, removeFromCart, subtotal, tax, taxName, taxRate, discount, discountAmount, total, applyDiscount } = useCart();
    const { formatPrice } = useCurrency();


    return (
        <aside className="h-full w-80 lg:w-96 bg-vibepos-surface border-l border-gray-200 flex flex-col shadow-xl z-20">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">
                    {readOnly ? 'Order Review' : 'Current Order'}
                </h2>
                <p className="text-xs text-gray-500">
                    {items.length === 0 ? 'Cart is empty' : `${items.length} items`}
                </p>
            </div>

            {/* Cart Items List */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${readOnly ? 'opacity-80 pointer-events-none' : ''}`}>
                {items.length === 0 && (
                    <div className="text-center text-gray-400 mt-10">
                        <p>No items added.</p>
                    </div>
                )}
                {items.map((item) => (
                    <div key={item.product_id} className="flex justify-between items-start group p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-800">{item.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">x{item.quantity}</span>
                                <span className="text-xs font-semibold text-gray-700">{formatPrice(item.price_at_sale)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <p className="text-sm font-bold text-gray-900">{formatPrice(item.price_at_sale * item.quantity)}</p>
                            {!readOnly && (
                                <button
                                    onClick={() => removeFromCart(item.product_id)}
                                    className="text-gray-300 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer / Totals */}
            <div className="p-6 bg-gray-50 border-t border-gray-200">
                <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-500">
                        <span>Subtotal</span>
                        <span>{formatPrice(subtotal)}</span>
                    </div>

                    {/* Discount Section - Read Only Display */}
                    {discount && (
                        <div className="flex justify-between items-center text-gray-500">
                            <div className="flex items-center gap-2">
                                <span>Discount</span>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                    {discount.name}
                                    {!readOnly && (
                                        <button onClick={() => applyDiscount(null)} className="hover:text-green-900"><X size={12} /></button>
                                    )}
                                </span>
                            </div>
                            <span className="text-green-600 font-bold">
                                -{formatPrice(discountAmount)}
                            </span>
                        </div>
                    )}

                    <div className="flex justify-between text-gray-500">
                        <span>{taxName} ({taxRate}%)</span>
                        <span>{formatPrice(tax)}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-bold text-gray-900 pt-4 border-t border-gray-100">
                        <span>Total</span>
                        <span>{formatPrice(total)}</span>
                    </div>
                </div>

                {!readOnly ? (
                    <button
                        onClick={onCheckout}
                        disabled={items.length === 0}
                        className={`
                            w-full py-4 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95
                            ${items.length === 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                : 'bg-vibepos-primary hover:bg-blue-600 text-white shadow-blue-200'
                            }
                        `}
                    >
                        <CreditCard size={20} />
                        <span>Pay Now {formatPrice(total)}</span>
                    </button>
                ) : (
                    <div className="p-3 bg-blue-50 text-vibepos-primary text-center rounded-xl text-sm font-semibold border border-blue-100">
                        Completing Payment...
                    </div>
                )}
            </div>
        </aside>
    );
};
