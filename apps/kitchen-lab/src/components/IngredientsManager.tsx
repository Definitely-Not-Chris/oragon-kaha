import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Ingredient } from '../types';
import { useCurrency } from '../context/CurrencyContext';
import { IngredientPickerModal } from './IngredientPickerModal';

interface IngredientsManagerProps {
    ingredients: Ingredient[];
    updateIngredient: (id: string, field: keyof Ingredient, value: any) => void;
    removeIngredient: (id: string) => void;
    addIngredient: () => void;
    calculateCost: (ing: Ingredient) => number;
    showAdvanced: boolean;
    onImport?: (ing: Ingredient) => void;
}

export const IngredientsManager: React.FC<IngredientsManagerProps> = ({
    ingredients,
    updateIngredient,
    removeIngredient,
    addIngredient,
    calculateCost,
    showAdvanced,
    onImport
}) => {
    const { formatPrice, symbol } = useCurrency();
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-700">Ingredients</h3>
                <div className="flex gap-2">
                    {onImport && (
                        <button onClick={() => setIsPickerOpen(true)} className="text-sm bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-3 py-1 rounded-md shadow-sm transition-all flex items-center gap-1">
                            <Plus size={14} /> Import from Library
                        </button>
                    )}
                    <button onClick={addIngredient} className="text-sm bg-white border border-gray-200 hover:border-vibepos-primary hover:text-vibepos-primary px-3 py-1 rounded-md shadow-sm transition-all flex items-center gap-1">
                        <Plus size={14} /> Add Custom
                    </button>
                </div>
            </div>
            <div className="p-4 space-y-3">
                {ingredients.map((ing) => (
                    <div key={ing.id} className="flex gap-3 items-start animate-fade-in group">
                        <div className="flex-1 grid grid-cols-12 gap-3">
                            <div className="col-span-5">
                                <label className="text-[10px] text-gray-400 uppercase font-semibold mb-1 block">Item Name</label>
                                <input
                                    value={ing.name}
                                    onChange={(e) => updateIngredient(ing.id, 'name', e.target.value)}
                                    placeholder="Ingredient"
                                    className="w-full bg-vibepos-base border border-transparent hover:border-gray-200 focus:border-vibepos-primary rounded px-3 py-2 text-sm font-medium transition-all focus:outline-none"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] text-gray-400 uppercase font-semibold mb-1 block">Qty</label>
                                <input
                                    type="number"
                                    value={ing.qty}
                                    onChange={(e) => updateIngredient(ing.id, 'qty', Number(e.target.value))}
                                    className="w-full bg-vibepos-base border border-transparent hover:border-gray-200 focus:border-vibepos-primary rounded px-3 py-2 text-sm text-center focus:outline-none"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] text-gray-400 uppercase font-semibold mb-1 block">Unit Cost</label>
                                <div className="relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">{symbol}</span>
                                    <input
                                        type="number"
                                        value={ing.unitCost}
                                        onChange={(e) => updateIngredient(ing.id, 'unitCost', Number(e.target.value))}
                                        className="w-full bg-vibepos-base border border-transparent hover:border-gray-200 focus:border-vibepos-primary rounded px-2 py-2 pl-5 text-sm text-center focus:outline-none"
                                    />
                                </div>
                            </div>

                            {/* Cost Display */}
                            <div className="col-span-3 flex items-center justify-end px-2 pt-5">
                                <span className="font-mono font-medium text-vibepos-dark">{formatPrice(calculateCost(ing))}</span>
                            </div>

                            {/* Advanced Row */}
                            {showAdvanced && (
                                <div className="col-span-12 flex gap-4 bg-gray-50 p-2 rounded-lg mt-1 border border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">Tax%</span>
                                        <input
                                            type="number"
                                            value={ing.taxRate}
                                            onChange={(e) => updateIngredient(ing.id, 'taxRate', Number(e.target.value))}
                                            className="w-16 bg-white border border-gray-200 rounded px-2 py-1 text-xs"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">Disc%</span>
                                        <input
                                            type="number"
                                            value={ing.discountRate}
                                            onChange={(e) => updateIngredient(ing.id, 'discountRate', Number(e.target.value))}
                                            className="w-16 bg-white border border-gray-200 rounded px-2 py-1 text-xs"
                                        />
                                    </div>
                                    <div className="flex-1 text-[10px] text-gray-400 flex items-center">
                                        * Ajust taxes & discounts specific to this item's sourcing.
                                    </div>
                                </div>
                            )}
                        </div>
                        <button onClick={() => removeIngredient(ing.id)} className="mt-6 p-2 text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            {onImport && (
                <IngredientPickerModal
                    isOpen={isPickerOpen}
                    onClose={() => setIsPickerOpen(false)}
                    onSelect={(ing) => {
                        onImport(ing);
                        setIsPickerOpen(false);
                    }}
                />
            )}
        </div>
    );
};
