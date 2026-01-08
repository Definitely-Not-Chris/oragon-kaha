import { Download, Printer, ArrowLeft, TrendingUp, Tag, DollarSign, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { SalesReportResult, DiscountReportResult, ReportsEngine } from '../../lib/ReportsEngine';
import { useCurrency } from '../../lib/useCurrency';

interface Props {
    data: SalesReportResult | DiscountReportResult;
    type: string;
    onBack: () => void;
}

export const ReportResultView = ({ data, type, onBack }: Props) => {
    const { formatPrice } = useCurrency();

    const handleExport = () => {
        // Flatten data for CSV
        if (type === 'SALES_SUMMARY') {
            const result = data as SalesReportResult;
            const csvData = result.data.map(s => ({
                Date: format(new Date(s.timestamp), 'yyyy-MM-dd HH:mm'),
                Invoice: s.invoice_number,
                Total: s.total_amount,
                Net: s.total_amount - (s.tax_amount || 0),
                Tax: s.tax_amount || 0,
                Discount: s.discount_amount || 0,
                Status: s.status,
                Payment: s.payment_method
            }));
            ReportsEngine.exportToCSV(csvData, 'Sales_Report');
        } else if (type === 'DISCOUNT_SUMMARY') {
            const result = data as DiscountReportResult;
            const csvData = result.data.map(s => ({
                Date: format(new Date(s.timestamp), 'yyyy-MM-dd HH:mm'),
                Invoice: s.invoice_number,
                DiscountName: s.discount_name,
                DiscountAmount: s.discount_amount,
                TotalSale: s.total_amount
            }));
            ReportsEngine.exportToCSV(csvData, 'Discount_Report');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (type === 'SALES_SUMMARY') {
        const result = data as SalesReportResult;
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                {/* Header Actions */}
                <div className="flex items-center justify-between print:hidden">
                    <button onClick={onBack} className="text-gray-500 hover:text-gray-900 flex items-center gap-2 text-sm font-bold">
                        <ArrowLeft size={16} /> Back to Parameters
                    </button>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">
                            <Printer size={16} /> Print
                        </button>
                        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-vibepos-primary text-white font-bold rounded-xl hover:bg-opacity-90">
                            <Download size={16} /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Report Title */}
                <div className="text-center pb-6 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900">Sales Summary Report</h2>
                    <p className="text-gray-500 font-medium">
                        {format(result.period.start, 'MMM dd, yyyy')} - {format(result.period.end, 'MMM dd, yyyy')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Generated: {format(result.generated_at, 'Pp')}</p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SummaryCard
                        label="Gross Sales"
                        value={formatPrice(result.metrics.gross_sales)}
                        icon={<TrendingUp size={20} className="text-emerald-600" />}
                        sub="Before deductions"
                    />
                    <SummaryCard
                        label="Net Sales"
                        value={formatPrice(result.metrics.net_sales)}
                        icon={<DollarSign size={20} className="text-blue-600" />}
                        sub="VATable Sales"
                    />
                    <SummaryCard
                        label="Total Tax"
                        value={formatPrice(result.metrics.total_tax)}
                        icon={<Tag size={20} className="text-orange-600" />}
                        sub="Collected"
                    />
                    <SummaryCard
                        label="Discounts"
                        value={formatPrice(result.metrics.total_discount)}
                        icon={<Tag size={20} className="text-red-600" />}
                        sub="Deductions"
                    />
                </div>

                {/* Detailed Breakdown Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Payment Methods */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <CreditCard size={18} className="text-gray-400" /> Payment Methods
                        </h3>
                        <div className="space-y-3">
                            {Object.entries(result.payment_methods).map(([method, amount]) => (
                                <div key={method} className="flex justify-between items-center p-2 border-b border-dashed border-gray-100">
                                    <span className="text-sm font-medium text-gray-600 capitalize">{method}</span>
                                    <span className="font-bold text-gray-900">{formatPrice(amount)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4">Transaction Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl text-center">
                                <span className="block text-2xl font-bold text-gray-900">{result.metrics.transaction_count}</span>
                                <span className="text-xs text-gray-500 font-bold uppercase">Completed</span>
                            </div>
                            <div className="bg-red-50 p-4 rounded-xl text-center">
                                <span className="block text-2xl font-bold text-red-600">{result.metrics.voided_count}</span>
                                <span className="text-xs text-red-400 font-bold uppercase">Voided</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    } else if (type === 'DISCOUNT_SUMMARY') {
        const result = data as DiscountReportResult;
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                {/* Header Actions */}
                <div className="flex items-center justify-between print:hidden">
                    <button onClick={onBack} className="text-gray-500 hover:text-gray-900 flex items-center gap-2 text-sm font-bold">
                        <ArrowLeft size={16} /> Back to Parameters
                    </button>
                    <div className="flex gap-2">
                        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">
                            <Printer size={16} /> Print
                        </button>
                        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-vibepos-primary text-white font-bold rounded-xl hover:bg-opacity-90">
                            <Download size={16} /> Export CSV
                        </button>
                    </div>
                </div>

                <div className="text-center pb-6 border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900">Discount Analysis Report</h2>
                    <p className="text-gray-500 font-medium">
                        {format(result.period.start, 'MMM dd, yyyy')} - {format(result.period.end, 'MMM dd, yyyy')}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <SummaryCard
                        label="Total Discounts Given"
                        value={formatPrice(result.metrics.total_discount_given)}
                        icon={<Tag size={20} className="text-red-500" />}
                        sub="Total Value"
                    />
                    <SummaryCard
                        label="Discounted Txns"
                        value={result.metrics.discounted_transaction_count.toString()}
                        icon={<CreditCard size={20} className="text-blue-500" />}
                        sub="Count"
                    />
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4">Breakdown by Discount Name</h3>
                    <div className="space-y-3">
                        {Object.entries(result.breakdown).map(([name, amount]) => (
                            <div key={name} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                <span className="font-bold text-gray-700">{name || 'Unknown Promo'}</span>
                                <span className="font-bold text-gray-900">{formatPrice(amount)}</span>
                            </div>
                        ))}
                        {Object.keys(result.breakdown).length === 0 && (
                            <p className="text-center text-gray-400 py-4">No discounts found in this period.</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return <div>Unknown Report Type</div>;
};

const SummaryCard = ({ label, value, icon, sub }: { label: string, value: string, icon: any, sub: string }) => (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
        <div className="flex justify-between items-start">
            <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
        </div>
        <div>
            <span className="block text-2xl font-black text-gray-900">{value}</span>
            <div className="flex justify-between items-center mt-1">
                <span className="text-xs font-bold text-gray-400 uppercase">{label}</span>
                <span className="text-[10px] text-gray-400">{sub}</span>
            </div>
        </div>
    </div>
);
