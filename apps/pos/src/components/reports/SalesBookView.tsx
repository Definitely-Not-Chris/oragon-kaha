import { format } from 'date-fns';
import { useCurrency } from '../../lib/useCurrency';
import { SalesBookResult } from '../../lib/ReportsEngine';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import { ReportsEngine } from '../../lib/ReportsEngine';

interface Props {
    data: SalesBookResult;
    onBack: () => void;
}

export const SalesBookView = ({ data, onBack }: Props) => {
    const { formatPrice } = useCurrency();

    const handlePrint = () => window.print();

    const handleExport = () => {
        const csvData = data.rows.map(row => ({
            Date: row.date,
            'Beg. Invoice': row.beg_invoice,
            'End. Invoice': row.end_invoice,
            'Beg. Balance': row.beg_balance,
            'Gross Sales': row.gross_sales,
            'Deductions': row.total_deductions,
            'Net Sales': row.net_sales,
            'End. Balance': row.end_balance,
            'Total Income': row.total_income,
            'Reset Counter': row.reset_counter
        }));
        ReportsEngine.exportToCSV(csvData, 'Sales_Book');
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
                    <h1 className="text-2xl font-bold text-gray-900 uppercase">Sales Book Report</h1>
                    <p className="text-gray-500 font-medium">{format(data.period.start, 'PP')} - {format(data.period.end, 'PP')}</p>
                    <div className="flex justify-between mt-6 text-xs text-gray-600 font-mono border-y border-gray-200 py-2">
                        <span>Machine: {data.machine_info.machine_no}</span>
                        <span>Serial: {data.machine_info.serial_no}</span>
                        <span>Generated: {format(data.generated_at, 'yyyy-MM-dd HH:mm')}</span>
                        <span>User: {data.generated_by}</span>
                    </div>
                </div>

                {/* The Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-xs md:text-sm text-left">
                        <thead>
                            <tr className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                                <th className="p-3">Date</th>
                                <th className="p-3 text-center">Beg. Invoice</th>
                                <th className="p-3 text-center">End. Invoice</th>
                                <th className="p-3 text-right">Beg. Accumulated</th>
                                <th className="p-3 text-right text-emerald-600">Gross Sales</th>
                                <th className="p-3 text-right text-red-500">Deductions</th>
                                <th className="p-3 text-right text-blue-600">Net Sales</th>
                                <th className="p-3 text-right">End. Accumulated</th>
                                {/* <th className="p-3 text-right">Reset</th> */}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.rows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-3 font-medium whitespace-nowrap">{row.date}</td>
                                    <td className="p-3 text-center font-mono">{row.beg_invoice}</td>
                                    <td className="p-3 text-center font-mono">{row.end_invoice}</td>
                                    <td className="p-3 text-right font-mono text-gray-500">{formatPrice(row.beg_balance)}</td>
                                    <td className="p-3 text-right font-bold text-emerald-700">{formatPrice(row.gross_sales)}</td>
                                    <td className="p-3 text-right font-medium text-red-600">-{formatPrice(row.total_deductions)}</td>
                                    <td className="p-3 text-right font-bold text-blue-700">{formatPrice(row.net_sales)}</td>
                                    <td className="p-3 text-right font-mono font-bold text-gray-900">{formatPrice(row.end_balance)}</td>
                                    {/* <td className="p-3 text-right text-gray-400">{row.reset_counter}</td> */}
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 font-bold border-t-2 border-gray-200">
                            <tr>
                                <td colSpan={3} className="p-3 text-right uppercase">Period Totals</td>
                                <td className="p-3 text-right text-gray-400">-</td>
                                <td className="p-3 text-right">{formatPrice(data.aggregates.total_gross)}</td>
                                <td className="p-3 text-right text-red-600">-{formatPrice(data.aggregates.total_deductions)}</td>
                                <td className="p-3 text-right text-blue-700">{formatPrice(data.aggregates.total_net)}</td>
                                <td className="p-3 text-right text-gray-900">{formatPrice(data.aggregates.grand_accumulated_sales)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Footer Signatures (Optional for compliance) */}
                <div className="mt-12 grid grid-cols-2 gap-12 print:visible hidden">
                    <div className="border-t border-gray-300 pt-2 text-center text-sm font-bold text-gray-700">
                        Prepared By
                    </div>
                    <div className="border-t border-gray-300 pt-2 text-center text-sm font-bold text-gray-700">
                        Approved By
                    </div>
                </div>
            </div>
        </div>
    );
};
