import React, { useState } from 'react';
import { Plus, Trash2, DollarSign, TrendingUp } from 'lucide-react';
import { useExpensesStore } from '../stores/expensesStore';
import { useCurrency } from '../context/CurrencyContext';

export const ExpensesPage = () => {
    const { monthlyExpenses, recipeDefaults, addMonthlyExpense, removeMonthlyExpense, updateRecipeDefaults } = useExpensesStore();
    const { formatPrice, symbol } = useCurrency();

    // Quick Add State
    const [newName, setNewName] = useState('');
    const [newAmount, setNewAmount] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newAmount) return;
        addMonthlyExpense({
            id: Math.random().toString(),
            name: newName,
            amount: Number(newAmount),
            category: 'fixed'
        });
        setNewName('');
        setNewAmount('');
    };

    const totalMonthly = monthlyExpenses.reduce((sum, item) => sum + item.amount, 0);

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            <header>
                <h1 className="text-3xl font-bold text-vibepos-dark flex items-center gap-2">
                    <DollarSign className="text-vibepos-primary" /> Monthly Expenses
                </h1>
                <p className="text-vibepos-secondary">Track your fixed operational costs (Rent, Payroll, etc.)</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main List */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700">Recurring Expenses</h3>
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Monthly</span>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {monthlyExpenses.map(expense => (
                                <div key={expense.id} className="p-4 flex items-center justify-between group hover:bg-gray-50 transition-colors">
                                    <div>
                                        <div className="font-medium text-gray-800">{expense.name}</div>
                                        <div className="text-xs text-gray-400 capitalize">{expense.category} Cost</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-mono font-bold text-vibepos-dark">{formatPrice(expense.amount)}</span>
                                        <button
                                            onClick={() => removeMonthlyExpense(expense.id)}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add New Row */}
                        <form onSubmit={handleAdd} className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <input
                                placeholder="Expense Name (e.g. WiFi)"
                                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-vibepos-primary outline-none"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                            />
                            <div className="relative w-32">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{symbol}</span>
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 pl-6 text-sm focus:ring-2 focus:ring-vibepos-primary outline-none"
                                    value={newAmount}
                                    onChange={e => setNewAmount(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="bg-vibepos-dark text-white p-2 rounded-lg hover:bg-gray-800 transition-colors">
                                <Plus size={20} />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Summary & Defaults */}
                <div className="space-y-6">
                    {/* Total Card */}
                    <div className="bg-vibepos-primary text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-blue-100 text-sm font-bold uppercase tracking-wider mb-1">Total Monthly Burn</h3>
                            <div className="text-3xl font-bold mb-2">{formatPrice(totalMonthly)}</div>
                            <p className="text-xs text-blue-200 opacity-80">This is your break-even baseline before selling a single item.</p>
                        </div>
                        <TrendingUp className="absolute -bottom-4 -right-4 text-white opacity-10 w-32 h-32" />
                    </div>

                    {/* Defaults Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <SettingsIcon /> Recipe Defaults
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Default Target Margin %</label>
                                <input
                                    type="number"
                                    className="w-full bg-vibepos-base border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-vibepos-primary outline-none"
                                    value={recipeDefaults.targetMargin}
                                    onChange={e => updateRecipeDefaults({ targetMargin: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase block mb-1">Default Tax Rate %</label>
                                <input
                                    type="number"
                                    className="w-full bg-vibepos-base border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-vibepos-primary outline-none"
                                    value={recipeDefaults.taxRate}
                                    onChange={e => updateRecipeDefaults({ taxRate: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Mini icon component to avoid imports clutter check if lucide is enough
const SettingsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);
