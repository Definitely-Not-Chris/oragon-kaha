import Dexie, { Table } from 'dexie';
import type { RetailProduct, ServiceProduct, Sale, StockMovement, StockAudit, User, Discount, Customer, WorkShift, CashTransaction, AppSettings, ReportLog } from '@vibepos/shared-types';

export type LocalProduct = RetailProduct | ServiceProduct;

export interface LocalCartItem {
    product_id: string;
    quantity: number;
    price_at_sale: number;
    name: string;
    type: 'RETAIL' | 'SERVICE';
    category?: string;
}

export interface SyncQueueItem {
    id?: number;
    url: string;
    method: 'POST' | 'PUT' | 'DELETE';
    payload: any;
    status: 'PENDING' | 'PROCESSING' | 'FAILED';
    retry_count: number;
    created_at: Date;
    error_log?: string;
}

export class VibePOSDatabase extends Dexie {
    products!: Table<LocalProduct>;
    sales!: Table<Sale>;
    cart_items!: Table<LocalCartItem>;
    stock_movements!: Table<StockMovement>;
    stock_audits!: Table<StockAudit>;
    users!: Table<User>;
    discounts!: Table<Discount>;
    customers!: Table<Customer>;
    work_shifts!: Table<WorkShift>;
    cash_transactions!: Table<CashTransaction>;
    settings!: Table<AppSettings>;
    report_logs!: Table<ReportLog>;
    sync_queue!: Table<SyncQueueItem>;

    constructor() {
        super('VibePOS_Live_v1');

        // Squashed Schema for Clean Start
        this.version(1).stores({
            products: 'id, type, category, name, stock_level, is_composite',
            sales: 'id, invoice_number, status, timestamp, payment_method, cashier_id, synced',
            stock_movements: 'id, product_id, timestamp, type, synced',
            stock_audits: 'id, status, date_started',
            users: 'id, username, role, password',
            discounts: 'id, name, code, type, target, trigger, is_active',
            customers: 'id, phone, email, name, tin_number',
            work_shifts: 'id, status, start_time, synced',
            cash_transactions: 'id, shift_id, type, timestamp, synced',
            settings: 'id',
            report_logs: 'id, type, generated_at',
            cart_items: 'product_id',
            sync_queue: '++id, status, created_at, retry_count'
        });

        this.on('populate', () => {
            this.discounts.bulkAdd([
                {
                    id: crypto.randomUUID(),
                    name: 'Senior Citizen',
                    type: 'PERCENTAGE',
                    value: 20,
                    target: 'CART',
                    trigger: 'MANUAL',
                    is_statutory: true,
                    is_active: true,
                    priority: 0
                },
                {
                    id: crypto.randomUUID(),
                    name: 'PWD',
                    type: 'PERCENTAGE',
                    value: 20,
                    target: 'CART',
                    trigger: 'MANUAL',
                    is_statutory: true,
                    is_active: true,
                    priority: 0
                }
            ]);
        });
    }
}

export const db = new VibePOSDatabase();
