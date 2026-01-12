import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, UserSchema } from '@vibepos/shared-types';

import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async createUser(data: Omit<User, 'id'>) {
        // Basic validation
        UserSchema.omit({ id: true }).parse(data);

        // Check duplicates
        const existing = await this.prisma.user.findUnique({ where: { username: data.username } });
        if (existing) throw new BadRequestException('Username already taken');

        const hashedPassword = await bcrypt.hash(data.password, 10);

        return this.prisma.user.create({
            data: {
                username: data.username,
                password: hashedPassword,
                fullName: data.full_name,
                role: data.role,
                organizationId: data.organization_id || null
            }
        });
    }

    async findAll() {
        return this.prisma.user.findMany({
            include: { organization: true },
            orderBy: { username: 'asc' }
        });
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { organization: true }
        });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async findByUsername(username: string) {
        return this.prisma.user.findUnique({
            where: { username },
            include: { organization: true }
        });
    }

    async update(id: string, data: Partial<User>) {
        const user = await this.findOne(id);

        let updateData: any = {
            fullName: data.full_name,
            role: data.role,
            organizationId: data.organization_id,
        };

        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        return this.prisma.user.update({
            where: { id },
            data: updateData
        });
    }

    async remove(id: string) {
        await this.findOne(id);
        return this.prisma.user.delete({ where: { id } });
    }
}
