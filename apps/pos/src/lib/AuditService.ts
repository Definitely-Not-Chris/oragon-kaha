import { db } from '../db';
import { AuditLog, AuditActionType } from '@vibepos/shared-types';

export const AuditService = {
    async logAction(
        action: typeof AuditActionType._type,
        details?: string,
        userId?: string,
        userName?: string
    ) {
        try {
            const log: AuditLog = {
                id: crypto.randomUUID(),
                action,
                details,
                user_id: userId,
                user_name: userName,
                timestamp: new Date(),
                synced: false
            };

            await db.audit_logs.add(log);
            console.log(`[Audit] ${action}: ${details}`);

            // Trigger Sync (Fire and Forget)
            import('./SyncEngine').then(({ SyncEngine }) => {
                SyncEngine.queuePacket({
                    audit_logs: [log]
                });
            });
        } catch (error) {
            console.error('Failed to log audit action:', error);
        }
    }
};
