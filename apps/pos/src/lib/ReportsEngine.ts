import { db } from '../db';
import { Sale, ReportLog } from '@vibepos/shared-types';

export interface ReportDateRange {
    start: Date;
    end: Date;
}

export interface SalesReportResult {
    period: { start: Date; end: Date };
    generated_at: Date;
    metrics: {
        gross_sales: number; // Total item prices before discount
        net_sales: number;   // VATable sales
        total_tax: number;
        total_discount: number;
        service_charge: number;
        transaction_count: number;
        voided_count: number;
    };
    payment_methods: Record<string, number>; // method -> amount
    data: Sale[]; // Raw data if needed for export
}

export interface DiscountReportResult {
    period: { start: Date; end: Date };
    generated_at: Date;
    metrics: {
        total_discount_given: number;
        discounted_transaction_count: number;
    };
    breakdown: Record<string, number>; // type/name -> amount
    data: Sale[];
}

export interface SalesBookRow {
    date: string;
    beg_invoice: string;
    end_invoice: string;
    total_deductions: number;
    beg_balance: number; // Accumulated Sales before this day
    net_sales: number;
    gross_sales: number;
    end_balance: number; // Accumulated Sales after this day
    total_income: number; // Usually Net Sales or Collected Amount
    reset_counter: number;
}

export interface SalesBookResult {
    period: { start: Date; end: Date };
    generated_at: Date;
    generated_by: string;
    machine_info: {
        machine_no: string;
        serial_no: string;
    };
    rows: SalesBookRow[];
    aggregates: {
        total_gross: number;
        total_net: number;
        total_deductions: number;
        grand_accumulated_sales: number; // final end balance
    };
}

export interface DiscountBookRow {
    date: string;
    invoice_no: string;
    customer_name: string;
    customer_id_ref: string; // e.g. Senior ID
    discount_type: string;
    gross_sales: number;
    discount_amount: number;
    net_sales: number;
}

export interface DiscountBookResult {
    period: { start: Date; end: Date };
    generated_at: Date;
    generated_by: string;
    rows: DiscountBookRow[];
    aggregates: {
        total_gross: number;
        total_discount: number;
        total_net: number;
    };
}

export interface FinancialReadingResult {
    period: { start: Date; end: Date };
    generated_at: Date;
    generated_by: string; // User
    type: 'Z-READING' | 'X-READING';

    // Metrics
    total_sales: number; // Net/Paid amount? Or Gross? Usually Total Collected.
    total_tax: number;
    total_discounts: number;
    transaction_count: number;

    start_invoice: string;
    end_invoice: string;

    payments_breakdown: Record<string, number>;
    discounts_breakdown: Record<string, number>;
    transaction_stats: Record<string, number>;
}

export class ReportsEngine {

    /**
     * Generate Official Sales Book Report (Daily Breakdown)
     */
    static async generateSalesBookReport(range: ReportDateRange, userId?: string): Promise<SalesBookResult> {
        const start = range.start;
        const end = range.end;

        // 1. Calculate Beginning Balance (Grand Accumulated Sales BEFORE Start Date)
        // We sum up ALL 'completed' sales from Epoch to StartDate.
        const prevSales = await db.sales
            .where('timestamp')
            .below(start)
            .filter(s => s.status !== 'VOIDED' && s.status !== 'REFUNDED')
            .toArray();

        let runningBalance = prevSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);

        // 2. Get Sales in Range
        const currentSales = await db.sales
            .where('timestamp')
            .between(start, end, true, true)
            .toArray();

        // 3. Group by Date
        const salesByDay: Record<string, Sale[]> = {};
        currentSales.forEach(sale => {
            const dateStr = new Date(sale.timestamp).toISOString().split('T')[0];
            if (!salesByDay[dateStr]) salesByDay[dateStr] = [];
            salesByDay[dateStr].push(sale);
        });

        // 4. Build Rows
        const rows: SalesBookRow[] = [];
        const sortedDates = Object.keys(salesByDay).sort();

        // Accumulators for the report period
        let periodGross = 0;
        let periodNet = 0;
        let periodDeductions = 0;

