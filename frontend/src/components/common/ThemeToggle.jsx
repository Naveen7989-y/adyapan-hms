import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Theme Toggle Button
 * 
 * Requirements:
 * - Displays Sun icon when theme is Light
 * - Displays Moon icon when theme is Dark
 * - Seamless toggle between Light & Dark themes with smooth micro-animation
 */
export const ThemeToggle = ({
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  showLabel = false,
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  const sizeConfigs = {
    sm: {
      btn: 'p-1.5 rounded-lg text-xs gap-1.5',
      icon: 'w-4 h-4',
    },
    md: {
      btn: 'p-2 sm:px-2.5 sm:py-2 rounded-xl text-xs font-bold gap-2',
      icon: 'w-4 h-4 sm:w-4.5 sm:h-4.5',
    },
    lg: {
      btn: 'p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl text-sm font-bold gap-2',
      icon: 'w-5 h-5',
    },
  };

  const config = sizeConfigs[size] || sizeConfigs.md;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center transition-all duration-300 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 select-none group ${
        isDark
          ? 'bg-[#0B1524] hover:bg-[#102030] text-[#1EAD86] border border-[#05775A]/40 shadow-sm hover:shadow-gold-glow hover:border-[#05775A]'
          : 'bg-white hover:bg-[#F8FAFC] text-[#0D9488] hover:text-[#0F766E] border border-[#E2E8F0] shadow-xs hover:shadow-sm hover:border-[#0D9488]'
      } ${config.btn} ${className}`}
      title={isDark ? 'Dark theme active • Click for Light theme' : 'Light theme active • Click for Dark theme'}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {/* Icon with rotation & scale transition */}
      <span className="relative flex items-center justify-center transition-transform duration-300 group-hover:rotate-12">
        {isDark ? (
          // Moon icon when dark theme
          <Moon className={`${config.icon} text-[#1EAD86] animate-in fade-in zoom-in duration-200 fill-[#05775A]/20`} />
        ) : (
          // Sun icon when light theme
          <Sun className={`${config.icon} text-[#0D9488] group-hover:text-[#0F766E] animate-in fade-in zoom-in duration-200 fill-[#0D9488]/20`} />
        )}
      </span>

      {showLabel && (
        <span className="hidden sm:inline font-mono uppercase tracking-wider text-[11px]">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
