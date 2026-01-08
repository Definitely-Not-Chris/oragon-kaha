
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Load Env
try {
    const envPath = path.resolve(__dirname, '.env');
    const envFile = fs.readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/['"]+/g, '');
            process.env[key] = value;
        }
    });
} catch (e) { }

const prisma = new PrismaClient();

async function main() {
    console.log('--- Verifying Sync Loop ---');

    // 1. Check Stock Movements
    const movements = await prisma.stockMovement.findMany({
        orderBy: { timestamp: 'desc' },
        take: 5
    });
    console.log(`\nLatest Stock Movements: ${movements.length}`);
    movements.forEach(m => {
        console.log(`- [${m.type}] ${m.quantityChange} (Ref: ${m.referenceId?.slice(0, 8)})`);
    });

    // 2. Check Shifts
    const shifts = await prisma.workShift.findMany({
        orderBy: { startTime: 'desc' },
        take: 5
    });
    console.log(`\nLatest Shifts: ${shifts.length}`);
    shifts.forEach(s => {
        console.log(`- [${s.status}] Start: ${s.startTime.toISOString().slice(11, 16)} | Expected: ${s.expectedCash}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
