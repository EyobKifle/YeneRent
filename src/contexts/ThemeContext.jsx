import React, { useState, useEffect, useContext, createContext } from 'react';
import { settingsService } from '../utils/settingsService';

const applyTheme = (themeName) => {
  document.body.setAttribute('data-theme', themeName);
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const savedSettings = settingsService.getSettings();
    return savedSettings.appearance.theme || 'light';
  });

  useEffect(() => {
    applyTheme(theme); // Apply theme immediately on mount
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
    const currentSettings = settingsService.getSettings();
    settingsService.saveSettings({
      ...currentSettings,
      appearance: { ...currentSettings.appearance, theme: newTheme },
    });
    applyTheme(newTheme);
  };

  const changeTheme = (themeName) => {
    setThemeState(themeName);
    const currentSettings = settingsService.getSettings();
    settingsService.saveSettings({
      ...currentSettings,
      appearance: { ...currentSettings.appearance, theme: themeName },
    });
    applyTheme(themeName);
  };

  const value = {
    theme,
    toggleTheme,
    setTheme: changeTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  return useContext(ThemeContext);
};
