// frontend/src/components/layout/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  HomeIcon,
  TicketIcon,
  PlusCircleIcon,
  UserIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/tickets', label: 'Tickets', icon: TicketIcon },
    { path: '/tickets/create', label: 'Create Ticket', icon: PlusCircleIcon },
    ...(user?.role === 'agent' || user?.role === 'admin'
      ? [{ path: '/live-chat', label: 'Live Chat', icon: ChatBubbleLeftRightIcon }]
      : []),
    { path: '/profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 w-72 max-w-[85vw]
        md:static md:z-auto md:w-64 md:max-w-none md:translate-x-0
        glass-panel border-r
        h-screen flex flex-col
        transform transition-transform duration-300 ease-in-out will-change-transform
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Logo */}
      <div className="p-6 border-b border-gray-200/70 dark:border-gray-700 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="text-white font-bold text-xl">T</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white truncate">ISP Ticketing</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Support System</p>
          </div>
        </Link>
        {/* Close button — mobile drawer only */}
        <button
          onClick={onClose}
          className="md:hidden p-2 -mr-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
          aria-label="Close menu"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`
                flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 mb-1
                ${active 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-white' : ''}`} />
              <span className="font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        {user?.role === 'admin' && (
          <Link
            to="/admin/dashboard"
            onClick={onClose}
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <ShieldCheckIcon className="h-5 w-5 flex-shrink-0" />
            <span className="font-medium truncate">Admin Panel</span>
          </Link>
        )}
        <button
          onClick={logout}
          className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium truncate">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;