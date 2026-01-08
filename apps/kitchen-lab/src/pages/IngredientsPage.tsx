import React, { useState } from 'react';
import { Plus, Search, Trash2, Edit2 } from 'lucide-react';
import { useIngredientsStore } from '../stores/ingredientsStore';
import { useCurrency } from '../context/CurrencyContext';
import type { Ingredient } from '../types';

export const IngredientsPage = () => {
    const { ingredients, addIngredient, updateIngredient, removeIngredient } = useIngredientsStore();
    const { symbol, formatPrice } = useCurrency();
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState<string | null>(null);

    // Form State for New/Edit
    const [formData, setFormData] = useState<Partial<Ingredient>>({
        name: '',
        qty: 1,
        unit: 'unit',
        unitCost: 0,
        taxRate: 0,
        discountRate: 0
    });

    const filteredIngredients = ingredients.filter(ing =>
        ing.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing) {
            updateIngredient(isEditing, formData);
            setIsEditing(null);
        } else {
            addIngredient({
                id: Math.random().toString(),
                name: formData.name || 'New Item',
                qty: formData.qty || 1,
                unit: formData.unit || 'unit',
                unitCost: formData.unitCost || 0,
                taxRate: formData.taxRate || 0,
                discountRate: formData.discountRate || 0,
            } as Ingredient);
        }
        setFormData({ name: '', qty: 1, unit: 'unit', unitCost: 0, taxRate: 0, discountRate: 0 });
    };

    const handleEdit = (ing: Ingredient) => {
        setIsEditing(ing.id);
        setFormData(ing);
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-vibepos-dark">Ingredients Master</h1>
                    <p className="text-vibepos-secondary">Manage your global ingredients database.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit">
                    <h3 className="font-bold text-lg mb-4">{isEditing ? 'Edit Ingredient' : 'Add New Ingredient'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Name</label>
                            <input
                                className="w-full border border-gray-200 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-vibepos-primary outline-none"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Unit</label>
                                <input
                                    className="w-full border border-gray-200 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-vibepos-primary outline-none"
                                    value={formData.unit}
                                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Cost ({symbol})</label>
                                <input
                                    type="number" step="0.01"
                                    className="w-full border border-gray-200 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-vibepos-primary outline-none"
                                    value={formData.unitCost}
                                    onChange={e => setFormData({ ...formData, unitCost: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-vibepos-primary text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                            {isEditing ? <Edit2 size={18} /> : <Plus size={18} />}
                            {isEditing ? 'Update Item' : 'Add to Library'}
                        </button>

                        {isEditing && (
                            <button
                                type="button"
                                onClick={() => { setIsEditing(null); setFormData({ name: '', qty: 1, unit: 'unit', unitCost: 0 }); }}
                                className="w-full bg-gray-100 text-gray-600 font-bold py-2 rounded-xl hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                    </form>
                </div>

                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-vibepos-primary outline-none"
                            placeholder="Search ingredients..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Item</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Unit</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Cost</th>
                                    <th className="p-4 text-xs font-bold text-right text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredIngredients.map(ing => (
                                    <tr key={ing.id} className="hover:bg-gray-50 group transition-colors">
                                        <td className="p-4 font-medium text-gray-800">{ing.name}</td>
                                        <td className="p-4 text-gray-500">{ing.unit}</td>
                                        <td className="p-4 font-mono text-vibepos-dark font-medium">{formatPrice(ing.unitCost)}</td>
                                        <td className="p-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(ing)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => removeIngredient(ing.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredIngredients.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-gray-400">
                                            No ingredients found. Add some to get started!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
