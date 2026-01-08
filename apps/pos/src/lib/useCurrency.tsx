import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useCallback } from 'react';

export const useCurrency = () => {
    const settings = useLiveQuery(() => db.settings.get('device_settings'));
    const currency = settings?.currency || 'PHP';

    const formatPrice = useCallback((amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    }, [currency]);

    // Helper to just get the symbol if needed
    const getSymbol = () => {
        return (0).toLocaleString('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/\d/g, '').trim();
    }

    return {
        currency,
        formatPrice,
        symbol: getSymbol()
    };
};
