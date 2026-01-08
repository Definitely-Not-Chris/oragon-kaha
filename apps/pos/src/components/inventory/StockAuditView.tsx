import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { CheckCircle, Plus, History, Download } from 'lucide-react';
import { StockAuditSession } from './StockAuditSession';

export const StockAuditView = () => {
    const [isSessionActive, setIsSessionActive] = useState(false);

    // Fetch History
    const audits = useLiveQuery(() =>
        db.stock_audits.reverse().sortBy('timestamp')
    );

    const handleExportCsv = (audit: any) => {
        if (!audit) return;
        const csvContent = [
            ['Product ID', 'Expected', 'Counted', 'Discrepancy'],
            ...audit.items.map((i: any) => [
                i.product_id, i.expected_stock, i.counted_stock, i.discrepancy
            ])
        ].map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `audit_${new Date(audit.timestamp).toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isSessionActive) {
        return <StockAuditSession onExit={() => setIsSessionActive(false)} />;
    }

    return (
        <div className="flex flex-col h-full p-6 bg-vibepos-base overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Inventory Auditing</h1>
                    <p className="text-gray-500">Track and verify stock levels</p>
                </div>
                <button
                    onClick={() => setIsSessionActive(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-vibepos-primary text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-600 transition-all hover:scale-105 active:scale-95"
                >
                    <Plus size={20} />
                    Start New Audit
                </button>
            </div>

            {/* Empty State */}
            {!audits || audits.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-gray-200 border-dashed">
                    <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Audits Yet</h3>
                    <p className="text-gray-500 max-w-sm mb-8">
                        Start your first stocktake to ensure your system inventory matches physical counts.
                    </p>
                    <button
                        onClick={() => setIsSessionActive(true)}
                        className="px-6 py-2 bg-white border border-gray-300 font-bold text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Start Now
                    </button>
                </div>
            ) : (
                <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <History size={18} className="text-gray-400" />
                            Audit History
                        </h3>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{audits.length} Records</span>
                    </div>
                    <div className="overflow-y-auto flex-1 p-0">
                        <div className="divide-y divide-gray-100">
                            {audits.map(audit => (
                                <div key={audit.id} className="p-6 hover:bg-blue-50/50 transition-colors group">
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-lg">
                                                {new Date(audit.timestamp).getDate()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                                    {new Date(audit.timestamp).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                                    {audit.status === 'COMPLETED' && <CheckCircle size={14} className="text-green-500" />}
                                                </p>
                                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                                    {new Date(audit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                    {audit.items.length} items counted
                                                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                                    <span className={audit.items.filter((i: any) => i.discrepancy !== 0).length > 0 ? "text-orange-600 font-bold" : "text-green-600 font-bold"}>
                                                        {audit.items.filter((i: any) => i.discrepancy !== 0).length} Discrepancies
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleExportCsv(audit)}
                                                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-vibepos-primary bg-blue-100/50 hover:bg-blue-100 rounded-lg transition-colors"
                                                title="Download CSV"
                                            >
                                                <Download size={16} /> Export
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
