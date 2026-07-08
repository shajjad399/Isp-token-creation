// frontend/src/components/ui/DashboardSkeleton.jsx
// ============================================================
// Super-premium shimmer skeleton for AdminDashboard's loading
// state. Mirrors the real layout (welcome banner, stat cards,
// role distribution, quick actions / system info) so nothing
// jumps around once the real data lands. Tuned separately from
// the customer dashboard skeleton, and tested across phone /
// tablet / desktop breakpoints.
// ============================================================
import React from 'react';

const DashboardSkeleton = () => {
  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in-up">
      {/* Slim indeterminate bar — a small "the app is working" cue that
          sits above the shape-matching skeleton below it. */}
      <div className="premium-loading-bar" />

      {/* Welcome banner skeleton — gradient + glow blobs like the real
          banner, softened, with a shimmering title/subtitle. */}
      <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 md:p-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg shadow-blue-500/25">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-56 h-56 sm:w-72 sm:h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -left-24 w-56 h-56 sm:w-72 sm:h-72 bg-white/10 rounded-full blur-3xl animate-pulse animation-delay-500" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="h-3 w-24 rounded-full bg-white/20 skeleton" />
          <div className="h-6 sm:h-7 w-56 sm:w-64 max-w-[85%] rounded-lg bg-white/25 skeleton" />
          <div className="h-3.5 sm:h-4 w-64 sm:w-80 max-w-[95%] rounded-lg bg-white/15 skeleton" />
        </div>
      </div>

      {/* Stat cards skeleton — 1 col on tiny phones, 2 on phones, 4 from
          tablet up, so nothing feels cramped at 320–360px widths. */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="skeleton-glow rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 border border-gray-100 dark:border-gray-700 shadow-sm"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="h-3 w-16 sm:w-20 rounded-md skeleton" />
                <div className="h-6 sm:h-7 w-10 sm:w-12 rounded-md skeleton" />
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl skeleton-icon flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>

      {/* Role distribution skeleton */}
      <div className="card-premium p-4 sm:p-6">
        <div className="h-4 sm:h-5 w-40 sm:w-48 rounded-md skeleton mb-4" />
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="text-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl space-y-2"
            >
              <div className="h-6 sm:h-7 w-8 sm:w-10 mx-auto rounded-md skeleton" />
              <div className="h-2.5 sm:h-3 w-12 sm:w-14 mx-auto rounded-md skeleton" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions / system info skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="card-premium p-4 sm:p-6">
          <div className="h-4 sm:h-5 w-28 sm:w-32 rounded-md skeleton mb-4" />
          <div className="space-y-3">
            <div className="h-11 sm:h-12 rounded-xl skeleton" />
            <div className="h-11 sm:h-12 rounded-xl skeleton" />
          </div>
        </div>

        <div className="card-premium p-4 sm:p-6">
          <div className="h-4 sm:h-5 w-24 sm:w-28 rounded-md skeleton mb-4" />
          <div className="space-y-3">
            <div className="flex justify-between">
              <div className="h-3 w-12 sm:w-14 rounded-md skeleton" />
              <div className="h-3 w-28 sm:w-32 rounded-md skeleton" />
            </div>
            <div className="flex justify-between">
              <div className="h-3 w-8 sm:w-10 rounded-md skeleton" />
              <div className="h-3 w-14 sm:w-16 rounded-md skeleton" />
            </div>
            <div className="flex justify-between">
              <div className="h-3 w-10 sm:w-12 rounded-md skeleton" />
              <div className="h-3 w-12 sm:w-14 rounded-md skeleton" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;