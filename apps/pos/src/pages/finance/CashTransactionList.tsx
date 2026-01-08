import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { format } from 'date-fns';
import { useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, MinusCircle } from 'lucide-react';
import { useCurrency } from '../../lib/useCurrency';

interface CashTransactionListProps {
    shiftId: string;
}

export const CashTransactionList = ({ shiftId }: CashTransactionListProps) => {
    const { formatPrice } = useCurrency();
    const transactions = useLiveQuery(
        () => db.cash_transactions
            .where('shift_id')
            .equals(shiftId)
            .reverse()
            .sortBy('timestamp')
    );

    const totals = useMemo(() => {
        if (!transactions) return { payIn: 0, payOut: 0, drop: 0 };
        return transactions.reduce((acc, t) => {
            if (t.type === 'PAY_IN') acc.payIn += t.amount;
            if (t.type === 'PAY_OUT') acc.payOut += t.amount;
            if (t.type === 'DROP') acc.drop += t.amount;
            return acc;
        }, { payIn: 0, payOut: 0, drop: 0 });
    }, [transactions]);

    if (!transactions || transactions.length === 0) {
        return (
            <div className="p-4 text-center text-gray-400 text-sm italic">
                No cash transactions recorded in this shift.
            </div>
        );
    }

    return (
        <div className="mt-4 border-t border-gray-100 pt-4 animate-in fade-in slide-in-from-top-2">
            <h4 className="text-sm font-bold text-gray-700 mb-3">Cash Transactions</h4>

            {/* Summary Chips */}
            <div className="flex flex-wrap gap-3 mb-4 text-xs font-semibold">
                <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md border border-emerald-100">
                    Pay Ins: {formatPrice(totals.payIn)}
                </span>
                <span className="bg-rose-50 text-rose-700 px-2 py-1 rounded-md border border-rose-100">
                    Pay Outs: {formatPrice(totals.payOut)}
                </span>
                <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-md border border-amber-100">
                    Drops: {formatPrice(totals.drop)}
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-3 py-2 rounded-l-lg">Time</th>
                            <th className="px-3 py-2">Type</th>
                            <th className="px-3 py-2">Details</th>
                            <th className="px-3 py-2 text-right rounded-r-lg">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {transactions.map(tx => (
                            <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                                    {format(new Date(tx.timestamp), 'p')}
                                </td>
                                <td className="px-3 py-2">
                                    <span className={`
                                        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border
                                        ${tx.type === 'PAY_IN' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : ''}
                                        ${tx.type === 'PAY_OUT' ? 'bg-rose-100 text-rose-700 border-rose-200' : ''}
                                        ${tx.type === 'DROP' ? 'bg-amber-100 text-amber-700 border-amber-200' : ''}
                                    `}>
                                        {tx.type === 'PAY_IN' && <ArrowDownLeft size={10} />}
                                        {tx.type === 'PAY_OUT' && <ArrowUpRight size={10} />}
                                        {tx.type === 'DROP' && <MinusCircle size={10} />}
                                        {tx.type.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-3 py-2 text-gray-700">
                                    {tx.reason}
                                    <span className="block text-xs text-gray-400">by {tx.performed_by || 'Staff'}</span>
                                </td>
                                <td className={`px-3 py-2 text-right font-mono font-medium ${tx.type === 'PAY_IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {tx.type === 'PAY_IN' ? '+' : '-'}{formatPrice(tx.amount)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
