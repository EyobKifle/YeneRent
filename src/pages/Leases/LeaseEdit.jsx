import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import { readFileAsDataURL } from '../../utils/utils';
import Button from '../../components/ui/Button';
import './LeaseEdit.css';

export default function LeaseEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    tenantId: '',
    propertyId: '',
    unitId: '',
    startDate: '',
    endDate: '',
    rentAmount: '',
    withholdingAmount: '',
    leaseAgreementFile: null,
    withholdingReceiptFile: null,
    leaseAgreementFileName: '',
    withholdingReceiptFileName: ''
  });
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [availableUnitsForProperty, setAvailableUnitsForProperty] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leaseData, tenantsData, propertiesData, unitsData] = await Promise.all([
          api.get(`/leases/${id}`),
          api.get('/tenants'),
          api.get('/properties'),
          api.get('/units')
        ]);
        setTenants(tenantsData || []);
        setProperties(propertiesData.properties || []);
        setUnits(unitsData || []);
        setFormData({
          tenantId: leaseData.tenantId || '',
          propertyId: leaseData.unitId ? unitsData.find(u => u.id === leaseData.unitId)?.propertyId || '' : '',
          unitId: leaseData.unitId || '',
          startDate: leaseData.startDate || '',
          endDate: leaseData.endDate || '',
          rentAmount: leaseData.rentAmount || '',
          withholdingAmount: leaseData.withholdingAmount || '',
          leaseAgreementFile: null,
          withholdingReceiptFile: null,
          leaseAgreementFileName: leaseData.leaseAgreementName || '',
          withholdingReceiptFileName: leaseData.withholdingReceiptName || ''
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

  useEffect(() => {
    if (formData.propertyId) {
      const activeLeaseUnitIds = [] // For edit, allow current unit
      const unitsForProperty = units.filter(u => u.propertyId === formData.propertyId && !activeLeaseUnitIds.includes(u.id) || u.id === formData.unitId);
      setAvailableUnitsForProperty(unitsForProperty);
    } else {
      setAvailableUnitsForProperty([]);
    }
  }, [formData.propertyId, units, formData.unitId]);

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

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files[0] || null
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.tenantId) newErrors.tenantId = 'Tenant is required';
    if (!formData.propertyId) newErrors.propertyId = 'Property is required';
    if (!formData.unitId) newErrors.unitId = 'Unit is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (!formData.rentAmount) newErrors.rentAmount = 'Rent amount is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      let leaseAgreementUrl = null;
      let withholdingReceiptUrl = null;
      let leaseAgreementName = formData.leaseAgreementFileName;
      let withholdingReceiptName = formData.withholdingReceiptFileName;

      if (formData.leaseAgreementFile) {
        leaseAgreementUrl = await readFileAsDataURL(formData.leaseAgreementFile);
        leaseAgreementName = formData.leaseAgreementFile.name;
      }
      if (formData.withholdingReceiptFile) {
        withholdingReceiptUrl = await readFileAsDataURL(formData.withholdingReceiptFile);
        withholdingReceiptName = formData.withholdingReceiptFile.name;
      }

      const leaseData = {
        tenantId: formData.tenantId,
        propertyId: formData.propertyId,
        unitId: formData.unitId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        rentAmount: parseFloat(formData.rentAmount),
        withholdingAmount: parseFloat(formData.withholdingAmount) || null,
        leaseAgreementUrl,
        leaseAgreementName,
        withholdingReceiptUrl,
        withholdingReceiptName,
      };

      await api.put(`/leases/${id}`, leaseData);
      navigate(`/leases/${id}`);
    } catch (error) {
      console.error('Error updating lease:', error);
      setErrors({ general: 'Failed to update lease' });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/leases/${id}`);
  };

  if (fetchLoading) {
    return <div className="loading">{t('Loading...')}</div>;
  }

  return (
    <div className="lease-edit-page">
      <div className="page-header">
        <div>
          <Button variant="secondary" onClick={handleBack}>
            <i className="fa-solid fa-arrow-left"></i> {t('Back to Details')}
          </Button>
          <h1>{t('Edit Lease')}</h1>
          <p>{t('Update lease information.')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="edit-form">
        {errors.general && (
          <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
            {errors.general}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="tenantId">{t('Tenant')} *</label>
          <select
            id="tenantId"
            name="tenantId"
            value={formData.tenantId}
            onChange={handleInputChange}
            className={errors.tenantId ? 'error' : ''}
          >
            <option value="">{t('Select a tenant')}</option>
            {tenants.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {errors.tenantId && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem' }}>{errors.tenantId}</span>}
        </div>

        <div className="form-row-columns">
          <div className="form-group">
            <label htmlFor="propertyId">{t('Property')} *</label>
            <select
              id="propertyId"
              name="propertyId"
              value={formData.propertyId}
              onChange={handleInputChange}
              className={errors.propertyId ? 'error' : ''}
            >
              <option value="">{t('Select a property')}</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.propertyId && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem' }}>{errors.propertyId}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="unitId">{t('Unit')} *</label>
            <select
              id="unitId"
              name="unitId"
              value={formData.unitId}
              onChange={handleInputChange}
              className={errors.unitId ? 'error' : ''}
            >
              <option value="">{t('Select a unit')}</option>
              {availableUnitsForProperty.map(u => (
                <option key={u.id} value={u.id}>Unit {u.unitNumber}</option>
              ))}
            </select>
            {errors.unitId && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem' }}>{errors.unitId}</span>}
          </div>
        </div>

        <div className="form-row-columns">
          <div className="form-group">
            <label htmlFor="startDate">{t('Start Date')} *</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              className={errors.startDate ? 'error' : ''}
            />
            {errors.startDate && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem' }}>{errors.startDate}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="endDate">{t('End Date')} *</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
              className={errors.endDate ? 'error' : ''}
            />
            {errors.endDate && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem' }}>{errors.endDate}</span>}
          </div>
        </div>

        <div className="form-row-columns">
          <div className="form-group">
            <label htmlFor="rentAmount">{t('Monthly Rent (ETB)')} *</label>
            <input
              type="number"
              id="rentAmount"
              name="rentAmount"
              value={formData.rentAmount}
              onChange={handleInputChange}
              className={errors.rentAmount ? 'error' : ''}
              min="0"
            />
            {errors.rentAmount && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem' }}>{errors.rentAmount}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="withholdingAmount">{t('Withholding Amount (Optional)')}</label>
            <input
              type="number"
              id="withholdingAmount"
              name="withholdingAmount"
              value={formData.withholdingAmount}
              onChange={handleInputChange}
              min="0"
            />
          </div>
        </div>

        <div className="form-row-columns">
          <div className="form-group">
            <label htmlFor="leaseAgreementFile">{t('Lease Agreement')}</label>
            <input
              type="file"
              id="leaseAgreementFile"
              name="leaseAgreementFile"
              accept="image/*,.pdf"
              onChange={handleFileChange}
            />
            <small className="form-hint">
              {formData.leaseAgreementFile?.name || formData.leaseAgreementFileName || 'Upload PDF or image'}
            </small>
          </div>
          <div className="form-group">
            <label htmlFor="withholdingReceiptFile">{t('Withholding Receipt')}</label>
            <input
              type="file"
              id="withholdingReceiptFile"
              name="withholdingReceiptFile"
              accept="image/*,.pdf"
              onChange={handleFileChange}
            />
            <small className="form-hint">
              {formData.withholdingReceiptFile?.name || formData.withholdingReceiptFileName || 'Upload PDF or image'}
            </small>
          </div>
        </div>

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={handleBack}>
            {t('Cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? t('Updating...') : t('Update Lease')}
          </Button>
        </div>
      </form>
    </div>
  );
}
