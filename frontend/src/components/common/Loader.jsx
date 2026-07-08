// ============================================================
// frontend/src/components/common/Loader.jsx
// ============================================================
// Premium, fully responsive loading indicator.
//
//  <Loader />                                   full-screen app loader
//  <Loader fullScreen={false} />                inline loader (sits in flow)
//  <Loader overlay />                           blurred overlay on a parent
//                                                (give the parent `relative`)
//  <Loader size="sm" variant="dots" />           compact inline dots loader
//  <Loader variant="bars" text="Uploading..." /> equalizer-style loader
//  <Loader progress={62} text="Uploading..." />  determinate progress bar
//
// No external dependencies — pure Tailwind + a few scoped keyframes.
// ============================================================
import React from 'react';

const RING_SIZES = {
  xs: 'w-6 h-6 border-2',
  sm: 'w-8 h-8 border-2',
  md: 'w-11 h-11 sm:w-12 sm:h-12 border-[3px]',
  lg: 'w-14 h-14 sm:w-16 sm:h-16 border-4',
  xl: 'w-20 h-20 sm:w-24 sm:h-24 border-4',
  '2xl': 'w-24 h-24 sm:w-32 sm:h-32 border-[6px]'
};

const TEXT_SIZES = {
  xs: 'text-xs',
  sm: 'text-xs sm:text-sm',
  md: 'text-sm sm:text-base',
  lg: 'text-base sm:text-lg',
  xl: 'text-lg sm:text-xl',
  '2xl': 'text-xl sm:text-2xl'
};

const DOT_SIZES = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-3.5 h-3.5',
  '2xl': 'w-4 h-4'
};

const BAR_SIZES = {
  xs: 'w-0.5 h-4',
  sm: 'w-1 h-5',
  md: 'w-1 h-7',
  lg: 'w-1.5 h-9',
  xl: 'w-2 h-12',
  '2xl': 'w-2.5 h-16'
};

// ------------------------------------------------------------
// Variant: Ring — dual counter-rotating gradient ring (default, premium)
// ------------------------------------------------------------
const RingSpinner = ({ size, from, to }) => (
  <div className={`relative ${RING_SIZES[size].split(' ').slice(0, 2).join(' ')}`}>
    <div
      className={`absolute inset-0 rounded-full ${RING_SIZES[size]} border-transparent animate-spin`}
      style={{
        borderTopColor: from,
        borderRightColor: from,
        animationDuration: '0.9s'
      }}
    />
    <div
      className={`absolute inset-[3px] rounded-full ${RING_SIZES[size]} border-transparent animate-spin`}
      style={{
        borderBottomColor: to,
        borderLeftColor: to,
        animationDirection: 'reverse',
        animationDuration: '1.3s'
      }}
    />
  </div>
);

// ------------------------------------------------------------
// Variant: Dots — three bouncing gradient dots
// ------------------------------------------------------------
const DotsSpinner = ({ size, from, to }) => (
  <div className="flex items-center gap-1.5" role="presentation">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className={`${DOT_SIZES[size]} rounded-full loader-dot`}
        style={{
          background: `linear-gradient(135deg, ${from}, ${to})`,
          animationDelay: `${i * 0.15}s`
        }}
      />
    ))}
  </div>
);

// ------------------------------------------------------------
// Variant: Bars — audio-equalizer style bars
// ------------------------------------------------------------
const BarsSpinner = ({ size, from, to }) => (
  <div className="flex items-end gap-1" role="presentation">
    {[0, 1, 2, 3].map((i) => (
      <span
        key={i}
        className={`${BAR_SIZES[size]} rounded-full loader-bar`}
        style={{
          background: `linear-gradient(180deg, ${from}, ${to})`,
          animationDelay: `${i * 0.12}s`
        }}
      />
    ))}
  </div>
);

// ------------------------------------------------------------
// Variant: Pulse — soft breathing gradient orb (good for subtle/branded loads)
// ------------------------------------------------------------
const PulseSpinner = ({ size, from, to }) => (
  <div className={`relative flex items-center justify-center ${RING_SIZES[size].split(' ').slice(0, 2).join(' ')}`}>
    <span
      className="absolute inset-0 rounded-full loader-pulse-ring"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    />
    <span
      className="relative rounded-full w-1/2 h-1/2 loader-pulse-core"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    />
  </div>
);

const VARIANTS = {
  ring: RingSpinner,
  dots: DotsSpinner,
  bars: BarsSpinner,
  pulse: PulseSpinner
};

