# VibePOS UI/UX Design System (APPROVED)
**Status:** Locked & Ready for Implementation
**Chosen Style:** "Balanced Tech" (Docker Blue & White)

## Core Philosophy
**"The Digital Ledger"**
- We bridge the gap between paper and screen.
- **Visuals**: Clean, high-contrast, structured tables (like a ledger).
- **Interactions**: Big, obvious buttons. No hidden menus.
- **Terminology**: "Stock" (not Inventory), "Sale" (not Transaction), "Pay" (not Checkout).

## Deep-Dive: The "FoodPoint" Aesthetic
- **Layout**: 3-Column Standard
    1. **Nav Rail** (Left, Slim): Dashboard, Inventory, Orders.
    2. **Main Stage** (Center, Wide): Product Browsing (Grid/List toggle).
    3. **Order Terminal** (Right, Fixed): The "Cart" and Checkout.

## Color Palette: "Balanced Tech"
- **Dominant**: White (`#ffffff`) and Soft Gray (`#f8fafc`).
- **Primary Action ONLY**: `#2496ed` (Docker Blue) -> User for "Pay Now", "Confirm", and active states.
- **Navigation**: White or Light Slate vs the previous heavy dark blue.
- **Stock Indicators**: Neutral or subtle tags, not heavy colored badges.
- **Goal**: Avoid "Blue Overload". The UI should feel like paper with blue ink, not a swimming pool.
- **Surface**: Pure White (`#ffffff`) -> Clean panels.
- **Text**: Dark Slate (`#0f172a`) -> High contrast.
- **Accent**: Light Blue/Sky -> For selected backgrounds and active states.

## Typography
- **Font**: Inter (Google Fonts)
- **Scale**: Large base size (16px+) for readability.
- **Weights**: Heavy use of **Bold** for numbers (Prices, Stock Counts).

## Key Screens
### 1. The Stock Ledger (Inventory)
- **Goal**: Replenish and track items.
- **Look**: A clean table with zebra striping or clear row borders.
- **Actions**: "Add Item" is the most prominent button. Edit/Delete icons are large.

### 2. The Register (POS)
- **Goal**: Speed. Focus on the items first, customer second.
- **Left Panel (Nav)**: Icons for 'Sale', 'Stock', 'Reports'.
- **Center Panel (Browser)**:
    - **Header**: Search Bar + **Grid/List Toggle Icons** (Must be visible) + Filter.
    - **List Items/Cards**:
        - *Products*: MUST show **Stock Count** (e.g., "Stock: 45").
        - *Services*: Show Duration/Clock icon.
- **Right Panel (Cart)**:
    - **Top**: "Order Summary" (Items list). 
    - **Removed**: Customer selector is GONE from the top (moved to checkout modal/step).
### 3. The Checkout Experience (Dedicated View)
- **Concept**: "The Counter". We transition from "Browsing" to "paying".
- **Trigger**: Clicking "Pay Now" in the Cart Panel.
### 3. The Checkout Experience (Full Screen Terminal)
- **Concept**: "Focus Mode".
- **Layout**:
    - **Left**: Main Navigation Sidebar (remains visible).
    - **Center/Right**: Merged into a comprehensive **Payment Terminal**.
    - **Hidden**: Further Right "Cart Panel" is REMOVED to clear distractions.
- **Components**:
    - **Back Button**: Prominent top-left.
    - **Payment Columns**: 
        - Left: Payment Methods & Customer.
        - Right: Receipt/Order Summary (moved inside the main view).
- **Why**: Maximum focus on the transaction. Big buttons, clear numbers.
