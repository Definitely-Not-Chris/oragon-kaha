
import { useState, useEffect } from 'react';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { AppSettings } from '@vibepos/shared-types';
import { Save } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { UsersView } from './UsersView';
import { RolePermissionsView } from './RolePermissionsView';

export const SettingsView = () => {
    const { showToast } = useToast();
    const settings = useLiveQuery(async () => {
        const s = await db.settings.get('device_settings');
        return s || {
            id: 'device_settings',
            enable_shifts: true,
            enable_tax_automation: false,
            tax_rate: 0,
            tax_name: 'Tax',
            tax_inclusive: true,
            enable_service_charge: false,
            service_charge_rate: 0,

            currency: 'PHP',
            receipt_header: 'Welcome to VibePOS',
            receipt_footer: 'Thank you for your business!',
        };
    });

    const [formState, setFormState] = useState<AppSettings | null>(null);

    useEffect(() => {
        if (settings) {
            setFormState(settings as AppSettings);
        }
    }, [settings]);

    const handleSave = async () => {
        if (!formState) return;
        try {
            await db.settings.put(formState);
            showToast('Settings saved successfully', 'success');
            // Force reload to apply critical changes usually requires context update or reload
            // Ideally we use a context, but for now a reload ensures pure state
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            showToast('Failed to save settings', 'error');
        }
    };

    const [activeTab, setActiveTab] = useState<'DEVICE' | 'USERS' | 'ROLES'>('DEVICE');

    if (!formState) return <div className="p-8">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-500 mt-1">Manage system configuration and staff access.</p>
                </div>
            </div>

            {/* Simple Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg mb-8 w-fit">
                <button
                    onClick={() => setActiveTab('DEVICE')}
                    className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'DEVICE'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Device Setup
                </button>
                <button
                    onClick={() => setActiveTab('USERS')}
                    className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'USERS'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    User Management
                </button>
                <button
                    onClick={() => setActiveTab('ROLES')}
                    className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'ROLES'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Role Access
                </button>
            </div>

            {activeTab === 'USERS' && <UsersView />}
            {activeTab === 'ROLES' && <RolePermissionsView />}
            {activeTab === 'DEVICE' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 space-y-8">
                        {/* Localization Section */}
                        <div>
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                Localization
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-gray-800">Currency</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Display currency for prices and receipts.
                                    </p>
                                </div>
                                <select
                                    value={formState.currency || 'PHP'}
                                    onChange={(e) => setFormState({ ...formState, currency: e.target.value as any })}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-vibepos-primary"
                                >
                                    <option value="PHP">PHP (₱)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                </select>
                            </div>
                        </div>

                        {/* Shift Management Section */}
                        <div>
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                Cash & Shift Management
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-gray-800">Enable Shift Logic</p>
                                    <p className="text-xs text-gray-500 mt-1 max-w-sm">
                                        If enabled, staff must open a shift to sell. If disabled, the POS is always open.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setFormState({ ...formState, enable_shifts: !formState.enable_shifts })}
                                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vibepos-primary ${formState.enable_shifts ? 'bg-vibepos-primary' : 'bg-gray-300'}`}
                                >
                                    <span
                                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${formState.enable_shifts ? 'translate-x-7' : 'translate-x-1'}`}
                                    />
                                </button>
                            </div>
                        </div>

                        {/* Receipt Customization Section */}
                        <div>
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                Receipt Configuration
                            </h3>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Receipt Header (Business Name)</label>
                                    <input
                                        type="text"
                                        value={formState.receipt_header || ''}
                                        onChange={e => setFormState({ ...formState, receipt_header: e.target.value })}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-vibepos-primary outline-none font-bold"
                                        placeholder="e.g. Coffee Haven"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Appears at the top of the receipt.</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Receipt Footer (Message)</label>
                                    <input
                                        type="text"
                                        value={formState.receipt_footer || ''}
                                        onChange={e => setFormState({ ...formState, receipt_footer: e.target.value })}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-vibepos-primary outline-none"
                                        placeholder="e.g. Thank you, come again!"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Appears at the bottom.</p>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Logo URL (Optional)</label>
                                    <input
                                        type="text"
                                        value={formState.receipt_logo_url || ''}
                                        onChange={e => setFormState({ ...formState, receipt_logo_url: e.target.value })}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-vibepos-primary outline-none font-mono"
                                        placeholder="https://..."
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Public URL or Base64 string for the logo.</p>
                                </div>
                            </div>
                        </div>

                        {/* Tax & Fees Section */}
                        <div>
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                Tax Rules
                            </h3>
                            <div className="space-y-4">
                                {/* Tax Configuration */}
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-gray-800">Global Tax</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Apply a standard tax rate to all applicable items.
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Rate (%)</label>
                                            <input
                                                type="number"
                                                value={formState.tax_rate}
                                                onChange={e => setFormState({ ...formState, tax_rate: Number(e.target.value) })}
                                                className="w-20 text-right font-mono font-bold border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-vibepos-primary outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Tax Name</label>
                                            <input
                                                type="text"
                                                value={formState.tax_name}
                                                onChange={e => setFormState({ ...formState, tax_name: e.target.value })}
                                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-vibepos-primary outline-none"
                                                placeholder="e.g. VAT"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between border border-gray-200 bg-white p-2 rounded-lg">
                                            <span className="text-sm font-medium text-gray-700 ml-1">Tax Inclusive?</span>
                                            <button
                                                onClick={() => setFormState({ ...formState, tax_inclusive: !formState.tax_inclusive })}
                                                className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${formState.tax_inclusive ? 'bg-vibepos-primary' : 'bg-gray-300'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formState.tax_inclusive ? 'translate-x-5' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-end">
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-200"
                        >
                            <Save size={18} /> Save Changes
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
