import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const MainLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen((prev) => !prev);

    return (
        <div className="flex h-screen overflow-hidden bg-primary">
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="lg:hidden shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-secondary/80 backdrop-blur-xl">
                    <button
                        type="button"
                        onClick={toggleSidebar}
                        className="p-2 rounded-xl text-text-primary hover:bg-white/10 transition-colors"
                        aria-label="Open menu"
                    >
                        <i className="fa-solid fa-bars text-xl" />
                    </button>
                    <span className="font-bold text-accent text-lg">CyChess</span>
                    <div className="w-10" aria-hidden="true" />
                </header>

                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
