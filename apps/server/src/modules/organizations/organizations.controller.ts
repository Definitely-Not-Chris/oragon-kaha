import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { Organization } from '@vibepos/shared-types';

@Controller('organizations')
export class OrganizationsController {
    constructor(private readonly service: OrganizationsService) { }

    @Post()
    create(@Body() dto: Omit<Organization, 'id' | 'created_at'>) {
        return this.service.create(dto);
    }

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.service.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: Partial<Organization>) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.service.remove(id);
    }
}
