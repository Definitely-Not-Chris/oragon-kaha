import { useState } from 'react';
import { Calendar as CalendarIcon, FileSpreadsheet, Filter } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { Calendar } from '../ui/calendar'; // Assuming shadcn Calendar exists
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'; // Assuming shadcn
import { cn } from '../../lib/utils';
import { ReportType } from '@vibepos/shared-types';

export interface ReportParams {
    type: string; // ReportType enum string
    dateRange: { start: Date; end: Date };
}

interface Props {
    onGenerate: (params: ReportParams) => void;
    isGenerating: boolean;
}

export const ReportGeneratorParams = ({ onGenerate, isGenerating }: Props) => {
    const [date, setDate] = useState<DateRange | undefined>({
        from: startOfDay(new Date()),
        to: endOfDay(new Date())
    });
    const [reportType, setReportType] = useState<string>('SALES_SUMMARY');

    const handleGenerate = () => {
        if (!date?.from || !date?.to) return;

        onGenerate({
            type: reportType,
            dateRange: {
                start: startOfDay(date.from),
                end: endOfDay(date.to)
            }
        });
    };

    // Quick Date Presets
    const setPreset = (preset: 'TODAY' | 'YESTERDAY' | 'THIS_MONTH' | 'LAST_7_DAYS') => {
        const now = new Date();
        switch (preset) {
            case 'TODAY':
                setDate({ from: startOfDay(now), to: endOfDay(now) });
                break;
            case 'YESTERDAY':
                const yest = subDays(now, 1);
                setDate({ from: startOfDay(yest), to: endOfDay(yest) });
                break;
            case 'THIS_MONTH':
                setDate({ from: startOfMonth(now), to: endOfMonth(now) });
                break;
            case 'LAST_7_DAYS':
                setDate({ from: subDays(now, 7), to: endOfDay(now) });
                break;
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <Filter className="text-vibepos-primary" size={20} />
                <h3 className="font-bold text-gray-900">Report Parameters</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Report Type Selection */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Report Type</label>
                    <select
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-vibepos-primary"
                    >
                        <option value="SALES_SUMMARY">Sales Summary Report</option>
                        <option value="SALES_BOOK">Official Sales Book Report</option>
                        <option value="DISCOUNT_SUMMARY">Discount Analytics</option>
                        <option value="DISCOUNT_BOOK">Official Discount Book Report</option>
                        <option value="X_READING">X-Reading (Shift Report)</option>
                        <option value="Z_READING">Z-Reading (End of Day)</option>
                        {/* <option value="INVENTORY_VALUATION">Inventory Valuation</option> */}
                    </select>
                    <p className="text-xs text-gray-400">
                        {reportType === 'SALES_SUMMARY' && "Gross, Net, Tax, and Payment Breakdown."}
                        {reportType === 'SALES_BOOK' && "Daily Breakdown with Accumulated Sales (BIR Format)."}
                        {reportType === 'DISCOUNT_SUMMARY' && "Analysis of discounts given by type."}
                        {reportType === 'DISCOUNT_BOOK' && "Detailed list of discount transactions (BIR Format)."}
                        {reportType === 'X_READING' && "Current financial snapshot (Does not reset totals)."}
                        {reportType === 'Z_READING' && "Final Day Report (Resets daily totals)."}
                    </p>
                </div>

                {/* 2. Date Range Selection */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Date Range</label>
                    <div className="flex flex-col gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    id="date"
                                    className={cn(
                                        "w-full justify-start text-left font-normal p-3 rounded-xl border border-gray-200 bg-gray-50 flex items-center gap-2 hover:bg-gray-100 transition-colors",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                                    {date?.from ? (
                                        date.to ? (
                                            <span className="font-bold text-gray-900">
                                                {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                                            </span>
                                        ) : (
                                            format(date.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>

                        {/* Presets */}
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {['TODAY', 'YESTERDAY', 'THIS_MONTH', 'LAST_7_DAYS'].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPreset(p as any)}
                                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-600 rounded-lg whitespace-nowrap transition-colors"
                                >
                                    {p.replace(/_/g, ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !date?.from || !date?.to}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-gray-200"
                >
                    {isGenerating ? (
                        <>Generating...</>
                    ) : (
                        <>
                            <FileSpreadsheet size={18} /> Generate Report
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
