import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ProductOrService, Sale, SaleItem, Customer, RetailProduct, ServiceProduct, Discount } from '@vibepos/shared-types';
import { db } from '../db';
import { SyncEngine } from './SyncEngine';
import { useToast } from '../components/ui/Toast';

// Extending the Base type for Cart usage
export interface CartItem extends SaleItem {
    type: 'RETAIL' | 'SERVICE';
}

interface CartContextType {
    items: CartItem[];
    addToCart: (product: ProductOrService) => Promise<void>;
    removeFromCart: (productId: string) => Promise<void>;
    updateQuantity: (productId: string, delta: number) => Promise<void>;
    clearCart: (restoreStock?: boolean) => Promise<void>;
    total: number;
    subtotal: number;
    tax: number;
    taxName: string;
    taxRate: number;
    serviceCharge: number;
    serviceChargeRate: number;
    completeSale: (method: 'CASH' | 'CARD' | 'QR') => Promise<Sale | null>;

    // Customer Management
    selectedCustomer: Customer | null;
    selectCustomer: (customer: Customer | null) => void;

    // Discount Management
    discount: Discount | null;
    applyDiscount: (discount: Discount | null, details?: { id_number: string; holder_name: string }) => void;
    discountAmount: number;
    discountDetails: { id_number: string; holder_name: string } | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const items = useLiveQuery(() => db.cart_items.toArray()) ?? [];
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [discount, setDiscount] = useState<Discount | null>(null);
    const [discountDetails, setDiscountDetails] = useState<{ id_number: string; holder_name: string } | null>(null);
    const { showToast } = useToast();

    // Helper to handle stock reservation (negative delta) or release (positive delta)
    // Returns true if successful, false if blocked (out of stock)
    const handleStockChange = async (productId: string, delta: number): Promise<boolean> => {
        const product = await db.products.get(productId) as RetailProduct | ServiceProduct | undefined;
        if (!product) return false;

        if (product.type === 'SERVICE') return true; // Services have infinite stock for now

        // RETAIL Logic
        const retail = product as RetailProduct;

        if (retail.is_composite && retail.ingredients && retail.ingredients.length > 0) {
            // COMPOSITE: Check/Update Ingredients

            // 1. Check Phase (only if reserving, i.e., delta < 0)
            if (delta < 0) {
                const requiredQty = Math.abs(delta);
                for (const ing of retail.ingredients) {
                    const ingProd = await db.products.get(ing.product_id) as RetailProduct | undefined;
                    const needed = ing.quantity * requiredQty;
                    if (!ingProd || ingProd.stock_level < needed) {
                        showToast(`Ingredient ${ingProd?.name || 'Unknown'} is out of stock`, 'error');
                        return false;
                    }
                }
            }

            // 2. Update Phase
            for (const ing of retail.ingredients) {
                const ingProd = await db.products.get(ing.product_id) as RetailProduct | undefined;
                if (ingProd) {
                    await db.products.update(ing.product_id, {
                        stock_level: ingProd.stock_level + (delta * ing.quantity)
                    });
                }
            }
            return true;
        } else {
            // STANDARD RETAIL
            if (delta < 0) {
                // Reserving
                if (retail.stock_level + delta < 0) {
                    showToast('Item is out of stock', 'error');
                    return false;
                }
            }
            await db.products.update(productId, {
                stock_level: retail.stock_level + delta
            });
            return true;
        }
    };

    const addToCart = async (product: ProductOrService) => {
        // Block Service if no staff assigned
        if (product.type === 'SERVICE') {
            if ('assigned_staff_id' in product && !product.assigned_staff_id) {
                showToast('Warning: Service has no assigned staff.', 'info');
                return;
            }
        }

        // Try to reserve stock (delta -1)
        const success = await handleStockChange(product.id!, -1);
        if (!success) return;

        // DB Cart Persistence
        const existing = await db.cart_items.get(product.id!);
        if (existing) {
            await db.cart_items.update(product.id!, {
                quantity: existing.quantity + 1
            });
        } else {
            await db.cart_items.add({
                product_id: product.id!,
                name: product.name,
                price_at_sale: product.price,
                quantity: 1,
                type: product.type,
                category: product.category
            });
        }
    };

    const removeFromCart = async (productId: string) => {
        const item = await db.cart_items.get(productId);
        if (item) {
            // Restore stock (delta +amount)
            await handleStockChange(productId, item.quantity);
            // Remove from DB Cart
            await db.cart_items.delete(productId);
        }
    };

