import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Organization, OrganizationSchema } from '@vibepos/shared-types';

@Injectable()
export class OrganizationsService {
    constructor(private prisma: PrismaService) { }

    async create(data: Omit<Organization, 'id' | 'created_at'>) {
        // Validate
        OrganizationSchema.omit({ id: true, created_at: true }).parse({
            ...data,
            is_active: data.is_active ?? true
        });

        return this.prisma.organization.create({
            data: {
                name: data.name,
                contactEmail: data.contact_email,
                isActive: data.is_active
            }
        });
    }

    async findAll() {
        return this.prisma.organization.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { users: true }
                }
            }
        });
    }

    async findOne(id: string) {
        const org = await this.prisma.organization.findUnique({
            where: { id },
            include: { users: true }
        });
        if (!org) throw new NotFoundException('Organization not found');
        return org;
    }

    async update(id: string, data: Partial<Organization>) {
        await this.findOne(id);

        return this.prisma.organization.update({
            where: { id },
            data: {
                name: data.name,
                contactEmail: data.contact_email,
                isActive: data.is_active
            }
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        // Maybe check dependencies before delete?
        return this.prisma.organization.delete({ where: { id } });
    }
}
