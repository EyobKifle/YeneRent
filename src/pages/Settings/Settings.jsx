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
      setMessage(t('Settings saved successfully!'));
      setTimeout(() => setMessage(''), 3000);
    } catch  {
      setMessage(t('Failed to save settings. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>{t('Settings')}</h1>
        <p>{t('Manage your account preferences and application settings.')}</p>
      </div>

      {message && (
        <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="settings-grid">
        <Card className="settings-card">
          <h3>{t('Appearance')}</h3>
          <div className="setting-group">
            <label>{t('Theme')}</label>
            <select value={theme} onChange={(e) => handleThemeChange(e.target.value)}>
              <option value="light">{t('Light')}</option>
              <option value="dark">{t('Dark')}</option>
            </select>
          </div>
        </Card>

        <Card className="settings-card">
          <h3>{t('Regional')}</h3>
          <div className="setting-group">
            <label>{t('Language')}</label>
            <select value={language} onChange={(e) => handleLanguageChange(e.target.value)}>
              <option value="en">{t('English')}</option>
              <option value="am">{t('Amharic')}</option>
            </select>
          </div>
        </Card>

        <Card className="settings-card">
          <h3>{t('Business Settings')}</h3>
          <div className="setting-group">
            <label>{t('VAT Rate (%)')}</label>
            <input
              type="number"
              step="0.01"
              value={settings.tax?.vatRate || 0}
              onChange={(e) => handleTaxChange('vatRate', e.target.value)}
            />
          </div>
          <div className="setting-group">
            <label>{t('Withholding Tax Rate (%)')}</label>
            <input
              type="number"
              step="0.01"
              value={settings.tax?.withholdingTaxRate || 0}
              onChange={(e) => handleTaxChange('withholdingTaxRate', e.target.value)}
            />
          </div>
          <div className="setting-group">
            <label>{t('Business Income Tax Rate (%)')}</label>
            <input
              type="number"
              step="0.01"
              value={settings.tax?.businessIncomeTaxRate || 0}
              onChange={(e) => handleTaxChange('businessIncomeTaxRate', e.target.value)}
            />
          </div>
        </Card>

        <Card className="settings-card">
          <h3>{t('Account')}</h3>
          <div className="setting-group">
            <label>{t('Email Notifications')}</label>
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
            <label>{t('Push Notifications')}</label>
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
          {loading ? t('Saving...') : t('Save Settings')}
        </Button>
      </div>
    </div>
  );
};

export default Settings;
