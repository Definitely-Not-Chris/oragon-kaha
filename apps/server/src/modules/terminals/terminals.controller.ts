import { Body, Controller, Post, Get, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TerminalsService } from './terminals.service';
import { RegisterTerminalResponse } from '@vibepos/shared-types';

// TODO: Add AuthGuard once we figure out how activation authenticates (License Key or User Token?)
// For now, we might assume the client sends the Organization ID or License Key in body?
// Re-reading plan: "POS requests Register Terminal".
// Safe bet: Require User Login token (Cashier/Admin) to register a terminal?
// Or just open for now with Org ID.
// Let's go with Body containing organization_id for MVP simplicity, assume network trust or improve later.

@Controller('terminals')
export class TerminalsController {
    constructor(private readonly terminalsService: TerminalsService) { }

    @Post('register')
    @UseGuards(JwtAuthGuard)
    async register(@Body() body: { organization_id: string; device_id?: string }, @Request() req): Promise<RegisterTerminalResponse> {
        if (req.user.role === 'SUPER_ADMIN') {
            throw new ForbiddenException('Super Admins cannot activate terminals');
        }
        return this.terminalsService.register(body.organization_id, body.device_id);
    }

    @Get()
    async findAll(@Query('organization_id') organizationId: string) {
        return this.terminalsService.findAll(organizationId);
    }
}
