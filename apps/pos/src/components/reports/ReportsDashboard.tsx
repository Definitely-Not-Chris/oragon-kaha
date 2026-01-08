import { useState } from 'react';
import { History, BarChart2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { ReportGeneratorParams, ReportParams } from './ReportGeneratorParams';
import { ReportResultView } from './ReportResultView';
import { ReportHistory } from './ReportHistory';
import { ReportsEngine, SalesReportResult, DiscountReportResult, SalesBookResult, DiscountBookResult, FinancialReadingResult } from '../../lib/ReportsEngine';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast';
import { SalesBookView } from './SalesBookView';
import { DiscountBookView } from './DiscountBookView';
import { ReadingView } from './ReadingView';

type Tab = 'GENERATOR' | 'HISTORY';

export const ReportsDashboard = () => {
    const [activeTab, setActiveTab] = useState<Tab>('GENERATOR');
    const [viewMode, setViewMode] = useState<'PARAMS' | 'RESULT'>('PARAMS');
    const [reportResult, setReportResult] = useState<SalesReportResult | DiscountReportResult | SalesBookResult | DiscountBookResult | FinancialReadingResult | null>(null);
    const [reportType, setReportType] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);

    const { currentUser } = useAuth();
    const { showToast } = useToast();

    const handleGenerate = async (params: ReportParams) => {
        setIsGenerating(true);
        try {
            let result;
            if (params.type === 'SALES_SUMMARY') {
                result = await ReportsEngine.generateSalesReport(params.dateRange, currentUser?.username);
            } else if (params.type === 'DISCOUNT_SUMMARY') {
                result = await ReportsEngine.generateDiscountReport(params.dateRange, currentUser?.username);
            } else if (params.type === 'SALES_BOOK') {
                result = await ReportsEngine.generateSalesBookReport(params.dateRange, currentUser?.username);
            } else if (params.type === 'DISCOUNT_BOOK') {
                result = await ReportsEngine.generateDiscountBookReport(params.dateRange, currentUser?.username);
            } else if (params.type === 'X_READING' || params.type === 'Z_READING') {
                // Map UI value to Internal Type
                const internalParams = params.type === 'X_READING' ? 'X-READING' : 'Z-READING';
                result = await ReportsEngine.generateFinancialReading(params.dateRange.start, internalParams, currentUser?.username);
            }

            if (result) {
                setReportResult(result);
                setReportType(params.type);
                setViewMode('RESULT');
                showToast('Report Generated Successfully', 'success');
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to generate report', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleBack = () => {
        setViewMode('PARAMS');
        setReportResult(null);
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
                    <p className="text-gray-500">Generate financial insights and audit logs.</p>
                </div>

                {/* Tabs */}
                <div className="bg-gray-100 p-1 rounded-xl flex gap-1 self-start md:self-auto">
                    <button
                        onClick={() => setActiveTab('GENERATOR')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all",
                            activeTab === 'GENERATOR' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <BarChart2 size={16} /> Analysis
                    </button>
                    <button
                        onClick={() => setActiveTab('HISTORY')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all",
                            activeTab === 'HISTORY' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <History size={16} /> History
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === 'GENERATOR' && (
                    <>
                        {viewMode === 'PARAMS' ? (
                            <ReportGeneratorParams onGenerate={handleGenerate} isGenerating={isGenerating} />
                        ) : (
                            reportResult && (
                                reportType === 'SALES_BOOK' ? (
                                    <SalesBookView
                                        data={reportResult as SalesBookResult}
                                        onBack={handleBack}
                                    />
                                ) : reportType === 'DISCOUNT_BOOK' ? (
                                    <DiscountBookView
                                        data={reportResult as DiscountBookResult}
                                        onBack={handleBack}
                                    />
                                ) : (reportType === 'X_READING' || reportType === 'Z_READING') ? (
                                    <ReadingView
                                        data={reportResult as FinancialReadingResult}
                                        onBack={handleBack}
                                    />
                                ) : (
                                    <ReportResultView
                                        data={reportResult as SalesReportResult | DiscountReportResult}
                                        type={reportType}
                                        onBack={handleBack}
                                    />
                                )
                            )
                        )}
                    </>
                )}


                {activeTab === 'HISTORY' && (
                    <ReportHistory />
                )}
            </div>
        </div>
    );
};