    const updateQuantity = async (productId: string, delta: number) => {
        const item = await db.cart_items.get(productId);
        if (!item) return;

        // Reserve (-1) or Release (+1) based on delta
        // If Adding (+1), delta passed is +1. We need to reserve (-1). 
        // Logic in handleStockChange: negative is reserve.
        // So pass -delta.
        const success = await handleStockChange(productId, -delta);
        if (!success) return;

        const newQty = item.quantity + delta;
        if (newQty > 0) {
            await db.cart_items.update(productId, { quantity: newQty });
        } else {
            // Should not happen via typical UI + button, but if it does:
            await db.cart_items.delete(productId);
        }
    };

    const clearCart = async (restoreStock = true) => {
        // Must fetch fresh because items state might lag slightly behind DB in some race conditions
        const finalItems = await db.cart_items.toArray();

        if (restoreStock) {
            for (const item of finalItems) {
                await handleStockChange(item.product_id, item.quantity);
            }
        }
        await db.cart_items.clear();

        setSelectedCustomer(null);
        setDiscount(null);
        setDiscountDetails(null);
    };

    // Load Settings
    const settings = useLiveQuery(() => db.settings.get('device_settings')) ?? {
        tax_rate: 0,
        tax_name: 'Tax',
        tax_inclusive: true,
        enable_service_charge: false,
        service_charge_rate: 0
    };

    const calculation = useMemo(() => {
        // 1. Raw Subtotal (Sum of Items)
        const rawSubtotal = items.reduce((sum, item) => {
            const price = Number(item.price_at_sale) || 0;
            const qty = Number(item.quantity) || 0;
            return sum + (price * qty);
        }, 0);

        // 2. Discount Amount
        let dAmount = 0;
        if (discount) {
            const val = Number(discount.value) || 0;
            if (discount.type === 'PERCENTAGE') {
                dAmount = rawSubtotal * (val / 100);
            } else {
                dAmount = val;
            }
        }
        dAmount = Math.max(0, Math.min(dAmount, rawSubtotal));

        // 3. Net Subtotal (Taxable Base if Exclusive)
        // If tax is inclusive, this value effectively includes tax. 
        // We will calculate the tax component out of it.
        const netTotal = rawSubtotal - dAmount;

        let taxAmount = 0;
        let taxableAmount = 0;
        let serviceCharge = 0;
        let finalTotal = 0;

        const taxRate = (settings.tax_rate || 0) / 100;
        const scRate = (settings.enable_service_charge ? (settings.service_charge_rate || 0) : 0) / 100;

        if (settings.tax_inclusive) {
            // INCLUSIVE LOGIC
            // Price Paid = Net Total
            // Tax = Net Total - (Net Total / (1 + Rate))
            taxAmount = netTotal - (netTotal / (1 + taxRate));
            taxableAmount = netTotal - taxAmount;

            // Service Charge on the "Gross" (conceptually debatable, but standard is SC on Bill Total)
            // Let's apply SC on the netTotal (which includes tax)
            serviceCharge = netTotal * scRate;

            finalTotal = netTotal + serviceCharge;
        } else {
            // EXCLUSIVE LOGIC
            // Taxable Base = Net Total
            taxableAmount = netTotal;
            taxAmount = taxableAmount * taxRate;

            // Service Charge on Taxable Base
            serviceCharge = taxableAmount * scRate;

            finalTotal = taxableAmount + taxAmount + serviceCharge;
        }

        return {
            subtotal: Number(netTotal) || 0, // This is "Subtotal after discount"
            discountAmount: dAmount,
            tax: Number(taxAmount) || 0,
            serviceCharge: Number(serviceCharge) || 0,
            total: Number(finalTotal) || 0,

            // Helpful for UI display
            rawSubtotal
        };
    }, [items, discount, settings]);

