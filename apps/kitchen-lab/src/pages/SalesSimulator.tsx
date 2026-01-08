import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Target, Calendar, ArrowRight } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

export const SalesSimulator = () => {
    // 1. Fixed Expenses Input
    const [expenses, setExpenses] = useState({
        rent: 2000,
        utilities: 500,
        payroll: 3000,
        software: 100,
        marketing: 400,
        other: 200
    });

    const { symbol, formatPrice } = useCurrency(); // Use currency context

    // 2. Business Params
    const [avgTicketSize, setAvgTicketSize] = useState(25);
    const [avgGrossMarginPercent, setAvgGrossMarginPercent] = useState(70); // 70% Profit on Food
    const [targetNetProfit, setTargetNetProfit] = useState(5000);

    // 3. Scenario Params
    const [projectedDailySales, setProjectedDailySales] = useState(500); // 500/day
    const [projectedDays, setProjectedDays] = useState(30);

    // Calculations
    const totalFixedCosts = Object.values(expenses).reduce((a, b) => a + b, 0);
    const grossMarginRatio = avgGrossMarginPercent / 100;

    // Break Even Analysis
    const breakEvenSalesParams = {
        monthly: totalFixedCosts / grossMarginRatio,
        daily: (totalFixedCosts / grossMarginRatio) / 30,
        units: (totalFixedCosts / grossMarginRatio) / avgTicketSize
    };

    // Target Profit Analysis
    const requiredSalesForTarget = (totalFixedCosts + targetNetProfit) / grossMarginRatio;

    // Scenario Analysis
    const scenarioRevenue = projectedDailySales * projectedDays;
    const scenarioCOGS = scenarioRevenue * (1 - grossMarginRatio);
    const scenarioGrossProfit = scenarioRevenue - scenarioCOGS;
    // Assuming fixed costs are monthly, we adjust for days if needed, but for simplicity let's assume monthly projection
    // If days != 30, we should pro-rate fixed costs? Or just subtract monthly fixed costs? 
    // Let's assume the scenario is "Result for this Period".
    const proRatedFixedCosts = (totalFixedCosts / 30) * projectedDays;
    const scenarioNetProfit = scenarioGrossProfit - proRatedFixedCosts;

    const InputField = ({ label, value, onChange, prefix = symbol }: any) => (
        <div className="space-y-1">
            <label className="text-xs font-semibold text-vibepos-secondary uppercase tracking-wider">{label}</label>
            <div className="relative">
                {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{prefix}</span>}
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className={`w-full bg-vibepos-base border border-gray-200 rounded-lg py-2 ${prefix ? 'pl-7' : 'pl-3'} pr-3 focus:ring-2 focus:ring-vibepos-primary focus:outline-none transition-all font-mono text-vibepos-dark`}
                />
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-10">
            <header>
                <h1 className="text-3xl font-bold text-vibepos-dark">Sales Simulator</h1>
                <p className="text-vibepos-secondary">Forecast profits and calculate break-even points.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT: Inputs */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Expenses Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-red-50 text-red-500 rounded-lg"><DollarSign size={20} /></div>
                            <h3 className="font-bold text-lg">Monthly Expenses</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Rent & Space" value={expenses.rent} onChange={(v: number) => setExpenses({ ...expenses, rent: v })} />
                            <InputField label="Payroll" value={expenses.payroll} onChange={(v: number) => setExpenses({ ...expenses, payroll: v })} />
                            <InputField label="Utilities" value={expenses.utilities} onChange={(v: number) => setExpenses({ ...expenses, utilities: v })} />
                            <InputField label="Marketing" value={expenses.marketing} onChange={(v: number) => setExpenses({ ...expenses, marketing: v })} />
                            <InputField label="Software/Misc" value={expenses.software} onChange={(v: number) => setExpenses({ ...expenses, software: v })} />
                            <InputField label="Other" value={expenses.other} onChange={(v: number) => setExpenses({ ...expenses, other: v })} />
                        </div>
                        <div className="mt-2 pt-4 border-t border-gray-100 flex justify-between items-center bg-red-50/50 p-3 rounded-xl">
                            <span className="font-medium text-red-800">Total Fixed Costs</span>
                            <span className="font-bold text-xl text-red-600">{formatPrice(totalFixedCosts)}</span>
                        </div>
                    </div>

                    {/* Business Logic Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><Target size={20} /></div>
                            <h3 className="font-bold text-lg">Business Targets</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Avg. Gross Margin %" value={avgGrossMarginPercent} onChange={setAvgGrossMarginPercent} prefix="" />
                            <InputField label="Avg. Ticket Size" value={avgTicketSize} onChange={setAvgTicketSize} />
                            <div className="col-span-2">
                                <InputField label="Target Net Profit" value={targetNetProfit} onChange={setTargetNetProfit} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Results */}
                <div className="lg:col-span-7 space-y-6">
                    {/* Critical Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <motion.div layout className="bg-vibepos-dark text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <TrendingUp size={100} />
                            </div>
                            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-1">Break-Even Sales</h3>
                            <div className="text-4xl font-bold mb-2">{formatPrice(breakEvenSalesParams.monthly)}/mo</div>
                            <p className="text-sm text-gray-400">
                                You need to sell <span className="text-white font-bold">{Math.ceil(breakEvenSalesParams.units)} units</span> to allow operations to hit {formatPrice(0)}.
                            </p>
                        </motion.div>

                        <motion.div layout className="bg-vibepos-primary text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Target size={100} />
                            </div>
                            <h3 className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">Sales for Target</h3>
                            <div className="text-4xl font-bold mb-2">{formatPrice(requiredSalesForTarget)}/mo</div>
                            <p className="text-sm text-blue-100">
                                To profit <b>{formatPrice(targetNetProfit)}</b>, you need <b>{formatPrice(requiredSalesForTarget / 30)}</b> daily.
                            </p>
                        </motion.div>
                    </div>

                    {/* Scenario Simulator */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="p-2 bg-purple-50 text-purple-500 rounded-lg"><Calendar size={20} /></div>
                            <h3 className="font-bold text-lg">Profit Projector</h3>
                        </div>

                        <div className="flex flex-wrap items-end gap-4 mb-8 bg-gray-50 p-4 rounded-xl">
                            <div className="flex-1 min-w-[150px]">
                                <InputField label="Projected Daily Sales" value={projectedDailySales} onChange={setProjectedDailySales} />
                            </div>
                            <div className="flex items-center pb-3 text-gray-400">
                                <ArrowRight size={20} />
                            </div>
                            <div className="flex-1 min-w-[100px]">
                                <InputField label="Duration (Days)" value={projectedDays} onChange={setProjectedDays} prefix="" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                            <div className="space-y-1">
                                <div className="text-xs text-gray-500 uppercase font-semibold">Projected Revenue</div>
                                <div className="text-2xl font-bold text-vibepos-dark">{formatPrice(scenarioRevenue)}</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs text-gray-500 uppercase font-semibold">Est. Costs</div>
                                <div className="text-2xl font-bold text-red-500">-{formatPrice(scenarioCOGS + proRatedFixedCosts)}</div>
                                <div className="text-xs text-gray-400">COGS + Fixed</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs text-gray-500 uppercase font-semibold">Net Profit</div>
                                <div className={`text-3xl font-bold ${scenarioNetProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {formatPrice(scenarioNetProfit)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
