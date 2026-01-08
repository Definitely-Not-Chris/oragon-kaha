import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Ingredient } from '../types';

interface IngredientsState {
    ingredients: Ingredient[];
    addIngredient: (ingredient: Ingredient) => void;
    updateIngredient: (id: string, ingredient: Partial<Ingredient>) => void;
    removeIngredient: (id: string) => void;
}

export const useIngredientsStore = create<IngredientsState>()(
    persist(
        (set) => ({
            ingredients: [],
            addIngredient: (ing) => set((state) => ({ ingredients: [...state.ingredients, ing] })),
            updateIngredient: (id, ing) => set((state) => ({
                ingredients: state.ingredients.map((item) => (item.id === id ? { ...item, ...ing } : item))
            })),
            removeIngredient: (id) => set((state) => ({
                ingredients: state.ingredients.filter((item) => item.id !== id)
            })),
        }),
        {
            name: 'kitchen-ingredients-storage',
        }
    )
);
