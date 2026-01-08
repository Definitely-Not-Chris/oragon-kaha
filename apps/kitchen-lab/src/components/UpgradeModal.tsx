import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Sparkles, Check, Lock } from 'lucide-react';
import { usePro } from '../context/ProContext';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
    const { upgradeToPro } = usePro();
    const [isLoading, setIsLoading] = useState(false);

    const handleUpgrade = async () => {
        setIsLoading(true);
        await upgradeToPro();
        setIsLoading(false);
        onClose();
        // Here you would typically show a success toast/confetti
    };

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
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95 translate-y-4"
                            enterTo="opacity-100 scale-100 translate-y-0"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100 translate-y-0"
                            leaveTo="opacity-0 scale-95 translate-y-4"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-white text-left align-middle shadow-2xl transition-all border border-purple-100 relative">
                                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-purple-600 to-indigo-600" />

                                <div className="relative pt-12 px-6 pb-6">
                                    <div className="mx-auto w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-4 text-purple-600 rotate-3 transform">
                                        <Sparkles size={32} />
                                    </div>

                                    <Dialog.Title as="h3" className="text-2xl font-black text-center text-gray-900 mb-2">
                                        Unlock Kitchen PRO
                                    </Dialog.Title>
                                    <p className="text-center text-gray-500 mb-8">
                                        Take your culinary business to the next level with professional tools.
                                    </p>

                                    <div className="space-y-3 mb-8">
                                        <div className="flex items-center gap-3 bg-purple-50 p-3 rounded-xl">
                                            <div className="w-6 h-6 rounded-full bg-purple-200 text-purple-700 flex items-center justify-center shrink-0">
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                            <span className="text-gray-700 font-medium text-sm">Unlimited Recipe Exports (JSON & CSV)</span>
                                        </div>
                                        <div className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-xl transition-colors">
                                            <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                                                <Lock size={14} />
                                            </div>
                                            <span className="text-gray-400 font-medium text-sm">Advanced AI Pricing Strategies</span>
                                        </div>
                                        <div className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-xl transition-colors">
                                            <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                                                <Lock size={14} />
                                            </div>
                                            <span className="text-gray-400 font-medium text-sm">Multi-Branch Sync</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <button
                                            onClick={handleUpgrade}
                                            disabled={isLoading}
                                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? (
                                                'Upgrading...'
                                            ) : (
                                                <>
                                                    <span>Upgrade Now</span>
                                                    <span className="bg-white/20 px-2 py-0.5 rounded text-sm text-white">$9.99</span>
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={onClose}
                                            className="w-full text-sm text-gray-400 font-medium hover:text-gray-600 py-2"
                                        >
                                            Maybe Later
                                        </button>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
