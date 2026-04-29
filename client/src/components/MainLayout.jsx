import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';

const MainLayout = () => {
    return (
        <div className="flex h-screen overflow-hidden bg-transparent">
            {/* Desktop Sidebar */}
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-[80px] lg:pb-0">
                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />
        </div>
    );
};

export default MainLayout;
