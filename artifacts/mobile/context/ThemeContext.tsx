import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';

type Scheme = 'light' | 'dark';

type ThemeContextType = {
  colorScheme: Scheme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  colorScheme: 'light',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorScheme] = useState<Scheme>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
  );

  const toggleTheme = () => {
    setColorScheme((prev) => {
      const next: Scheme = prev === 'light' ? 'dark' : 'light';
      try {
        Appearance.setColorScheme(next);
      } catch {
        // not supported on all platforms
      }
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ colorScheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
