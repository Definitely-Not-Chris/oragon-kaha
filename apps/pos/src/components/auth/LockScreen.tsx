import { useState } from 'react';
import { PinPad } from './PinPad';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';


export const LockScreen = () => {
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (pin: string) => {
        setIsLoading(true);
        setError('');

        // Artificial delay for UX
        await new Promise(r => setTimeout(r, 600));

        const success = await login(pin);
        setIsLoading(false);
        if (!success) {
            setError('Incorrect PIN. Please try again.');
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-vibepos-surface z-[100] flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-white"
            >
                <div className="mb-8 flex flex-col items-center">
                    <div className="w-24 h-24 flex items-center justify-center mb-4 overflow-hidden bg-transparent">
                        <img src="/logo.png" alt="Oragon Kaha Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-xl font-bold">
                        <span className="text-vibepos-primary">Oragon Kaha</span> POS
                    </h1>
                    <p className="text-gray-500">Secure Access</p>
                </div>

                <PinPad
                    onCreate={handleLogin}
                    isLoading={isLoading}
                    error={error}
                    label="Enter User PIN"
                />

                <p className="mt-8 text-xs text-gray-400">
                    Default Admin PIN: 1234
                </p>
            </motion.div>
        </AnimatePresence>
    );
};
