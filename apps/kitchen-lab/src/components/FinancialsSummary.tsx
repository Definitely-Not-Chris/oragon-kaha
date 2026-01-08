import React from 'react';
import { ChefHat, Download, Lock } from 'lucide-react';
import type { Expense } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { usePro } from '../context/ProContext';

interface FinancialsSummaryProps {
    financials: {
        totalIngredientsCost: number;
        totalCOGS: number;
        suggestedPrice: number;
        profit: number;
        finalPriceWithTax: number;
    };
    expenses: Expense;
    updateExpense: (field: keyof Expense, value: number) => void;
    onExport: () => void;
}

export const FinancialsSummary: React.FC<FinancialsSummaryProps> = ({
    financials,
    expenses,
    updateExpense,
    onExport
}) => {
    const { formatPrice } = useCurrency();
    const { isPro } = usePro();

    return (
        <div className="space-y-6">
            <div className="bg-vibepos-dark text-white p-6 rounded-2xl shadow-xl">
                <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-6">Financials</h3>

                <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Ingredients Cost</span>
                        <span>{formatPrice(financials.totalIngredientsCost)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Labor & Overhead</span>
                        <span>{formatPrice(expenses.laborCost + expenses.rentOverhead)}</span>
                    </div>
                    <div className="border-t border-gray-700 pt-3 flex justify-between font-bold text-lg text-red-400">
                        <span>Total COGS</span>
                        <span>{formatPrice(financials.totalCOGS)}</span>
                    </div>
                </div>

                {/* Margin Slider */}
                <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-300">Target Margin</span>
                        <span className="font-bold text-vibepos-primary">{expenses.targetMargin}%</span>
                    </div>
                    <input
                        type="range"
                        min="0" max="90" step="1"
                        value={expenses.targetMargin}
                        onChange={(e) => updateExpense('targetMargin', Number(e.target.value))}
                        className="w-full accent-vibepos-primary h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700 space-y-4">
                    <div>
                        <label className="text-xs text-gray-500 uppercase block mb-1">Recommended Price (ex. Tax)</label>
                        <div className="text-3xl font-bold font-mono tracking-tighter text-white">
                            {formatPrice(financials.suggestedPrice)}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-[10px] text-gray-500 uppercase block mb-1">Profit / Item</label>
                            <div className="text-lg font-bold text-green-400">+{formatPrice(financials.profit)}</div>
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] text-gray-500 uppercase block mb-1">Tax Rate %</label>
                            <input
                                type="number"
                                value={expenses.finalTaxRate}
                                onChange={(e) => updateExpense('finalTaxRate', Number(e.target.value))}
                                className="w-full bg-gray-700 border-none rounded px-2 py-1 text-white text-sm"
                            />
                        </div>
                    </div>
                    <div className="pt-2 border-t border-gray-700">
                        <label className="text-xs text-gray-500 uppercase block mb-1">Final Sell Price (inc. Tax)</label>
                        <div className="text-xl font-bold font-mono text-vibepos-accent">
                            {formatPrice(financials.finalPriceWithTax)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={onExport}
                    className="col-span-1 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-vibepos-primary hover:border-vibepos-primary font-bold py-3 rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    {isPro ? <Download size={20} /> : <Lock size={18} className="text-gray-400" />}
                    <span>Export</span>
                </button>

                <button className="col-span-1 bg-vibepos-primary hover:bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <ChefHat size={20} />
                    <span>Save</span>
                </button>
            </div>
        </div>
    );
};
