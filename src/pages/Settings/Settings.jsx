import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { settingsService } from '../../utils/settingsService';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import './Settings.css';

const Settings = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  const { language, setLanguage } = useLanguage();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const currentSettings = settingsService.getSettings();
    setSettings(currentSettings);
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    const updatedSettings = { ...settings, appearance: { ...settings.appearance, theme: newTheme } };
    setSettings(updatedSettings);
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    const updatedSettings = { ...settings, regional: { ...settings.regional, language: newLanguage } };
    setSettings(updatedSettings);
  };

  const handleTaxChange = (field, value) => {
    const updatedSettings = {
      ...settings,
      tax: { ...settings.tax, [field]: parseFloat(value) || 0 }
    };
    setSettings(updatedSettings);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      settingsService.saveSettings(settings);
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch  {
      setMessage('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage your account preferences and application settings.</p>
      </div>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="settings-grid">
        <Card className="settings-card">
          <h3>Appearance</h3>
          <div className="setting-group">
            <label>Theme</label>
            <select value={theme} onChange={(e) => handleThemeChange(e.target.value)}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </Card>

        <Card className="settings-card">
          <h3>Regional</h3>
          <div className="setting-group">
            <label>Language</label>
            <select value={language} onChange={(e) => handleLanguageChange(e.target.value)}>
              <option value="en">English</option>
              <option value="am">Amharic</option>
            </select>
          </div>
        </Card>

        <Card className="settings-card">
          <h3>Business Settings</h3>
          <div className="setting-group">
            <label>VAT Rate (%)</label>
            <input
              type="number"
              step="0.01"
              value={settings.tax?.vatRate || 0}
              onChange={(e) => handleTaxChange('vatRate', e.target.value)}
            />
          </div>
          <div className="setting-group">
            <label>Withholding Tax Rate (%)</label>
            <input
              type="number"
              step="0.01"
              value={settings.tax?.withholdingTaxRate || 0}
              onChange={(e) => handleTaxChange('withholdingTaxRate', e.target.value)}
            />
          </div>
          <div className="setting-group">
            <label>Business Income Tax Rate (%)</label>
            <input
              type="number"
              step="0.01"
              value={settings.tax?.businessIncomeTaxRate || 0}
              onChange={(e) => handleTaxChange('businessIncomeTaxRate', e.target.value)}
            />
          </div>
        </Card>

        <Card className="settings-card">
          <h3>Account</h3>
          <div className="setting-group">
            <label>Email Notifications</label>
            <input
              type="checkbox"
              checked={settings.notifications?.email || false}
              onChange={(e) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, email: e.target.checked }
              })}
            />
          </div>
          <div className="setting-group">
            <label>Push Notifications</label>
            <input
              type="checkbox"
              checked={settings.notifications?.push || false}
              onChange={(e) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, push: e.target.checked }
              })}
            />
          </div>
        </Card>
      </div>

      <div className="settings-actions">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
