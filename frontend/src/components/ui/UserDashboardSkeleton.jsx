// frontend/src/components/ui/UserDashboardSkeleton.jsx
// ============================================================
// Premium shimmer skeleton for the customer/agent Dashboard's
// loading state. Mirrors the real layout — welcome banner, stat
// cards, status distribution, quick actions, recent tickets —
// so the page fades from "loading shape" into real content
// instead of jumping around.
// ============================================================
import React from 'react';

const UserDashboardSkeleton = () => {
  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Welcome banner skeleton — same gradient + blurred blobs as the
          real banner, softened, so it reads as "this is loading". */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-purple-600/90 rounded-3xl p-8 md:p-10 shadow-lg shadow-blue-500/20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse animation-delay-500" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 w-full md:w-auto">
            <div className="h-5 w-32 rounded-full bg-white/20 skeleton" />
            <div className="h-8 w-56 max-w-[80%] rounded-lg bg-white/25 skeleton" />
            <div className="h-4 w-72 max-w-[90%] rounded-lg bg-white/15 skeleton" />
          </div>
          <div className="flex items-center gap-2 bg-white/10 rounded-2xl p-2 w-full md:w-auto">
            <div className="h-9 w-16 rounded-xl bg-white/20 skeleton" />
            <div className="h-9 w-16 rounded-xl bg-white/20 skeleton" />
            <div className="h-9 w-16 rounded-xl bg-white/20 skeleton" />
          </div>
        </div>
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="skeleton-glow bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 p-6"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-3 w-20 rounded-md skeleton" />
                <div className="h-7 w-12 rounded-md skeleton" />
                <div className="h-3 w-24 rounded-md skeleton" />
                <div className="h-3 w-16 rounded-md skeleton" />
              </div>
              <div className="h-12 w-12 rounded-2xl skeleton flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {/* Status distribution + quick actions skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-5 w-52 rounded-md skeleton" />
            <div className="h-3 w-20 rounded-md skeleton" />
          </div>
          <div className="space-y-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="h-3 w-20 rounded-md skeleton" />
                  <div className="h-3 w-14 rounded-md skeleton" />
                </div>
                <div className="h-2 w-full rounded-full skeleton" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 p-6">
          <div className="h-5 w-32 rounded-md skeleton mb-4" />
          <div className="space-y-3">
            <div className="h-12 rounded-xl skeleton" />
            <div className="h-12 rounded-xl skeleton" />
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="h-3 w-40 mx-auto rounded-md skeleton" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent tickets skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="h-5 w-36 rounded-md skeleton" />
          <div className="h-3 w-16 rounded-md skeleton" />
        </div>
        <div className="p-6 space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full skeleton flex-shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-1/2 max-w-[240px] rounded-md skeleton" />
                  <div className="h-3 w-1/3 max-w-[180px] rounded-md skeleton" />
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="h-5 w-20 rounded-full skeleton" />
                <div className="h-3 w-16 rounded-md skeleton" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserDashboardSkeleton;