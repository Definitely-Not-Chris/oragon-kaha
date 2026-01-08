import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useState } from 'react';
import { Search, Plus, Edit2, Phone, Mail, Calendar, DollarSign } from 'lucide-react';
import { Customer } from '@vibepos/shared-types';
import { CustomerFormModal } from './CustomerFormModal';

export const CustomersView = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    const customers = useLiveQuery(async () => {
        let collection = db.customers.orderBy('name'); // Default sort by name

        const all = await collection.toArray();
        if (!searchTerm) return all;

        const lower = searchTerm.toLowerCase();
        return all.filter(c =>
            c.name.toLowerCase().includes(lower) ||
            (c.phone && c.phone.includes(lower)) ||
            (c.email && c.email.toLowerCase().includes(lower))
        );
    }, [searchTerm]);

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setEditingCustomer(null);
        setIsFormOpen(true);
    };

    const totalCustomers = customers?.length || 0;
    // const activeCustomers = customers?.filter(c => c.last_visit > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length || 0;

    return (
        <div className="h-full flex flex-col bg-vibepos-base p-6 overflow-hidden">
            <CustomerFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={() => setIsFormOpen(false)}
                customer={editingCustomer}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
                    <p className="text-gray-500">Manage your client base</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-6 py-3 bg-vibepos-primary text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200"
                >
                    <Plus size={20} />
                    Add Customer
                </button>
            </div>

            {/* Stats / Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-6 flex flex-col lg:flex-row gap-4 items-center">
                <div className="flex gap-8 px-4 border-r border-gray-100 hidden lg:flex">
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold">Total Clients</p>
                        <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
                    </div>
                </div>

                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, phone, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-vibepos-primary/20 focus:border-vibepos-primary transition-all"
                    />
                </div>
            </div>

            {/* Customers List via Grid/Cards for better touch targets? Or Table? Let's do a nice card list for Vibe */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 content-start">
                {!customers ? (
                    <div className="col-span-full text-center p-10 text-gray-400">Loading...</div>
                ) : customers.length === 0 ? (
                    <div className="col-span-full text-center p-10 text-gray-400 italic">No customers found.</div>
                ) : (
                    customers.map(customer => (
                        <div key={customer.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:border-vibepos-primary transition-all group relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-50 text-vibepos-primary rounded-full flex items-center justify-center font-bold text-lg shadow-inner">
                                        {customer.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{customer.name}</h3>
                                        <p className="text-xs text-gray-500">Since {new Date(customer.last_visit).getFullYear()}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleEdit(customer)}
                                    className="p-2 text-gray-400 hover:text-vibepos-primary hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Edit2 size={18} />
                                </button>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                {(customer.phone || customer.email) ? (
                                    <>
                                        {customer.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone size={14} className="text-gray-400" />
                                                <span>{customer.phone}</span>
                                            </div>
                                        )}
                                        {customer.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail size={14} className="text-gray-400" />
                                                <span className="truncate">{customer.email}</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-gray-400 italic text-xs">No contact info</div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-gray-400">Total Spent</span>
                                    <span className="font-bold text-gray-900 flex items-center gap-1">
                                        <DollarSign size={14} />
                                        {customer.total_spent?.toFixed(2) || '0.00'}
                                    </span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] uppercase font-bold text-gray-400">Last Visit</span>
                                    <span className="font-medium text-gray-700 flex items-center gap-1">
                                        <Calendar size={14} />
                                        {new Date(customer.last_visit).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
