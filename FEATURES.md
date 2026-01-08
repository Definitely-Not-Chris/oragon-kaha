# VibePOS Feature Roadmap

## 🏗️ Phase 0: Foundation & Infrastructure
### Major Features
- [x] **Monorepo Architecture** (Turborepo + pnpm)
- [x] **Offline-First Database** (Dexie.js + React Query)
- [x] **Design System** (Shadcn/UI + Tailwind + Framer Motion)
- [x] **Backend Modular Core** (NestJS Feature Modules)
- [x] **Containerization** (Docker Compose for Postgres/Redis)

---

## 🛒 Phase 1: Point of Sale (The Terminal)
### Major Features
- [x] **Smart Product Grid** (Retail & Service Items, Search, Filter)
- [x] **Dynamic Cart Engine**
    - Local Stock Reservation, Tax Calculation, Service Validation.
    - **Persistent Recovery**: Cart state is crash-proof (survives reload).
- [x] **Checkout Experience**
    - Cash/Card/QR flow, "Pay Now" Modal, Change Calculation.
- [x] **Customer Management**
    - [x] Select Customer at Checkout, Guest Default.
    - [x] **Customer Profiles**: Manage CRM data (Phone, Email, Notes).
    - [x] **Extended Fields**: Support for TIN (Tax ID) and Birthdate for promos.
- [x] **Transaction History**
    - Search, Filter by Date/Status, Void/Refund capability.
- [x] **Discount Management** `[CRITICAL]`
    - [x] **Statutory Discounts**: PWD, Senior Citizen (ID tracking, VAT Exemption logic).
    - [x] **Custom Discounts**: Fixed Amount or Percentage (e.g. Employee Meal).
    - [x] **Cart-Level vs Item-Level**: Apply to specific items or whole bill.
    - [ ] **Enhancements (Verification & Expiration)**
        - [ ] **Expiration Option**: Discounts with `valid_from` and `valid_until`.
        - [ ] **Customer Type Logic**: Validate `customer_type` (Senior/PWD) field vs Discount.
        - [ ] **Statutory Verification**: Modal to capture ID/Name when applying Senior/PWD discount during checkout.

### Minor Features
- [x] **Toast Notifications** (Success/Error feedback for all actions)
- [x] **Strict Validation** (Zero-Stock blocking, Payment amount checks)

---

## 📦 Phase 2: Inventory & Supply Chain
### Major Features
- [x] **Product Management** (CRUD, Barcodes, Categories)
- [x] **Stock Control** (Adjustments, Receive Stock, Write-offs)
- [x] **Inventory Auditing** (Stocktake Sessions, Discrepancy Reports)
- [ ] **Composite Inventory (Recipes)** `[PLANNED]`
    - [x] **Recipe Builder**: Define ingredients for products (e.g., Latte = Milk + Beans).
    - [x] **Recursive Deduction**: Selling a parent item deducts child stock.
    - [x] **Dynamic Costing**: Cost calculated from ingredients.
- [ ] **Advanced Promotions (Time-Based)** `[SKIPPED]`
    - [ ] **Happy Hour Logic**: Auto-apply discounts based on Time/Day.
    - [ ] **Bundles/Combos**: "Meal Deal" (Burger + Fries) at special price.
    - [ ] **Composite Linking**: Promo applies to specific Composite Items (e.g. "Lunch Set" triggers specific inventory deduction).

### Minor Features
- [ ] **Low Stock Alerts** (Configurable thresholds per item)
- [ ] **Bulk Actions** (Import/Export CSV)

---

## 💰 Phase 3: Finance & Business Logic
### Major Features
- [x] **Cash Management (Shift Logic)** `[CRITICAL]`
    - [x] **Open Shift**: Count opening float.
    - [x] **Drawer Operations**: Pay In / Pay Out (Expenses).
    - [x] **Close Shift**: Blind count, variance tracking, Z-Reading generation.
    - [x] **Management Module**: Dedicated Shift History page for auditing.
    - [x] **Access Control**: POS Lockout when shift is closed.
    - [x] **Optional Shift Logic**: Feature flag to disable shift requirements via Settings.
    - [x] Tax & Receipt Engine `[CRITICAL]`
    - [x] Tax Rules: Configurable rates (VAT, SC), Tax Name, Inclusive/Exclusive toggle.
    - [ ] Service Charge: Optional percentage-based service fee.
    - [x] Receipt Customization: Logo, Configurable Header/Footer, Thermal Printer Format.
- [x] **Advanced Reporting Engine** `[NEW]`
    - [x] **Sales Report Generator**:
        - [x] Filter by Date Range (Start/End).
        - [x] Metrics: Gross Sales, Net Sales, VAT/Tax Collected, Total Discounts, Transaction Count.
        - [x] **Official Sales Book**: Compliance-ready tabular list of daily sales with accumulated totals.
        - [x] **X/Z Reading**: Generate official end-of-day or mid-shift financial receipts.
        - [x] Grand Totals (Accumulated).
    - [x] **Discount Analytics**:
        - [x] Breakdown by Discount Type (Senior/PWD/Promo).
        - [x] **Official Discount Book**: Compliance-ready tabular list of all discounted sales.
        - [x] Total Deduction Amount.
    - [x] **Export & History**:
        - [x] Export to CSV/Excel.
        - [x] **Generation History**: Log who generated what report and when.
    - [x] **UI/UX**: "Parameter First" approach (Select options -> Generate -> View/Download).

