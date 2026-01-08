import { Module } from '@nestjs/common';
import { LicensingController } from './licensing.controller';
import { LicensingService } from './licensing.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
    controllers: [LicensingController],
    providers: [LicensingService, PrismaService],
})
export class LicensingModule { }
