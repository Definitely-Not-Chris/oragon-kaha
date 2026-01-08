import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncPacket, SyncAck } from '@vibepos/shared-types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sync')
export class SyncController {
    private logs: string[] = [];

    constructor(private readonly syncService: SyncService) { }

    @Post('push')
    @UseGuards(JwtAuthGuard)
    async push(@Body() packet: SyncPacket, @Request() req): Promise<SyncAck> {
        this.addLog(`Received packet ${packet.id} from ${packet.terminal_id}. OrgID: ${(packet as any).organization_id || 'NONE'}`);
        try {
            // req.user is populated by JwtStrategy (userId, username, role, organizationId)
            const result = await this.syncService.processPacket(packet, req.user);
            this.addLog(`Processed packet ${packet.id}: ${result.status}`);
            return result;
        } catch (e: any) {
            this.addLog(`Error processing packet ${packet.id}: ${e.message}`);
            throw e;
        }
    }

    @Get('logs')
    getLogs() {
        return this.logs.slice(-50).reverse(); // Return last 50 logs
    }

    private addLog(message: string) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}`;
        this.logs.push(logEntry);
        console.log(logEntry); // Also log to console
        if (this.logs.length > 200) this.logs.shift(); // Limit memory usage
    }
}
