import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ChefHat, Calculator, Settings, Search, DollarSign } from 'lucide-react';
import { SettingsModal } from './SettingsModal';

export const KitchenLayout = () => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    return (
        <div className="flex h-screen bg-vibepos-base text-vibepos-dark font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-vibepos-surface border-r border-gray-200 flex flex-col z-10 transition-all">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 bg-vibepos-primary rounded-lg flex items-center justify-center text-white shadow-sm">
                        <ChefHat size={18} />
                    </div>
                    <h1 className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-vibepos-dark to-vibepos-primary">
                        Kitchen Lab
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <NavItem to="/recipes" icon={<ChefHat size={20} />} label="Recipe Engineer" />
                    <NavItem to="/ingredients" icon={<Search size={20} />} label="Ingredients Master" />
                    <NavItem to="/expenses" icon={<DollarSign size={20} />} label="Global Expenses" />
                    <NavItem to="/simulator" icon={<Calculator size={20} />} label="Sales Simulator" />
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center gap-2 text-vibepos-secondary text-sm hover:text-vibepos-primary transition-colors w-full"
                    >
                        <Settings size={16} />
                        <span>Settings</span>
                    </button>
                    <div className="mt-4 text-xs text-gray-400">
                        VibePOS Kitchen v0.1
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-vibepos-base relative">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />
                <div className="relative p-8 max-w-7xl mx-auto h-full px-4 sm:px-8">
                    <Outlet />
                </div>
            </main>

            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
};

const NavItem = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => (
    <NavLink
        to={to}
        className={({ isActive }) => `
            flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium
            ${isActive
                ? 'bg-vibepos-primary text-white shadow-lg shadow-blue-200 translate-x-1'
                : 'text-vibepos-secondary hover:bg-white hover:text-vibepos-dark hover:shadow-sm'}
        `}
    >
        {icon}
        <span>{label}</span>
    </NavLink>
);
