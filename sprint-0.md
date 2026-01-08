Sprint 0 — The "Architectural Skeleton" Prompt
Instructions: Copy and paste this into Antigravity once you have your project folder ready.

Prompt: "I am building VibePOS, a hybrid offline-first POS and Inventory system. Act as a Senior Solutions Architect to scaffold the project foundation.

1. Workspace Setup:

Initialize a monorepo using pnpm workspaces and Turborepo.

Create three apps: apps/pos (React + Vite), apps/admin (React + Vite), and apps/server (NestJS).

Create two shared packages: packages/shared-types (Zod schemas & TS interfaces) and packages/database (Prisma schema & client).

2. NestJS Feature-Driven Design: Structure the apps/server by business domain rather than technical layer. Inside src/modules/, generate the following placeholders:

inventory/: Product and service management logic.

sales/: Transaction and 'Open Ticket' logic.

sync/: The engine for reconciling offline data from terminals. Ensure each module has its own controller, service, and module files.

3. Universal Data Model: Define a ProductOrService type in packages/shared-types using Zod. It must handle:

Retail: stock_level, sku, barcode.

Service: duration_minutes, assigned_staff_id.

Shared: name, price, category, image_url.

4. Infrastructure:

Create a docker-compose.yml with PostgreSQL (main store) and Redis (for real-time sync via WebSockets).

Set up a root turbo.json that handles build, dev, and lint dependencies across the monorepo.

5. Hybrid Config: Set up the NestJS app to use @nestjs/config. Define an environment variable DEPLOY_MODE that can switch between CLOUD and LOCAL_EDGE.

Output: Provide the file tree and the commands required to install and start the dev environment."