### Minor Features
- [ ] **Expense Tracking** (Petty cash logging)
- [ ] **Currency Support** (Multi-currency display)

---

## 🔄 Phase 4: Enterprise Edge (Self-Hosted Cluster) `apps/server`
### Major Features
- [ ] **Local Sync Engine**
    - [ ] **Master/Slave Architecture**: One POS acts as "Server".
    - [ ] **Device Discovery**: Zero-config pairing on LAN (Bonjour/mDNS).
    - [ ] **Conflict Resolution**: "Last Write Wins" for offline edits merging.
- [ ] **Hardware Integration**
    - [ ] **Thermal Printer**: Standard ESC/POS or Browser Print. (Basic Impl Done).
    - [ ] **Kitchen Display System (KDS)**: Direct routing from POS to Kitchen Tablet.

---

## 🚀 Phase 5: Access & Security
### Major Features
- [ ] **Local User Management**
    - [x] **PIN-based access** (4-digit) for quick switching.
    - [x] **Secure PIN Storage** (bcrypt hashing).
    - [x] **Admin PIN Reset**: Admins can securely change PINs for any user.
    - [x] **Protected Main Admin**: Prevent deletion of the root `admin` account.
- [ ] **Role-Based Access Control (RBAC)**
    - Restrict "Void", "Refund", "Settings" to Manager role.
- [x] **Licensing System**
    - [x] **Activation Flows**:
        - **Login-First (Preferred)**: User logs in with `username/password` -> POS fetches & stores License Key.
        - **Manual Fallback**: Input License Key manually (if login fails or headless setup).
        - **Enterprise**: Master Key Activation (Local Server) -> Terminals pair with Local Server.
    - [x] **Offline Token**: Long-lived JWT stored in LocalStorage (Dexie Pending).
    - [x] **Heartbeat Protocol** `[NEW]`
        - **Purpose**: Validate license status, Check for revocations, Sync expiry date.
        - **Frequency**: On App Launch & Every 5 Minutes.
        - **Logic**:
             1. POS sends `LicenseKey` to Server.
             2. Server responds with `Status`.
             3. **If Revoked**: Automatically wipe credentials and redirect to Activation.

    ---

    ## ☁️ Phase 6: Vibe Cloud (SaaS Backup & HQ) `apps/admin`
    ### Major Features
    - [x] **Cloud Backup (Pro Tier)**
        - [x] **Async Sync**: Background upload of sales/inventory when online.
        - [x] **Owner Dashboard**: View analytics from anywhere.
    - [ ] **Multi-Store Management**
        - [ ] **Headquarters Mode**: Push menu updates to all branches.
        - [x] **Aggregated Reports**: Sales inputs from multiple locations.
    - [x] **Terminal Management**
        - [x] **Identity**: Unique ID + Incremental Number ("Terminal #1").
        - [x] **Auto-Registration**: New devices automatically register on first sync.
        - [ ] **Terminal Linking**: Option to "Adopt" an existing terminal ID on a new browser/device to preserve history.
        - [x] **Terminal Dashboard**: List active terminals and status in Admin.
    - [ ] **License & Payment Portal**
        - [x] **Manual Payment Approval Workflow**:
            - [x] **User Side**: Upload "Proof of Payment" (Screenshot/Photo).
            - [x] **Admin Side**: "Pending Approvals" Dashboard with Status Filtering.
            - [x] **Action**: Admin Corrects Amount/Ref -> Approves -> Selects Validity Duration (e.g., +1 Month).
        - [ ] **Subscription Engine (MVP)**:
            - [ ] **Manual Validity Extension**: Admin manually grants time based on payment amount.
            - [ ] **Payment History**: View "All" vs "Pending" payments.
    - [x] **License Management**: View all issued keys, Revoke keys, **Manual Device Reset**.
- [x] **Admin Identity Management**
    - [x] **Dashboard Landing Page**: dedicated home with Admin Stats and Cashier Shortcuts.
    - [x] **User Management**: Create/Edit Admin and Cashier accounts.
    - [x] **Organization Management**: Create/Edit Stores ("Organizations").
- [x] **Authentication & Client Portal** `[NEW]`
    - [x] **Login System**: Secure Auth for Super Admins and Cashier accounts.
    - [x] **Role-Based Views**:
        - **Super Admin**: Full access to Licensing, Payments, All Stores.
        - **Store Owner**: "Headquarters Mode" (Read-Only access to their own data).
    - [x] **Client Dashboard**: Sales and Inventory analytics for Store Owners.

## 📱 Phase 7: PWA & Mobile `apps/pos` `[NEW]`
### Major Features
- [x] **PWA Installation**
    - [x] Web Manifest (Icons, Name, Theme).
    - [x] Service Worker (Offline caching).
    - [x] "Install App" Prompt on Activation Page.

---

## 🎯 Target Deployment Models
1.  **Community / Lifetime (Standalone)**: Device is the Server. 100% Offline.
2.  **Pro (Hybrid)**: Device is Offline-First + Background Cloud Sync.
3.  **Enterprise (Edge Cluster)**: Local Server (Mini-PC/IoT) + Multiple Terminals. Zero Internet dependence.

## Legend
- `[x]` : **Completed** & Verified
- `[ ]` : **Pending** / In Progress
- `[CRITICAL]` : Mandatory for Minimum Viable Product (MVP)
- `[PLANNED]` : High value, slated for next sprint
