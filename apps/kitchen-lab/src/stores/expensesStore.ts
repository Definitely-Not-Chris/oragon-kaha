import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MonthlyExpense {
    id: string;
    name: string;
    amount: number;
    category: 'fixed' | 'variable';
}

interface ExpensesState {
    monthlyExpenses: MonthlyExpense[];
    recipeDefaults: {
        targetMargin: number;
        taxRate: number;
    };
    addMonthlyExpense: (expense: MonthlyExpense) => void;
    removeMonthlyExpense: (id: string) => void;
    updateMonthlyExpense: (id: string, expense: Partial<MonthlyExpense>) => void;
    updateRecipeDefaults: (defaults: Partial<ExpensesState['recipeDefaults']>) => void;
}

export const useExpensesStore = create<ExpensesState>()(
    persist(
        (set) => ({
            monthlyExpenses: [
                { id: '1', name: 'Rent', amount: 2000, category: 'fixed' },
                { id: '2', name: 'Salaries', amount: 3500, category: 'fixed' },
                { id: '3', name: 'Utilities', amount: 500, category: 'fixed' }
            ],
            recipeDefaults: {
                targetMargin: 30,
                taxRate: 10
            },
            addMonthlyExpense: (ex) => set((state) => ({ monthlyExpenses: [...state.monthlyExpenses, ex] })),
            removeMonthlyExpense: (id) => set((state) => ({ monthlyExpenses: state.monthlyExpenses.filter(e => e.id !== id) })),
            updateMonthlyExpense: (id, ex) => set((state) => ({
                monthlyExpenses: state.monthlyExpenses.map(e => e.id === id ? { ...e, ...ex } : e)
            })),
            updateRecipeDefaults: (defaults) => set((state) => ({
                recipeDefaults: { ...state.recipeDefaults, ...defaults }
            })),
        }),
        {
            name: 'kitchen-expenses-storage',
        }
    )
);
