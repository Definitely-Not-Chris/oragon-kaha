import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Customer } from '@vibepos/shared-types';
import { db } from '../../db';
import { useToast } from '../ui/Toast';

interface CustomerFormModalProps {
    customer?: Customer | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export const CustomerFormModal = ({ customer, isOpen, onClose, onSave }: CustomerFormModalProps) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [tin, setTin] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [notes, setNotes] = useState('');
    const { showToast } = useToast();

    // Reset or Populate form on open
    useEffect(() => {
        if (isOpen) {
            if (customer) {
                setName(customer.name);
                setPhone(customer.phone || '');
                setEmail(customer.email || '');
                setTin(customer.tin_number || '');
                setBirthdate(customer.birthdate ? new Date(customer.birthdate).toISOString().split('T')[0] : '');
                setNotes(customer.notes || '');
            } else {
                setName('');
                setPhone('');
                setEmail('');
                setTin('');
                setBirthdate('');
                setNotes('');
            }
        }
    }, [isOpen, customer]);

    const handleSubmit = async () => {
        if (!name.trim()) {
            showToast('Name is required', 'error');
            return;
        }

        try {
            if (customer && customer.id) {
                // Edit
                await db.customers.update(customer.id, {
                    name,
                    phone: phone || undefined,
                    email: email || undefined,
                    tin_number: tin || undefined,
                    birthdate: birthdate ? new Date(birthdate) : undefined,
                    notes: notes || undefined
                });
                showToast('Customer updated', 'success');
            } else {
                // Create
                await db.customers.add({
                    id: crypto.randomUUID(),
                    name,
                    phone: phone || undefined,
                    email: email || undefined,
                    tin_number: tin || undefined,
                    birthdate: birthdate ? new Date(birthdate) : undefined,
                    notes: notes || undefined,
                    type: 'REGULAR',
                    total_spent: 0,
                    last_visit: new Date()
                });
                showToast('Customer created', 'success');
            }
            onSave();
            onClose();
        } catch (error) {
            console.error(error);
            showToast('Failed to save customer', 'error');
        }
    };

    if (!isOpen) return null;

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
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
                >
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h2 className="text-lg font-bold text-gray-800">
                            {customer ? 'Edit Customer' : 'New Customer'}
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name *</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-vibepos-primary"
                                placeholder="e.g. John Doe"
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-vibepos-primary"
                                    placeholder="Optional"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-vibepos-primary"
                                    placeholder="Optional"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">TIN Number</label>
                                <input
                                    type="text"
                                    value={tin}
                                    onChange={e => setTin(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-vibepos-primary"
                                    placeholder="Tax Identification No."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Birthdate</label>
                                <input
                                    type="date"
                                    value={birthdate}
                                    onChange={e => setBirthdate(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-vibepos-primary"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notes</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-vibepos-primary h-24 resize-none"
                                placeholder="Preferences, allergies, etc."
                            />
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex-1 py-3 bg-vibepos-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200"
                            >
                                Save Customer
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
