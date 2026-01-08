
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Handle .env manually
try {
    const envPath = path.resolve(__dirname, '.env');
    const envFile = fs.readFileSync(envPath, 'utf-8');
    envFile.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            let value = parts.slice(1).join('=').trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    });
} catch (e) {
    console.log('No .env file found or failed to read it, checking process.env...');
}

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking for Duplicates (Org + Inv + Term) ---');

    // Fetch all sales with relevant fields
    const sales = await prisma.sale.findMany({
        select: {
            id: true,
            organizationId: true,
            invoiceNumber: true,
            terminalId: true,
            totalAmount: true,
            timestamp: true,
            items: { select: { id: true } }
        }
    });

    // Group by key
    const groups: { [key: string]: typeof sales } = {};

    sales.forEach(sale => {
        // Create a composite key. handle nulls as string 'null' for grouping
        const key = `${sale.organizationId}|${sale.invoiceNumber}|${sale.terminalId}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(sale);
    });

    let duplicateCount = 0;
    let deletedCount = 0;

    for (const key in groups) {
        const group = groups[key];
        if (group.length > 1) {
            duplicateCount++;
            console.log(`\nDuplicate Group Found: ${key} (${group.length} records)`);

            // Sort: Prefer records with MORE items, then LATEST timestamp
            // We want to KEEP the best one.
            group.sort((a, b) => {
                const itemsA = a.items.length;
                const itemsB = b.items.length;
                if (itemsA !== itemsB) return itemsB - itemsA; // Descending items
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(); // Descending time
            });

            const toKeep = group[0];
            const toDelete = group.slice(1);

            console.log(`Keeping: ${toKeep.id} (Items: ${toKeep.items.length}, Time: ${toKeep.timestamp})`);

            for (const sale of toDelete) {
                console.log(`Deleting: ${sale.id} (Items: ${sale.items.length}, Time: ${sale.timestamp})`);

                // Delete dependants first if strict (Cascading usually handles it but let's be safe)
                // Actually prisma schema likely has onDelete Cascade or nothing.
                // We'll try deleting the sale directly.
                await prisma.saleItem.deleteMany({ where: { saleId: sale.id } });
                await prisma.sale.delete({ where: { id: sale.id } });
                deletedCount++;
            }
        }
    }

    console.log(`\n--- Summary ---`);
    console.log(`Total Sales Scanned: ${sales.length}`);
    console.log(`Duplicate Groups: ${duplicateCount}`);
    console.log(`Records Deleted: ${deletedCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
