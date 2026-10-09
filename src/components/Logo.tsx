'use strict';
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const subSizes = {
    sm: 'text-[9px] tracking-[0.25em]',
    md: 'text-[11px] tracking-[0.3em]',
    lg: 'text-xs tracking-[0.35em]',
    xl: 'text-sm tracking-[0.4em]',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* SVG Icon mirroring user provided logo image */}
      <div className={`relative flex-shrink-0 ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-sm transition-transform duration-300 hover:scale-105"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Rounded Squircle Background */}
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="26"
            className="fill-emerald-500 transition-colors"
          />
          
          {/* Mint Leaf / Water Drop Icon Above Middle Bar */}
          <path
            d="M 50 18 C 58 24 64 33 55 42 C 45 42 41 33 50 18 Z"
            fill="#d1fae5"
            className="transition-transform origin-center"
          />

          {/* Left Vertical Bar (Short) */}
          <rect
            x="22"
            y="52"
            width="14"
            height="26"
            rx="7"
            className="fill-white dark:fill-slate-900 transition-colors"
          />

          {/* Center Vertical Bar (Tall) */}
          <rect
            x="43"
            y="40"
            width="14"
            height="38"
            rx="7"
            className="fill-white dark:fill-slate-900 transition-colors"
          />

          {/* Right Vertical Bar (Medium) */}
          <rect
            x="64"
            y="48"
            width="14"
            height="30"
            rx="7"
            className="fill-white dark:fill-slate-900 transition-colors"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <span
            className={`font-extrabold tracking-tight text-slate-900 dark:text-white ${titleSizes[size]}`}
          >
            Eco<span className="text-emerald-500">Estate</span>
          </span>
          <span
            className={`font-semibold uppercase text-slate-500 dark:text-slate-400 mt-0.5 ${subSizes[size]}`}
          >
            I N D I A
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
