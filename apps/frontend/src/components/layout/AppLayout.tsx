import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Settings, LogOut, User, Menu, X } from 'lucide-react';
import clsx from 'clsx';
import { ScriptBadge } from '../ui/ScriptBadge';
import { OrgSelector } from './OrgSelector';
import { useAuth } from '../../contexts/AuthContext';

const SidebarItem = ({ to, icon: Icon, label, onClick }: { to: string; icon: any; label: string; onClick?: () => void }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            onClick={onClick}
            className={clsx(
                "flex items-center gap-3 px-4 py-3 font-display font-bold uppercase transition-all border-r-[4px]",
                isActive
                    ? "bg-brand-yellow border-brand-black translate-x-[2px]"
                    : "hover:bg-gray-100 border-transparent hover:border-gray-300"
            )}
        >
            <Icon size={20} strokeWidth={2.5} />
            {label}
        </Link>
    );
};

export const AppLayout = () => {
    const { user, logout, isOwner } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-50 text-brand-black font-body overflow-hidden">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b-2 border-brand-black z-30 flex items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-black italic tracking-tighter">
                        WORK<span className="text-white text-stroke-black">FLOW</span>
                    </h1>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 border-2 border-brand-black rounded hover:bg-brand-yellow transition-colors"
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={clsx(
                "w-64 border-r-2 border-brand-black bg-white flex flex-col fixed h-full z-40 shadow-brutal transition-transform duration-300 transform lg:translate-x-0 lg:static",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-5 border-b-2 border-brand-black bg-brand-yellow hidden lg:block overflow-hidden">
                    <h1 className="text-xl font-black italic tracking-tighter truncate">
                        WORK<span className="text-white text-stroke-black">FLOW</span>
                    </h1>
                    <ScriptBadge className="mt-2 text-xs rotate-[-2deg]">BETA v1.0</ScriptBadge>
                </div>

                {/* Mobile Sidebar Header */}
                <div className="p-6 border-b-2 border-brand-black bg-brand-yellow lg:hidden flex justify-between items-center">
                    <h1 className="text-2xl font-black italic tracking-tighter">
                        MENU
                    </h1>
                    <button onClick={() => setIsSidebarOpen(false)}>
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>

                {/* Organization Selector */}
                <OrgSelector />

                <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
                    <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" onClick={() => setIsSidebarOpen(false)} />
                    {isOwner && (
                        <SidebarItem to="/projects" icon={FolderKanban} label="Projects" onClick={() => setIsSidebarOpen(false)} />
                    )}
                </nav>

                {/* User Section */}
                <div className="border-t-2 border-brand-black mt-auto">
                    <div className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-yellow border-2 border-brand-black flex items-center justify-center font-bold">
                            <User size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate">{user?.firstName} {user?.lastName}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>

                    <SidebarItem to="/settings" icon={Settings} label="Settings" onClick={() => setIsSidebarOpen(false)} />

                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 font-display font-bold uppercase hover:bg-red-50 text-left transition-colors text-red-600"
                    >
                        <LogOut size={20} strokeWidth={2.5} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 pt-20 lg:p-8 lg:pt-8 w-full">
                    <div className="max-w-[1600px] mx-auto w-full h-full">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};
