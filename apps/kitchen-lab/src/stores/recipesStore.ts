import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Ingredient, Expense } from '../types';

export interface SavedRecipe {
    id: string;
    name: string;
    ingredients: Ingredient[];
    laborCost: number;
    rentOverhead: number; // Allocated overhead per unit/batch
    targetMargin: number;
    taxRate: number;
    updatedAt: string;
}

interface RecipesState {
    recipes: SavedRecipe[];
    addRecipe: (recipe: SavedRecipe) => void;
    updateRecipe: (id: string, recipe: Partial<SavedRecipe>) => void;
    removeRecipe: (id: string) => void;
}

export const useRecipesStore = create<RecipesState>()(
    persist(
        (set) => ({
            recipes: [],
            addRecipe: (recipe) => set((state) => ({ recipes: [...state.recipes, recipe] })),
            updateRecipe: (id, recipe) => set((state) => ({
                recipes: state.recipes.map(r => r.id === id ? { ...r, ...recipe, updatedAt: new Date().toISOString() } : r)
            })),
            removeRecipe: (id) => set((state) => ({
                recipes: state.recipes.filter(r => r.id !== id)
            })),
        }),
        {
            name: 'kitchen-recipes-storage',
        }
    )
);
