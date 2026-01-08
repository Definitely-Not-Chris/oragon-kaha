import React, { createContext, useContext, useState, useEffect } from 'react';

type Currency = 'USD' | 'PHP';

interface CurrencyContextType {
    currency: Currency;
    symbol: string;
    setCurrency: (currency: Currency) => void;
    formatPrice: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currency, setCurrencyState] = useState<Currency>(() => {
        const saved = localStorage.getItem('vibepos_currency');
        return (saved as Currency) || 'USD';
    });

    useEffect(() => {
        localStorage.setItem('vibepos_currency', currency);
    }, [currency]);

    const symbol = currency === 'USD' ? '$' : '₱';

    const setCurrency = (c: Currency) => {
        setCurrencyState(c);
    };

    const formatPrice = (amount: number) => {
        return `${symbol}${amount.toFixed(2)}`;
    };

    return (
        <CurrencyContext.Provider value={{ currency, symbol, setCurrency, formatPrice }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};
