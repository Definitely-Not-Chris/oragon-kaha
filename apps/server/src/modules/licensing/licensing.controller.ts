import { Controller, Get, Post, Body, Param, Put, UseGuards, Request, Query } from '@nestjs/common';
import { LicensingService } from './licensing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('licensing')
export class LicensingController {
    constructor(private readonly licensingService: LicensingService) { }

    // Public Endpoint (simulation, normally guarded by User Auth)

    @Post('heartbeat')
    async heartbeat(@Body() body: { key: string, deviceId: string }) {
        return this.licensingService.heartbeat(body.key, body.deviceId);
    }

    // Admin Endpoints
    @Get('admin/proofs')
    async getProofs(@Query('status') status?: string, @Query('search') search?: string) {
        return this.licensingService.getProofs(status, search);
    }

    @Put('admin/proofs/:id')
    async updateProof(
        @Param('id') id: string,
        @Body() body: { amount?: number, referenceNo?: string }
    ) {
        return this.licensingService.updateProof(id, body);
    }

    @Post('admin/approve/:id')
    async approveProof(
        @Param('id') proofId: string,
        @Body() body: { adminId: string, type: 'PRO' | 'ENTERPRISE', maxBranches: number, durationDays: number }
    ) {
        // Default duration if missing (fallback)
        const duration = body.durationDays || 30;
        return this.licensingService.approveProof(proofId, body.adminId, body.type, body.maxBranches, duration);
    }

    @Post('admin/reject/:id')
    async rejectProof(
        @Param('id') proofId: string,
        @Body() body: { adminId: string, reason: string }
    ) {
        return this.licensingService.rejectProof(proofId, body.adminId, body.reason);
    }

    @Get('admin/keys')
    async listKeys() {
        return this.licensingService.listAllKeys();
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getMyLicense(@Request() req) {
        if (!req.user.organizationId) {
            return null;
        }
        // Return the first active license for now
        const licenses = await this.licensingService.getLicensesByOrgId(req.user.organizationId);
        return licenses[0] || null;
    }

    @UseGuards(JwtAuthGuard)
    @Post('proof')
    async uploadProof(@Request() req, @Body() body: any) {
        // Allow upload even if no Org ID yet (e.g. creating new Org via proof)
        return this.licensingService.uploadProof({
            ...body,
            organizationId: req.user.organizationId,
            userId: req.user.userId
        });
    }

    @UseGuards(JwtAuthGuard)
    @Get('me/payments')
    async getMyPaymentHistory(@Request() req) {
        if (!req.user.organizationId) {
            return [];
        }
        return this.licensingService.getProofsByOrgId(req.user.organizationId);
    }

    @Put('admin/revoke/:id')
    async revokeKey(@Param('id') keyId: string) {
        return this.licensingService.revokeKey(keyId);
    }
}
