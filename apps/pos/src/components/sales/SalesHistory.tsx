import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useState } from 'react';
import { Search, SortAsc, SortDesc, CheckCircle, CloudOff, Download, XCircle, RefreshCcw, Loader2 } from 'lucide-react';
import { FilterTabs } from '../ui/FilterTabs';
import { Sale } from '@vibepos/shared-types';
import { TransactionDetailsModal } from './TransactionDetailsModal';
import { useCurrency } from '../../lib/useCurrency';

import { DateRange } from 'react-day-picker';

import { DateRangePicker } from '../ui/DateRangePicker';
import { startOfDay, endOfDay } from 'date-fns';

type DateFilterType = 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'LAST_WEEK' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM' | 'ALL';

export const SalesHistory = () => {
    const { formatPrice } = useCurrency();
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [dateFilter, setDateFilter] = useState<DateFilterType | 'ALL'>('ALL');
    const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'CASH' | 'CARD' | 'ONLINE'>('ALL');
    const [date, setDate] = useState<DateRange | undefined>(undefined);

    // Selection for Modal
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    // We can remove manual refs for shadcn Popover.





    // Fetch sales from Dexie with JS Filtering
    const data = useLiveQuery(async () => {
        let collection = db.sales.orderBy('timestamp');

        // Initial sort by date is efficient in Dexie, but we might resort later for Amount
        if (sortOrder === 'desc') { // Always sort by date initially, as 'sortBy' state is removed
            collection = collection.reverse();
        }

        const [allSales, syncQueue] = await Promise.all([
            collection.toArray(),
            db.sync_queue.where('status').equals('PROCESSING').toArray()
        ]);

        // Extract IDs of sales currently being synced
        const processingIds = new Set<string>();
        syncQueue.forEach(item => {
            const payload = item.payload as any;
            if (payload.sales && Array.isArray(payload.sales)) {
                payload.sales.forEach((s: Sale) => {
                    if (s.id) processingIds.add(s.id);
                });
            }
        });

        let filtered = allSales.filter(sale => {
            // 1. Payment Method
            if (paymentFilter !== 'ALL' && sale.payment_method !== paymentFilter) return false;

            // 2. Search (Order #, Amount, Customer, Status)
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const idMatch = (sale.order_number || sale.id || '').toLowerCase().includes(term);
                const amountMatch = sale.total_amount.toString().includes(term);
                const customerMatch = (sale.customer_name || '').toLowerCase().includes(term);
                // @ts-ignore - status might be new enum
                const statusMatch = (sale.status || '').toLowerCase().includes(term);

                if (!idMatch && !amountMatch && !customerMatch && !statusMatch) return false;
            }

            // 3. Date Filter (Unified Logic using 'date' state or 'dateFilter')
            // If date state is present, use it. Presets also populate 'date'.
            if (date?.from) {
                const saleDate = new Date(sale.timestamp);
                if (saleDate < startOfDay(date.from)) return false;
                if (date.to && saleDate > endOfDay(date.to)) return false;
            } else if (dateFilter !== 'ALL' && dateFilter !== 'CUSTOM') {
                // Fallback to legacy logic if date state is somehow empty but filter is set? 
                // Actually, handlePresetSelect sets both.
                // But initial load 'ALL' has undefined date.
                return true;
            }

            return true;
        });

        return { sales: filtered, processingIds };
    }, [sortOrder, paymentFilter, searchTerm, dateFilter, date]);

    const sales = data?.sales;
    const processingIds = data?.processingIds;

    const handleExportCsv = () => {
        if (!sales || sales.length === 0) return;

        const headers = ['Date', 'Time', 'Order #', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Sync'];
        const rows = sales.map(s => {
            const date = s.timestamp instanceof Date ? s.timestamp : new Date(s.timestamp);
            return [
                date.toLocaleDateString(),
                date.toLocaleTimeString(),
                s.order_number || s.id,
                s.customer_name || 'Walk-in',
                s.items.map(i => `${i.quantity}x ${i.name}`).join('; '),
                s.total_amount.toFixed(2),
                s.payment_method,
                s.status || 'COMPLETED',
                s.synced ? 'Yes' : 'No'
            ].map(cell => `"${cell}"`).join(','); // Quote cells to handle commas
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `sales_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col h-full bg-vibepos-base p-6 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
                    <p className="text-gray-500">Manage your offline & synced sales</p>
                </div>

                {/* Sort Controls */}
                <div className="flex gap-2">
                    <button
                        onClick={handleExportCsv}
                        className="p-2 rounded-lg text-gray-400 hover:text-vibepos-primary hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-100"
                        title="Export CSV"
                    >
                        <Download size={20} />
                    </button>
                    <div className="flex gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                        {/* Sort Criteria Toggle */}
                        {/* <div className="flex bg-gray-100 rounded-lg p-0.5">
                            <button
                                onClick={() => setSortBy('date')}
                                className={`px-2 py-1.5 text-xs font-bold rounded-md transition-all ${sortBy === 'date' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                            >
                                Date
                            </button>
                            <button
                                onClick={() => setSortBy('amount')}
                                className={`px-2 py-1.5 text-xs font-bold rounded-md transition-all ${sortBy === 'amount' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                            >
                                Amt
                            </button>
                        </div> */}
                        {/* <div className="w-px bg-gray-200 my-1"></div> */}
                        <button
                            onClick={() => setSortOrder('desc')}
                            className={`p-2 rounded-lg transition-colors ${sortOrder === 'desc' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Descending"
                        >
                            <SortDesc size={20} />
                        </button>
                        <button
                            onClick={() => setSortOrder('asc')}
                            className={`p-2 rounded-lg transition-colors ${sortOrder === 'asc' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Ascending"
                        >
                            <SortAsc size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-6 flex flex-col lg:flex-row gap-4">

                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search Order #, Customer, Amount..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vibepos-primary/20 focus:border-vibepos-primary transition-all"
                    />
                </div>

                {/* Filters Group */}
                <div className="flex gap-3 overflow-x-auto pb-2 lg:pb-0">

                    {/* Date Range Picker */}
                    <DateRangePicker
                        date={date}
                        setDate={setDate}
                        onPresetSelect={(preset) => setDateFilter(preset as any)}
                    />

                    {/* Payment Method Pills */}
                    <FilterTabs
                        value={paymentFilter}
                        onChange={setPaymentFilter}
                        options={[
                            { label: 'All', value: 'ALL' },
                            { label: 'Cash', value: 'CASH' },
                            { label: 'Card', value: 'CARD' },
                            { label: 'QR', value: 'ONLINE' },
                        ]}
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Order #</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Items</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Total</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Payment</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Sync</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {!sales ? (
                                <tr><td colSpan={8} className="p-8 text-center text-gray-500">Loading records...</td></tr>
                            ) : sales.length === 0 ? (
                                <tr><td colSpan={8} className="p-10 text-center text-gray-400 italic">No transactions found matching your criteria.</td></tr>
                            ) : (
                                sales.map((sale) => (
                                    <tr
                                        key={sale.id}
                                        onClick={() => setSelectedSale(sale)}
                                        className="group hover:bg-blue-50/50 transition-colors cursor-pointer"
                                    >
                                        <td className="p-4 text-sm font-medium text-gray-600 whitespace-nowrap">
                                            {sale.timestamp instanceof Date
                                                ? sale.timestamp.toLocaleDateString()
                                                : new Date(sale.timestamp).toLocaleDateString()
                                            }
                                            <span className="block text-xs text-gray-400">
                                                {sale.timestamp instanceof Date
                                                    ? sale.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                }
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-mono text-sm font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-md">
                                                {sale.invoice_number ? `INV-${sale.invoice_number}` : (sale.order_number || ('#' + sale.id!.slice(0, 6)))}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-900 font-medium">
                                            {sale.customer_name || 'Walk-in Customer'}
                                        </td>
                                        <td className="p-4 text-sm text-gray-500 truncate max-w-[150px]">
                                            {sale.items.length} items ({sale.items.map(i => i.name).join(', ')})
                                        </td>
                                        <td className="p-4 text-right font-bold text-gray-900">
                                            {formatPrice(sale.total_amount)}
                                            {sale.discount_amount && (
                                                <div className="text-[10px] text-green-600 font-medium">
                                                    -{formatPrice(sale.discount_amount)} Off
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-center text-xs font-bold text-gray-500">
                                            {sale.payment_method === 'ONLINE' ? 'QR' : sale.payment_method}
                                        </td>
                                        <td className="p-4 text-center">
                                            {sale.status === 'VOIDED' ? (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                                                    <XCircle size={12} /> Voided
                                                </div>
                                            ) : sale.status === 'REFUNDED' ? (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100">
                                                    <RefreshCcw size={12} /> Refunded
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-600 border border-gray-100">
                                                    Completed
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {processingIds?.has(sale.id!) ? (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                                    <Loader2 size={12} className="animate-spin" /> Backing up...
                                                </div>
                                            ) : sale.synced ? (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                                                    <CheckCircle size={12} /> Yes
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-400 border border-gray-200">
                                                    <CloudOff size={12} /> No
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Footer Summary */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center text-sm text-gray-600">
                    <span>Showing {sales?.length || 0} transaction(s)</span>
                    <div className="flex gap-4">
                        <span>Total Sales: <strong className="text-gray-900">{formatPrice(sales?.reduce((sum, s) => sum + s.total_amount, 0) || 0)}</strong></span>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <TransactionDetailsModal
                sale={selectedSale}
                onClose={() => setSelectedSale(null)}
            />
        </div>
    );
};