        for (const dateStr of sortedDates) {
            const daySales = salesByDay[dateStr].filter(s => s.status !== 'VOIDED' && s.status !== 'REFUNDED');
            const allDaySales = salesByDay[dateStr]; // Include voids for invoice range check

            if (daySales.length === 0 && allDaySales.length === 0) continue;

            allDaySales.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            const begInvoice = allDaySales[0]?.invoice_number || '-';
            const endInvoice = allDaySales[allDaySales.length - 1]?.invoice_number || '-';

            // Metrics for the Day
            let dayGross = 0;
            let dayNet = 0; // VATable
            let dayDeductions = 0;

            for (const s of daySales) {
                const total = s.total_amount; // This is usually "Amount Payable"
                const discount = s.discount_amount || 0;
                const tax = s.tax_amount || 0;

                const stickerPrice = total + discount; // The "Gross" before discount
                dayGross += stickerPrice;
                dayDeductions += discount;
                dayNet += (total - tax); // Revenue ex-tax
            }

            const begBal = runningBalance;
            const endBal = begBal + dayGross; // Accumulated usually tracks Gross Sales
            runningBalance = endBal;

            rows.push({
                date: dateStr,
                beg_invoice: begInvoice,
                end_invoice: endInvoice,
                total_deductions: dayDeductions,
                beg_balance: begBal,
                net_sales: dayNet,
                gross_sales: dayGross,
                end_balance: endBal,
                total_income: dayNet,
                reset_counter: 0,
            });

            periodGross += dayGross;
            periodNet += dayNet;
            periodDeductions += dayDeductions;
        }

        // Log Generation
        await this.logReport('SALES_BOOK', range, userId, {
            total_gross: periodGross,
            total_net: periodNet,
            rows_count: rows.length
        });

