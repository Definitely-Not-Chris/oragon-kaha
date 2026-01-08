import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterTerminalResponse } from '@vibepos/shared-types';

@Injectable()
export class TerminalsService {
    constructor(private prisma: PrismaService) { }

    async register(organizationId: string, deviceId?: string): Promise<RegisterTerminalResponse> {
        // 1. Check if device already registered? (Optional - for now assume always new if no ID presented)

        // 2. Count existing terminals for this Org to determine number
        const count = await this.prisma.terminal.count({
            where: { organizationId }
        });

        const nextNumber = count + 1;
        const name = `Terminal #${nextNumber}`;

        // 3. Create Terminal
        const terminal = await this.prisma.terminal.create({
            data: {
                organizationId,
                counter: nextNumber,
                name,
                deviceId
            }
        });

        return {
            terminal_id: terminal.id,
            terminal_number: terminal.counter,
            name: terminal.name
        };
    }

    async findAll(organizationId: string) {
        return this.prisma.terminal.findMany({
            where: { organizationId },
            orderBy: { counter: 'asc' }
        });
    }
}
