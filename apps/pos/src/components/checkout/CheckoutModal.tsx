import { X, User, Tag, Banknote, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export interface PaymentResult {
    method: 'CASH' | 'QR';
    amount_tendered: number;
    change_amount: number;
    reference_number?: string;
}

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (result: PaymentResult) => void;
    total: number;
}

export const CheckoutModal = ({ isOpen, onClose, onComplete, total }: CheckoutModalProps) => {
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR'>('CASH');
    const [amountTendered, setAmountTendered] = useState<string>('');
    const [referenceNumber, setReferenceNumber] = useState('');

    // Validation Logic
    const tenderedNum = parseFloat(amountTendered) || 0;
    const changeAmount = Math.max(0, tenderedNum - total);

    const isPaymentValid =
        tenderedNum >= total &&
        (paymentMethod === 'CASH' || referenceNumber.trim().length > 0);

    const handleAmountChange = (val: string) => {
        // Allow decimals
        if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
            setAmountTendered(val);
        }
    };

    const handleComplete = () => {
        // Construct payload
        const paymentDetails = {
            method: paymentMethod,
            amount_tendered: tenderedNum,
            change_amount: changeAmount,
            reference_number: paymentMethod !== 'CASH' ? referenceNumber : undefined
        };
        // Close with details (in a real app this would call a prop)
        // For now, we assume the parent handles the actual sale creation via context or similar, 
        // but this modal's contract is just visual. 
        // Wait! The onClose prop is void. This modal needs to pass data back.
        // I need to check how it's used.
        // Assuming I'll update the onClose signature or add an onComplete prop later.
        // But for now, let's just emit the event if possible or log it.
        // Actually, the user asked to "record this".
        // I should search where CheckoutModal is used.
        onComplete(paymentDetails);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header: The Bill */}
                        <div className="bg-gray-50 border-b border-gray-200 p-8 text-center relative">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Amount Due</p>
                            <h2 className="text-5xl font-bold text-vibepos-primary">${total.toFixed(2)}</h2>
                        </div>

                        {/* Body: Split View */}
                        <div className="flex flex-col md:flex-row flex-1 min-h-0">

                            {/* LEFT: Context (Customer & Discounts) */}
                            <div className="flex-1 p-8 border-r border-gray-100 space-y-8">
                                {/* Customer Selection */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <User size={16} className="text-vibepos-primary" />
                                        Customer
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-700 font-medium">
                                            Walk-in Customer
                                        </div>
                                        <button className="px-4 py-2 text-sm font-bold text-vibepos-primary bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
                                            Change
                                        </button>
                                    </div>
                                </div>

                                {/* Discount Section */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <Tag size={16} className="text-vibepos-primary" />
                                        Discounts & Vouchers
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {['5% Off', '10% Off', 'Staff', 'Senior', 'Voucher'].map((tag) => (
                                            <button
                                                key={tag}
                                                className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:border-vibepos-primary hover:text-vibepos-primary transition-all active:scale-95"
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="pt-2">
                                        <input
                                            type="text"
                                            placeholder="Enter voucher code..."
                                            className="w-full p-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-vibepos-primary focus:ring-2 focus:ring-blue-100 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Payment Method */}
                            <div className="flex-1 p-8 bg-gray-50/50 space-y-6">
                                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    Select Payment Method
                                </label>

                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => { setPaymentMethod('CASH'); setAmountTendered(''); }}
                                        className={`
                                            p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all
                                            ${paymentMethod === 'CASH'
                                                ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 shadow-sm scale-105'
                                                : 'border-white bg-white text-gray-500 hover:border-gray-300'
                                            }
                                        `}
                                    >
                                        <Banknote size={32} />
                                        <span className="text-xs font-bold">CASH</span>
                                    </button>

                                    <button
                                        onClick={() => { setPaymentMethod('QR'); setAmountTendered(''); }}
                                        className={`
                                            p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all
                                            ${paymentMethod === 'QR'
                                                ? 'border-purple-500 bg-purple-50/50 text-purple-700 shadow-sm scale-105'
                                                : 'border-white bg-white text-gray-500 hover:border-gray-300'
                                            }
                                        `}
                                    >
                                        <QrCode size={32} />
                                        <span className="text-xs font-bold">APP</span>
                                    </button>
                                </div>

                                {/* Dynamic Input based on Method */}
                                <div className="p-4 bg-white rounded-xl border border-gray-200 mt-4 space-y-4">

                                    {/* Amount Paid Input (Universal) */}
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-xs font-semibold text-gray-500">Amount Received / Paid</label>
                                            {!isPaymentValid && tenderedNum > 0 && tenderedNum < total && (
                                                <span className="text-xs font-bold text-red-500 animate-pulse">Insufficient Amount</span>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={amountTendered}
                                                onChange={(e) => handleAmountChange(e.target.value)}
                                                className={`flex-1 p-2 border rounded-lg text-lg font-mono font-bold focus:outline-none focus:ring-2 ${!isPaymentValid && tenderedNum > 0 && tenderedNum < total ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-100'}`}
                                                placeholder="0.00"
                                                autoFocus
                                            />
                                            {paymentMethod === 'CASH' && (
                                                <div className="flex gap-1">
                                                    {[20, 50, 100, 500, 1000].map(amt => (
                                                        <button
                                                            key={amt}
                                                            onClick={() => setAmountTendered(amt.toString())}
                                                            className="px-2 py-1 bg-gray-100 rounded text-xs font-bold hover:bg-gray-200"
                                                        >
                                                            {amt}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Reference ID (Non-Cash) */}
                                    {paymentMethod !== 'CASH' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-xs font-semibold text-gray-500">Reference / Trace No.</label>
                                                {!referenceNumber && (
                                                    <span className="text-xs font-bold text-amber-500">Required</span>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                value={referenceNumber}
                                                onChange={(e) => setReferenceNumber(e.target.value)}
                                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 uppercase"
                                                placeholder="e.g. GCASH Ref No."
                                            />
                                        </motion.div>
                                    )}

                                    {/* Change Display */}
                                    <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-400 uppercase">Change Due</span>
                                        <span className={`text-xl font-bold ${changeAmount > 0 ? 'text-green-600' : 'text-gray-300'}`}>
                                            ${changeAmount.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer: Action */}
                        <div className="p-6 border-t border-gray-200 bg-white">
                            <button
                                onClick={handleComplete}
                                disabled={!isPaymentValid}
                                className={`w-full py-5 text-xl font-bold rounded-xl shadow-lg transition-all transform active:scale-[0.98] ${isPaymentValid
                                    ? 'bg-vibepos-primary hover:bg-blue-600 text-white shadow-blue-200'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                    }`}
                            >
                                {isPaymentValid ? `Pay ${paymentMethod}` : 'Enter Correct Details'}
                            </button>
                            <button onClick={onClose} className="w-full text-center text-sm font-medium text-gray-400 mt-4 hover:text-gray-600">
                                Cancel Transaction
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
