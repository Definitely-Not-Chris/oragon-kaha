import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Search, Plus } from 'lucide-react';
import { useIngredientsStore } from '../stores/ingredientsStore';
import { useCurrency } from '../context/CurrencyContext';
import type { Ingredient } from '../types';

interface IngredientPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (ingredient: Ingredient) => void;
}

export const IngredientPickerModal: React.FC<IngredientPickerModalProps> = ({ isOpen, onClose, onSelect }) => {
    const { ingredients } = useIngredientsStore();
    const { formatPrice } = useCurrency();
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = ingredients.filter(ing =>
        ing.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-bold text-gray-900 mb-4">
                                    Select Ingredient from Library
                                </Dialog.Title>

                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-vibepos-primary outline-none"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div className="max-h-[60vh] overflow-y-auto border rounded-xl border-gray-100">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="p-3 text-xs font-bold text-gray-500 uppercase">Item</th>
                                                <th className="p-3 text-xs font-bold text-gray-500 uppercase">Unit</th>
                                                <th className="p-3 text-xs font-bold text-gray-500 uppercase">Cost</th>
                                                <th className="p-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filtered.map(ing => (
                                                <tr key={ing.id} className="hover:bg-blue-50 cursor-pointer group" onClick={() => { onSelect(ing); onClose(); }}>
                                                    <td className="p-3 font-medium text-gray-800">{ing.name}</td>
                                                    <td className="p-3 text-gray-500 text-sm">{ing.unit}</td>
                                                    <td className="p-3 font-mono text-sm">{formatPrice(ing.unitCost)}</td>
                                                    <td className="p-3 text-right">
                                                        <button className="p-1 bg-vibepos-primary text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Plus size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filtered.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-gray-400">
                                                        No ingredients found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
