import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Read saved theme from localStorage, default to 'system'
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('theme-mode') || 'system';
  });

  const applyTheme = (mode) => {
    let resolvedTheme = mode;
    
    if (mode === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  };

  useEffect(() => {
    // Apply theme whenever themeMode changes
    applyTheme(themeMode);
    localStorage.setItem('theme-mode', themeMode);
  }, [themeMode]);

  useEffect(() => {
    // Listen for system theme preferences changes if themeMode is set to system
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = () => {
      if (themeMode === 'system') {
        applyTheme('system');
      }
    };

    // Modern browsers support addEventListener, fallback to addListener for older ones
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, [themeMode]);

  const changeThemeMode = (newMode) => {
    setThemeMode(newMode);
  };

  return (
    <ThemeContext.Provider value={{ themeMode, changeThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
