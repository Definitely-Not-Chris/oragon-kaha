import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
    PaymentProofSchema, PaymentProof,
    LicenseKeySchema, LicenseKey, LicenseKeyType, LicenseKeyStatus
} from '@vibepos/shared-types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LicensingService {
    constructor(private prisma: PrismaService) { }

    // Public: Upload Proof of Payment
    async uploadProof(data: any) {
        let orgId = data.organizationId || data.organization_id;

        // If Org ID is missing but Name is provided, create the Organization
        if (!orgId && data.organizationName) {
            const newOrg = await this.prisma.organization.create({
                data: {
                    name: data.organizationName,
                    isActive: true
                }
            });
            orgId = newOrg.id;

            // Link the creating user to this new Organization
            if (data.userId) {
                await this.prisma.user.update({
                    where: { id: data.userId },
                    data: { organizationId: orgId }
                });
            }
        } else if (!orgId) {
            throw new BadRequestException('Organization ID or Name is required');
        }

        // Validate other fields manually or use schema subset (ignoring org_id since we resolved it)
        const amount = Number(data.amount);
        if (isNaN(amount)) throw new BadRequestException('Invalid Amount');

        return this.prisma.paymentProof.create({
            data: {
                organizationId: orgId,
                amount: amount,
                paymentMethod: data.payment_method || 'CASH',
                imageUrl: data.image_url || '',
                referenceNo: data.reference_no,
                // Default status is PENDING
            }
        });
    }

    // Admin: List Proofs (Filtered)
    async getProofs(status?: string, search?: string) {
        const where: any = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { referenceNo: { contains: search, mode: 'insensitive' } },
                { organization: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }

        return this.prisma.paymentProof.findMany({
            where,
            include: { organization: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    // Admin: Update Pending Proof (e.g. Correct amount)
    async updateProof(id: string, data: { amount?: number, referenceNo?: string }) {
        const proof = await this.prisma.paymentProof.findUnique({ where: { id } });
        if (!proof) throw new NotFoundException('Payment proof not found');
        if (proof.status !== 'PENDING') throw new BadRequestException('Can only update pending proofs');

        return this.prisma.paymentProof.update({
            where: { id },
            data: {
                amount: data.amount,
                referenceNo: data.referenceNo
            }
        });
    }

    // Admin: Approve Proof & Generate/Extend Key
    async approveProof(
        proofId: string,
        adminId: string,
        licenseType: 'PRO' | 'ENTERPRISE',
        maxBranches: number,
        durationDays: number
    ) {
        const proof = await this.prisma.paymentProof.findUnique({ where: { id: proofId } });
        if (!proof) throw new NotFoundException('Payment proof not found');
        if (proof.status !== 'PENDING') throw new BadRequestException('Proof already reviewed');

        const keyString = `VIBE-${licenseType}-${uuidv4().substring(0, 8).toUpperCase()}`;

        // Calculate Validity
        const now = new Date();
        const existingKey = await this.prisma.licenseKey.findUnique({ where: { organizationId: proof.organizationId } });

        let validUntil = new Date();
        // If key exists and is valid, extend from current expiry
        if (existingKey && existingKey.validUntil && existingKey.validUntil > now) {
            validUntil = new Date(existingKey.validUntil);
        }
        // Add duration
        validUntil.setDate(validUntil.getDate() + durationDays);

        const result = await this.prisma.$transaction(async (tx) => {
            // Update Proof
            await tx.paymentProof.update({
                where: { id: proofId },
                data: {
                    status: 'APPROVED',
                    reviewedBy: adminId
                }
            });

            // Upsert License
            return tx.licenseKey.upsert({
                where: { organizationId: proof.organizationId },
                create: {
                    key: keyString,
                    type: licenseType,
                    organizationId: proof.organizationId,
                    maxBranches: maxBranches,
                    status: 'ACTIVE',
                    validUntil: validUntil
                },
                update: {
                    // Don't change key if exists, just extend validity? 
                    // Let's keep one key per org for simplicity for now.
                    // But if they upgrade type, maybe update type.
                    type: licenseType,
                    maxBranches: maxBranches,
                    status: 'ACTIVE',
                    validUntil: validUntil
                }
            });
        });

        return result;
    }

    // Admin: Reject Proof
    async rejectProof(proofId: string, adminId: string, reason: string) {
        return this.prisma.paymentProof.update({
            where: { id: proofId },
            data: {
                status: 'REJECTED',
                reviewedBy: adminId,
                rejectionReason: reason
            }
        });
    }

    // Admin: List All Keys
    async listAllKeys() {
        return this.prisma.licenseKey.findMany({
            include: { organization: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    // Admin: Revoke Key
    async revokeKey(keyId: string) {
        return this.prisma.licenseKey.update({
            where: { id: keyId },
            data: { status: 'REVOKED' }
        });
    }

    // Public: Get My License (For Client Dashboard)
    async getLicensesByOrgId(orgId: string) {
        return this.prisma.licenseKey.findMany({
            where: { organizationId: orgId },
            include: { organization: true },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getProofsByOrgId(orgId: string) {
        return this.prisma.paymentProof.findMany({
            where: { organizationId: orgId },
            orderBy: { createdAt: 'desc' }
        });
    }

    // Public: Heartbeat Check from Terminals
    async heartbeat(licenseKey: string, deviceId: string) {
        const license = await this.prisma.licenseKey.findFirst({
            where: { key: licenseKey }
        });

        if (!license) {
            // If strictly enforcing, return INVALID. 
            // If allowing "Demo" or unkeyed for now, handle accordingly.
            // Here we assume strict:
            return { status: 'INVALID', commands: ['DEACTIVATE'] };
        }

        if (license.status === 'REVOKED') {
            return { status: 'REVOKED', commands: ['DEACTIVATE'] };
        }

        if (license.validUntil && new Date(license.validUntil) < new Date()) {
            // Auto-expire?
            return { status: 'EXPIRED', commands: ['DEACTIVATE'] };
        }

        // Ideally log this heartbeat to a Device table to track active devices count vs Max Branches

        return { status: 'ACTIVE', commands: [] };
    }
}
