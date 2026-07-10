// frontend/src/components/layout/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useNotifications } from '../../hooks/useNotifications';
import Avatar from '../ui/Avatar';
import { getFileUrl } from '../../services/api';
import {
  BellIcon,
  MoonIcon,
  SunIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <nav className="glass-panel border-b px-4 md:px-6 py-3">
      <div className="flex justify-between items-center">
        {/* Left Section */}
        <div className="flex items-center space-x-2 md:space-x-4 min-w-0">
          {/* Hamburger — mobile/tablet only, toggles the drawer sidebar */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
            aria-label="Toggle menu"
          >
            <Bars3Icon className="h-6 w-6 text-gray-700 dark:text-gray-200" />
          </button>
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white truncate">
            Dashboard
          </h2>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Search */}
          <div className="hidden md:block">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-48 lg:w-64 px-4 py-2 pl-10 bg-gray-100 dark:bg-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <SunIcon className="h-5 w-5 text-yellow-500" />
            ) : (
              <MoonIcon className="h-5 w-5 text-gray-600" />
            )}
          </button>

          {/* Notifications */}
          <Menu as="div" className="relative">
            <Menu.Button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative">
              <BellIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-80 sm:w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-gray-500 dark:text-gray-400 text-center">No notifications</p>
                  ) : (
                    notifications.map(notif => {
                      const content = (
                        <div
                          onClick={() => !notif.isRead && markAsRead(notif._id)}
                          className="w-full text-left"
                        >
                          <div className="flex items-start gap-2">
                            {!notif.isRead && (
                              <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                            )}
                            <div className={notif.isRead ? 'ml-4' : ''}>
                              <p className={`text-sm ${notif.isRead ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white font-medium'}`}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {notif.shortMessage || notif.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      );

                      const linkTo = notif.relatedTicket
                        ? `/tickets/${notif.relatedTicket._id}`
                        : notif.relatedInvoice
                        ? `/billing/${notif.relatedInvoice._id}`
                        : null;

                      return (
                        <Menu.Item key={notif._id}>
                          {({ active }) => (
                            linkTo ? (
                              <Link
                                to={linkTo}
                                onClick={() => !notif.isRead && markAsRead(notif._id)}
                                className={`block px-4 py-3 cursor-pointer ${active ? 'bg-gray-50 dark:bg-gray-700' : ''}`}
                              >
                                {content}
                              </Link>
                            ) : (
                              <div
                                onClick={() => !notif.isRead && markAsRead(notif._id)}
                                className={`px-4 py-3 cursor-pointer ${active ? 'bg-gray-50 dark:bg-gray-700' : ''}`}
                              >
                                {content}
                              </div>
                            )
                          )}
                        </Menu.Item>
                      );
                    })
                  )}
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                    className="text-sm text-blue-600 hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:no-underline"
                  >
                    Mark all as read
                  </button>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* User Menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl p-2 transition-colors">
              <Avatar name={user?.name} src={getFileUrl(user?.avatar)} size="sm" />
              <span className="hidden md:block text-gray-700 dark:text-gray-300 text-sm font-medium">
                {user?.name}
              </span>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                <div className="p-2">
                  {user?.role === 'admin' && (
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/admin/dashboard"
                          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm ${
                            active ? 'bg-gray-100 dark:bg-gray-700' : ''
                          }`}
                        >
                          <ShieldCheckIcon className="h-4 w-4" />
                          <span>Admin Panel</span>
                        </Link>
                      )}
                    </Menu.Item>
                  )}
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/profile"
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm ${
                          active ? 'bg-gray-100 dark:bg-gray-700' : ''
                        }`}
                      >
                        <UserCircleIcon className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={logout}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm w-full text-left ${
                          active ? 'bg-gray-100 dark:bg-gray-700' : ''
                        } text-red-600`}
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;