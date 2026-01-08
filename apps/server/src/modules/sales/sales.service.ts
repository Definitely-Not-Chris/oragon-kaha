import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SalesService {
    constructor(private prisma: PrismaService) { }

    create() {
        return { status: 'Sale created' };
    }

    async findAll(organizationId: string) {
        return this.prisma.sale.findMany({
            where: { organizationId },
            include: {
                items: true,
                terminal: true
            },
            orderBy: { timestamp: 'desc' }
        });
    }
}
