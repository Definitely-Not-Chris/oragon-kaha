import { format } from 'date-fns';
import { useCurrency } from '../../lib/useCurrency';
import { DiscountBookResult } from '../../lib/ReportsEngine';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import { ReportsEngine } from '../../lib/ReportsEngine';

interface Props {
    data: DiscountBookResult;
    onBack: () => void;
}

export const DiscountBookView = ({ data, onBack }: Props) => {
    const { formatPrice } = useCurrency();

    const handlePrint = () => window.print();

    const handleExport = () => {
        const csvData = data.rows.map(row => ({
            Date: row.date,
            Invoice: row.invoice_no,
            'Customer Name': row.customer_name,
            'ID Ref': row.customer_id_ref,
            'Discount Type': row.discount_type,
            'Gross Sales': row.gross_sales,
            'Discount Amount': row.discount_amount,
            'Net Sales': row.net_sales
        }));
        ReportsEngine.exportToCSV(csvData, 'Discount_Book');
    };

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

            {/* Official Header */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 print:shadow-none print:border-none print:p-0">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 uppercase">Discount Book Report</h1>
                    <p className="text-gray-500 font-medium">{format(data.period.start, 'PP')} - {format(data.period.end, 'PP')}</p>
                    <div className="flex justify-between mt-6 text-xs text-gray-600 font-mono border-y border-gray-200 py-2">
                        <span>User: {data.generated_by}</span>
                        <span>Generated: {format(data.generated_at, 'yyyy-MM-dd HH:mm')}</span>
                    </div>
                </div>

                {/* The Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-xs md:text-sm text-left">
                        <thead>
                            <tr className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                                <th className="p-3">Date</th>
                                <th className="p-3">Invoice #</th>
                                <th className="p-3">Customer Name</th>
                                <th className="p-3">ID / Ref #</th>
                                <th className="p-3">Discount Type</th>
                                <th className="p-3 text-right">Gross Amount</th>
                                <th className="p-3 text-right text-red-600">Discount</th>
                                <th className="p-3 text-right">Net Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.rows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-3 font-medium whitespace-nowrap">{row.date}</td>
                                    <td className="p-3 font-mono">{row.invoice_no}</td>
                                    <td className="p-3 font-bold text-gray-900">{row.customer_name}</td>
                                    <td className="p-3 font-mono text-gray-500">{row.customer_id_ref}</td>
                                    <td className="p-3">
                                        <span className="px-2 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-600">
                                            {row.discount_type}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right text-gray-500">{formatPrice(row.gross_sales)}</td>
                                    <td className="p-3 text-right font-bold text-red-600">-{formatPrice(row.discount_amount)}</td>
                                    <td className="p-3 text-right font-bold text-gray-900">{formatPrice(row.net_sales)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-200">
                            <tr>
                                <td colSpan={5} className="p-3 text-right uppercase">Period Totals</td>
                                <td className="p-3 text-right text-gray-500">{formatPrice(data.aggregates.total_gross)}</td>
                                <td className="p-3 text-right text-red-600">-{formatPrice(data.aggregates.total_discount)}</td>
                                <td className="p-3 text-right text-gray-900">{formatPrice(data.aggregates.total_net)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Footer Signatures */}
                <div className="mt-12 grid grid-cols-2 gap-12 print:visible hidden">
                    <div className="border-t border-gray-300 pt-2 text-center text-sm font-bold text-gray-700">
                        Prepared By
                    </div>
                    <div className="border-t border-gray-300 pt-2 text-center text-sm font-bold text-gray-700">
                        Certified Correct
                    </div>
                </div>
            </div>
        </div>
    );
};
