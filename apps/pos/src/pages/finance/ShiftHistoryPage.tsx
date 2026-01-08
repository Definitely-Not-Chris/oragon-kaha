import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useCurrency } from '../../lib/useCurrency';
import { format } from 'date-fns';
import { Clock, CheckCircle, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { CashTransactionList } from './CashTransactionList';

export const ShiftHistoryPage = () => {
    const { formatPrice } = useCurrency();
    const shifts = useLiveQuery(() =>
        db.work_shifts.orderBy('start_time').reverse().toArray()
    );

    const [searchTerm, setSearchTerm] = useState('');
    const [expandedShiftId, setExpandedShiftId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedShiftId(prev => prev === id ? null : id);
    };

    if (!shifts) return <div className="p-8 text-center text-gray-500">Loading shifts...</div>;

    const filteredShifts = shifts.filter(s =>
        (s.id?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.notes?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Shift History</h1>
                    <p className="text-sm text-gray-500">Track opening/closing balances and verify cash variance.</p>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search notes or ID..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vibepos-primary/20 focus:border-vibepos-primary transition-all"
                    />
                </div>
            </div>

            <div className="grid gap-4">
                {filteredShifts.map(shift => (
                    <div
                        key={shift.id}
                        className={`
                            bg-white rounded-xl shadow-sm border transition-all cursor-pointer overflow-hidden
                            ${expandedShiftId === shift.id ? 'ring-2 ring-vibepos-primary/10 border-vibepos-primary shadow-md' : 'border-gray-100 hover:shadow-md'}
                        `}
                        onClick={() => toggleExpand(shift.id!)}
                    >
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                {/* Header Info */}
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${shift.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {shift.status === 'OPEN' ? <Clock size={24} /> : <CheckCircle size={24} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-gray-900">
                                                {shift.status === 'OPEN' ? 'Active Shift' : 'Closed Shift'}
                                            </h3>
                                            <span className="text-xs font-mono text-gray-400">#{shift.id?.slice(0, 8)}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Started: {format(new Date(shift.start_time), 'PP p')}
                                        </p>
                                        {shift.end_time && (
                                            <p className="text-sm text-gray-500">
                                                Ended: {format(new Date(shift.end_time), 'PP p')}
                                            </p>
                                        )}
                                        {expandedShiftId !== shift.id && (
                                            <p className="text-xs text-vibepos-primary mt-2 flex items-center gap-1 font-medium">
                                                <ChevronDown size={12} /> Show Transactions
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Financials */}
                                <div className="flex items-center gap-8 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-8">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase font-bold">Opening</p>
                                        <p className="font-bold text-gray-900">{formatPrice(shift.opening_float)}</p>
                                    </div>

                                    {shift.status === 'CLOSED' && (
                                        <>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-bold">Expected</p>
                                                <p className="font-bold text-gray-900">{formatPrice(shift.expected_cash || 0)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-bold">Actual</p>
                                                <p className="font-bold text-gray-900">{formatPrice(shift.actual_cash || 0)}</p>
                                            </div>
                                            <div className={`
                                                px-4 py-2 rounded-lg border
                                                ${(shift.variance || 0) === 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}
                                            `}>
                                                <p className="text-xs uppercase font-bold">Variance</p>
                                                <p className="font-bold">
                                                    {(shift.variance || 0) > 0 ? '+' : ''}{formatPrice(shift.variance || 0)}
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    {shift.status === 'OPEN' && (
                                        <div className="bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-100">
                                            <p className="text-xs text-emerald-600 uppercase font-bold">Current Expected</p>
                                            <p className="font-bold text-emerald-900 text-lg">{formatPrice(shift.expected_cash || 0)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {expandedShiftId === shift.id && (
                                <div onClick={e => e.stopPropagation()} className="cursor-default">
                                    <CashTransactionList shiftId={shift.id!} />
                                    <button
                                        className="w-full mt-4 text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 py-2"
                                        onClick={(e) => { e.stopPropagation(); toggleExpand(shift.id!); }}
                                    >
                                        <ChevronUp size={12} /> Collapse
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {filteredShifts.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <Clock className="mx-auto text-gray-300 mb-3" size={48} />
                        <h3 className="font-bold text-gray-600">No shifts found</h3>
                        <p className="text-sm text-gray-400">Start a shift from the sidebar to see it here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
