The Project Brief (Context for the AI)
Project Name: VibePOS (Hybrid Offline-First POS & Inventory)

The Vision: A product and service centric, on point or direct visual Point of Sale (POS) system designed for super non-technical users. It should handle both Retail (physical goods) and Service (time-based bookings) businesses.

Target Users: Small shop owners, pet supplies and grooming, salons, and service providers who want to manage their business in a simple and efficient way.

Key Competitive Advantage: * Hybrid-Edge Architecture: Works as a single-tablet setup, a multi-terminal local network (Local Server), or a cloud-synced system.

Offline-First: Sales never stop if the Wi-Fi drops.

The Monetization Strategy: A monorepo where the POS App and Admin Dashboard are distinct products. We can gate features like "Multi-Store Analytics" or "Staff Commissions" behind subscription tiers.

Technical Standards:

Frontend: React, TypeScript, Tailwind, Dexie.js (IndexedDB).

Backend: NestJS, TypeScript, PostgreSQL (via Prisma).

Structure: Monorepo (pnpm + Turborepo) with a Feature-Driven NestJS architecture.