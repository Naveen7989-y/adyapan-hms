import React from 'react';

/**
 * Official Adyapan Hospital 3D Glossy Badge Logo
 * 
 * Features:
 * - High-resolution circular glossy amber emblem with "ady. ADYAPAN" typography
 * - Smooth hardware-accelerated drop shadow and golden luminescence
 * - Interactive hover scale and sheen effects
 * - Responsive sizing tokens ('xs' | 'sm' | 'md' | 'lg' | 'xl')
 */
export const AdyapanLogo = ({
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className = '',
  glow = true,
  withPing = false,
}) => {
  const sizeClasses = {
    xs: 'w-7 h-7',
    sm: 'w-8 h-8 sm:w-9 sm:h-9',
    md: 'w-11 h-11 sm:w-12 sm:h-12',
    lg: 'w-14 h-14 sm:w-16 sm:h-16',
    xl: 'w-20 h-20 sm:w-24 sm:h-24',
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none group ${currentSize} ${className}`}
    >
      <img
        src="/adyapan-logo.png"
        alt="Adyapan Hospital Logo"
        className={`w-full h-full object-contain rounded-full transition-transform duration-300 group-hover:scale-105 ${
          glow ? 'filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.38)]' : 'shadow-sm'
        }`}
        loading="eager"
        decoding="async"
      />
      {withPing && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white"></span>
        </span>
      )}
    </div>
  );
};

export const HeartbeatLogo = AdyapanLogo;
export default AdyapanLogo;
