import { useState } from 'react';
import { db } from '../../db';
import { hashPin } from '../../lib/security';
import { X, Lock, Save, Loader2 } from 'lucide-react';
import { useToast } from '../ui/Toast';

interface ChangePinModalProps {
    userId: string;
    username: string;
    onClose: () => void;
}

export const ChangePinModal = ({ userId, username, onClose }: ChangePinModalProps) => {
    const { showToast } = useToast();
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (newPin.length !== 4) {
            showToast('PIN must be exactly 4 digits', 'error');
            return;
        }

        if (newPin !== confirmPin) {
            showToast('PINs do not match', 'error');
            return;
        }

        setLoading(true);

        try {
            const hashedPin = await hashPin(newPin);
            await db.users.update(userId, { password: hashedPin });
            showToast(`PIN updated for ${username}`, 'success');
            onClose();
        } catch (error) {
            console.error('Failed to update PIN', error);
            showToast('Failed to update PIN', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Lock size={18} className="text-blue-600" />
                            Change PIN
                        </h3>
                        <p className="text-sm text-gray-500">Update access for <span className="font-bold text-gray-900">{username}</span></p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New 4-Digit PIN</label>
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            className="w-full text-center text-3xl font-mono tracking-widest py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm PIN</label>
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            className={`w-full text-center text-3xl font-mono tracking-widest py-3 border rounded-xl outline-none focus:ring-2
                                ${confirmPin && confirmPin !== newPin
                                    ? 'border-red-300 focus:ring-red-500 text-red-600'
                                    : 'border-gray-300 focus:ring-blue-500'
                                }
                            `}
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••"
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || newPin.length !== 4 || newPin !== confirmPin}
                        className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /> Update PIN</>}
                    </button>
                </div>
            </div>
        </div>
    );
};
