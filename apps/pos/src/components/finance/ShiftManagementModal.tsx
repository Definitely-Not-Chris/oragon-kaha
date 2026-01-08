import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign, LogOut, FileText, AlertTriangle } from 'lucide-react';
import { useShift } from '../../contexts/ShiftContext';
import { useCurrency } from '../../lib/useCurrency';

interface ShiftManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ShiftManagementModal = ({ isOpen, onClose }: ShiftManagementModalProps) => {
    const { currentShift, openShift, closeShift, addCashTransaction } = useShift();
    const { formatPrice } = useCurrency();
    const [step, setStep] = useState<'VIEW' | 'OPEN' | 'CLOSE' | 'TX'>('VIEW');

    // Open Shift State
    const [floatAmount, setFloatAmount] = useState('');

    // Close Shift State
    const [actualCash, setActualCash] = useState('');
    const [closingNotes, setClosingNotes] = useState('');

    // Tx State
    const [txType, setTxType] = useState<'PAY_IN' | 'PAY_OUT'>('PAY_OUT');
    const [txAmount, setTxAmount] = useState('');
    const [txReason, setTxReason] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (!currentShift) {
                setStep('OPEN');
            } else {
                setStep('VIEW');
            }
        }
    }, [isOpen, currentShift]);

    const handleOpenShift = async () => {
        const val = parseFloat(floatAmount);
        if (isNaN(val) || val < 0) return;
        await openShift(val);
        onClose();
    };

    const handleCloseShift = async () => {
        const val = parseFloat(actualCash);
        if (isNaN(val) || val < 0) return;
        await closeShift(val, closingNotes);
        onClose();
    };

    const handleAddTx = async () => {
        const val = parseFloat(txAmount);
        if (isNaN(val) || val <= 0 || !txReason) return;
        await addCashTransaction(txType, val, txReason);
        setTxAmount('');
        setTxReason('');
        setStep('VIEW');
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
                    className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="font-bold text-lg text-gray-800">
                            {step === 'OPEN' ? 'Open New Shift' :
                                step === 'CLOSE' ? 'Close Shift & Z-Read' :
                                    step === 'TX' ? 'Cash Transaction' : 'Shift Status'}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {step === 'OPEN' && (
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                                    <DollarSign className="text-blue-600 mt-1" size={20} />
                                    <div>
                                        <p className="text-sm font-bold text-blue-900">Opening Float</p>
                                        <p className="text-xs text-blue-700 mt-1">
                                            Count the money in the drawer before starting sales.
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount</label>
                                    <input
                                        type="number"
                                        autoFocus
                                        value={floatAmount}
                                        onChange={e => setFloatAmount(e.target.value)}
                                        className="w-full text-2xl font-bold p-3 border rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                                <button
                                    onClick={handleOpenShift}
                                    className="w-full py-3 bg-vibepos-primary text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all"
                                >
                                    Start Shift
                                </button>
                            </div>
                        )}

                        {step === 'VIEW' && currentShift && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <p className="text-xs font-bold text-emerald-600 uppercase">Expected Cash</p>
                                        <p className="text-2xl font-bold text-emerald-900 mt-1">{formatPrice(currentShift.expected_cash || 0)}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-xs font-bold text-gray-500 uppercase">Opening Float</p>
                                        <p className="text-xl font-bold text-gray-700 mt-1">{formatPrice(currentShift.opening_float || 0)}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <button
                                        onClick={() => setStep('TX')}
                                        className="w-full py-3 bg-white border-2 border-dashed border-gray-300 text-gray-600 font-bold rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <FileText size={18} /> Add Expense / Pay In
                                    </button>

                                    <button
                                        onClick={() => setStep('CLOSE')}
                                        className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        <LogOut size={18} /> Close Shift
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'TX' && (
                            <div className="space-y-4">
                                <div className="flex bg-gray-100 p-1 rounded-xl">
                                    <button
                                        onClick={() => setTxType('PAY_OUT')}
                                        className={`flex-1 py-2 font-bold text-sm rounded-lg transition-all ${txType === 'PAY_OUT' ? 'bg-white shadow text-red-600' : 'text-gray-500'}`}
                                    >
                                        Pay Out (Expense)
                                    </button>
                                    <button
                                        onClick={() => setTxType('PAY_IN')}
                                        className={`flex-1 py-2 font-bold text-sm rounded-lg transition-all ${txType === 'PAY_IN' ? 'bg-white shadow text-emerald-600' : 'text-gray-500'}`}
                                    >
                                        Pay In (Add Cash)
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Amount</label>
                                    <input
                                        type="number"
                                        autoFocus
                                        value={txAmount}
                                        onChange={e => setTxAmount(e.target.value)}
                                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason / Note</label>
                                    <input
                                        type="text"
                                        value={txReason}
                                        onChange={e => setTxReason(e.target.value)}
                                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                                        placeholder="e.g. Buying Ice"
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button onClick={() => setStep('VIEW')} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancel</button>
                                    <button onClick={handleAddTx} className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black">Save</button>
                                </div>
                            </div>
                        )}

                        {step === 'CLOSE' && (
                            <div className="space-y-4">
                                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                                    <AlertTriangle className="text-amber-600 mt-1" size={20} />
                                    <div>
                                        <p className="text-sm font-bold text-amber-900">Blind Count Required</p>
                                        <p className="text-xs text-amber-700 mt-1">
                                            Count the actual cash in the drawer carefully. This will generate the Z-Reading.
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Actual Cash Counted</label>
                                    <input
                                        type="number"
                                        autoFocus
                                        value={actualCash}
                                        onChange={e => setActualCash(e.target.value)}
                                        className="w-full text-2xl font-bold p-3 border rounded-xl focus:ring-2 focus:ring-amber-100 focus:border-amber-500 outline-none"
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes (Optional)</label>
                                    <textarea
                                        value={closingNotes}
                                        onChange={e => setClosingNotes(e.target.value)}
                                        className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-gray-100 focus:border-gray-300 outline-none h-20 resize-none text-sm"
                                        placeholder="Any discrepancies?"
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button onClick={() => setStep('VIEW')} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl">Cancel</button>
                                    <button
                                        onClick={handleCloseShift}
                                        className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200"
                                    >
                                        End Shift
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
