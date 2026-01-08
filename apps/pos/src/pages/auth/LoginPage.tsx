import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PinPad } from '../../components/auth/PinPad';
import { useAuth } from '../../contexts/AuthContext';

import { motion } from 'framer-motion';

export const LoginPage = () => {
    const { login, currentUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect if already logged in
    useEffect(() => {
        if (currentUser) {
            const from = location.state?.from?.pathname || '/dashboard';
            navigate(from, { replace: true });
        }
    }, [currentUser, navigate, location]);

    if (currentUser) return null; // Prevent UI flash

    const handleLogin = async (pin: string) => {
        setIsLoading(true);
        setError('');

        // Artificial delay for UX
        await new Promise(r => setTimeout(r, 600));

        const success = await login(pin);
        setIsLoading(false);

        if (success) {
            // Navigation handled by useEffect
        } else {
            setError('Incorrect PIN. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="mb-8 flex flex-col items-center">
                    <div className="w-24 h-24 flex rounded-full items-center justify-center shadow-lg mb-4 overflow-hidden bg-transparent">
                        <img src="/logo.png" alt="Oragon Kaha Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-2xl font-bold">
                        <span>Oragon Kaha POS</span>
                    </h1>
                    <p className="text-gray-500">Sign in to start your shift</p>
                </div>

                <PinPad
                    onCreate={handleLogin}
                    isLoading={isLoading}
                    error={error}
                    label="Enter User PIN"
                />

                <p className="mt-8 text-center text-xs text-gray-400">
                    Default Admin PIN: 1234
                </p>
            </motion.div>
        </div>
    );
};
