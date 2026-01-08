export interface Ingredient {
    id: string;
    name: string;
    qty: number;
    unit: string;
    unitCost: number;
    taxRate: number; // Percentage (e.g., 10 for 10%)
    discountRate: number; // Percentage
}

export interface Expense {
    laborCost: number;
    rentOverhead: number;
    targetMargin: number; // Percentage
    finalTaxRate: number; // Percentage
}
