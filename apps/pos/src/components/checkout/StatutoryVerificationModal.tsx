import { motion } from 'framer-motion';
import { useState } from 'react';
import { X, Check, ShieldCheck } from 'lucide-react';
import { useToast } from '../ui/Toast';

interface StatutoryVerificationModalProps {
    discountName: string;
    onClose: () => void;
    onVerify: (details: { id_number: string; holder_name: string }) => void;
}

export const StatutoryVerificationModal = ({ discountName, onClose, onVerify }: StatutoryVerificationModalProps) => {
    const [idNumber, setIdNumber] = useState('');
    const [holderName, setHolderName] = useState('');
    const { showToast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!idNumber.trim()) {
            showToast('ID Number is required', 'error');
            return;
        }
        if (!holderName.trim()) {
            showToast('Card Holder Name is required', 'error');
            return;
        }

        onVerify({ id_number: idNumber, holder_name: holderName });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-amber-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Verify Discount</h3>
                            <p className="text-xs text-amber-700 font-medium">{discountName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-sm text-gray-500 mb-4">
                        Please enter the details from the customer's ID card (Senior Citizen / PWD) to validate this statutory discount.
                    </p>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ID Number</label>
                        <input
                            type="text"
                            value={idNumber}
                            onChange={(e) => setIdNumber(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:outline-none bg-gray-50 focus:bg-white font-mono"
                            placeholder="e.g. 123-456-789"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Card Holder Name</label>
                        <input
                            type="text"
                            value={holderName}
                            onChange={(e) => setHolderName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:outline-none bg-gray-50 focus:bg-white"
                            placeholder="e.g. Juan Dela Cruz"
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all flex items-center justify-center gap-2"
                        >
                            <Check size={18} />
                            Verify & Apply
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};
