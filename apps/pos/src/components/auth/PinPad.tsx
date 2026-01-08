import { useState } from 'react';
import { Delete, ArrowRight } from 'lucide-react';

interface PinPadProps {
    onCreate: (pin: string) => void;
    isLoading?: boolean;
    label?: string;
    error?: string;
}

export const PinPad = ({ onCreate, isLoading = false, label = "Enter PIN", error }: PinPadProps) => {
    const [pin, setPin] = useState('');

    const handleNum = (num: number) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            // Auto submit on 4th digit?
            // if (newPin.length === 4) onCreate(newPin); 
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handleSubmit = () => {
        if (pin.length > 0) {
            onCreate(pin);
            setPin(''); // Reset on submit attempt
        }
    };

    return (
        <div className="w-full max-w-sm mx-auto p-6 bg-white rounded-2xl shadow-xl">
            <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-2">{label}</h2>
                <div className="flex gap-4 justify-center h-4 mb-2">
                    {[0, 1, 2, 3].map(i => (
                        <div
                            key={i}
                            className={`w-3 h-3 rounded-full transition-colors ${i < pin.length ? 'bg-vibepos-primary' : 'bg-gray-200'
                                }`}
                        />
                    ))}
                </div>
                {error && <p className="text-sm text-red-500 animate-pulse">{error}</p>}
            </div>

            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                        key={num}
                        onClick={() => handleNum(num)}
                        className="h-16 rounded-xl bg-gray-50 text-2xl font-bold text-gray-700 hover:bg-white hover:shadow-md hover:scale-105 transition-all active:scale-95 border border-gray-100"
                    >
                        {num}
                    </button>
                ))}
                <div />
                <button
                    onClick={() => handleNum(0)}
                    className="h-16 rounded-xl bg-gray-50 text-2xl font-bold text-gray-700 hover:bg-white hover:shadow-md hover:scale-105 transition-all active:scale-95 border border-gray-100"
                >
                    0
                </button>
                <button
                    onClick={handleDelete}
                    className="h-16 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 hover:scale-105 transition-all active:scale-95"
                >
                    <Delete size={24} />
                </button>
            </div>

            <button
                onClick={handleSubmit}
                disabled={pin.length === 0 || isLoading}
                className="w-full mt-6 py-4 bg-vibepos-primary text-white font-bold rounded-xl shadow-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
                {isLoading ? 'Verifying...' : 'Login'} <ArrowRight size={20} />
            </button>
        </div>
    );
};
