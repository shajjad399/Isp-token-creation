// ============================================================
// frontend/src/components/admin/AdminNotificationBell.jsx
// ============================================================
// Description: Admin panel notification bell. Groups all admin
// notifications into 3 tabs:
//   1) Token    -> new/updated tickets (tokens) — click redirects
//                  to token/ticket management
//   2) Payment  -> billing / bill-payment notifications
//   3) Others   -> everything else (e.g. user login notifications)
// ============================================================

import React, { Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import {
  BellIcon,
  TicketIcon,
  CreditCardIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { useAdminNotifications } from '../../hooks/useAdminNotifications';

const TABS = [
  { key: 'token', label: 'Token', icon: TicketIcon },
  { key: 'payment', label: 'Payment', icon: CreditCardIcon },
  { key: 'other', label: 'Others', icon: UserCircleIcon }
];

// Where a notification should send the admin when clicked, per tab.
const resolveLink = (category, notif) => {
  if (category === 'token') {
    return notif.relatedTicket?._id ? `/tickets/${notif.relatedTicket._id}` : '/tickets';
  }
  if (category === 'payment') {
    return notif.relatedInvoice?._id ? `/admin/billing/${notif.relatedInvoice._id}` : '/admin/billing';
  }
  // 'other' — e.g. login notifications link to that user's profile
  return notif.relatedUser?._id ? `/admin/users/edit/${notif.relatedUser._id}` : null;
};

const AdminNotificationBell = () => {
  const navigate = useNavigate();
  const {
    activeTab,
    setActiveTab,
    notifications,
    counts,
    markAsRead,
    markAllAsRead
  } = useAdminNotifications();

  const handleItemClick = (notif) => {
    if (!notif.isRead) markAsRead(notif._id, activeTab);
    const link = resolveLink(activeTab, notif);
    if (link) navigate(link);
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
        aria-label="Notifications"
      >
        <BellIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        {counts.total > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center animate-pulse">
            {counts.total > 99 ? '99+' : counts.total}
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
        <Menu.Items className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-96 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {TABS.map((tab) => {
              const count = counts[tab.key] || 0;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-sm font-medium transition-colors relative ${
                    isActive
                      ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-6 text-gray-500 dark:text-gray-400 text-center text-sm">
                No {TABS.find((t) => t.key === activeTab)?.label.toLowerCase()} notifications
              </p>
            ) : (
              notifications.map((notif) => (
                <Menu.Item key={notif._id}>
                  {({ active }) => (
                    <div
                      onClick={() => handleItemClick(notif)}
                      className={`px-4 py-3 cursor-pointer ${active ? 'bg-gray-50 dark:bg-gray-700' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        {!notif.isRead && (
                          <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                        <div className={notif.isRead ? 'ml-4' : ''}>
                          <p
                            className={`text-sm ${
                              notif.isRead
                                ? 'text-gray-500 dark:text-gray-400'
                                : 'text-gray-900 dark:text-white font-medium'
                            }`}
                          >
                            {notif.title}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {notif.shortMessage || notif.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </Menu.Item>
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <button
              onClick={markAllAsRead}
              disabled={counts.total === 0}
              className="text-sm text-blue-600 hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:no-underline"
            >
              Mark all as read
            </button>
            {activeTab === 'token' && (
              <Link to="/tickets" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                View all tokens
              </Link>
            )}
            {activeTab === 'payment' && (
              <Link to="/admin/billing" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                View all billing
              </Link>
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default AdminNotificationBell;