        return {
            period: range,
            generated_at: new Date(),
            generated_by: userId || 'System',
            machine_info: {
                machine_no: '001', // TODO: Get from Settings
                serial_no: 'VIBE-POS-001'
            },
            rows,
            aggregates: {
                total_gross: periodGross,
                total_net: periodNet,
                total_deductions: periodDeductions,
                grand_accumulated_sales: runningBalance
            }
        };
    }

    /**
     * Generate Official Discount Book Report
     * Lists individual discount transactions for analysis/compliance.
     */
    static async generateDiscountBookReport(range: ReportDateRange, userId?: string): Promise<DiscountBookResult> {
        const sales = await db.sales
            .where('timestamp')
            .between(range.start, range.end, true, true)
            .filter(s => (s.discount_amount || 0) > 0 && s.status !== 'VOIDED' && s.status !== 'REFUNDED')
            .toArray();

        // Sort by Date, then Invoice
        sales.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const rows: DiscountBookRow[] = [];
        let totalGross = 0;
        let totalDiscount = 0;
        let totalNet = 0;

        for (const s of sales) {
            const discountVal = s.discount_amount || 0;
            const netVal = s.total_amount; // Amount Paid
            const grossVal = netVal + discountVal; // Sticker Price

            // Customer Details
            const custName = s.discount_info?.holder_name || s.customer_name || 'Walk-in';
            const custId = s.discount_info?.id_number || '-';

            rows.push({
                date: new Date(s.timestamp).toLocaleDateString(),
                invoice_no: s.invoice_number || '-',
                customer_name: custName,
                customer_id_ref: custId,
                discount_type: s.discount_name || 'Generic',
                gross_sales: grossVal,
                discount_amount: discountVal,
                net_sales: netVal
            });

            totalGross += grossVal;
            totalDiscount += discountVal;
            totalNet += netVal;
        }

        // Log Generation
        await this.logReport('DISCOUNT_BOOK', range, userId, {
            total_discount: totalDiscount,
            rows_count: rows.length
        });

        return {
            period: range,
            generated_at: new Date(),
            generated_by: userId || 'System',
            rows,
            aggregates: {
                total_gross: totalGross,
                total_discount: totalDiscount,
                total_net: totalNet
            }
        };
    }

    /**
     * Generate Sales Report
     * Aggregates completed sales within range.
     */
    static async generateSalesReport(range: ReportDateRange, userId?: string): Promise<SalesReportResult> {
        // Query Sales
        const sales = await db.sales
            .where('timestamp')
            .between(range.start, range.end, true, true)
            .toArray();

        const result: SalesReportResult = {
            period: range,
            generated_at: new Date(),
            metrics: {
                gross_sales: 0,
                net_sales: 0,
                total_tax: 0,
                total_discount: 0,
                service_charge: 0,
                transaction_count: 0,
                voided_count: 0
            },
            payment_methods: {},
            data: sales
        };

        for (const sale of sales) {
            if (sale.status === 'VOIDED' || sale.status === 'REFUNDED') {
                result.metrics.voided_count++;
                continue;
            }

            result.metrics.transaction_count++;

            // Financials
            const total = sale.total_amount;
            const tax = sale.tax_amount || 0;
            const discount = sale.discount_amount || 0;
            const service = sale.service_charge_amount || 0;

            result.metrics.net_sales += (total - tax);
            result.metrics.gross_sales += (total + discount); // Theoretical Gross
            result.metrics.total_tax += tax;
            result.metrics.total_discount += discount;
            result.metrics.service_charge += service;

            // Payment Methods
            const method = sale.payment_method || 'CASH';
            result.metrics.gross_sales = Number(result.metrics.gross_sales.toFixed(2)); // Rounding safety

            result.payment_methods[method] = (result.payment_methods[method] || 0) + total;
        }

        // Log Generation
        await this.logReport('SALES_SUMMARY', range, userId, result.metrics);

        return result;
    }

    /**
     * Generate Discount Report
     */
    static async generateDiscountReport(range: ReportDateRange, userId?: string): Promise<DiscountReportResult> {
        const sales = await db.sales
            .where('timestamp')
            .between(range.start, range.end, true, true)
            .filter(s => (s.discount_amount || 0) > 0 && s.status !== 'VOIDED')
            .toArray();

        const result: DiscountReportResult = {
            period: range,
            generated_at: new Date(),
            metrics: {
                total_discount_given: 0,
                discounted_transaction_count: 0
            },
            breakdown: {},
            data: sales
        };

        for (const sale of sales) {
            const amount = sale.discount_amount || 0;
            const name = sale.discount_name || 'Unknown';

            result.metrics.total_discount_given += amount;
            result.metrics.discounted_transaction_count++;

            // Group by Discount Name/Type
            result.breakdown[name] = (result.breakdown[name] || 0) + amount;
        }

        await this.logReport('DISCOUNT_SUMMARY', range, userId, result.metrics);

        return result;
    }

    /**
     * Log the report generation to History
     */
    private static async logReport(type: any, range: ReportDateRange, userId: string | undefined, summary: any) {
        try {
            await db.report_logs.add({
                id: crypto.randomUUID(),
                type: type,
                generated_at: new Date(),
                generated_by: userId || 'System',
                parameters: { start: range.start, end: range.end },
                result_summary: summary
            });
        } catch (e) {
            console.error("Failed to log report", e);
        }
    }

    /**
     * Export Data to CSV Blob
     */
    static exportToCSV(data: any[], fileName: string) {
        if (!data || !data.length) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(fieldName => {
                const val = (row as any)[fieldName];
                return JSON.stringify(val === undefined ? '' : val); // Handle commas in strings
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        URL.revokeObjectURL(url);
    }

    /**
     * Generate X/Z Reading
     * Calculates financial snapshot for a day/shift.
     */
    static async generateFinancialReading(date: Date, type: 'X-READING' | 'Z-READING', userId?: string): Promise<FinancialReadingResult> {
        // Standard Day Range (00:00 - 23:59)
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        // Query Sales
        const dailySales = await db.sales
            .where('timestamp')
            .between(start, end, true, true)
            .toArray();

        // 1. Transaction Stats
        const txBreakdown = dailySales.reduce((acc: Record<string, number>, s: Sale) => {
            const status = s.status || 'COMPLETED';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, { COMPLETED: 0, VOIDED: 0, REFUNDED: 0 });

        const txCount = dailySales.length;

        // 2. Financials (Valid Only)
        const validSales = dailySales.filter(s => s.status !== 'VOIDED' && s.status !== 'REFUNDED');

        // Total Collected (Total Amount Paid)
        const totalSales = validSales.reduce((sum, s) => sum + s.total_amount, 0);

        // Tax Calculation (Backwards from Total if Inclusive)
        // Net = Total / 1.12
        // Tax = Total - Net
        const totalTax = totalSales - (totalSales / 1.12);

        // 3. Payment Methods
        const byMethod = validSales.reduce((acc: Record<string, number>, sale: Sale) => {
            const method = sale.payment_method;
            acc[method] = (acc[method] || 0) + sale.total_amount;
            return acc;
        }, {});

        // 4. Discounts
        const discountBreakdown = validSales.reduce((acc: Record<string, number>, s: Sale) => {
            if (s.discount_amount && s.discount_amount > 0) {
                let key = 'Other';
                const name = (s.discount_name || '').toLowerCase();
                if (name.includes('senior')) key = 'Senior Citizen';
                else if (name.includes('pwd')) key = 'PWD';

                acc[key] = (acc[key] || 0) + s.discount_amount;
            }
            return acc;
        }, { 'Senior Citizen': 0, 'PWD': 0, 'Other': 0 });

        const totalDiscounts = Object.values(discountBreakdown).reduce((a, b) => a + b, 0);

        // Log Generation
        await this.logReport(type, { start, end }, userId, {
            total_sales: totalSales,
            tx_count: txCount
        });

        return {
            period: { start, end },
            generated_at: new Date(),
            generated_by: userId || 'System',
            type,
            total_sales: totalSales,
            total_tax: totalTax,
            total_discounts: totalDiscounts,
            transaction_count: txCount,
            start_invoice: dailySales[0]?.invoice_number || '-',
            end_invoice: dailySales[dailySales.length - 1]?.invoice_number || '-',
            payments_breakdown: byMethod,
            discounts_breakdown: discountBreakdown,
            transaction_stats: txBreakdown
        };
    }
}
