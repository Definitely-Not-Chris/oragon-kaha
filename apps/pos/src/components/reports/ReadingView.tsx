import { Printer, DollarSign, CreditCard, Banknote, QrCode, Tag, Activity, ArrowLeft } from 'lucide-react';
import { FinancialReadingResult } from '../../lib/ReportsEngine';
import { useCurrency } from '../../lib/useCurrency';

interface Props {
    data: FinancialReadingResult;
    onBack?: () => void;
}

export const ReadingView = ({ data, onBack }: Props) => {
    const { formatPrice } = useCurrency();

    const handlePrint = () => window.print();

    return (
        <div className="max-w-3xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Header / Controls */}
            <div className="flex justify-between items-center mb-8 print:hidden">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className="text-gray-500 hover:text-gray-900 flex items-center gap-2 text-sm font-bold">
                            <ArrowLeft size={16} /> Back
                        </button>
                    )}
                    <h1 className="text-3xl font-bold text-gray-900 uppercase">{data.type.replace('_', ' ')}</h1>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-2 bg-vibepos-primary text-white font-bold rounded-xl shadow-lg hover:bg-opacity-90 transition-colors"
                    >
                        <Printer size={20} /> Print Report
                    </button>
                </div>
            </div>

            {/* Receipt View (Printable) */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200 print:shadow-none print:border-none print:p-0">
                <div className="text-center mb-8 border-b border-gray-100 pb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Oragon Kaha Store</h2>
                    <p className="text-gray-500 text-sm">Official {data.type === 'Z-READING' ? 'Z-Reading' : 'X-Reading'} Report</p>
                    <p className="font-mono font-bold mt-2 text-lg">{data.period.start.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <div className="mt-2 text-xs text-gray-400 font-mono">
                        Generated: {data.generated_at.toLocaleString()} by {data.generated_by}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="bg-gray-50 p-6 rounded-2xl print:bg-transparent print:p-0 print:border print:border-gray-200">
                        <p className="text-gray-500 text-sm font-bold uppercase mb-1">Total Sales</p>
                        <p className="text-3xl font-bold text-gray-900">{formatPrice(data.total_sales)}</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-2xl print:bg-transparent print:p-0 print:border print:border-gray-200">
                        <p className="text-gray-500 text-sm font-bold uppercase mb-1">Total Transactions</p>
                        <p className="text-3xl font-bold text-gray-900">{data.transaction_count}</p>
                    </div>
                </div>

                <div className="space-y-4 font-mono text-sm border-b border-gray-100 pb-8 mb-8">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Opening Invoice #</span>
                        <span className="font-bold text-gray-900">{data.start_invoice}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Closing Invoice #</span>
                        <span className="font-bold text-gray-900">{data.end_invoice}</span>
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
                        <span className="font-bold">{formatPrice(data.payments_breakdown['CASH'] || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl print:bg-transparent print:border-b">
                        <div className="flex items-center gap-3">
                            <CreditCard size={18} className="text-blue-600" />
                            <span className="font-medium">Card</span>
                        </div>
                        <span className="font-bold">{formatPrice(data.payments_breakdown['CARD'] || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl print:bg-transparent print:border-b">
                        <div className="flex items-center gap-3">
                            <QrCode size={18} className="text-purple-600" />
                            <span className="font-medium">Online / QR</span>
                        </div>
                        <span className="font-bold">{formatPrice((data.payments_breakdown['ONLINE'] || 0) + (data.payments_breakdown['QR'] || 0))}</span>
                    </div>
                </div>

                {/* Discount Breakdown */}
                {data.total_discounts > 0 && (
                    <>
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Tag size={18} className="text-gray-400" /> Discount Breakdown
                        </h3>
                        <div className="space-y-2 mb-8 text-sm">
                            <div className="flex justify-between p-2 border-b border-gray-100 border-dashed">
                                <span className="text-gray-600">Senior Citizen</span>
                                <span className="font-bold text-gray-900">{formatPrice(data.discounts_breakdown['Senior Citizen'] || 0)}</span>
                            </div>
                            <div className="flex justify-between p-2 border-b border-gray-100 border-dashed">
                                <span className="text-gray-600">PWD</span>
                                <span className="font-bold text-gray-900">{formatPrice(data.discounts_breakdown['PWD'] || 0)}</span>
                            </div>
                            <div className="flex justify-between p-2 border-b border-gray-100 border-dashed">
                                <span className="text-gray-600">Other Discounts</span>
                                <span className="font-bold text-gray-900">{formatPrice(data.discounts_breakdown['Other'] || 0)}</span>
                            </div>
                            <div className="flex justify-between p-2 pt-3 font-bold text-red-600">
                                <span>Total Deductions</span>
                                <span>-{formatPrice(data.total_discounts)}</span>
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
                        <span className="block font-bold text-xl text-green-600">{data.transaction_stats['COMPLETED'] || 0}</span>
                        <span className="text-gray-500 text-xs uppercase font-bold">Completed</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl print:border print:bg-white">
                        <span className="block font-bold text-xl text-red-600">{data.transaction_stats['VOIDED'] || 0}</span>
                        <span className="text-gray-500 text-xs uppercase font-bold">Voided</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl print:border print:bg-white">
                        <span className="block font-bold text-xl text-orange-600">{data.transaction_stats['REFUNDED'] || 0}</span>
                        <span className="text-gray-500 text-xs uppercase font-bold">Refunded</span>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Gross Sales (Before Discount)</span>
                        <span className="font-bold">{formatPrice(data.total_sales + data.total_discounts)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2 text-red-600">
                        <span className="">Less: Discounts</span>
                        <span className="font-bold">-{formatPrice(data.total_discounts)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2 pt-2 border-t border-dashed">
                        <span className="text-gray-900 font-bold">Net Sales (Inc. Tax)</span>
                        <span className="font-bold text-lg">{formatPrice(data.total_sales)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2 text-gray-500 italic">
                        <span className=""> - VATable Sales</span>
                        <span className="font-bold">{formatPrice(data.total_sales - data.total_tax)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2 text-gray-500 italic">
                        <span className=""> - VAT Amount (12%)</span>
                        <span className="font-bold">{formatPrice(data.total_tax)}</span>
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
