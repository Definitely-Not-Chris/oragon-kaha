import { z } from 'zod';

export const ProductType = z.enum(['RETAIL', 'SERVICE']);

export const SharedProductSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    price: z.number().min(0),
    category: z.string(),
    image_url: z.string().url().optional(),
    type: ProductType,
});

export const ProductIngredientSchema = z.object({
    product_id: z.string(), // The raw material ID
    quantity: z.number().min(0),
    unit: z.string().optional(), // e.g. 'g', 'ml', 'pcs'
    cost_share: z.number().optional(), // Calculated cost portion
});

export type ProductIngredient = z.infer<typeof ProductIngredientSchema>;

export const RetailProductSchema = SharedProductSchema.extend({
    type: z.literal('RETAIL'),
    stock_level: z.number().int().min(0),
    sku: z.string(),
    barcode: z.string().optional(),
    low_stock_threshold: z.number().int().min(0).default(5),
    cost_price: z.number().min(0).optional(),

    // Composite / Recipe Logic
    is_composite: z.boolean().default(false),
    ingredients: z.array(ProductIngredientSchema).optional(),
});

export const ServiceProductSchema = SharedProductSchema.extend({
    type: z.literal('SERVICE'),
    duration_minutes: z.number().int().min(1),
    assigned_staff_id: z.string().optional(),
});

export const ProductOrServiceSchema = z.union([
    RetailProductSchema,
    ServiceProductSchema,
]);

export type ProductOrService = z.infer<typeof ProductOrServiceSchema>;
export type RetailProduct = z.infer<typeof RetailProductSchema>;
export type ServiceProduct = z.infer<typeof ServiceProductSchema>;

export const SaleItemSchema = z.object({
    product_id: z.string(),
    quantity: z.number().int().min(1),
    price_at_sale: z.number().min(0),
    name: z.string(), // Snapshot of product name
    type: ProductType.optional(), // Added for sync recovery
    category: z.string().optional(), // Added for sync recovery
});

export const SaleStatus = z.enum(['COMPLETED', 'PENDING_SYNC', 'SYNCED', 'VOIDED', 'REFUNDED', 'PARTIALLY_REFUNDED']);

export const SaleSchema = z.object({
    id: z.string().uuid().optional(), // Optional for creation, required for synced
    items: z.array(SaleItemSchema).min(1),

    // Financial Breakdown
    total_amount: z.number().min(0), // Final amount to be paid
    subtotal_amount: z.number().min(0).default(0), // Amount before tax/discounts
    terminal_id: z.string().optional(), // Linked Terminal ID

    // Tax Snapshot
    tax_amount: z.number().min(0).default(0),
    tax_name: z.string().optional(),
    tax_rate_snapshot: z.number().optional(), // Rate at time of sale
    is_tax_inclusive: z.boolean().default(true),

    // Service Charge Snapshot
    service_charge_amount: z.number().default(0),

    payment_method: z.enum(['CASH', 'CARD', 'ONLINE']),
    status: SaleStatus.default('COMPLETED'),
    timestamp: z.date().default(() => new Date()), // Local time
    synced: z.boolean().default(false), // Logic for sync
    customer_id: z.string().optional(), // Linked customer
    customer_name: z.string().optional(),
    order_number: z.string().optional(), // Friendly ID e.g. 'ORD-1001'
    invoice_number: z.string().optional(), // Sequential ID e.g. '000001'
    notes: z.string().optional(),
    discount_info: z.object({
        id_number: z.string().optional(),
        holder_name: z.string().optional(),
    }).optional(),
    discount_name: z.string().optional(),
    discount_amount: z.number().min(0).optional(),
});

export type SaleItem = z.infer<typeof SaleItemSchema>;
export type Sale = z.infer<typeof SaleSchema>;

// Inventory Management
export const StockMovementType = z.enum(['PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN']);

export const StockMovementSchema = z.object({
    id: z.string().uuid().optional(),
    product_id: z.string(),
    type: StockMovementType,
    quantity_change: z.number().int(), // Positive for add, negative for remove
    reason: z.string().optional(),
    timestamp: z.date().default(() => new Date()),
    synced: z.boolean().default(false),
    reference_id: z.string().optional(), // e.g., Sale ID or PO ID
});

