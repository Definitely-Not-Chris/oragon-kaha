import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SalesModule } from './modules/sales/sales.module';
import { SyncModule } from './modules/sync/sync.module';
import { LicensingModule } from './modules/licensing/licensing.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { AuthModule } from './modules/auth/auth.module';
import { TerminalsModule } from './modules/terminals/terminals.module';

import { AppController } from './app.controller';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ['.env.local', '.env'],
        }),
        InventoryModule,
        SalesModule,
        SyncModule,
        LicensingModule,
        UsersModule,
        OrganizationsModule,
        AuthModule,
        TerminalsModule,
    ],
    controllers: [AppController],
})
export class AppModule { }
