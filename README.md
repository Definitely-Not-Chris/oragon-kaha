# Oragon Kaha POS (formerly VibePOS)

**Oragon Kaha** is a modern, offline-first Point of Sale (POS) and Enterprise Resource Planning (ERP) system designed for food and service businesses in the Philippines. It prioritizes speed, resilience, and user experience.

## 🚀 The Vision
To empower non-technical business owners with a "Product-Centric" and "High-Vibe" system that works flawlessly—even when the internet doesn't.

### Key Features
*   **Offline-First:** Built on Dexie.js (IndexedDB). Sales never stop if Wi-Fi drops.
*   **Hybrid Sync:** Background synchronization to the cloud whenever a connection is available.
*   **Monorepo Architecture:** Clean separation of concerns with shared types and logic.
*   **Food-Ready:** Includes Recipe Management, Kitchen Display System (Planned), and Shift Management.

## 🏗️ Architecture
This project is a **pnpm Turborepo** monorepo containing:

### Apps
*   **`apps/pos`**: The Tablet/PWA Interface. (React + Vite + Shadcn/UI).
    *   *Role:* The "Cash Register". Handles sales, simple inventory, and shift management.
*   **`apps/admin`**: The Cloud Dashboard. (React + Vite).
    *   *Role:* The "Headquarters". Analytics, Multi-store management, and Licensing.
*   **`apps/server`**: The Backend API. (NestJS + Prisma + PostgreSQL).
    *   *Role:* Data aggregation, Authentication, and Sync coordination.

### Packages
*   **`packages/shared-types`**: Zod Schemas and TypeScript interfaces shared across all apps.
*   **`packages/database`**: Prisma Client and Schema definitions.

## 🛠️ Technology Stack
*   **Frontend:** React, TypeScript, Tailwind CSS, Framer Motion.
*   **Local DB:** Dexie.js (Wrapper for IndexedDB).
*   **Backend:** NestJS, Socket.io (for Sync).
*   **Database:** PostgreSQL (Cloud), SQLite (Local Dev options).
*   **ORM:** Prisma.

## 📦 Getting Started

### Prerequisites
*   Node.js 20+
*   pnpm (`npm install -g pnpm`)
*   Docker (for local Postgres/Redis)

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/Definitely-Not-Chris/oragon-kaha.git

# 2. Install dependencies
pnpm install

# 3. Setup Environment
cp apps/server/.env.example apps/server/.env
# (Populate DATABASE_URL and JWT_SECRET)

# 4. Initialize Database
cd packages/database
pnpm prisma db push

# 5. Run the Stack (from root)
pnpm dev
```

## 🔐 Licensing Model
*   **Community:** Free, Standalone, Offline-only.
*   **Pro:** Paid, Cloud Sync, Analytics.
*   **Enterprise:** Self-hosted Local Server clusters.

## 🤝 Contributing
1.  Read `FEATURES.md` for the roadmap.
2.  Follow the **Feature-First** folder structure.
3.  Always update `packages/shared-types` for data models.

---
*Built with ❤️ in Bicol.*