    const completeSale = async (method: 'CASH' | 'CARD' | 'QR'): Promise<Sale | null> => {
        if (items.length === 0) return null;

        // Generate Invoice Number
        const lastSale = await db.sales.orderBy('invoice_number').last();
        let nextInvoiceNum = 1;
        if (lastSale && lastSale.invoice_number) {
            const current = parseInt(lastSale.invoice_number, 10);
            if (!isNaN(current)) {
                nextInvoiceNum = current + 1;
            }
        }
        const invoiceNumber = nextInvoiceNum.toString().padStart(6, '0');

        const sale: Sale = {
            id: crypto.randomUUID(),
            items: items.map((item) => ({
                ...item,
                type: item.type, // Explicitly pass type
                category: (item as any).category // Explicitly pass category
            })),

            total_amount: calculation.total,
            subtotal_amount: calculation.subtotal,

            // Tax & Fees Snapshot
            tax_amount: calculation.tax,
            tax_name: settings.tax_name,
            tax_rate_snapshot: settings.tax_rate,
            is_tax_inclusive: settings.tax_inclusive ?? true,

            service_charge_amount: calculation.serviceCharge,

            payment_method: method === 'QR' ? 'ONLINE' : method as any,
            status: 'COMPLETED',
            synced: false,
            timestamp: new Date(),
            customer_name: selectedCustomer?.name || 'Walk-in Customer',
            customer_id: selectedCustomer?.id,
            order_number: `ORD - ${Date.now().toString().slice(-6)} -${Math.floor(Math.random() * 1000)} `,
            invoice_number: invoiceNumber,
            discount_info: discountDetails || undefined, discount_name: discount?.name,
            discount_amount: calculation.discountAmount > 0 ? calculation.discountAmount : undefined,
        };

        try {
            await db.transaction('rw', [db.sales, db.customers, db.stock_movements, db.products, db.work_shifts, db.cart_items, db.sync_queue], async () => {
                // 1. Save the Sale
                await db.sales.add(sale);

                // 2. Generate Stock Movements (Moved up for Sync)
                const movements: any[] = [];
                for (const item of items) {
                    const product = await db.products.get(item.product_id) as RetailProduct | ServiceProduct | undefined;

                    if (product && product.type === 'RETAIL') {
                        const retail = product as RetailProduct;

                        if (retail.is_composite && retail.ingredients) {
                            for (const ing of retail.ingredients) {
                                movements.push({
                                    id: crypto.randomUUID(),
                                    product_id: ing.product_id,
                                    type: 'SALE',
                                    quantity_change: -(ing.quantity * item.quantity),
                                    reason: `Sold via Composite: ${retail.name} (Qty: ${item.quantity})`,
                                    timestamp: new Date(),
                                    synced: false,
                                    reference_id: sale.id
                                });
                            }
                        } else {
                            movements.push({
                                id: crypto.randomUUID(),
                                product_id: retail.id,
                                type: 'SALE',
                                quantity_change: -(item.quantity),
                                reason: 'Sale',
                                timestamp: new Date(),
                                synced: false,
                                reference_id: sale.id
                            });
                        }
                    }
                }

                if (movements.length > 0) {
                    await db.stock_movements.bulkAdd(movements);
                }

                // 3. Trigger Background Sync
                // We don't await this so UI doesn't block
                SyncEngine.queuePacket({
                    sales: [sale as any],
                    stock_movements: movements // Include Generated Movements
                }).catch(console.error);

                // 3. Update Customer Stats
                if (selectedCustomer && selectedCustomer.id) {
                    const cust = await db.customers.get(selectedCustomer.id);
                    if (cust) {
                        await db.customers.update(selectedCustomer.id, {
                            total_spent: (cust.total_spent || 0) + calculation.total,
                            last_visit: new Date()
                        });
                    }
                }

                // 4. Update Shift Cash (If CASH sale)
                if (method === 'CASH') {
                    const activeShift = await db.work_shifts.where('status').equals('OPEN').first();
                    if (activeShift && activeShift.id) {
                        await db.work_shifts.update(activeShift.id, {
                            expected_cash: (activeShift.expected_cash || 0) + calculation.total,
                            synced: false
                        });
                    }
                }

                // 5. Clear Persistent Cart (Inside Transaction)
                await db.cart_items.clear();
            });

            console.log("Sale Completed");
            // Clear cart WITHOUT restoring stock (as it's sold)
            // await clearCart(false); // Already done in transaction

            console.log("Triggering Success Toast");
            showToast('Sale Completed Successfully!', 'success');
            return sale;
        } catch (error) {
            console.error("Failed to process sale:", error);
            showToast('Failed to process sale locally.', 'error');
            return null;
        }
    };

    return (
        <CartContext.Provider value={{
            items,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            subtotal: calculation.subtotal,
            tax: calculation.tax,
            taxName: settings.tax_name || 'Tax',
            taxRate: settings.tax_rate || 0,
            serviceCharge: calculation.serviceCharge,
            serviceChargeRate: settings.enable_service_charge ? (settings.service_charge_rate || 0) : 0,
            total: calculation.total,
            completeSale,
            selectedCustomer,
            selectCustomer: setSelectedCustomer,
            discount,
            applyDiscount: (d, details) => {
                // Expiration Check
                if (d && d.valid_until && new Date(d.valid_until) < new Date()) {
                    showToast(`Discount "${d.name}" has expired!`, 'error');
                    return;
                }
                setDiscount(d);
                setDiscountDetails(details || null);
            },
            discountAmount: calculation.discountAmount,
            discountDetails
        }}>
            {children}
        </CartContext.Provider >
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within CartProvider");
    return context;
};
