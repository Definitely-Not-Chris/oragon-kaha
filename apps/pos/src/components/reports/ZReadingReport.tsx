import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { startOfDay, endOfDay } from 'date-fns';
import { db } from '../../db';
import { Sale } from '@vibepos/shared-types';
import { Printer, DollarSign, CreditCard, Banknote, QrCode, Tag, Activity } from 'lucide-react';

export const ZReadingReport = () => {
    // Current date filter (default to today)
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Query sales for the selected date
    const dailySales = useLiveQuery(async () => {
        const start = startOfDay(selectedDate);
        const end = endOfDay(selectedDate);

        // Dexie doesn't have elaborate date filtering on index in one go easily without range
        // Since we have timestamp index, we can use it.
        return await db.sales
            .where('timestamp')
            .between(start, end)
            .toArray();
    }, [selectedDate]);

    // Calculate Aggregates
    const metrics = useMemo(() => {
        if (!dailySales) return null;

        // 1. Transaction Stats (All Records)
        const txBreakdown = dailySales.reduce((acc: Record<string, number>, s: Sale) => {
            const status = s.status || 'COMPLETED';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, { COMPLETED: 0, VOIDED: 0, REFUNDED: 0 } as Record<string, number>);

        const txCount = dailySales.length;

        // 2. Financials (Only COMPLETED Sales count towards revenue)
        const validSales = dailySales.filter(s => s.status !== 'VOIDED' && s.status !== 'REFUNDED');

        const totalSales = validSales.reduce((sum: number, s: Sale) => sum + s.total_amount, 0);

        // Tax Calculation (Backwards from Total)
        // If Price is Tax Inclusive (VAT 12% in PH usually): 
        // Net = Total / 1.12
        // Tax = Total - Net
        const totalTax = totalSales - (totalSales / 1.12);

        // 3. Payment Methods (Valid Only)
        const byMethod = validSales.reduce((acc: Record<string, number>, sale: Sale) => {
            // Handle both 'ONLINE' and 'QR' as same bucket if needed, or keep separate
            const method = sale.payment_method;
            acc[method] = (acc[method] || 0) + sale.total_amount;
            return acc;
        }, {} as Record<string, number>);

        // 4. Discounts (Valid Only)
        const discountBreakdown = validSales.reduce((acc: Record<string, number>, s: Sale) => {
            if (s.discount_amount && s.discount_amount > 0) {
                let key = 'Other';
                // Normalize names to catch variations
                const name = (s.discount_name || '').toLowerCase();
                if (name.includes('senior')) key = 'Senior Citizen';
                else if (name.includes('pwd')) key = 'PWD';

                acc[key] = (acc[key] || 0) + s.discount_amount;
            }
            return acc;
        }, { 'Senior Citizen': 0, 'PWD': 0, 'Other': 0 } as Record<string, number>);

        const totalDiscounts = Object.values(discountBreakdown).reduce((a, b) => a + b, 0);


        return {
            totalSales,
            totalTax,
            totalDiscounts,
            txCount,
            txBreakdown,
            byMethod,
            discountBreakdown,
            startInvoice: dailySales[0]?.invoice_number || '-',
            endInvoice: dailySales[dailySales.length - 1]?.invoice_number || '-'
        };
    }, [dailySales]);

    if (!metrics) return <div className="p-8">Loading Report...</div>;

    return (
        <div className="max-w-3xl mx-auto p-6">
            {/* Header / Controls */}
            <div className="flex justify-between items-center mb-8 print:hidden">
                <h1 className="text-3xl font-bold text-gray-900">Z-Reading Report</h1>
                <div className="flex gap-4">
                    <input
                        type="date"
                        value={selectedDate.toISOString().split('T')[0]}
                        onChange={(e) => setSelectedDate(new Date(e.target.value))}
                        className="px-4 py-2 border border-gray-200 rounded-xl"
                    />
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-6 py-2 bg-vibepos-primary text-white font-bold rounded-xl shadow-lg hover:bg-blue-600 transition-colors"
                    >
                        <Printer size={20} /> Print Z-Read
                    </button>
                </div>
            </div>

            {/* Receipt View (Printable) */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 print:shadow-none print:border-none print:p-0">
                <div className="text-center mb-8 border-b border-gray-100 pb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Oragon Kaha Store</h2>
                    <p className="text-gray-500 text-sm">Daily Sales Report (Z-Reading)</p>
                    <p className="font-mono font-bold mt-2 text-lg">{selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="bg-gray-50 p-6 rounded-2xl print:bg-transparent print:p-0 print:border print:border-gray-200">
                        <p className="text-gray-500 text-sm font-bold uppercase mb-1">Gross Sales</p>
                        <p className="text-3xl font-bold text-gray-900">${metrics.totalSales.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-2xl print:bg-transparent print:p-0 print:border print:border-gray-200">
                        <p className="text-gray-500 text-sm font-bold uppercase mb-1">Total Transactions</p>
                        <p className="text-3xl font-bold text-gray-900">{metrics.txCount}</p>
                    </div>
                </div>

                <div className="space-y-4 font-mono text-sm border-b border-gray-100 pb-8 mb-8">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Opening Invoice #</span>
                        <span className="font-bold text-gray-900">{metrics.startInvoice}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Closing Invoice #</span>
                        <span className="font-bold text-gray-900">{metrics.endInvoice}</span>
                    </div>
                </div>

                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign size={18} className="text-gray-400" /> Payment Breakdown
                </h3>
                <div className="space-y-3 mb-8">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl print:bg-transparent print:border-b">
                        <div className="flex items-center gap-3">
                            <Banknote size={18} className="text-green-600" />
                            <span className="font-medium">Cash</span>
                        </div>
                        <span className="font-bold">${(metrics.byMethod['CASH'] || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl print:bg-transparent print:border-b">
                        <div className="flex items-center gap-3">
                            <CreditCard size={18} className="text-blue-600" />
                            <span className="font-medium">Card</span>
                        </div>
                        <span className="font-bold">${(metrics.byMethod['CARD'] || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl print:bg-transparent print:border-b">
                        <div className="flex items-center gap-3">
                            <QrCode size={18} className="text-purple-600" />
                            <span className="font-medium">Online / QR</span>
                        </div>
                        <span className="font-bold">${((metrics.byMethod['ONLINE'] || 0) + (metrics.byMethod['QR'] || 0)).toFixed(2)}</span>
                    </div>
                </div>

                {/* Discount Breakdown */}
                {metrics.totalDiscounts > 0 && (
                    <>
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Tag size={18} className="text-gray-400" /> Discount Breakdown
                        </h3>
                        <div className="space-y-2 mb-8 text-sm">
                            <div className="flex justify-between p-2 border-b border-gray-100 border-dashed">
                                <span className="text-gray-600">Senior Citizen</span>
                                <span className="font-bold text-gray-900">${(metrics.discountBreakdown['Senior Citizen'] || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between p-2 border-b border-gray-100 border-dashed">
                                <span className="text-gray-600">PWD</span>
                                <span className="font-bold text-gray-900">${(metrics.discountBreakdown['PWD'] || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between p-2 border-b border-gray-100 border-dashed">
                                <span className="text-gray-600">Other Discounts</span>
                                <span className="font-bold text-gray-900">${(metrics.discountBreakdown['Other'] || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between p-2 pt-3 font-bold text-red-600">
                                <span>Total Deductions</span>
                                <span>-${metrics.totalDiscounts.toFixed(2)}</span>
                            </div>
                        </div>
                    </>
                )}

                {/* Transaction Stats */}
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity size={18} className="text-gray-400" /> Transaction Stats
                </h3>
                <div className="grid grid-cols-3 gap-4 mb-8 text-center text-sm">
                    <div className="bg-gray-50 p-3 rounded-xl print:border print:bg-white">
                        <span className="block font-bold text-xl text-green-600">{metrics.txBreakdown['COMPLETED'] || 0}</span>
                        <span className="text-gray-500 text-xs uppercase font-bold">Completed</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl print:border print:bg-white">
                        <span className="block font-bold text-xl text-red-600">{metrics.txBreakdown['VOIDED'] || 0}</span>
                        <span className="text-gray-500 text-xs uppercase font-bold">Voided</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl print:border print:bg-white">
                        <span className="block font-bold text-xl text-orange-600">{metrics.txBreakdown['REFUNDED'] || 0}</span>
                        <span className="text-gray-500 text-xs uppercase font-bold">Refunded</span>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Gross Sales (Before Discount)</span>
                        <span className="font-bold">${(metrics.totalSales + metrics.totalDiscounts).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2 text-red-600">
                        <span className="">Less: Discounts</span>
                        <span className="font-bold">-${metrics.totalDiscounts.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2 pt-2 border-t border-dashed">
                        <span className="text-gray-900 font-bold">Net Sales (Inc. Tax)</span>
                        <span className="font-bold text-lg">${metrics.totalSales.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2 text-gray-500 italic">
                        <span className=""> - VATable Sales</span>
                        <span className="">${(metrics.totalSales - metrics.totalTax).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2 text-gray-500 italic">
                        <span className=""> - VAT Amount (12%)</span>
                        <span className="">${metrics.totalTax.toFixed(2)}</span>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t-2 border-dashed border-gray-300 text-center text-xs text-gray-400 print:mt-12">
                    <p>End of Report • {new Date().toLocaleString()}</p>
                    <p>Printed by Oragon Kaha</p>
                </div>
            </div>
        </div>
    );
};
