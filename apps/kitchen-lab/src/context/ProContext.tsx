import React, { createContext, useContext, useState } from 'react';

interface ProContextType {
    isPro: boolean;
    upgradeToPro: () => Promise<void>;
}

const ProContext = createContext<ProContextType | undefined>(undefined);

export const ProProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPro, setIsPro] = useState<boolean>(() => {
        return localStorage.getItem('vibepos_pro_status') === 'true';
    });

    const upgradeToPro = async () => {
        // Simulate API call
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                setIsPro(true);
                localStorage.setItem('vibepos_pro_status', 'true');
                resolve();
            }, 1000);
        });
    };

    return (
        <ProContext.Provider value={{ isPro, upgradeToPro }}>
            {children}
        </ProContext.Provider>
    );
};

export const usePro = () => {
    const context = useContext(ProContext);
    if (context === undefined) {
        throw new Error('usePro must be used within a ProProvider');
    }
    return context;
};