export type StockMovement = z.infer<typeof StockMovementSchema>;



// Inventory Auditing
export const StockAuditItemSchema = z.object({
    product_id: z.string(),
    expected_stock: z.number().int(),
    counted_stock: z.number().int(),
    discrepancy: z.number().int(), // counted - expected
});

export const StockAuditSchema = z.object({
    id: z.string().uuid().optional(),
    timestamp: z.date().default(() => new Date()),
    status: z.enum(['IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
    items: z.array(StockAuditItemSchema),
    notes: z.string().optional(),
});

export type StockAuditItem = z.infer<typeof StockAuditItemSchema>;
export type StockAudit = z.infer<typeof StockAuditSchema>;

// Organization / Client
export const CustomerSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    type: z.enum(['REGULAR', 'SENIOR', 'PWD']).default('REGULAR'),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    notes: z.string().optional(),
    total_spent: z.number().default(0),
    last_visit: z.date().default(() => new Date()),
    birthdate: z.date().optional(),
    tin_number: z.string().optional(),
});

export type Customer = z.infer<typeof CustomerSchema>;

export const OrganizationSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string(),
    contact_email: z.string().email().optional(),
    is_active: z.boolean().default(true),
    created_at: z.date().default(() => new Date()),
});

export type Organization = z.infer<typeof OrganizationSchema>;

