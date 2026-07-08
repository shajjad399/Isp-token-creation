// frontend/src/components/admin/AdminLayout.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import {
  HomeIcon,
  UsersIcon,
  TicketIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  MoonIcon,
  SunIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  // ✅ Mobile/tablet: sidebar sheet is closed by default, opened via the menu button
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/admin/users', label: 'Users', icon: UsersIcon },
    { path: '/live-chat', label: 'Live Chat', icon: ChatBubbleLeftRightIcon },
    { path: '/profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <div className="flex h-screen app-mesh-bg overflow-hidden">
      {/* Backdrop — mobile/tablet only, shown while sidebar sheet is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw]
          md:static md:z-auto md:w-64 md:max-w-none md:translate-x-0
          glass-panel shadow-xl border-r
          flex flex-col h-screen
          transform transition-transform duration-300 ease-in-out will-change-transform
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-6 border-b border-gray-200/70 dark:border-gray-700 flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:text-white dark:bg-none truncate">ISP Admin</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{user?.email}</p>
          </div>
          {/* Close button — mobile/tablet sheet only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 -mr-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
            aria-label="Close menu"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          ))}
          
          <button
            onClick={toggleTheme}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
          >
            {theme === 'dark' ? <SunIcon className="h-5 w-5 flex-shrink-0" /> : <MoonIcon className="h-5 w-5 flex-shrink-0" />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 mt-4"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="glass-panel shadow-sm px-4 md:px-6 py-4 border-b">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {/* Menu button (3-line icon) — mobile/tablet only, opens the sidebar sheet */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 -ml-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
                aria-label="Open menu"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white truncate">Admin Panel</h2>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {user?.name} ({user?.role})
              </span>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 content-mesh">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;