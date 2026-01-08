import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChefHat, Clock, ArrowRight } from 'lucide-react';
import { useRecipesStore } from '../stores/recipesStore';
import { useCurrency } from '../context/CurrencyContext';

export const RecipeListPage = () => {
    const navigate = useNavigate();
    const { recipes, removeRecipe } = useRecipesStore();
    const { formatPrice } = useCurrency();

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-vibepos-dark">My Recipes</h1>
                    <p className="text-vibepos-secondary">Manage and optimize your menu items.</p>
                </div>
                <button
                    onClick={() => navigate('/recipes/new')}
                    className="bg-vibepos-primary text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200"
                >
                    <Plus size={20} /> New Recipe
                </button>
            </header>

            {recipes.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <ChefHat size={40} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-700">No Recipes Yet</h3>
                    <p className="text-gray-400 mb-6">Start engineering your first profitable product.</p>
                    <button
                        onClick={() => navigate('/recipes/new')}
                        className="text-vibepos-primary font-bold hover:underline"
                    >
                        Create Recipe &rarr;
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recipes.map(recipe => {
                        // Recalculate basic cost for display
                        const totalIngCost = recipe.ingredients.reduce((sum, i) => sum + (i.qty * i.unitCost), 0);
                        const totalCost = totalIngCost + (recipe.laborCost || 0) + (recipe.rentOverhead || 0);
                        const suggestedPrice = totalCost / (1 - (recipe.targetMargin / 100));

                        return (
                            <div key={recipe.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => navigate(`/recipes/${recipe.id}`)}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center">
                                            <ChefHat size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">{recipe.name}</h3>
                                            <div className="text-xs text-gray-400 flex items-center gap-1">
                                                <Clock size={12} /> {new Date(recipe.updatedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Cost</span>
                                        <span className="font-medium text-gray-800">{formatPrice(totalCost)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Target Price</span>
                                        <span className="font-bold text-vibepos-primary">{formatPrice(suggestedPrice)}</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 -mx-5 -mb-5 p-4 mt-2">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{recipe.ingredients.length} Ingredients</span>
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:text-vibepos-primary group-hover:translate-x-1 transition-all">
                                        <ArrowRight size={16} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
