---
description: Implement the VibePOS POS UI based on the "Balanced Tech" design.
---

# POS UI Implementation Workflow

1. **Update Design Tokens**
   - [x] Verify `apps/pos/tailwind.config.js` matches the "Balanced Tech" palette (White/Slate dominant, Blue actions).
   - [x] Update `apps/pos/src/index.css` with base styles if needed.

2. **Scaffold Layout Components**
   - [x] Create `apps/pos/src/components/layout/MainLayout.tsx` (The 3-column shell).
   - [x] Create `apps/pos/src/components/layout/SidebarNav.tsx` (Left Rail).
   - [x] Create `apps/pos/src/components/layout/CartPanel.tsx` (Right Rail).

3. **Refactor Product Browser (Center Stage)**
   - [x] Move `ProductGrid` and `ProductCard` to `apps/pos/src/components/products/`.
   - [x] Implement `ViewToggle` (Grid/List) in `apps/pos/src/components/products/ProductBrowser.tsx`.
   - [x] Create `ProductListItem.tsx` for the list view.

4. **Assemble Page**
   - [x] Update `apps/pos/src/App.tsx` to use `MainLayout`.
   - [x] Verify responsiveness and strict 3-column behavior.
