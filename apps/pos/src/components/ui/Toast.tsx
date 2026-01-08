import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        const newToast = { id, message, type };

        setToasts((prev) => [...prev, newToast]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
                            pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-right-full fade-in duration-300
                            ${toast.type === 'success' ? 'bg-white border-green-200 text-gray-800' : ''}
                            ${toast.type === 'error' ? 'bg-white border-red-200 text-gray-800' : ''}
                            ${toast.type === 'info' ? 'bg-white border-blue-200 text-gray-800' : ''}
                        `}
                    >
                        {toast.type === 'success' && <CheckCircle className="text-green-500" size={20} />}
                        {toast.type === 'error' && <AlertCircle className="text-red-500" size={20} />}
                        {toast.type === 'info' && <Info className="text-blue-500" size={20} />}

                        <span className="font-medium text-sm">{toast.message}</span>

                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
