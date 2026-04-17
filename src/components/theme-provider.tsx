
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Function to get initial theme, ensuring it only runs on client
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light'; // Default for server or if window is not available
  }
  const storedTheme = localStorage.getItem('coursehub-theme') as Theme | null;
  if (storedTheme) {
    return storedTheme;
  }
  // Default to system preference if no theme is stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};


export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize theme state. The actual setting of the class on <html>
  // will happen in useEffect after mount to avoid hydration issues.
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    // This effect runs only on the client after mount.
    // It ensures the class on <html> matches the theme state derived from localStorage or system preference.
    const currentTheme = getInitialTheme();
    setThemeState(currentTheme); // Ensure state matches client-side reality

    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []); // Empty dependency array ensures this runs once on mount (client-side)


  const setTheme = (newTheme: Theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('coursehub-theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
