import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SyncPacket, SyncAck, SyncPacketSchema } from '@vibepos/shared-types';

@Injectable()
export class SyncService {
    private readonly logger = new Logger(SyncService.name);

    constructor(private prisma: PrismaService) { }

    async processPacket(packet: SyncPacket, user?: any): Promise<SyncAck> {
        this.logger.log(`Received Sync Packet: ${packet.id} from Terminal: ${packet.terminal_id}`);
        this.logger.log(`Packet Content: Sales=${packet.sales?.length}, Shifts=${packet.shifts?.length}`);

        // 0. Resolve Organization from Terminal ID
        let terminal = await this.prisma.terminal.findUnique({
            where: { id: packet.terminal_id }
        });

        if (!terminal) {
            const orgId = (packet as any).organization_id;
            this.logger.warn(`Terminal ${packet.terminal_id} not found. Recovery check: orgId=${orgId}`);

            // If terminal is missing, we try to see if it's a valid organization attempting re-registration
            if (orgId) {
                const org = await this.prisma.organization.findUnique({
                    where: { id: orgId }
                });

                if (org) {
                    // Create the missing terminal record with the SAME ID it's already using
                    const count = await this.prisma.terminal.count({ where: { organizationId: org.id } });
                    const terminalName = (packet as any).terminal_name || `Terminal #${count + 1}`;

                    this.logger.log(`Found Org ${org.name} for recovery. Creating terminal: ${terminalName}`);

                    terminal = await this.prisma.terminal.create({
                        data: {
                            id: packet.terminal_id, // Reuse existing client-side ID
                            organizationId: org.id,
                            counter: count + 1,
                            name: terminalName,
                        }
                    });
                    this.logger.log(`Terminal ${terminal.id} recovered successfully as ${terminalName}.`);
                } else {
                    this.logger.error(`Org ID ${orgId} not found in database. Recovery failed.`);
                }
            } else {
                this.logger.error(`No organization_id in packet. Recovery impossible.`);
            }
        }

        if (!terminal) {
            this.logger.error(`Terminal ${packet.terminal_id} not found and recovery failed. Rejecting packet.`);
            return {
                packet_id: packet.id,
                status: 'FAILED',
                processed_at: new Date(),
                errors: [{ entity: 'Packet', error: 'Terminal not recognized' }]
            };
        }

        // --- SECONDARY SECURITY CHECK ---
        // Verify if the Sync User belongs to the Terminal's Organization
        if (user && user.organizationId) {
            if (terminal.organizationId !== user.organizationId) {
                this.logger.error(`SECURITY ALERT: User ${user.username} (Org: ${user.organizationId}) attempted to sync to Terminal ${terminal.name} (Org: ${terminal.organizationId}). REJECTED.`);
                return {
                    packet_id: packet.id,
                    status: 'FAILED',
                    processed_at: new Date(),
                    errors: [{ entity: 'Security', error: 'Organization Mismatch: User does not belong to this Terminal.' }]
                };
            }
        }

        // Update Last Seen
        await this.prisma.terminal.update({
            where: { id: terminal.id },
            data: { lastSeen: new Date() }
        });

        const organizationId = terminal.organizationId;

        try {
            await this.prisma.$transaction(async (prisma: any) => {
                // 1. Process Customers
                if (packet.customers && packet.customers.length > 0) {
                    for (const customer of packet.customers) {
                        await prisma.customer.upsert({
                            where: { id: customer.id },
                            update: {
                                ...customer,
                                birthdate: customer.birthdate ? new Date(customer.birthdate) : null,
                                last_visit: new Date(customer.last_visit)
                            },
                            create: {
                                ...customer,
                                birthdate: customer.birthdate ? new Date(customer.birthdate) : null,
                                last_visit: new Date(customer.last_visit),
                                organizationId
                            }
                        });
                    }
                }

                // 2. Process Sales
                if (packet.sales && packet.sales.length > 0) {
                    for (const sale of packet.sales) {
                        // Check if exists to support idempotency
                        const existing = await prisma.sale.findUnique({ where: { id: sale.id } });
                        if (existing) continue;

                        // Ensure all products in the sale exist (Satisfy FK constraint)
                        for (const item of sale.items) {
                            await prisma.product.upsert({
                                where: { id: item.product_id },
                                update: {}, // Stay as is if exists
                                create: {
                                    id: item.product_id,
                                    name: item.name,
                                    price: item.price_at_sale,
                                    category: (item as any).category || "Uncategorized", // Dynamic category
                                    type: (item as any).type || "RETAIL" // Use provided type or fallback
                                }
                            });
                        }

                        const { discount_info, ...saleData } = sale as any; // Remove unmapped fields

                        await prisma.sale.create({
                            data: {
                                id: sale.id,
                                invoiceNumber: sale.invoice_number, // Map snake_case
                                totalAmount: sale.total_amount,     // Map snake_case
                                paymentMethod: sale.payment_method, // Map snake_case
                                status: sale.status,
                                timestamp: new Date(sale.timestamp),
                                discountName: sale.discount_name,
                                discountAmount: sale.discount_amount,
                                organization: { connect: { id: organizationId } },
                                terminal: { connect: { id: terminal.id } },
                                items: {
                                    create: sale.items.map(item => ({
                                        productId: item.product_id,
                                        quantity: item.quantity,
                                        priceAtSale: item.price_at_sale,
                                        name: item.name
                                    }))
                                }
                            }
                        });
                    }
                }

                // 3. Process Shifts
                if (packet.shifts && packet.shifts.length > 0) {
                    for (const shift of packet.shifts) {
                        try {
                            await prisma.workShift.upsert({
                                where: { id: shift.id },
                                update: {
                                    ...shift,
                                    startTime: new Date(shift.start_time),
                                    endTime: shift.end_time ? new Date(shift.end_time) : null,
                                },
                                create: {
                                    ...shift,
                                    startTime: new Date(shift.start_time),
                                    endTime: shift.end_time ? new Date(shift.end_time) : null,
                                    organizationId
                                }
                            });
                        } catch (e) {
                            // If shift fails, log but continue (maybe deviceId issues?)
                            // Often 'device_id' on client might not match a relation on server if not rigorously managed
                            // We will strip device_id for safer sync if it causes issues, but let's try strict first.
                            console.error(`Failed to sync shift ${shift.id}:`, e);
                        }
                    }
                }

                // 4. Process Stock Movements
                if (packet.stock_movements && packet.stock_movements.length > 0) {
                    for (const movement of packet.stock_movements) {
                        // Ensure product exists (it should via sales, but for adjustments we must check)
                        const productExists = await prisma.product.findUnique({ where: { id: movement.product_id } });
                        if (!productExists) {
                            // If product missing for stock movement, we can't create it easily without name/price
                            console.warn(`Skipping stock movement ${movement.id} - Product ${movement.product_id} not found.`);
                            continue;
                        }

                        // Check idempotency
                        const existingMove = await prisma.stockMovement.findUnique({ where: { id: movement.id } });
                        if (existingMove) continue;

                        await prisma.stockMovement.create({
                            data: {
                                id: movement.id,
                                productId: movement.product_id,
                                type: movement.type,
                                quantityChange: movement.quantity_change,
                                reason: movement.reason,
                                timestamp: new Date(movement.timestamp),
                                referenceId: movement.reference_id,
                                organizationId // Link to Org
                            }
                        });

                        // Optional: Update current stock level in Product table?
                        // For now we just log the movement history. 
                        // Real-time stock level aggregation is expensive, but some systems update a 'cached' count.
                        // VibePOS seems to treat 'StockMovement' as the ledger.
                        // Let's update the cached stock_level on Product to stay in sync.
                        await prisma.product.update({
                            where: { id: movement.product_id },
                            data: {
                                stockLevel: { increment: movement.quantity_change }
                            }
                        });
                    }
                }
            });

            return {
                packet_id: packet.id,
                status: 'SUCCESS',
                processed_at: new Date()
            };

        } catch (error) {
            this.logger.error(`Failed to process packet ${packet.id}`, error);
            return {
                packet_id: packet.id,
                status: 'FAILED',
                processed_at: new Date(),
                errors: [{ entity: 'Packet', error: error.message }]
            };
        }
    }
}
