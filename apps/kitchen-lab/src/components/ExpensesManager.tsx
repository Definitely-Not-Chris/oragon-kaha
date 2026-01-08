import React from 'react';
import type { Expense } from '../types';
import { useCurrency } from '../context/CurrencyContext';

interface ExpensesManagerProps {
    expenses: Expense;
    updateExpense: (field: keyof Expense, value: number) => void;
}

export const ExpensesManager: React.FC<ExpensesManagerProps> = ({ expenses, updateExpense }) => {
    const { symbol } = useCurrency();

    return (
        <div className="grid grid-cols-2 gap-6 p-4 bg-white rounded-xl border border-gray-200">
            <div>
                <label className="text-sm font-semibold text-gray-600 mb-2 block">Direct Labor Cost</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{symbol}</span>
                    <input
                        type="number"
                        value={expenses.laborCost}
                        onChange={e => updateExpense('laborCost', Number(e.target.value))}
                        className="w-full bg-vibepos-base border border-gray-200 rounded-lg py-2 pl-7 pr-3 focus:ring-2 focus:ring-vibepos-primary focus:outline-none"
                    />
                </div>
            </div>
            <div>
                <label className="text-sm font-semibold text-gray-600 mb-2 block">Rent/Utilities Overhead</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{symbol}</span>
                    <input
                        type="number"
                        value={expenses.rentOverhead}
                        onChange={e => updateExpense('rentOverhead', Number(e.target.value))}
                        className="w-full bg-vibepos-base border border-gray-200 rounded-lg py-2 pl-7 pr-3 focus:ring-2 focus:ring-vibepos-primary focus:outline-none"
                    />
                </div>
            </div>
        </div>
    );
};
