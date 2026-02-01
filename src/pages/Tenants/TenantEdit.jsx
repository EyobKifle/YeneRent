import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../../utils/api';
import Button from '../../components/ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import './TenantEdit.css';

export default function TenantEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    unitId: '',
    moveInDate: '',
    moveOutDate: '',
    tinNumber: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    status: 'active',
    notes: '',
    idPhotos: []
  });
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [unitsData, tenantData] = await Promise.all([
          api.get('units'),
          api.get(`/tenants/${id}`)
        ]);
        setUnits(unitsData || []);
        
        // Helper function to convert ISO date to YYYY-MM-DD format
        const formatDateForInput = (dateString) => {
          if (!dateString) return '';
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        };
        
        setFormData({
          name: tenantData.name || '',
          email: tenantData.email || '',
          phone: tenantData.phone || '',
          unitId: tenantData.unitId || '',
          moveInDate: formatDateForInput(tenantData.moveInDate),
          moveOutDate: formatDateForInput(tenantData.moveOutDate),
          tinNumber: tenantData.tinNumber || '',
          emergencyContact: tenantData.emergencyContact || {
            name: '',
            phone: '',
            relationship: ''
          },
          status: tenantData.status || 'active',
          notes: tenantData.notes || '',
          idPhotos: tenantData.idPhotos || []
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
    const { name, value, type, files } = e.target;
    if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value
        }
      }));
    } else if (type === 'file') {
      if (name === 'idPhotos') {
        const newFiles = Array.from(files);
        setFormData(prev => ({
          ...prev,
          idPhotos: [...prev.idPhotos, ...newFiles]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: files[0] || null
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const removeIdPhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      idPhotos: prev.idPhotos.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      let idPhotoUrls = [];

      if (formData.idPhotos.length > 0) {
        for (const photo of formData.idPhotos) {
          if (photo.url) {
            // Already uploaded
            idPhotoUrls.push(photo);
          } else {
            const formDataUpload = new FormData();
            formDataUpload.append('file', photo);

            const uploadResponse = await api.post('uploads/document', formDataUpload);

            idPhotoUrls.push({
              url: uploadResponse.url,
              name: photo.name
            });
          }
        }
      }

      const tenantData = {
        ...formData,
        unitId: formData.unitId || null,
        moveInDate: formData.moveInDate || null,
        moveOutDate: formData.moveOutDate || null,
        tinNumber: formData.tinNumber || undefined,
        emergencyContact: formData.emergencyContact.name || formData.emergencyContact.phone || formData.emergencyContact.relationship
          ? formData.emergencyContact
          : undefined,
        notes: formData.notes || undefined,
        idPhotos: idPhotoUrls.length > 0 ? idPhotoUrls : undefined
      };

      await api.put(`tenants/${id}`, tenantData);
      navigate(`/tenants/${id}`);
    } catch (error) {
      console.error('Error updating tenant:', error);
      if (error.errors) {
        setErrors(error.errors.reduce((acc, err) => ({ ...acc, [err.path]: err.msg }), {}));
      } else if (error.error) {
        setErrors({ general: error.error });
      } else {
        setErrors({ general: 'Failed to update tenant' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/tenants/${id}`);
  };

  if (fetchLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="tenant-edit-page">
      <div className="page-header">
        <div>
          <Button variant="secondary" onClick={handleBack}>
            <i className="fa-solid fa-arrow-left"></i> Back to Details
          </Button>
          <h1>Edit Tenant</h1>
          <p>Update tenant information.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="edit-form">
        {errors.general && (
          <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
            {errors.general}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="name">{t('Name')} *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem' }}>{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">{t('Email')} *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={errors.email ? 'error' : ''}
          />
          {errors.email && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem' }}>{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="phone">{t('Phone')} *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className={errors.phone ? 'error' : ''}
          />
          {errors.phone && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem' }}>{errors.phone}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="unitId">{t('Unit')}</label>
          <select
            id="unitId"
            name="unitId"
            value={formData.unitId}
            onChange={handleInputChange}
          >
            <option value="">{t('Select Unit (Optional)')}</option>
            {units.map(unit => (
              <option key={unit._id || unit.id} value={unit._id || unit.id}>
                {t('Unit')} {unit.unitNumber} - {unit.propertyId?.name || t('Unknown Property')}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="moveInDate">{t('Move-in Date')}</label>
          <input
            type="date"
            id="moveInDate"
            name="moveInDate"
            value={formData.moveInDate}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="moveOutDate">{t('Move-out Date')}</label>
          <input
            type="date"
            id="moveOutDate"
            name="moveOutDate"
            value={formData.moveOutDate}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="tinNumber">{t('TIN Number')}</label>
          <input
            type="text"
            id="tinNumber"
            name="tinNumber"
            value={formData.tinNumber}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="emergencyContact.name">{t('Emergency Contact Name')}</label>
          <input
            type="text"
            id="emergencyContact.name"
            name="emergencyContact.name"
            value={formData.emergencyContact.name}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="emergencyContact.phone">{t('Emergency Contact Phone')}</label>
          <input
            type="tel"
            id="emergencyContact.phone"
            name="emergencyContact.phone"
            value={formData.emergencyContact.phone}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="emergencyContact.relationship">{t('Emergency Contact Relationship')}</label>
          <input
            type="text"
            id="emergencyContact.relationship"
            name="emergencyContact.relationship"
            value={formData.emergencyContact.relationship}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="status">{t('Status')}</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
          >
            <option value="active">{t('Active')}</option>
            <option value="inactive">{t('Inactive')}</option>
            <option value="former">{t('Former')}</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="notes">{t('Notes')}</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows="3"
          />
        </div>

        <div className="form-group">
          <label htmlFor="idPhotos">{t('ID Photos')}</label>
          <input
            type="file"
            id="idPhotos"
            name="idPhotos"
            accept="image/*,.pdf"
            multiple
            onChange={handleInputChange}
          />
          {formData.idPhotos?.length > 0 && (
            <div style={{ marginTop: '0.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                {t('Selected photos')} ({formData.idPhotos.length}):
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {formData.idPhotos.map((photo, index) => {
                  // Check if photo is a File object (new upload) or an already-uploaded photo object
                  const isFileObject = photo instanceof File;
                  const imageUrl = isFileObject 
                    ? URL.createObjectURL(photo) 
                    : getImageUrl(photo.url);
                  
                  const isPdf = isFileObject 
                    ? photo.type === 'application/pdf'
                    : (photo.url?.toLowerCase().endsWith('.pdf') || photo.type === 'application/pdf');
                  
                  return (
                    <div key={index} style={{ position: 'relative', display: 'inline-block' }}>
                      {isPdf ? (
                        <div style={{ width: '80px', height: '60px', borderRadius: '4px', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                          <i className="fa-solid fa-file-pdf fa-2x" style={{ color: '#ff4444' }}></i>
                        </div>
                      ) : (
                        <img
                          src={imageUrl}
                          alt={`ID Photo ${index + 1}`}
                          style={{
                            width: '80px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            border: '1px solid #ddd'
                          }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeIdPhoto(index)}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: '#ff4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={handleBack}>
            {t('Cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? t('Updating...') : t('Update Tenant')}
          </Button>
        </div>
      </form>
    </div>
  );
}
