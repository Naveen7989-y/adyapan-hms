import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import WaterFlowTransition from '../components/common/WaterFlowTransition';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('adyapan_theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // Fallback if localStorage is inaccessible
    }
    return 'light';
  });

  const [isFlowing, setIsFlowing] = useState(false);
  const [flowTargetTheme, setFlowTargetTheme] = useState('light');

  // Synchronize root element classes and localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    try {
      localStorage.setItem('adyapan_theme', theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  // Liquid Water Flow Theme Transition Handler
  const transitionToTheme = useCallback((nextTheme) => {
    if (isFlowing || nextTheme === theme) return;

    setFlowTargetTheme(nextTheme);
    setIsFlowing(true);

    const root = document.documentElement;
    root.classList.add('theme-transitioning');

    // Use native View Transitions API when supported (Chrome, Edge, modern browsers)
    if (typeof document.startViewTransition === 'function') {
      try {
        const transition = document.startViewTransition(() => {
          // Synchronously update DOM classes so snapshot captures target theme immediately
          if (nextTheme === 'dark') {
            root.classList.add('dark');
            root.style.colorScheme = 'dark';
          } else {
            root.classList.remove('dark');
            root.style.colorScheme = 'light';
          }
          setThemeState(nextTheme);
        });

        transition.finished.finally(() => {
          setIsFlowing(false);
          root.classList.remove('theme-transitioning');
        });
        return;
      } catch (e) {
        console.warn('View Transition failed, using liquid overlay fallback', e);
      }
    }

    // High-performance fallback for environments without View Transitions API
    // Swap theme state at mid-flow (~380ms) when screen is immersed by the liquid cascade
    const swapTimer = setTimeout(() => {
      setThemeState(nextTheme);
    }, 380);

    const finishTimer = setTimeout(() => {
      setIsFlowing(false);
      root.classList.remove('theme-transitioning');
    }, 850);

    return () => {
      clearTimeout(swapTimer);
      clearTimeout(finishTimer);
    };
  }, [theme, isFlowing]);

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    transitionToTheme(nextTheme);
  }, [theme, transitionToTheme]);

  const setTheme = useCallback((newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      transitionToTheme(newTheme);
    }
  }, [transitionToTheme]);

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark, isFlowing }}>
      {/* Liquid Water Flowing Animation Overlay */}
      <WaterFlowTransition isFlowing={isFlowing} toTheme={flowTargetTheme} />
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
