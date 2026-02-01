import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../utils/api';
import Button from '../../components/ui/Button';
import './DocumentEdit.css';

export default function DocumentEdit() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    file: null,
    propertyId: '',
    tenantId: ''
  });
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [documentData, propertiesData, tenantsData] = await Promise.all([
          api.get(`/documents/${documentId}`),
          api.get('/properties'),
          api.get('/tenants')
        ]);
        setProperties(propertiesData.properties || []);
        setTenants(tenantsData || []);
        setFormData({
          name: documentData.name || '',
          category: documentData.category || '',
          file: null,
          propertyId: documentData.propertyId || '',
          tenantId: documentData.tenantId || ''
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setFetchLoading(false);
      }
    };

    if (documentId) {
      fetchData();
    }
  }, [documentId]);

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
    const { files } = e.target;
    setFormData(prev => ({
      ...prev,
      file: files[0] || null
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      let fileUrl = null;
      let fileName = null;
      let fileType = null;
      let fileSize = null;

      // Handle file upload if new file selected
      if (formData.file) {
        const uploadForm = new FormData();
        uploadForm.append('file', formData.file);
        
        try {
            const res = await api.post('uploads/document', uploadForm);
            if (res && res.url) {
                fileUrl = res.url;
                fileName = res.originalName || formData.file.name;
                fileType = formData.file.type || 'application/octet-stream';
                fileSize = formData.file.size;
            }
        } catch (uploadError) {
            console.error('File upload failed:', uploadError);
            setErrors({ general: 'Failed to upload new file. Please try again.' });
            setLoading(false);
            return;
        }
      }

      const documentData = {
        name: formData.name,
        category: formData.category,
        propertyId: formData.propertyId || null,
        tenantId: formData.tenantId || null
      };

      if (fileUrl) {
          documentData.url = fileUrl;
          documentData.fileName = fileName;
          documentData.type = fileType;
          documentData.size = fileSize;
      }

      await api.put(`/documents/${documentId}`, documentData);
      navigate(`/documents/${documentId}`);
    } catch (error) {
      console.error('Error updating document:', error);
      setErrors({ general: 'Failed to update document' });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/documents/${documentId}`);
  };

  if (fetchLoading) {
    return <div className="loading">{t('Loading...')}</div>;
  }

  return (
    <div className="document-edit-page">
      <div className="page-header">
        <div>
          <Button variant="secondary" onClick={handleBack}>
            <i className="fa-solid fa-arrow-left"></i> {t('Back to Details')}
          </Button>
          <h1>{t('Edit Document')}</h1>
          <p>{t('Update document information.')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="edit-form">
        {errors.general && (
          <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
            {errors.general}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="name">{t('Document Name')} *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={errors.name ? 'error' : ''}
            placeholder="Enter document name"
          />
          {errors.name && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem' }}>{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="category">{t('Category')} *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className={errors.category ? 'error' : ''}
          >
            <option value="">{t('Select Category')}</option>
            <option value="Lease Agreement">{t('Lease Agreement')}</option>
            <option value="Payment Receipt">{t('Payment Receipt')}</option>
            <option value="Tax Document">{t('Tax Document')}</option>
            <option value="Other">{t('Other')}</option>
          </select>
          {errors.category && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem' }}>{errors.category}</span>}
        </div>

        <div className="form-row-columns">
          <div className="form-group">
            <label htmlFor="propertyId">{t('Linked Property')}</label>
            <select
              id="propertyId"
              name="propertyId"
              value={formData.propertyId}
              onChange={handleInputChange}
            >
              <option value="">{t('Select Property')}</option>
              {properties.map(prop => (
                <option key={prop._id || prop.id} value={prop._id || prop.id}>{prop.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="tenantId">{t('Linked Tenant')}</label>
            <select
              id="tenantId"
              name="tenantId"
              value={formData.tenantId}
              onChange={handleInputChange}
            >
              <option value="">{t('Select Tenant')}</option>
              {tenants.map(tenant => (
                <option key={tenant._id || tenant.id} value={tenant._id || tenant.id}>{tenant.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="file">{t('Upload New File')}</label>
          <input
            type="file"
            id="file"
            name="file"
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileChange}
          />
          <small className="form-hint">
            {formData.file?.name || 'Leave empty to keep current file'}
          </small>
        </div>

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={handleBack}>
            {t('Cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? t('Updating...') : t('Update Document')}
          </Button>
        </div>
      </form>
    </div>
  );
}
