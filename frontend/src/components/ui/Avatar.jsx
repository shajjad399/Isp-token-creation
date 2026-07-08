// frontend/src/components/ui/Avatar.jsx
import React, { useState, useEffect } from 'react';

const Avatar = ({ name, src, size = 'md', className = '', onClick }) => {
  const [imgError, setImgError] = useState(false);

  // Reset error state whenever a new src is provided (e.g. after re-upload)
  useEffect(() => {
    setImgError(false);
  }, [src]);

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-20 h-20 text-xl'
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
    'bg-orange-500', 'bg-cyan-500', 'bg-rose-500', 'bg-violet-500'
  ];

  const getColor = (name) => {
    if (!name) return colors[0];
    const index = name.length % colors.length;
    return colors[index];
  };

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ${sizes[size]} ${className}`}
        onClick={onClick}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div 
      className={`
        rounded-full flex items-center justify-center font-semibold text-white
        ${sizes[size]} ${getColor(name)} ${className}
        ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
      `}
      onClick={onClick}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;