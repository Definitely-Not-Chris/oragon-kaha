import { Controller, Post, Get, Query } from '@nestjs/common';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
    constructor(private readonly salesService: SalesService) { }

    @Post()
    createSale() {
        return this.salesService.create();
    }

    @Get()
    findAll(
        @Query('organization_id') organizationId: string,
        @Query('from') from?: string,
        @Query('to') to?: string
    ) {
        return this.salesService.findAll(organizationId, from, to);
    }
}
