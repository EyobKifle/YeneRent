import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { settingsService } from '../../utils/settingsService';
import './Settings.css';

export default function SettingsPage() {
  const [settings, setSettings] = useState(settingsService.getSettings());
  const [message, setMessage] = useState('');

  useEffect(() => {
    // If a backend settings API is added, load from there here.
  }, []);

  const handleChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    settingsService.saveSettings(settings);
    setMessage('Settings saved');
    setTimeout(() => setMessage(''), 2000);
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage application configuration</p>
      </div>

      {message && <div className="message success">{message}</div>}

      <Card>
        <h3>Organization</h3>
        <div className="form-group">
          <label>Organization Name</label>
          <input
            className="form-input"
            value={settings.general?.orgName || ''}
            onChange={(e) => handleChange('general', 'orgName', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Logo URL</label>
          <input
            className="form-input"
            value={settings.general?.logoUrl || ''}
            onChange={(e) => handleChange('general', 'logoUrl', e.target.value)}
          />
        </div>
      </Card>

      <Card>
        <h3>Appearance</h3>
        <div className="form-group">
          <label>Theme</label>
          <select
            className="form-input"
            value={settings.appearance?.theme || 'light'}
            onChange={(e) => handleChange('appearance', 'theme', e.target.value)}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </Card>

      <Card>
        <h3>Tax Settings</h3>
        <div className="form-group">
          <label>Include VAT</label>
          <select
            className="form-input"
            value={settings.tax?.includeVAT ? 'true' : 'false'}
            onChange={(e) => handleChange('tax', 'includeVAT', e.target.value === 'true')}
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div className="form-group">
          <label>VAT Rate (%)</label>
          <input
            type="number"
            className="form-input"
            value={settings.tax?.vatRate ? (settings.tax.vatRate * 100) : 15}
            onChange={(e) => handleChange('tax', 'vatRate', parseFloat(e.target.value) / 100)}
            step="0.01"
            min="0"
            max="100"
          />
        </div>
      </Card>

      <Card>
        <h3>Regional</h3>
        <div className="form-group">
          <label>Calendar</label>
          <select
            className="form-input"
            value={settings.regional?.calendar || 'gregorian'}
            onChange={(e) => handleChange('regional', 'calendar', e.target.value)}
          >
            <option value="gregorian">Gregorian</option>
            <option value="ethiopian">Ethiopian</option>
          </select>
        </div>
        <div className="form-group">
          <label>Language</label>
          <select
            className="form-input"
            value={settings.regional?.language || 'en'}
            onChange={(e) => handleChange('regional', 'language', e.target.value)}
          >
            <option value="en">English</option>
            <option value="am">Amharic</option>
          </select>
        </div>
      </Card>

      <div className="form-actions">
        <Button onClick={handleSave}>Save Settings</Button>
      </div>
    </div>
  );
}
