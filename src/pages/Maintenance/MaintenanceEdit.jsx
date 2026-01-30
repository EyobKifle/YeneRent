import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import Button from '../../components/ui/Button';
import './MaintenanceEdit.css';

export default function MaintenanceEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    title: '',
    property: '',
    status: 'pending',
    reportedDate: '',
    cost: ''
  });
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [maintenanceData, propertiesData] = await Promise.all([
          api.get(`/maintenance/${id}`),
          api.get('/properties')
        ]);
        setProperties(propertiesData.properties || []);
        setFormData({
          title: maintenanceData.title || '',
          property: maintenanceData.property || '',
          status: maintenanceData.status || 'pending',
          reportedDate: maintenanceData.reportedDate || '',
          cost: maintenanceData.cost || ''
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setFetchLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.property) newErrors.property = 'Property is required';
    if (!formData.reportedDate) newErrors.reportedDate = 'Reported date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const maintenanceData = {
        title: formData.title,
        property: formData.property,
        status: formData.status,
        reportedDate: formData.reportedDate,
        cost: parseFloat(formData.cost) || 0
      };

      await api.put(`/maintenance/${id}`, maintenanceData);
      navigate(`/maintenance/${id}`);
    } catch (error) {
      console.error('Error updating maintenance:', error);
      setErrors({ general: 'Failed to update maintenance request' });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/maintenance/${id}`);
  };

  if (fetchLoading) {
    return <div className="loading">{t('Loading...')}</div>;
  }

  return (
    <div className="maintenance-edit-page">
      <div className="page-header">
        <div>
          <Button variant="secondary" onClick={handleBack}>
            <i className="fa-solid fa-arrow-left"></i> {t('Back to Details')}
          </Button>
          <h1>{t('Edit Maintenance Request')}</h1>
          <p>{t('Update maintenance request information.')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="edit-form">
        {errors.general && (
          <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
            {errors.general}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="title">{t('Request Title')} *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={errors.title ? 'error' : ''}
            placeholder="e.g., Leaky Faucet, Broken Light Fixture"
          />
          {errors.title && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem' }}>{errors.title}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="property">{t('Property')} *</label>
          <select
            id="property"
            name="property"
            value={formData.property}
            onChange={handleInputChange}
            className={errors.property ? 'error' : ''}
          >
            <option value="">{t('Select Property')}</option>
            {properties.map(prop => (
              <option key={prop} value={prop}>{prop}</option>
            ))}
          </select>
          {errors.property && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem' }}>{errors.property}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="status">{t('Status')}</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
          >
            <option value="pending">{t('Pending')}</option>
            <option value="in-progress">{t('In Progress')}</option>
            <option value="completed">{t('Completed')}</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="reportedDate">{t('Reported Date')} *</label>
          <input
            type="date"
            id="reportedDate"
            name="reportedDate"
            value={formData.reportedDate}
            onChange={handleInputChange}
            className={errors.reportedDate ? 'error' : ''}
          />
          {errors.reportedDate && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem' }}>{errors.reportedDate}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="cost">{t('Estimated Cost ($)')}</label>
          <NumberInput
            value={formData.cost}
            onChange={(value) => setFormData(prev => ({ ...prev, cost: value }))}
            placeholder="0.00"
            min={0}
            step={0.01}
          />
        </div>

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={handleBack}>
            {t('Cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? t('Updating...') : t('Update Maintenance Request')}
          </Button>
        </div>
      </form>
    </div>
  );
}
