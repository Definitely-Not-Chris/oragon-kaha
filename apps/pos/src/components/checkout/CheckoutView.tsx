import { User, CreditCard, Banknote, QrCode, ArrowLeft, Receipt } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../../lib/useCart';
import { useToast } from '../ui/Toast';
import { CustomerSelectionModal } from './CustomerSelectionModal';
import { Customer, Discount } from '@vibepos/shared-types';
import { StatutoryVerificationModal } from './StatutoryVerificationModal';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Tag, Plus, X, Printer, CheckCircle } from 'lucide-react';
import { useCurrency } from '../../lib/useCurrency';
import { printReceipt } from '../../lib/printer';
import { AppSettings, Sale } from '@vibepos/shared-types';

interface CheckoutViewProps {
    onBack: () => void;
    total?: number; // Optional now as we use the hook
}

export const CheckoutView = ({ onBack }: CheckoutViewProps) => {
    const { items, subtotal, tax, taxName, taxRate, serviceCharge, serviceChargeRate, total, completeSale, selectedCustomer, selectCustomer, discount, discountAmount, applyDiscount } = useCart();
    const { formatPrice, symbol } = useCurrency();
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'QR'>('CASH');
    const [cashReceived, setCashReceived] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSelectingCustomer, setIsSelectingCustomer] = useState(false);
    const { showToast } = useToast();

    const [completedSale, setCompletedSale] = useState<Sale | null>(null);

    // Fetch Settings properly for Receipt
    const settings = useLiveQuery(() => db.settings.get('device_settings')) as AppSettings | undefined;

    // Discount Logic
    const activeDiscounts = (useLiveQuery(() => db.discounts.toArray()) || []).filter(d => d.is_active);
    const [isDiscountOpen, setIsDiscountOpen] = useState(false);
    const [verifyingDiscount, setVerifyingDiscount] = useState<Discount | null>(null);

    const handleDiscountClick = (d: Discount) => {
        setIsDiscountOpen(false);
        if (d.is_statutory) {
            setVerifyingDiscount(d);
        } else {
            applyDiscount(d);
        }
    };

    const handleVerification = (details: { id_number: string; holder_name: string }) => {
        if (verifyingDiscount) {
            applyDiscount(verifyingDiscount, details);
            setVerifyingDiscount(null);
            showToast('Discount Verified & Applied', 'success');
        }
    };

    const isPaymentValid =
        paymentMethod !== 'CASH' || ((parseFloat(cashReceived) || 0) >= total);

    const handlePayment = async () => {
        // Redundant check can be kept for safety, but button handles primary logic
        if (paymentMethod === 'CASH') {
            const received = parseFloat(cashReceived);
            if (isNaN(received) || received < total) {
                showToast(`Insufficient cash. Due: $${total.toFixed(2)}`, 'error');
                return;
            }
        }

        setIsProcessing(true);
        const sale = await completeSale(paymentMethod);
        setIsProcessing(false);

        if (sale) {
            setCompletedSale(sale);
        } else {
            // Error handling handled in completeSale
        }
    };

    const handleCashInput = (amount: number) => {
        setCashReceived(amount.toString());
    };

    const handleCustomerSelect = (customer: Customer) => {
        selectCustomer(customer);
        setIsSelectingCustomer(false);
    };

    if (completedSale) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl p-8 text-center animate-in zoom-in duration-300">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 shadow-green-200 shadow-lg">
                    <CheckCircle size={48} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                <p className="text-gray-500 mb-8">
                    Invoice #{completedSale.invoice_number} • {formatPrice(completedSale.total_amount)}
                </p>

                <div className="flex gap-4 w-full max-w-md">
                    <button
                        onClick={() => {
                            if (settings) {
                                printReceipt(completedSale, settings);
                            } else {
                                showToast('Settings not loaded', 'error');
                            }
                        }}
                        className="flex-1 py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:border-vibepos-primary hover:text-vibepos-primary hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                    >
                        <Printer size={20} /> Print Receipt
                    </button>
                    <button
                        onClick={onBack}
                        className="flex-1 py-4 bg-vibepos-primary text-white font-bold rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-200 transition-all"
                    >
                        New Sale
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-200">
            {isSelectingCustomer && (
                <CustomerSelectionModal
                    onSelect={handleCustomerSelect}
                    onClose={() => setIsSelectingCustomer(false)}
                />
            )}

            {verifyingDiscount && (
                <StatutoryVerificationModal
                    discountName={verifyingDiscount.name}
                    onClose={() => setVerifyingDiscount(null)}
                    onVerify={handleVerification}
                />
            )}

            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
                <button
                    onClick={onBack}
                    className="p-3 bg-white border border-gray-200 hover:border-vibepos-primary hover:text-vibepos-primary rounded-xl text-gray-500 transition-all shadow-sm"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Payment Terminal</h2>
                    <p className="text-sm text-gray-400">Transaction #{new Date().getTime().toString().slice(-6)}</p>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                {/* LEFT COLUMN: Payment Interaction (65%) */}
                <div className="flex-[2] p-8 overflow-y-auto border-r border-gray-100 space-y-8">

                    {/* 1. Customer & Discount Group */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Customer */}
                        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm relative overflow-hidden group">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Customer</label>
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 leading-tight">{selectedCustomer?.name || 'Walk-in'}</p>
                                        <p className="text-[10px] text-gray-500">{selectedCustomer ? (selectedCustomer.phone || 'Registered') : 'Guest'}</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsSelectingCustomer(true)} className="text-xs font-bold text-vibepos-primary hover:underline">Change</button>
                            </div>
                        </div>

                        {/* Discount Selector */}
                        <div>
                            {discount ? (
                                <div className="bg-green-50 rounded-2xl p-4 border border-green-100 shadow-sm flex items-center justify-between h-full">
                                    <div>
                                        <label className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1 block">Active Discount</label>
                                        <div className="flex items-center gap-2">
                                            <Tag size={16} className="text-green-600" />
                                            <span className="font-bold text-green-900">{discount.name}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => applyDiscount(null)}
                                        className="p-2 bg-white rounded-full text-green-600 hover:text-red-600 hover:bg-red-50 transition-colors shadow-sm"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <Popover open={isDiscountOpen} onOpenChange={setIsDiscountOpen}>
                                    <PopoverTrigger asChild>
                                        <button className="w-full h-full bg-white rounded-2xl p-4 border-2 border-dashed border-gray-200 hover:border-vibepos-primary hover:bg-blue-50/50 transition-all flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-vibepos-primary group-hover:bg-vibepos-primary group-hover:text-white transition-colors">
                                                    <Tag size={18} />
                                                </div>
                                                <div className="text-left">
                                                    <span className="block font-bold text-gray-600 group-hover:text-vibepos-primary transition-colors">Add Discount</span>
                                                    <span className="block text-[10px] text-gray-400">Coupons / Senior / PWD</span>
                                                </div>
                                            </div>
                                            <Plus size={18} className="text-gray-400 group-hover:text-vibepos-primary" />
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-0 bg-white shadow-xl border border-gray-100 rounded-xl" align="start">
                                        <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                                            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                                <Tag size={16} className="text-vibepos-primary" />
                                                Available Discounts
                                            </h4>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                                            {activeDiscounts.length === 0 && (
                                                <div className="p-6 text-center text-gray-400 text-sm">
                                                    <Tag size={32} className="mx-auto mb-2 opacity-50" />
                                                    No active discounts found
                                                </div>
                                            )}
                                            {activeDiscounts.map(d => (
                                                <button
                                                    key={d.id}
                                                    onClick={() => handleDiscountClick(d)}
                                                    className="w-full text-left px-3 py-3 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all flex justify-between items-center group mb-1"
                                                >
                                                    <div>
                                                        <div className="font-bold text-gray-900 text-sm">{d.name}</div>
                                                        <div className="flex gap-2 mt-1">
                                                            {d.is_statutory && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Statutory</span>}
                                                            {d.code && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">{d.code}</span>}
                                                        </div>
                                                    </div>
                                                    <span className="font-bold text-vibepos-primary bg-blue-50 px-2 py-1 rounded group-hover:bg-white text-sm">
                                                        {d.type === 'PERCENTAGE' ? `${d.value}%` : `$${d.value}`}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            )}
                        </div>
                    </div>

                    {/* 2. Payment Method & Details Combined */}
                    <div className="bg-gray-50 rounded-3xl p-6 border border-gray-200">
                        {/* Method Tabs */}
                        <div className="flex p-1 bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
                            {[
                                { id: 'CASH', icon: Banknote, label: 'Cash Payment' },
                                { id: 'CARD', icon: CreditCard, label: 'Card Terminal' },
                                { id: 'QR', icon: QrCode, label: 'QR / E-Wallet' },
                            ].map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setPaymentMethod(m.id as any)}
                                    className={`
                                        flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all
                                        ${paymentMethod === m.id
                                            ? 'bg-vibepos-primary text-white shadow-md transform scale-[1.02]'
                                            : 'text-gray-500 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    <m.icon size={18} />
                                    <span>{m.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Dynamic Input Area */}
                        <div className="min-h-[200px] flex flex-col items-center justify-center">
                            {paymentMethod === 'CASH' && (
                                <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="relative mb-6">
                                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                            <span className="text-3xl font-bold text-gray-300">{symbol}</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={cashReceived}
                                            onChange={(e) => setCashReceived(e.target.value)}
                                            className={`
                                                w-full pl-12 pr-6 py-6 text-5xl font-bold bg-white border-2 rounded-2xl focus:outline-none transition-all text-center shadow-sm
                                                ${!isPaymentValid
                                                    ? 'border-red-200 text-red-900 focus:border-red-400 focus:ring-4 focus:ring-red-50'
                                                    : 'border-gray-200 text-gray-900 focus:border-vibepos-primary focus:ring-4 focus:ring-blue-50'
                                                }
                                            `}
                                            placeholder="0.00"
                                            autoFocus
                                        />
                                        {!isPaymentValid && cashReceived && (
                                            <div className="absolute -bottom-6 left-0 right-0 text-center">
                                                <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">Insufficient Amount</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Amount Grid */}
                                    <div className="grid grid-cols-4 gap-3 mb-6">
                                        {[10, 20, 50, 100].map(amt => (
                                            <button
                                                key={amt}
                                                onClick={() => handleCashInput(amt)}
                                                className="py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:border-vibepos-primary hover:text-vibepos-primary hover:bg-blue-50 shadow-sm active:scale-95 transition-all text-lg"
                                            >
                                                {symbol}{amt}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="h-12 flex items-center justify-center">
                                        {isPaymentValid && (parseFloat(cashReceived) > total) && (
                                            <div className="flex flex-col items-center animate-bounce-short">
                                                <span className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Change Due</span>
                                                <span className="text-3xl font-mono font-black text-green-600">{formatPrice(parseFloat(cashReceived) - total)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {paymentMethod === 'CARD' && (
                                <div className="text-center animate-in zoom-in duration-300">
                                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-blue-200">
                                        <CreditCard size={48} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready for Card</h3>
                                    <p className="text-gray-500">Insert or Tap on Terminal</p>
                                </div>
                            )}

                            {paymentMethod === 'QR' && (
                                <div className="text-center animate-in zoom-in duration-300">
                                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 inline-block mb-6 relative group cursor-pointer hover:border-vibepos-primary transition-colors">
                                        <div className="absolute inset-0 bg-vibepos-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                                        <div className="w-48 h-48 bg-gray-900 rounded-lg opacity-10" />
                                        <QrCode className="absolute inset-0 m-auto text-gray-900 opacity-20" size={64} />
                                    </div>
                                    <p className="font-bold text-gray-900 text-lg">Scan Customer QR</p>
                                    <p className="text-gray-400 text-sm">Supports GCash, Maya, PayPal</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Order Summary (35%) */}
                <div className="flex-1 bg-white p-8 flex flex-col border-l border-gray-100 shadow-[-10px_0_40px_-20px_rgba(0,0,0,0.05)] z-20">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                            <Receipt size={16} />
                        </div>
                        <h3 className="font-bold text-gray-900">Order Summary</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6">
                        {items.map((item, i) => (
                            <div key={i} className="flex justify-between items-start group">
                                <div className="flex gap-3">
                                    <div className="w-5 h-5 bg-gray-100 rounded text-[10px] font-bold flex items-center justify-center text-gray-500 mt-0.5">{item.quantity}x</div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                                        <p className="text-[10px] text-gray-400">@ {formatPrice(item.price_at_sale)}</p>
                                    </div>
                                </div>
                                <p className="font-bold text-gray-900 text-sm">{formatPrice(item.price_at_sale * item.quantity)}</p>
                            </div>
                        ))}
                        <div className="border-t border-dashed border-gray-200 my-4" />

                        {/* Discount Line Item (Read Only here, manage on left) */}
                        {discount && (
                            <div className="flex justify-between items-center text-green-600 bg-green-50 p-3 rounded-xl mb-2">
                                <span className="text-sm font-bold flex items-center gap-2">
                                    <Tag size={14} />
                                    {discount.name}
                                </span>
                                <span className="font-bold">-{formatPrice(discountAmount)}</span>
                            </div>
                        )}

                        <div className="flex justify-between text-sm text-gray-500 mb-1">
                            <span>Subtotal</span>
                            <span>{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>{taxName} ({taxRate}%)</span>
                            <span>{formatPrice(tax)}</span>
                        </div>
                        {serviceCharge > 0 && (
                            <div className="flex justify-between text-sm text-gray-500 mt-1">
                                <span>Service Charge ({serviceChargeRate}%)</span>
                                <span>{formatPrice(serviceCharge)}</span>
                            </div>
                        )}
                    </div>

                    {/* Total & Pay Button */}

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-end mb-6">
                            <span className="text-sm font-medium text-gray-500">Total Payable</span>
                            <span className="text-4xl font-bold text-vibepos-primary">{formatPrice(total)}</span>
                        </div>
                        <button
                            onClick={handlePayment}
                            disabled={!isPaymentValid || isProcessing}
                            className={`w-full py-4 text-white text-lg font-bold rounded-xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${isPaymentValid ? 'bg-vibepos-primary hover:bg-blue-600 shadow-blue-200' : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                }`}
                        >
                            <span>{isProcessing ? 'Processing...' : (isPaymentValid ? 'Finalize Payment' : 'Enter Valid Amount')}</span>
                        </button>
                    </div>
                </div >

            </div >
        </div >
    );
};
