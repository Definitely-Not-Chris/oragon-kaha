import { useState, useMemo } from 'react';
import type { Ingredient, Expense } from '../types';

export const useRecipeCalculator = (initialIngredients: Ingredient[], initialExpenses?: Partial<Expense>) => {
    const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
    const [expenses, setExpenses] = useState<Expense>({
        laborCost: initialExpenses?.laborCost ?? 2.50,
        rentOverhead: initialExpenses?.rentOverhead ?? 1.00,
        targetMargin: initialExpenses?.targetMargin ?? 30,
        finalTaxRate: initialExpenses?.finalTaxRate ?? 10
    });

    const calculateIngredientCost = (ing: Ingredient) => {
        const base = ing.qty * ing.unitCost;
        const widthTax = base * (1 + ing.taxRate / 100);
        const final = widthTax * (1 - ing.discountRate / 100);
        return final;
    };

    const financials = useMemo(() => {
        const totalIngredientsCost = ingredients.reduce((sum, ing) => sum + calculateIngredientCost(ing), 0);
        const totalCOGS = totalIngredientsCost + expenses.laborCost + expenses.rentOverhead;

        // Reverse engineer Price from Margin: Price = Cost / (1 - Margin%)
        // Avoid division by zero
        const marginDecimal = expenses.targetMargin / 100;
        const suggestedPrice = marginDecimal < 1 ? totalCOGS / (1 - marginDecimal) : 0;

        const profit = suggestedPrice - totalCOGS;
        const finalPriceWithTax = suggestedPrice * (1 + expenses.finalTaxRate / 100);

        return {
            totalIngredientsCost,
            totalCOGS,
            suggestedPrice,
            profit,
            finalPriceWithTax
        };
    }, [ingredients, expenses]);

    const addIngredient = () => {
        setIngredients([...ingredients, {
            id: Math.random().toString(),
            name: '',
            qty: 0,
            unit: 'units',
            unitCost: 0,
            taxRate: 0,
            discountRate: 0
        }]);
    };

    const addSpecificIngredient = (ing: Ingredient) => {
        setIngredients([...ingredients, { ...ing, id: Math.random().toString() }]); // New ID to avoid collision
    };

    const updateIngredient = (id: string, field: keyof Ingredient, value: any) => {
        setIngredients(ingredients.map(ing =>
            ing.id === id ? { ...ing, [field]: value } : ing
        ));
    };

    const removeIngredient = (id: string) => {
        setIngredients(ingredients.filter(ing => ing.id !== id));
    };

    const updateExpense = (field: keyof Expense, value: number) => {
        setExpenses(prev => ({ ...prev, [field]: value }));
    };

    const exportData = () => {
        const data = {
            metadata: {
                createdAt: new Date().toISOString(),
                version: '1.0'
            },
            ingredients,
            expenses,
            financials
        };
        return JSON.stringify(data, null, 2);
    };

    return {
        ingredients,
        expenses,
        financials,
        actions: {
            addIngredient,
            addSpecificIngredient,
            updateIngredient,
            removeIngredient,
            updateExpense,
            calculateIngredientCost,
            exportData
        }
    };
};
