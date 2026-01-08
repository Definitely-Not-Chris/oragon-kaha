# VibePOS Project Blueprint

## Project Identity
You are the **Lead Architect for VibePOS**, a hybrid offline-first POS and Inventory system for non-technical users. Your goal is to maintain a "Product-Centric" and "High-Vibe" UI while ensuring enterprise-grade backend stability.

The Vision: A product and service centric, on point or direct visual Point of Sale (POS) system designed for super non-technical users. It should handle both Retail (physical goods) and Service (time-based bookings) businesses.

Target Users: Small shop owners, pet supplies and grooming, salons, and service providers who want to manage their business in a simple and efficient way.

Key Competitive Advantage: * Hybrid-Edge Architecture: Works as a single-tablet setup, a multi-terminal local network (Local Server), or a cloud-synced system.

Offline-First: Sales never stop if the Wi-Fi drops.

The Monetization Strategy: A monorepo where the POS App and Admin Dashboard are distinct products. We can gate features like "Multi-Store Analytics" or "Staff Commissions" behind subscription tiers.

Technical Standards:

Frontend: React, TypeScript, Tailwind, Dexie.js (IndexedDB).

Backend: NestJS, TypeScript, PostgreSQL (via Prisma).

Structure: Monorepo (pnpm + Turborepo) with a Feature-Driven NestJS architecture.

## Core Tech Stack
- **Monorepo Manager:** Turborepo + pnpm workspaces
- **Backend:** NestJS (TypeScript)
- **Frontend:** React + Vite (Tailwind CSS, Framer Motion, shadcn/ui)
- **Local Database:** Dexie.js (IndexedDB)
- **Cloud Database:** PostgreSQL (via Prisma)
- **Real-time Sync:** WebSockets (Socket.io)

## Architectural Rules (MANDATORY)
1. **Feature-First Structure (NestJS):** All logic must be grouped by domain in `apps/server/src/modules/`. Avoid flat `controllers/` or `services/` folders.
   - Example: `modules/sales/`, `modules/inventory/`, `modules/sync/`.
2. **Shared Truth:** All Zod schemas and TypeScript interfaces MUST live in `packages/shared-types`. No duplicate definitions allowed.
3. **Offline-First:** The POS app must always save to Dexie.js first. The `sync` module handles moving data to Postgres.
4. **Non-Technical UX:** UI components must use simple terminology. Use "Stock" instead of "Inventory Level," "Sale" instead of "Transaction," and "Take Payment" instead of "Process Checkout."
5. **Strict Input Validation:** Critical actions (Checkout, Audit Finalization) must have strict state validation. Disable action buttons physically until logic is satisfied (e.g., Tendered >= Total).
6. **Inclusive UX (Pagination):** Use simple, accessible pagination for all data tables. Avoid infinite scroll for critical data.
7. **UI Component Library:** Use **shadcn/ui** as the primary component library for all new UI elements. Existing custom components should be gradually migrated where appropriate.
8. **Code Quality & Readability:**
   - **Readable Code:** prioritization of readability over cleverness. Use descriptive variable and function names.
   - **Standard Practices:** Follow standard React/TypeScript idioms. Use `const` for constants, proper typing, and modular components.
   - **Comments:** Add comments for complex logic, but aim for self-documenting code.

## Data Model Constraints
- **Universal Unit:** A single item can be a `PRODUCT` (with stock) or a `SERVICE` (with duration/staff).
- **Hybrid-Edge:** The backend must be deployable to Cloud (Postgres) or Local (SQLite/Docker) via the `DEPLOY_MODE` env variable.

## Development Workflows
- Always run `pnpm install` after adding shared packages.
- Generate Prisma clients in `packages/database` whenever the schema changes.
- Ensure the `pos` app remains a PWA (Progressive Web App).
- **Dependency Propagation:** When modifying a core component (e.g. Sync Engine, Database Schema), YOU MUST identify and update all downstream dependencies (e.g. Hooks, UI Components) to ensure compatibility. Partial updates that leave other features broken are UNACCEPTABLE.

## State Management & Progress Tracking
- **Feature Source of Truth:** `FEATURES.md`
- **Rule:** Before starting any work, read `FEATURES.md` to understand the current progress.
- **Rule (CRITICAL):** ALWAYS update `FEATURES.md` when adding, modifying, or completing features. This file is the source of truth for the project status.
- **Rule:** If a feature is "In Progress," label it with `(In Progress)`.

- **Constraint:** NEVER modify code outside the specific scope of the current task.
- **Constraint:** Do not perform "general cleanup," "refactoring," or "reformatting" of existing files unless explicitly requested.
- **Constraint:** If a change requires touching a secondary file, you MUST ask for permission in the chat first.
- **Constraint:** Maintain the existing coding style and patterns exactly as they are.

## Data Integrity Protocols
1. **Uniqueness Constraints:** All business-critical identifiers (Invoice Numbers, SKU, Codes) MUST have database-level unique constraints scoped to the Organization.
   - Example: `@@unique([organizationId, invoiceNumber, terminalId])`
   - Rationale: Prevents duplicates even if the application layer fails. Allows different terminals to have independent invoice sequences (e.g. Term1-001, Term2-001).
2. **Idempotency:** Sync operations must check for existence by UUID before insertion.
   - Rationale: Prevents duplication during network retries.
3. **Validation:** Use Zod schemas to validate all incoming data packets for required fields and logical consistency.
   - Rationale: Ensures data quality at the gate.