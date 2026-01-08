import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, X, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Customer } from '@vibepos/shared-types';
import { useToast } from '../ui/Toast';

interface CustomerSelectionModalProps {
    onSelect: (customer: Customer) => void;
    onClose: () => void;
}

export const CustomerSelectionModal = ({ onSelect, onClose }: CustomerSelectionModalProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [view, setView] = useState<'SEARCH' | 'ADD'>('SEARCH');

    // New Customer Form State
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newEmail, setNewEmail] = useState('');

    const { showToast } = useToast();

    // Query customers
    const customers = useLiveQuery(async () => {
        if (!searchTerm) {
            return await db.customers.limit(10).toArray();
        }
        const lower = searchTerm.toLowerCase();
        return await db.customers
            .filter(c => {
                const nameMatch = c.name.toLowerCase().includes(lower);
                const phoneMatch = c.phone ? c.phone.includes(lower) : false;
                const emailMatch = c.email ? c.email.toLowerCase().includes(lower) : false;
                return nameMatch || phoneMatch || emailMatch;
            })
            .limit(10)
            .toArray();
    }, [searchTerm]);

    const handleAddCustomer = async () => {
        if (!newName) {
            showToast('Name is required', 'error');
            return;
        }

        const newCustomer: Customer = {
            id: crypto.randomUUID(),
            name: newName,
            phone: newPhone || undefined,
            email: newEmail || undefined,
            type: 'REGULAR',
            total_spent: 0,
            last_visit: new Date()
        };

        try {
            await db.customers.add(newCustomer);
            showToast('Customer added successfully', 'success');
            onSelect(newCustomer);
        } catch (error) {
            console.error(error);
            showToast('Failed to add customer', 'error');
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h2 className="text-lg font-bold text-gray-800">
                            {view === 'SEARCH' ? 'Select Customer' : 'Add New Customer'}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {view === 'SEARCH' ? (
                            <>
                                <div className="relative mb-4">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search by name, phone, or email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        autoFocus
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vibepos-primary/20 focus:border-vibepos-primary"
                                    />
                                </div>

                                <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                                    <button
                                        onClick={() => setView('ADD')}
                                        className="w-full p-4 border border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-2 text-vibepos-primary hover:bg-blue-50 transition-colors"
                                    >
                                        <UserPlus size={18} />
                                        <span className="font-semibold">Add New Customer</span>
                                    </button>

                                    {customers?.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => onSelect(c)}
                                            className="w-full p-4 border border-gray-100 rounded-xl flex items-center justify-between hover:border-vibepos-primary hover:shadow-sm transition-all text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                                    <UserIcon size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{c.name}</p>
                                                    <p className="text-xs text-gray-500">{c.phone || c.email || 'No contact info'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-medium text-gray-400">Total Spent</p>
                                                <p className="font-bold text-gray-900">${c.total_spent?.toFixed(2) || '0.00'}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Full Name *</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-vibepos-primary"
                                        placeholder="e.g. Jane Doe"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={newPhone}
                                        onChange={e => setNewPhone(e.target.value)}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-vibepos-primary"
                                        placeholder="e.g. 0917-123-4567"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Email</label>
                                    <input
                                        type="email"
                                        value={newEmail}
                                        onChange={e => setNewEmail(e.target.value)}
                                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-vibepos-primary"
                                        placeholder="jane.doe@example.com"
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setView('SEARCH')}
                                        className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddCustomer}
                                        className="flex-1 py-3 bg-vibepos-primary text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-600 transition-colors"
                                    >
                                        Save & Select
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
