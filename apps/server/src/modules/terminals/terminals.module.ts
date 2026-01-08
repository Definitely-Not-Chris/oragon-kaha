import { Module } from '@nestjs/common';
import { TerminalsService } from './terminals.service';
import { TerminalsController } from './terminals.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [TerminalsController],
    providers: [TerminalsService],
    exports: [TerminalsService],
})
export class TerminalsModule { }
