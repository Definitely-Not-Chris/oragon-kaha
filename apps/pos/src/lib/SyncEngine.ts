import { db, SyncQueueItem } from "../db";
import { v4 as uuidv4 } from 'uuid';
import { SyncPacket } from "@vibepos/shared-types";

export const SYNC_API_URL = "http://localhost:3000/sync/push"; // TODO: Move to config

export class SyncEngine {
    private static isSyncing = false;

    // Queue a packet for sync
    static async queuePacket(packet: Omit<SyncPacket, 'id' | 'created_at' | 'terminal_id' | 'organization_id'>) {
        console.log(`[Sync] Queueing packet:`, packet);
        const terminalId = localStorage.getItem('vibepos_terminal_id');
        if (!terminalId) {
            console.warn("[Sync] No Terminal ID found. Cannot queue packet.");
            return; // Or throw?
        }

        // Read organizationId from localStorage
        const userStr = localStorage.getItem('vibepos_user');
        const user = userStr ? JSON.parse(userStr) : null;
        const organizationId = user?.organizationId;
        if (!organizationId) {
            console.warn("[Sync] No Organization ID found. Cannot queue packet.");
            return; // Or throw?
        }

        const terminalName = localStorage.getItem('vibepos_terminal_name') || undefined;

        const fullPacket: SyncPacket = {
            id: uuidv4(),
            terminal_id: terminalId,
            terminal_name: terminalName,
            organization_id: organizationId, // Add organization_id here
            created_at: new Date(),
            ...packet
        };

        // Sanitize packet to ensure it's Dexie-compatible (no undefineds, functions)
        // This fixes DataCloneError
        let cleanPayload;
        try {
            cleanPayload = JSON.parse(JSON.stringify(fullPacket));
        } catch (jsonErr) {
            console.error("[Sync] JSON Serialization Failed - Circular Reference?", jsonErr);
            throw jsonErr;
        }

        try {
            if (!db.sync_queue) throw new Error("Sync Queue table missing (undefined)");

            await db.sync_queue.add({
                url: SYNC_API_URL,
                method: 'POST',
                payload: cleanPayload,
                status: 'PENDING',
                retry_count: 0,
                created_at: new Date()
            });
            console.log("[Sync] Packet queued successfully in Dexie");
        } catch (e: any) {
            console.error("[Sync] CRITICAL: Failed to queue packet to Dexie");
            console.error("Error Name:", e.name);
            console.error("Error Message:", e.message);
            console.error("Error Stack:", e.stack);
            throw e; // Propagate to caller (useCart)
        }

        // Try to sync immediately (force check)
        syncEngine.processQueue(true);
    }

    // Main Loop
    async processQueue(force = false) {
        if (SyncEngine.isSyncing) return;
        if (!navigator.onLine && !force) return;
        SyncEngine.isSyncing = true;

        try {
            // If forced (manual retry), reset FAILED items to PENDING first
            if (force) {
                await db.sync_queue
                    .where('status')
                    .equals('FAILED')
                    .modify({ status: 'PENDING', retry_count: 0 });
            }

            // Get oldest pending items first (FIFO)
            const pendingItems = await db.sync_queue
                .where('status')
                .equals('PENDING')
                .limit(5)
                .toArray();

            if (pendingItems.length === 0) {
                SyncEngine.isSyncing = false;
                return;
            }

            for (const item of pendingItems) {
                await this.processItem(item);
            }

            // Continue processing if there are more
            const remaining = await db.sync_queue.where('status').equals('PENDING').count();
            SyncEngine.isSyncing = false; // Release lock briefly
            if (remaining > 0) {
                this.processQueue(true);
            }

        } catch (error) {
            console.error("Sync Cycle Failed:", error);
            SyncEngine.isSyncing = false;
        }
    }

    private async processItem(item: SyncQueueItem) {
        try {
            // Update status to processing
            await db.sync_queue.update(item.id!, { status: 'PROCESSING' });

            // INJECTION: Ensure organization_id is present for items queued before the update
            let payload = { ...(item.payload as any) };
            if (!payload.organization_id) {
                const userStr = localStorage.getItem('vibepos_user');
                const user = userStr ? JSON.parse(userStr) : null;
                if (user?.organizationId) {
                    payload.organization_id = user.organizationId;
                    console.log(`[Sync] Injected organization_id ${user.organizationId} into legacy packet ${item.id}`);
                }
            }

            const token = localStorage.getItem("vibepos_pos_token");
            const headers: any = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(item.url, {
                method: item.method,
                headers: headers,
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            const result = await response.json();
            if (result.status !== 'SUCCESS') {
                throw new Error(`Server rejected packet: ${JSON.stringify(result.errors || result.status)}`);
            }

            // Success: Remove from queue
            await db.sync_queue.delete(item.id!);
            console.log(`[Sync] Packet ${item.id} synced successfully.`);

            // CRITICAL: Update local entities to synced=true
            const packet = item.payload as SyncPacket;

            if (packet.sales && packet.sales.length > 0) {
                await Promise.all(packet.sales.map(s => db.sales.update(s.id!, { synced: true })));
            }

            if (packet.stock_movements && packet.stock_movements.length > 0) {
                await Promise.all(packet.stock_movements.map(s => db.stock_movements.update(s.id!, { synced: true })));
            }

            if (packet.shifts && packet.shifts.length > 0) {
                await Promise.all(packet.shifts.map(s => db.work_shifts.update(s.id!, { synced: true })));
            }

        } catch (error) {
            console.error(`[Sync] Failed to sync item ${item.id}:`, error);

            // Retry Logic
            if (item.retry_count < 5) {
                await db.sync_queue.update(item.id!, {
                    status: 'PENDING', // Send back to queue
                    retry_count: item.retry_count + 1,
                    error_log: (error as any).message || String(error)
                });
            } else {
                // Give up after 5 tries
                await db.sync_queue.update(item.id!, {
                    status: 'FAILED'
                });
            }
        }
    }
}

export const syncEngine = new SyncEngine();
