// frontend/src/components/common/Loader.jsx
import React from 'react';

const Loader = ({ fullScreen = true, size = 'lg' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <div className={`${sizes[size]} border-4 border-blue-600 border-t-transparent rounded-full animate-spin`}></div>
        <div className={`absolute inset-0 ${sizes[size]} border-4 border-purple-600 border-b-transparent rounded-full animate-spin animation-delay-150`}></div>
      </div>
      <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading...</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default Loader;