import { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import api, { getImageUrl } from '../../utils/api';
import { useNotification } from '../../contexts/NotificationContext';

const AddTenantModal = ({ isOpen, onClose, onTenantAdded, tenant }) => {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    unitId: '',
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
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchUnits();
      if (tenant) {
        // Populate form for editing
        setFormData({
          name: tenant.name || '',
          email: tenant.email || '',
          phone: tenant.phone || '',
          unitId: tenant.unitId || '',
          tinNumber: tenant.tinNumber || '',
          emergencyContact: tenant.emergencyContact || {
            name: '',
            phone: '',
            relationship: ''
          },
          status: tenant.status || 'active',
          notes: tenant.notes || '',
          idPhotos: tenant.idPhotos || []
        });
      } else {
        // Reset form for adding
        setFormData({
          name: '',
          email: '',
          phone: '',
          unitId: '',
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
      }
    }
  }, [isOpen, tenant]);

  const fetchUnits = async () => {
    try {
      const unitsData = await api.get('units');
      setUnits(unitsData || []);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

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
        // Handle multiple ID photo files
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
    // Clear error for this field
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

      // Upload ID photos if present
      if (formData.idPhotos.length > 0) {
        for (const photo of formData.idPhotos) {
          // Check if photo is already uploaded (has url property) or is a new File
          if (photo.url) {
            // Already uploaded, just keep the existing data
            idPhotoUrls.push({
              url: photo.url,
              name: photo.name
            });
          } else {
            // New file, upload it
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
        tinNumber: formData.tinNumber || undefined,
        emergencyContact: formData.emergencyContact.name || formData.emergencyContact.phone || formData.emergencyContact.relationship
          ? formData.emergencyContact
          : undefined,
        notes: formData.notes || undefined,
        idPhotos: idPhotoUrls.length > 0 ? idPhotoUrls : undefined
      };

      let result;
      if (tenant) {
        // Update existing tenant
        result = await api.put(`tenants/${tenant.id}`, tenantData);
      } else {
        // Create new tenant
        result = await api.post('tenants', tenantData);
      }
      onTenantAdded(result);
      showNotification(tenant ? 'Tenant updated successfully!' : 'Tenant added successfully!', 'success');
      handleClose();
    } catch (error) {
      console.error('Error creating tenant:', error);
      if (error.errors) {
        setErrors(error.errors.reduce((acc, err) => ({ ...acc, [err.path]: err.msg }), {}));
      } else if (error.error) {
        setErrors({ general: error.error });
      } else {
        setErrors({ general: 'Failed to create tenant' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      unitId: '',
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
    setErrors({});
    onClose();
  };

  return (
    <Modal title={tenant ? "Edit Tenant" : "Add New Tenant"} isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="modal-form">
        {errors.general && (
          <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
            {errors.general}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="name">Name *</label>
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
          <label htmlFor="email">Email *</label>
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
          <label htmlFor="phone">Phone *</label>
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
          <label htmlFor="unitId">Unit</label>
          <select
            id="unitId"
            name="unitId"
            value={formData.unitId}
            onChange={handleInputChange}
          >
            <option value="">Select Unit (Optional)</option>
            {units.map(unit => (
              <option key={unit._id} value={unit._id}>
                Unit {unit.unitNumber} - {unit.propertyId?.name || 'Unknown Property'}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="tinNumber">TIN Number</label>
          <input
            type="text"
            id="tinNumber"
            name="tinNumber"
            value={formData.tinNumber}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="emergencyContact.name">Emergency Contact Name</label>
          <input
            type="text"
            id="emergencyContact.name"
            name="emergencyContact.name"
            value={formData.emergencyContact.name}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="emergencyContact.phone">Emergency Contact Phone</label>
          <input
            type="tel"
            id="emergencyContact.phone"
            name="emergencyContact.phone"
            value={formData.emergencyContact.phone}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="emergencyContact.relationship">Emergency Contact Relationship</label>
          <input
            type="text"
            id="emergencyContact.relationship"
            name="emergencyContact.relationship"
            value={formData.emergencyContact.relationship}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="former">Former</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows="3"
          />
        </div>

        <div className="form-group">
          <label htmlFor="idPhotos">ID Photos / Documents</label>
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
                Selected attachments ({formData.idPhotos.length}):
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {formData.idPhotos.map((photo, index) => {
                  const isFileObject = photo instanceof File;
                  const imageUrl = isFileObject 
                    ? URL.createObjectURL(photo) 
                    : getImageUrl(photo.url);
                  
                  const isPdf = isFileObject 
                    ? photo.type === 'application/pdf'
                    : (photo.url?.toLowerCase().endsWith('.pdf') || photo.type === 'application/pdf');
                  
                  const isWord = isFileObject
                    ? photo.name.match(/\.docx?$/i)
                    : photo.url?.toLowerCase().match(/\.docx?$/i);
                  
                  const isExcel = isFileObject
                    ? photo.name.match(/\.xlsx?$/i)
                    : photo.url?.toLowerCase().match(/\.xlsx?$/i);

                  return (
                    <div key={index} style={{ position: 'relative', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                      {isPdf ? (
                        <div style={{ width: '100px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                          <i className="fa-solid fa-file-pdf fa-2x" style={{ color: '#ff4444' }}></i>
                        </div>
                      ) : isWord ? (
                        <div style={{ width: '100px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                          <i className="fa-solid fa-file-word fa-2x" style={{ color: '#2b579a' }}></i>
                        </div>
                      ) : isExcel ? (
                        <div style={{ width: '100px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                          <i className="fa-solid fa-file-excel fa-2x" style={{ color: '#1d6f42' }}></i>
                        </div>
                      ) : (
                        <img
                          src={imageUrl}
                          alt={`ID Photo ${index + 1}`}
                          style={{
                            width: '100px',
                            height: '80px',
                            objectFit: 'cover'
                          }}
                        />
                      )}
                      {isFileObject && (
                        <div style={{ fontSize: '10px', padding: '2px', background: 'rgba(255,255,255,0.8)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>
                          {photo.name}
                          {(isWord || isExcel) && <div style={{ fontSize: '8px', color: '#666' }}>(Will convert)</div>}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeIdPhoto(index)}
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          background: 'rgba(255, 68, 68, 0.9)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
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
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? (tenant ? 'Updating...' : 'Adding...') : (tenant ? 'Update Tenant' : 'Add Tenant')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddTenantModal;
