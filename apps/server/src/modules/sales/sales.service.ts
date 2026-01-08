import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SalesService {
    constructor(private prisma: PrismaService) { }

    create() {
        return { status: 'Sale created' };
    }

    async findAll(organizationId: string, from?: string, to?: string) {
        const where: any = { organizationId };

        if (from) {
            where.timestamp = {
                gte: new Date(from),
                ...(to ? { lte: new Date(to) } : {})
            };
        }

        return this.prisma.sale.findMany({
            where,
            include: {
                items: true,
                terminal: true
            },
            orderBy: { timestamp: 'desc' }
        });
    }
}