// User & Auth
export const UserRole = z.enum(['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'CASHIER']);

export const AccessPermission = z.enum([
    'MANAGE_USERS',
    'MANAGE_INVENTORY',
    'MANAGE_DISCOUNTS',
    'VIEW_REPORTS',
    'VOID_SALE',
    'REFUND_SALE',
    'SETTINGS_ACCESS',
    'CLOSE_SHIFT',
    'OPEN_SHIFT',
    'PROCESS_SALE',
    'VIEW_OWN_HISTORY',
    'MANAGE_SETTINGS' // Added MANAGE_SETTINGS
]);

export type Permission = z.infer<typeof AccessPermission>;

export const UserSchema = z.object({
    id: z.string().uuid().optional(),
    organization_id: z.string().uuid().optional(), // Null for Super Admin
    username: z.string().min(3),
    password: z.string(), // Hash on server, Pin/Pass on Edge
    role: UserRole.default('CASHIER'),
    full_name: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;

// Discounts & Vouchers
// Discounts & Promotions
export const DiscountType = z.enum(['PERCENTAGE', 'FIXED']);
export const DiscountTarget = z.enum(['CART', 'ITEM', 'SPECIFIC_ITEMS']);
export const DiscountTrigger = z.enum(['MANUAL', 'CODE', 'TIME']);

export const DiscountSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1),
    type: DiscountType,
    value: z.number().min(0),
    target: DiscountTarget.default('CART'),
    target_products: z.array(z.string()).optional(), // List of Product IDs if target is SPECIFIC_ITEMS

    // Trigger Logic
    trigger: DiscountTrigger.default('MANUAL'),
    code: z.string().optional(), // Required if trigger is CODE

    // Advanced Rules
    min_purchase_amount: z.number().optional(),
    min_quantity: z.number().optional(),

    // Time-Based Rules (Happy Hour)
    valid_from: z.date().optional(),
    valid_until: z.date().optional(),
    start_date: z.date().optional(),
    end_date: z.date().optional(),
    valid_days: z.array(z.number().min(0).max(6)).optional(), // 0=Sunday, 6=Saturday
    valid_start_time: z.string().optional(), // "14:00"
    valid_end_time: z.string().optional(), // "17:00"

    // Statutory (PWD/Senior)
    is_statutory: z.boolean().default(false), // If true, exempts VAT might apply logic elsewhere

    is_active: z.boolean().default(true),
    priority: z.number().default(0), // Higher priority applied first?? Or override?
});

export type Discount = z.infer<typeof DiscountSchema>;

// Sync Engine

// Licensing & Security
export const LicenseType = z.enum(['STANDALONE', 'SERVER', 'CLIENT']); // Client = Dumb terminal connected to Server
export const LicensePlan = z.enum(['COMMUNITY', 'LIFETIME', 'PRO', 'ENTERPRISE']);

export const LicenseSchema = z.object({
    id: z.string().uuid(),
    key: z.string(), // The logical "Product Key" string (e.g. VIBE-XXXX-YYYY)
    type: LicenseType,
    plan: LicensePlan,

    // Constraints
    max_terminals: z.number().int().min(1).default(1),
    features: z.array(z.string()), // ['ANALYTICS', 'INVENTORY_ADVANCED']

    // Validity
    issued_at: z.number(), // Unix timestamp
    expires_at: z.number().optional(), // Null = Lifetime

    // Binding (Filled upon Activation)
    bound_device_id: z.string().optional(),

    // Signature (JWT logic will handle this, but good to have in schema if sending object)
    signature: z.string().optional(),
});

export type License = z.infer<typeof LicenseSchema>;

// Admin Licensing Module (Backend Models)
export const LicenseKeyStatus = z.enum(['ACTIVE', 'REVOKED', 'EXPIRED']);
export const LicenseKeyType = z.enum(['PRO', 'ENTERPRISE']);

export const LicenseKeySchema = z.object({
    id: z.string().uuid().optional(),
    key: z.string(),
    type: LicenseKeyType,
    status: LicenseKeyStatus.default('ACTIVE'),
    valid_until: z.date().optional(),
    max_branches: z.number().int().min(1).default(1),
    organization_id: z.string(),
    created_at: z.date().default(() => new Date()),
    updated_at: z.date().default(() => new Date()),
});

export type LicenseKey = z.infer<typeof LicenseKeySchema>;

export const PaymentMethod = z.enum(['BANK_TRANSFER', 'GCASH', 'PAYMAYA']);
export const PaymentProofStatus = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

export const PaymentProofSchema = z.object({
    id: z.string().uuid().optional(),
    organization_id: z.string(),
    reference_no: z.string().optional(),
    amount: z.number().min(0),
    payment_method: PaymentMethod,
    image_url: z.string().url(),
    status: PaymentProofStatus.default('PENDING'),
    reviewed_by: z.string().optional(),
    rejection_reason: z.string().optional(),
    created_at: z.date().default(() => new Date()),
    updated_at: z.date().default(() => new Date()),
});

export type PaymentProof = z.infer<typeof PaymentProofSchema>;

// Heartbeat (Online Check)
export const HeartbeatRequestSchema = z.object({
    license_id: z.string(),
    device_id: z.string(),
    ip_address: z.string().optional(), // Server detects this usually
    timestamp: z.number(),
    version: z.string(),
});

export type HeartbeatRequest = z.infer<typeof HeartbeatRequestSchema>;

// Cash Management
export const CashTransactionType = z.enum(['PAY_IN', 'PAY_OUT', 'DROP']);

export const CashTransactionSchema = z.object({
    id: z.string().uuid().optional(),
    shift_id: z.string(),
    type: CashTransactionType,
    amount: z.number().min(0),
    reason: z.string().min(1),
    timestamp: z.date().default(() => new Date()),
    synced: z.boolean().default(false),
    performed_by: z.string().optional(), // User ID or Name
});

export type CashTransaction = z.infer<typeof CashTransactionSchema>;

export const WorkShiftStatus = z.enum(['OPEN', 'CLOSED']);

export const WorkShiftSchema = z.object({
    id: z.string().uuid().optional(),
    device_id: z.string().optional(),
    status: WorkShiftStatus.default('OPEN'),

    // Timestamps
    start_time: z.date().default(() => new Date()),
    end_time: z.date().optional(),

    // Money
    opening_float: z.number().min(0),
    expected_cash: z.number().default(0), // Calculated: Float + Cash Sales + Pay Ins - Pay Outs
    actual_cash: z.number().optional(), // Blind count entered at close
    variance: z.number().optional(),    // actual - expected

    notes: z.string().optional(),
    synced: z.boolean().default(false),
    closed_by: z.string().optional(),
});

export type WorkShift = z.infer<typeof WorkShiftSchema>;

// App Settings (Moved here to resolve circular dependency with AccessPermission)
export const AppSettingsSchema = z.object({
    id: z.string().default('device_settings'),
    enable_shifts: z.boolean().default(true),
    enable_tax_automation: z.boolean().default(false),

    // Tax & Fees
    tax_rate: z.number().min(0).default(0), // e.g. 12 for 12%
    tax_name: z.string().default('Tax'), // e.g. "VAT" or "Sales Tax"
    tax_inclusive: z.boolean().default(true), // If true, price includes tax
    enable_service_charge: z.boolean().default(false),
    service_charge_rate: z.number().min(0).default(0),

    // Localization
    currency: z.enum(['PHP', 'USD', 'EUR', 'GBP']).default('PHP'),

    // Receipt Customization
    receipt_header: z.string().default('Welcome to VibePOS'),
    receipt_footer: z.string().default('Thank you for your business!'),
    receipt_logo_url: z.string().optional(),

    printer_ip: z.string().optional(),
    role_permissions: z.record(z.array(AccessPermission)).optional(),
});

export type AppSettings = z.infer<typeof AppSettingsSchema>;

// Reporting
export const ReportType = z.enum(['SALES_SUMMARY', 'DISCOUNT_SUMMARY', 'INVENTORY_VALUATION', 'Z-READING', 'X-READING', 'SALES_BOOK', 'DISCOUNT_BOOK']);

export const ReportLogSchema = z.object({
    id: z.string().uuid(),
    type: ReportType,
    generated_at: z.date().default(() => new Date()),
    generated_by: z.string().optional(), // User ID or Name
    parameters: z.record(z.any()).optional(), // JSON of params used (start, end, filters)
    result_summary: z.record(z.any()).optional(), // Snapshot of key metrics (e.g. Total Sales: 5000)
});

export type ReportLog = z.infer<typeof ReportLogSchema>;


// Sync Engine (Enhanced)
export const SyncActionType = z.enum(['CREATE', 'UPDATE', 'DELETE']);

export const SyncPacketSchema = z.object({
    id: z.string().uuid(), // Unique Packet ID
    terminal_id: z.string(),
    terminal_name: z.string().optional(),
    organization_id: z.string().optional(),
    created_at: z.date(),

    // Data Payloads
    sales: z.array(SaleSchema).optional(),
    customers: z.array(CustomerSchema).optional(),
    shifts: z.array(WorkShiftSchema).optional(),
    stock_movements: z.array(StockMovementSchema).optional(),
});

export type SyncPacket = z.infer<typeof SyncPacketSchema>;

export const SyncAckSchema = z.object({
    packet_id: z.string(),
    status: z.enum(['SUCCESS', 'PARTIAL', 'FAILED']),
    processed_at: z.date(),
    errors: z.array(z.object({
        id: z.string().optional(),
        entity: z.string(),
        error: z.string()
    })).optional()
});

export type SyncAck = z.infer<typeof SyncAckSchema>;

export const SyncLogSchema = z.object({
    id: z.string().uuid().optional(),
    packet_id: z.string(),
    direction: z.enum(['PUSH', 'PULL']),
    status: z.enum(['SUCCESS', 'FAILED']),
    timestamp: z.date().default(() => new Date()),
    details: z.string().optional()
});

export type SyncLog = z.infer<typeof SyncLogSchema>;

// Terminal Management
export const TerminalSchema = z.object({
    id: z.string().uuid().optional(),
    organization_id: z.string(),
    counter: z.number().int(), // 1, 2, 3...
    name: z.string(), // "Terminal #1"
    device_id: z.string().optional(),
    last_seen: z.date().default(() => new Date()),
});

export type Terminal = z.infer<typeof TerminalSchema>;

export const RegisterTerminalResponseSchema = z.object({
    terminal_id: z.string().uuid(),
    terminal_number: z.number().int(),
    name: z.string(),
});

export type RegisterTerminalResponse = z.infer<typeof RegisterTerminalResponseSchema>;
