import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../utils/api';
import Button from '../../components/ui/Button';
import NumberInput from '../../components/ui/NumberInput';
import './MaintenanceEdit.css';

export default function MaintenanceEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    title: '',
    propertyId: '',
    status: 'pending',
    reportedDate: '',
    cost: ''
  });
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [errors, setErrors] = useState({});

  // File states
  const [receiptFile, setReceiptFile] = useState(null);
  const [beforeImageFile, setBeforeImageFile] = useState(null);
  const [afterImageFile, setAfterImageFile] = useState(null);
  
  // Existing file data
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [currentImages, setCurrentImages] = useState([]);

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
          propertyId: (maintenanceData.propertyId?._id || maintenanceData.propertyId) || '',
          status: maintenanceData.status || 'pending',
          reportedDate: maintenanceData.reportedDate ? maintenanceData.reportedDate.split('T')[0] : '',
          cost: maintenanceData.cost || ''
        });
        
        setCurrentReceipt(maintenanceData.receiptUrl ? { name: maintenanceData.receiptName, url: maintenanceData.receiptUrl } : null);
        setCurrentImages(maintenanceData.images || []);

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
    if (!formData.propertyId) newErrors.propertyId = 'Property is required';
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
        propertyId: formData.propertyId,
        status: formData.status,
        reportedDate: formData.reportedDate,
        cost: parseFloat(formData.cost) || 0
      };

      // Handle uploads
      try {
        if (receiptFile) {
          const form = new FormData();
          form.append('file', receiptFile);
          const res = await api.post('uploads/document', form);
          if (res && res.url) {
            maintenanceData.receiptUrl = res.url;
            maintenanceData.receiptName = res.originalName || receiptFile.name;
          }
        }

        // Handle Images
        let updatedImages = [...currentImages];
        
        if (beforeImageFile) {
          const form = new FormData();
          form.append('file', beforeImageFile);
          const res = await api.post('uploads/image', form);
          if (res && res.url) {
            // Remove existing Before image if present
            updatedImages = updatedImages.filter(img => img.caption !== 'Before');
            updatedImages.push({ url: res.url, caption: 'Before' });
          }
        }

        if (afterImageFile) {
          const form = new FormData();
          form.append('file', afterImageFile);
          const res = await api.post('uploads/image', form);
          if (res && res.url) {
             // Remove existing After image if present
             updatedImages = updatedImages.filter(img => img.caption !== 'After');
             updatedImages.push({ url: res.url, caption: 'After' });
          }
        }

        maintenanceData.images = updatedImages;

      } catch (uploadError) {
        console.error('File upload failed:', uploadError);
        setErrors({ general: 'File upload failed, please try again.' });
        setLoading(false);
        return;
      }

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
          <label htmlFor="propertyId">{t('Property')} *</label>
          <select
            id="propertyId"
            name="propertyId"
            value={formData.propertyId}
            onChange={handleInputChange}
            className={errors.propertyId ? 'error' : ''}
          >
            <option value="">{t('Select Property')}</option>
            {properties.map(prop => (
              <option key={prop._id} value={prop._id}>{prop.name}</option>
            ))}
          </select>
          {errors.propertyId && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem' }}>{errors.propertyId}</span>}
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
            step={0.01}
          />
        </div>

        <div className="form-group">
          <label htmlFor="receipt">{t('Receipt (Image/PDF)')}</label>
          {currentReceipt && (
            <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Current: <a href={api.getImageUrl ? api.getImageUrl(currentReceipt.url) : currentReceipt.url} target="_blank" rel="noopener noreferrer">{currentReceipt.name || 'View Receipt'}</a>
            </div>
          )}
          <input
            type="file"
            id="receipt"
            name="receipt"
            accept="image/*,.pdf"
            onChange={(e) => setReceiptFile(e.target.files[0])}
          />
        </div>

        <div className="form-group">
          <label htmlFor="beforeImage">{t('Before Image')}</label>
          {currentImages.some(img => img.caption === 'Before') && (
            <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
              Checked: Current "Before" image exists. Uploading new one will replace it.
            </div>
          )}
          <input
            type="file"
            id="beforeImage"
            name="beforeImage"
            accept="image/*"
            onChange={(e) => setBeforeImageFile(e.target.files[0])}
          />
        </div>

        <div className="form-group">
          <label htmlFor="afterImage">{t('After Image')}</label>
          {currentImages.some(img => img.caption === 'After') && (
             <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
               Checked: Current "After" image exists. Uploading new one will replace it.
             </div>
          )}
          <input
            type="file"
            id="afterImage"
            name="afterImage"
            accept="image/*"
            onChange={(e) => setAfterImageFile(e.target.files[0])}
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
