
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
    console.log('--- Searching for Specific Transaction ---');

    // 1. Find 'test' Organization
    const testOrg = await prisma.organization.findFirst({
        where: { name: 'test' }
    });

    if (!testOrg) {
        console.log("Organization 'test' not found.");
        return;
    }
    console.log(`Found Org: ${testOrg.name} (${testOrg.id})`);

    // 2. Search for Sales
    // Searching for exact invoice OR partial match
    // 2. Search for Sales in 'test' Org (ALL)
    const allSalesInTest = await prisma.sale.findMany({
        where: { organizationId: testOrg.id },
        orderBy: { timestamp: 'desc' },
        take: 5
    });
    console.log(`\nLatest 5 sales in 'test' org:`);
    allSalesInTest.forEach(s => console.log(`- ${s.invoiceNumber} (${s.totalAmount}) - ${s.timestamp}`));

    // 3. Global Search for Invoice
    const globalSearch = await prisma.sale.findMany({
        where: {
            OR: [
                { invoiceNumber: 'INV-000001' },
                { invoiceNumber: '000001' },
                { invoiceNumber: '000001' }
            ]
        },
        include: { organization: true }
    });

    console.log(`\nGlobal search for invoice '000001' / 'INV-000001': ${globalSearch.length} found`);
    globalSearch.forEach(s => {
        console.log(`- Found in Org: ${s.organization?.name} (${s.organizationId})`);
    });


}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
