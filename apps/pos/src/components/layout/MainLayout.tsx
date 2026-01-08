import { ReactNode } from 'react';
import { SidebarNav } from './SidebarNav';
import { CartPanel } from './CartPanel';

interface MainLayoutProps {
    children: ReactNode;
    onCheckout: () => void;
    isCheckoutMode?: boolean;
    hideRightPanel?: boolean;
}

export const MainLayout = ({ children, onCheckout, isCheckoutMode = false, hideRightPanel = false }: MainLayoutProps) => {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-vibepos-base">
            {/* Left Rail: Navigation */}
            <SidebarNav />

            {/* Center Stage: Main Content */}
            <main className="flex-1 h-full overflow-hidden relative flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    {children}
                </div>
            </main>

            {/* Right Rail: Cart (Optional) */}
            {!hideRightPanel && <CartPanel onCheckout={onCheckout} readOnly={isCheckoutMode} />}
        </div>
    );
};
