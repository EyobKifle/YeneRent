import { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import api from '../../utils/api';

const UploadDocumentModal = ({ isOpen, onClose, onDocumentUploaded }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    propertyId: '',
    tenantId: '',
    file: null
  });
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [propertiesData, tenantsData] = await Promise.all([
        api.get('properties'),
        api.get('tenants')
      ]);
      setProperties(propertiesData || []);
      setTenants(tenantsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0] || null
      }));
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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Document name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.file) newErrors.file = 'File is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Upload file first
      const formDataUpload = new FormData();
      formDataUpload.append('file', formData.file);

      const uploadResponse = await api.post('uploads/document', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Create document record
      const documentData = {
        name: formData.name,
        category: formData.category,
        propertyId: formData.propertyId || undefined,
        tenantId: formData.tenantId || undefined,
        url: uploadResponse.url,
        size: formData.file.size,
        type: formData.file.type
      };

      const newDocument = await api.post('documents', documentData);
      onDocumentUploaded(newDocument);
      handleClose();
    } catch (error) {
      console.error('Error uploading document:', error);
      if (error.errors) {
        setErrors(error.errors.reduce((acc, err) => ({ ...acc, [err.path]: err.msg }), {}));
      } else if (error.error) {
        setErrors({ general: error.error });
      } else {
        setErrors({ general: 'Failed to upload document' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      category: '',
      propertyId: '',
      tenantId: '',
      file: null
    });
    setErrors({});
    onClose();
  };

  const categories = [
    'Lease Agreement',
    'Payment Receipt',
    'Tax Document',
    'Insurance Document',
    'Maintenance Record',
    'Other'
  ];

  return (
    <Modal title="Upload Document" isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="modal-form">
        {errors.general && (
          <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
            {errors.general}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="name">Document Name *</label>
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
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className={errors.category ? 'error' : ''}
          >
            <option value="">Select Category</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem' }}>{errors.category}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="propertyId">Link to Property (Optional)</label>
          <select
            id="propertyId"
            name="propertyId"
            value={formData.propertyId}
            onChange={handleInputChange}
          >
            <option value="">Select Property</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="tenantId">Link to Tenant (Optional)</label>
          <select
            id="tenantId"
            name="tenantId"
            value={formData.tenantId}
            onChange={handleInputChange}
          >
            <option value="">Select Tenant</option>
            {tenants.map(tenant => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="file">File *</label>
          <input
            type="file"
            id="file"
            name="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
            onChange={handleInputChange}
            className={errors.file ? 'error' : ''}
          />
          {errors.file && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem' }}>{errors.file}</span>}
          {formData.file && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
              Selected: {formData.file.name} ({(formData.file.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UploadDocumentModal;
