import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { WorkShift } from '@vibepos/shared-types';
import { useToast } from '../components/ui/Toast';
import { useAuth } from './AuthContext';
import { SyncEngine } from '../lib/SyncEngine';

interface ShiftContextType {
    currentShift: WorkShift | null;
    openShift: (float: number) => Promise<void>;
    closeShift: (actualCash: number, notes?: string) => Promise<void>;
    addCashTransaction: (type: 'PAY_IN' | 'PAY_OUT' | 'DROP', amount: number, reason: string) => Promise<void>;
    isLoading: boolean;
    isShiftEnabled: boolean;
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export const ShiftProvider = ({ children }: { children: ReactNode }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isShiftEnabled, setIsShiftEnabled] = useState(true);
    const { showToast } = useToast();
    const { currentUser } = useAuth();

    // 1. Check Settings Once on Mount
    useEffect(() => {
        db.settings.get('device_settings').then(s => {
            setIsShiftEnabled(s?.enable_shifts ?? true);
            setIsLoading(false);
        });
    }, []);

    // 2. Real-time Subscription to Open Shift
    const currentShift = useLiveQuery(
        () => isShiftEnabled ? db.work_shifts.where('status').equals('OPEN').first() : undefined,
        [isShiftEnabled]
    ) ?? null;

    const openShift = async (float: number) => {
        if (currentShift) {
            showToast('A shift is already open!', 'error');
            return;
        }

        const newShift: WorkShift = {
            id: crypto.randomUUID(),
            status: 'OPEN',
            start_time: new Date(),
            opening_float: float,
            expected_cash: float, // Initially just the float
            synced: false
        };

        try {
            await db.work_shifts.add(newShift);
            // Sync the new shift
            SyncEngine.queuePacket({ shifts: [newShift] }).catch(console.error);
            showToast('Shift opened successfully', 'success');
        } catch (error) {
            console.error(error);
            showToast('Failed to open shift', 'error');
        }
    };

    const closeShift = async (actualCash: number, notes?: string) => {
        if (!currentShift || !currentShift.id) return;

        try {
            // Recalculate finals one last time
            const opening = currentShift.opening_float;

            // Re-fetch totals to be safe
            const allSales = await db.sales
                .where('timestamp')
                .above(currentShift.start_time)
                .and(s => s.payment_method === 'CASH')
                .toArray();

            const totalSales = allSales.reduce((sum, s) => sum + s.total_amount, 0);

            const transactions = await db.cash_transactions
                .where('shift_id')
                .equals(currentShift.id)
                .toArray();

            const payIns = transactions
                .filter(t => t.type === 'PAY_IN')
                .reduce((sum, t) => sum + t.amount, 0);

            const payOuts = transactions
                .filter(t => t.type === 'PAY_OUT' || t.type === 'DROP') // Drops are technically payouts
                .reduce((sum, t) => sum + t.amount, 0);

            const expected = opening + totalSales + payIns - payOuts;
            const variance = actualCash - expected;

            await db.work_shifts.update(currentShift.id, {
                status: 'CLOSED',
                end_time: new Date(),
                actual_cash: actualCash,
                expected_cash: expected,
                variance: variance,
                closing_notes: notes,
                synced: false
            });

            // Fetch updated shift to sync
            const updatedShift = await db.work_shifts.get(currentShift.id);
            if (updatedShift) {
                SyncEngine.queuePacket({ shifts: [updatedShift] }).catch(console.error);
            }

            // setCurrentShift(null); <--- Removed, LiveQuery handles this
            showToast('Shift closed successfully', 'success');
        } catch (error) {
            console.error("Failed to close shift:", error);
            showToast('Failed to close shift', 'error');
        }
    };

    const addCashTransaction = async (type: 'PAY_IN' | 'PAY_OUT' | 'DROP', amount: number, reason: string) => {
        if (!currentShift || !currentShift.id) {
            showToast('No open shift', 'error');
            return;
        }

        try {
            await db.cash_transactions.add({
                id: crypto.randomUUID(),
                shift_id: currentShift.id,
                type,
                amount,
                reason,
                timestamp: new Date(),
                performed_by: currentUser?.username || 'Staff',
                synced: false
            });

            // Update expected cash
            const adjustment = type === 'PAY_IN' ? amount : -amount;
            await db.work_shifts.update(currentShift.id, {
                expected_cash: (currentShift.expected_cash || 0) + adjustment,
                synced: false
            });

            // Sync updated shift
            const updatedShift = await db.work_shifts.get(currentShift.id);
            if (updatedShift) {
                SyncEngine.queuePacket({ shifts: [updatedShift] }).catch(console.error);
            }

            // setCurrentShift handles by LiveQuery
            showToast(`Transaction recorded: ${type}`, 'success');
        } catch (error) {
            console.error("Failed to add transaction:", error);
            showToast('Failed to add transaction', 'error');
        }
    };

    return (
        <ShiftContext.Provider value={{ currentShift, openShift, closeShift, addCashTransaction, isLoading, isShiftEnabled }}>
            {children}
        </ShiftContext.Provider>
    );
};

export const useShift = () => {
    const context = useContext(ShiftContext);
    if (!context) throw new Error("useShift must be used within ShiftProvider");
    return context;
};
