import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Check } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { currency, setCurrency } = useCurrency();

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
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-center mb-6">
                                    <Dialog.Title as="h3" className="text-lg font-bold text-gray-900">
                                        Kitchen Settings
                                    </Dialog.Title>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Currency</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setCurrency('USD')}
                                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${currency === 'USD'
                                                        ? 'bg-vibepos-primary text-white border-transparent ring-2 ring-blue-200'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-vibepos-primary/50'
                                                    }`}
                                            >
                                                <span className="font-bold">$</span>
                                                <span className="font-medium">USD</span>
                                                {currency === 'USD' && <Check size={16} />}
                                            </button>
                                            <button
                                                onClick={() => setCurrency('PHP')}
                                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${currency === 'PHP'
                                                        ? 'bg-vibepos-primary text-white border-transparent ring-2 ring-blue-200'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-vibepos-primary/50'
                                                    }`}
                                            >
                                                <span className="font-bold">₱</span>
                                                <span className="font-medium">Philippine Peso</span>
                                                {currency === 'PHP' && <Check size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-xl border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        Close
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
