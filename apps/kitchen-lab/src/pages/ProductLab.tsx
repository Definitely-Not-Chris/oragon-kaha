import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, Save, ArrowLeft } from 'lucide-react';
import type { Ingredient, Expense } from '../types';
import { useRecipeCalculator } from '../hooks/useRecipeCalculator';
import { IngredientsManager } from '../components/IngredientsManager';
import { ExpensesManager } from '../components/ExpensesManager';
import { FinancialsSummary } from '../components/FinancialsSummary';
import { UpgradeModal } from '../components/UpgradeModal';
import { usePro } from '../context/ProContext';
import { useExpensesStore } from '../stores/expensesStore';
import { useRecipesStore } from '../stores/recipesStore';
import { v4 as uuidv4 } from 'uuid'; // Ensure uuid is installed or use Math.random

const INITIAL_INGREDIENTS: Ingredient[] = [
    { id: '1', name: 'New Ingredient', qty: 1, unit: 'unit', unitCost: 0, taxRate: 0, discountRate: 0 },
];

export const ProductLab = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Stores
    const { recipeDefaults } = useExpensesStore();
    const { recipes, addRecipe, updateRecipe } = useRecipesStore();

    // Local State
    const [productName, setProductName] = useState('New Recipe');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

    // Initial Data Logic
    const existingRecipe = id ? recipes.find(r => r.id === id) : null;
    const initialIngredients = existingRecipe?.ingredients || INITIAL_INGREDIENTS;

    // Calculator Hook
    const {
        ingredients,
        expenses,
        financials,
        actions
    } = useRecipeCalculator(initialIngredients, {
        targetMargin: existingRecipe ? existingRecipe.targetMargin : recipeDefaults.targetMargin,
        finalTaxRate: existingRecipe ? existingRecipe.taxRate : recipeDefaults.taxRate,
        laborCost: existingRecipe?.laborCost,
        rentOverhead: existingRecipe?.rentOverhead
    });

    useEffect(() => {
        if (existingRecipe) {
            setProductName(existingRecipe.name);
        }
    }, [existingRecipe]);

    const { isPro } = usePro();

    const handleSave = () => {
        const recipeData = {
            name: productName,
            ingredients,
            laborCost: expenses.laborCost,
            rentOverhead: expenses.rentOverhead,
            targetMargin: expenses.targetMargin,
            taxRate: expenses.finalTaxRate,
            updatedAt: new Date().toISOString()
        };

        if (existingRecipe) {
            updateRecipe(existingRecipe.id, recipeData);
        } else {
            addRecipe({
                id: uuidv4(),
                ...recipeData
            });
        }
        navigate('/recipes');
    };

    const handleExport = () => {
        if (!isPro) {
            setIsUpgradeModalOpen(true);
            return;
        }

        const data = actions.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${productName.replace(/\s+/g, '_')}_costing.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6 pb-20">
            <header className="flex justify-between items-end">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/recipes')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-vibepos-dark flex items-center gap-2">
                            <span className="text-gray-300">#</span>
                            <input
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                className="bg-transparent focus:outline-none focus:ring-2 focus:ring-vibepos-primary/20 rounded px-2 -ml-2 w-[400px]"
                                placeholder="Recipe Name"
                            />
                        </h1>
                        <p className="text-vibepos-secondary">Recipe Engineering & Costing</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-vibepos-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200"
                    >
                        <Save size={18} />
                        <span>Save Recipe</span>
                    </button>
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className={`px-4 py-2 rounded-xl font-medium transition-colors border ${showAdvanced ? 'bg-vibepos-dark text-white border-transparent' : 'bg-white text-gray-600 border-gray-200'}`}
                    >
                        {showAdvanced ? 'Simple View' : 'Advanced View'}
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT: Recipe Builder */}
                <div className="lg:col-span-2 space-y-6">
                    <IngredientsManager
                        ingredients={ingredients}
                        updateIngredient={actions.updateIngredient}
                        removeIngredient={actions.removeIngredient}
                        addIngredient={actions.addIngredient}
                        calculateCost={actions.calculateIngredientCost}
                        showAdvanced={showAdvanced}
                        onImport={actions.addSpecificIngredient}
                    />

                    {/* Overheads */}
                    <ExpensesManager
                        expenses={expenses}
                        updateExpense={actions.updateExpense}
                    />
                </div>

                {/* RIGHT: Results & Profit Dial */}
                <FinancialsSummary
                    financials={financials}
                    expenses={expenses}
                    updateExpense={actions.updateExpense}
                    onExport={handleExport}
                />
            </div>

            <UpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
            />
        </div>
    );
};