// ------------------------------------------------------------
// Ambient floating gradient blobs — used only in fullScreen mode for a
// premium "depth" background feel. Purely decorative, non-blocking.
// ------------------------------------------------------------
const AmbientBackdrop = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <div className="loader-blob loader-blob-1 absolute -top-24 -left-24 w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-blue-400/20 dark:bg-blue-500/10 blur-3xl" />
    <div className="loader-blob loader-blob-2 absolute -bottom-24 -right-24 w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-purple-400/20 dark:bg-purple-500/10 blur-3xl" />
  </div>
);

const Loader = ({
  fullScreen = true,
  overlay = false,
  size = 'lg',
  variant = 'ring',
  text = 'Loading...',
  subtext,
  progress,
  from = '#2563eb', // blue-600
  to = '#9333ea',   // purple-600
  transparent = false,
  className = ''
}) => {
  const Spinner = VARIANTS[variant] || RingSpinner;
  const hasProgress = typeof progress === 'number' && !Number.isNaN(progress);
  const clampedProgress = hasProgress ? Math.min(100, Math.max(0, progress)) : null;

  const content = (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="relative z-10 flex flex-col items-center justify-center px-4 text-center"
    >
      <Spinner size={size} from={from} to={to} />

      {(text || subtext) && (
        <div className={TEXT_SIZES[size].concat(' ', 'flex flex-col items-center gap-0.5 mt-4 sm:mt-5')}>
          {text && (
            <p className="font-semibold text-gray-700 dark:text-gray-200 tracking-wide">
              {text}
            </p>
          )}
          {subtext && (
            <p className="text-gray-400 dark:text-gray-500 font-normal text-[0.8em]">
              {subtext}
            </p>
          )}
        </div>
      )}

      {hasProgress && (
        <div className="w-40 sm:w-56 mt-4">
          <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${clampedProgress}%`,
                background: `linear-gradient(90deg, ${from}, ${to})`
              }}
            />
          </div>
          <p className="mt-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 tabular-nums">
            {Math.round(clampedProgress)}%
          </p>
        </div>
      )}

      <span className="sr-only">{text || 'Loading, please wait'}</span>
    </div>
  );

  // Full-viewport loader (app boot, route transitions)
  if (fullScreen) {
    return (
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden
          ${transparent ? '' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900'}
          ${className}`}
      >
        {!transparent && <AmbientBackdrop />}
        {content}
      </div>
    );
  }

  // Overlay loader — sits on top of a `relative` parent (e.g. a card mid-refresh)
  if (overlay) {
    return (
      <div
        className={`absolute inset-0 z-40 flex items-center justify-center rounded-[inherit]
          ${transparent ? '' : 'bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm'}
          ${className}`}
      >
        {content}
      </div>
    );
  }

  // Inline loader — sits naturally in normal document flow
  return (
    <div className={`flex items-center justify-center py-6 sm:py-10 ${className}`}>
      {content}
    </div>
  );
};

export default Loader;

// ============================================================
// Scoped keyframes — injected once, no tailwind.config changes needed
// ============================================================
if (typeof document !== 'undefined' && !document.getElementById('premium-loader-styles')) {
  const style = document.createElement('style');
  style.id = 'premium-loader-styles';
  style.textContent = `
    @keyframes loader-dot-bounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
      40% { transform: translateY(-45%); opacity: 1; }
    }
    .loader-dot {
      animation: loader-dot-bounce 1s ease-in-out infinite;
    }

    @keyframes loader-bar-scale {
      0%, 100% { transform: scaleY(0.35); opacity: 0.6; }
      50% { transform: scaleY(1); opacity: 1; }
    }
    .loader-bar {
      animation: loader-bar-scale 0.9s ease-in-out infinite;
      transform-origin: bottom;
    }

    @keyframes loader-pulse-core-scale {
      0%, 100% { transform: scale(0.85); opacity: 1; }
      50% { transform: scale(1.15); opacity: 0.85; }
    }
    .loader-pulse-core {
      animation: loader-pulse-core-scale 1.4s ease-in-out infinite;
    }

    @keyframes loader-pulse-ring-scale {
      0% { transform: scale(0.6); opacity: 0.55; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    .loader-pulse-ring {
      animation: loader-pulse-ring-scale 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes loader-blob-float {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(4%, 6%) scale(1.08); }
      66% { transform: translate(-3%, -4%) scale(0.96); }
    }
    .loader-blob-1 { animation: loader-blob-float 9s ease-in-out infinite; }
    .loader-blob-2 { animation: loader-blob-float 11s ease-in-out infinite reverse; }

    @media (prefers-reduced-motion: reduce) {
      .loader-dot, .loader-bar, .loader-pulse-core, .loader-pulse-ring,
      .loader-blob-1, .loader-blob-2 {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
      }
    }
  `;
  document.head.appendChild(style);
}