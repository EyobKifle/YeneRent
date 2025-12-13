// YeneRent/src/contexts/LanguageContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsService } from '../utils/settingsService';

const LanguageContext = createContext(null);

// Simple mock translations for now
const translations = {
  en: {
    'Dashboard': 'Dashboard',
    'Properties': 'Properties',
    'Tenants': 'Tenants',
    'Leases': 'Leases',
    'Payments': 'Payments',
    'Utilities': 'Utilities',
    'Maintenance': 'Maintenance',
    'Documents': 'Documents',
    'Analytics': 'Analytics',
    'English': 'English',
    'Amharic': 'አማርኛ',
    'My Profile': 'My Profile',
    'Settings': 'Settings',
    'Log Out': 'Log Out',
    'Rental Management': 'Rental Management',
    'Login': 'Login',
    'Sign Up': 'Sign Up',
    'Home': 'Home',
    'Features': 'Features',
    'Pricing': 'Pricing',
    'Demo': 'Demo',
    'Contact': 'Contact',
    // Add more translations as needed
  },
  am: {
    'Dashboard': 'ዳሽቦርድ',
    'Properties': 'ንብረቶች',
    'Tenants': 'ተከራዮች',
    'Leases': 'ኪራዮች',
    'Payments': 'ክፍያዎች',
    'Utilities': 'መገልገያዎች',
    'Maintenance': 'ጥገና',
    'Documents': 'ሰነዶች',
    'Analytics': 'ትንታኔዎች',
    'English': 'እንግሊዝኛ',
    'Amharic': 'አማርኛ',
    'My Profile': 'የእኔ መገለጫ',
    'Settings': 'ቅንብሮች',
    'Log Out': 'ውጣ',
    'Rental Management': 'የኪራይ አስተዳደር',
    'Login': 'ግባ',
    'Sign Up': 'ተመዝገብ',
    'Home': 'መነሻ',
    'Features': 'ባህሪያት',
    'Pricing': 'ዋጋ',
    'Demo': 'ማሳያ',
    'Contact': 'እውቂያ',
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    const savedSettings = settingsService.getSettings();
    return savedSettings.regional.language || 'en';
  });

  useEffect(() => {
    // Update settings in localStorage when language changes
    const currentSettings = settingsService.getSettings();
    settingsService.saveSettings({
      ...currentSettings,
      regional: { ...currentSettings.regional, language: language },
    });
  }, [language]);

  const setLanguage = (lang) => {
    setLanguageState(lang);
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => {
  return useContext(LanguageContext);
};
