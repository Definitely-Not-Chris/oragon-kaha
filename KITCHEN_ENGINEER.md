# Kitchen Engineer (Product Lab) - Design Doc

## Vision
The **Kitchen Engineer** is a dedicated module within the VibePOS ecosystem designed for "Culinary R&D." It allows business owners to model the financial viability of new products before they hit the menu. It combines precise accounting with AI-assisted creativity in a "High-Vibe," product-centric interface.

## Core Modules

### 1. The Recipe Builder ("The Anatomy")
*Define what goes into the plate.*
- **Ingredient Playground**: Add free-text ingredients or select from known inventory.
- **Smart Units**: Define cost per unit (e.g., $5/kg) and usage per recipe (e.g., 150g).
- **Per-Item Granularity**: Toggle specifically for Tax/Discounts on a per-ingredient basis (e.g., imported good tax).
- **Real-time COGS**: As you tweak quantities, the "Cost of Goods Sold" updates instantly.

### 2. The Reality Check ("The Overheads")
*Account for the invisible costs.*
- **Opex Sliders**: Drag-and-drop sliders to allocate percentages for:
    - **Rent**: Space utilization cost.
    - **Labor**: Estimated prep time cost (e.g., 5 mins @ $15/hr).
    - **Utilities**: Power/Gas estimates.
- **Capex Amortization**: Optional field to spread equipment cost over units sold.
- **Tax Toggle**: Global or Per-Item Tax settings for the final product.

### 3. The Profit Center ("The Magic Dial")
*Set your goals and see the numbers.*
- **Margin Slider**: A tactile slider to set Desired Profit Margin (e.g., 0% to 100%).
- **Dynamic Pricing**: Moving the slider instantly updates the **Recommended Retail Price (RRP)**.
- **Profit per Item**: Crystal clear display of Net Profit after all costs, taxes, and potential sales discounts.

### 4. Sales Simulator ("The Crystal Ball")
*Forecasting and Break-even Analysis.*
- **Mockup Sales**: "If I sell 50 Burgers and 30 Fries..." -> See Total Profit.
- **Break-even Calculator**: Input total monthly expenses (Rent, Salaries, etc.) to see specifically "How many Burgers do I need to sell to hit $0?".
- **Date-based Projection**: Estimate profit for a specific date range based on simulated foot traffic.


### 4. AI Chef Advisor ("The Brain")
*Your culinary consultant.*
- **Interface**: A chat sidebar or glowing "Ask AI" button.
- **Capabilities**:
    - **Sourcing**: "Find me a cheaper alternative to imported Parmesan."
    - **Trend Research**: "What are the trending taco fillings in 2026?"
    - **Optimization**: "This disk costs $12 to make. How can I get it down to $9 without losing quality?"

---

## Technical Architecture

### 1. Location
- **App**: `apps/kitchen-lab` (Standalone Application)
- **Port**: `5176` (Proposed)
- **Tech**: React + Vite + Tailwind + Framer Motion


### 2. Data Models (New `shared-types`)
We need to extend our Zod schemas to support this rich data.

```typescript
// Draft Schema for Kitchen Engineer

export const IngredientCostSchema = z.object({
  name: z.string(),
  cost: z.number(), // e.g., 10.00
  unit: z.string(), // e.g., "kg"
});

export const RecipeItemSchema = z.object({
  ingredient: IngredientCostSchema,
  quantity_used: z.number(),
  unit_used: z.string(), // Must be convertible to ingredient unit
});

export const CostingProfileSchema = z.object({
  labor_rate_per_hour: z.number(),
  prep_time_minutes: z.number(),
  overhead_percentage: z.number(), // Rent/Utilities as % of COGS or Flat rate
  tax_rate: z.number(),
});

export const ProductLabSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  recipe: z.array(RecipeItemSchema),
  costing: CostingProfileSchema,
  target_margin: z.number(), // 0-1 range (e.g., 0.3 for 30%)
  notes: z.string().optional(),
  ai_suggestions: z.array(z.string()).optional(),
});
```

### 3. Integration Plan
1.  **Standalone First**: Build as a local tool in `apps/admin`. Local Storage / Dexie for saving drafts.
2.  **LLM Hook**: Use Vercel AI SDK or direct fetch to OpenAI/Gemini for the Advisor.
3.  **Promotion**: One-click "Promote to POS" button that converts the `ProductLab` entry into a `RetailProduct` or `ServiceProduct` in the main database.

## UI/UX Vibes
- **Dark Mode Default**: Sleek, professional kitchen aesthetic.
- **Neumorphism/Glassmorphism**: Inputs sit on "glass" panels.
- **Big Data**: Key numbers in large, modern typography (Inter/Outfit font).
