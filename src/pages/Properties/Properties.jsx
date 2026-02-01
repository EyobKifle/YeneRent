/* eslint-disable no-unused-vars */
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/pages/Properties.css';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import NumberInput from '../../components/ui/NumberInput';
import api, { getImageUrl } from '../../utils/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const Properties = () => {
  console.log('Properties component rendered');
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const { showNotification } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openActionId, setOpenActionId] = useState(null);
  const [properties, setProperties] = useState([]);
  const [editingProperty, setEditingProperty] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    type: 'Apartment',
    rent: '',
    taxType: 'property-only',
    description: '',
    amenities: [],
    image: null,
    units: []
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openActionId && !event.target.closest('.action-dropdown')) {
        setOpenActionId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openActionId]);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        console.log('Fetching properties...');
        const response = await api.getProperties();
        console.log('Properties response:', response);
        setProperties(response.properties || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
        console.error('Error details:', error.message);
      }
    };

    fetchProperties();
  }, []);

  const filteredProperties = useMemo(() => {
    return properties.filter(prop =>
      prop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, properties]);

  const handleAddProperty = () => {
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    try {
      // Upload property image if present
      let imageUrl = null;
      if (formData.image) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', formData.image);

        const uploadResponse = await api.post('uploads/image', formDataUpload);
        imageUrl = uploadResponse.url;
      }

      // Upload unit images and prepare units data
      const processedUnits = [];
      for (const unit of formData.units) {
        let unitImageUrl = null;
        if (unit.image) {
          const formDataUpload = new FormData();
          formDataUpload.append('file', unit.image);

          const uploadResponse = await api.post('uploads/image', formDataUpload);
          unitImageUrl = uploadResponse.url;
        }

        processedUnits.push({
          unitNumber: unit.unitNumber,
          floor: unit.floor,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
          size: unit.size,
          rent: unit.rent,
          notes: unit.notes,
          imageUrl: unitImageUrl
        });
      }

      // Prepare property data
      const propertyData = {
        name: formData.name,
        address: formData.address,
        type: formData.type,
        rent: parseFloat(formData.rent),
        taxType: formData.taxType,
        description: formData.description,
        imageUrl,
        units: processedUnits // Send actual units array
      };

      // Create or Update property
      let newProperty;
      if (editingProperty) {
        newProperty = await api.put(`properties/${editingProperty._id}`, propertyData);
      } else {
        newProperty = await api.post('properties', propertyData);
      }

      // Update local state
      if (editingProperty) {
        setProperties(prev => prev.map(p => p._id === editingProperty._id ? newProperty : p));
        showNotification('Property updated successfully!', 'success');
      } else {
        setProperties(prev => [newProperty, ...prev]);
        showNotification('Property added successfully!', 'success');
      }

      // Reset form and close modal
      setFormData({
        name: '',
        address: '',
        type: 'Apartment',
        rent: '',
        taxType: 'property-only',
        description: '',
        amenities: [],
        image: null,
        units: []
      });
      setIsModalOpen(false);
      setEditingProperty(null);
      
      // Optionally re-fetch to ensure data consistency
      const response = await api.getProperties();
      setProperties(response.properties || []);
    } catch (error) {
      console.error('Error creating property:', error);
      showNotification('Failed to create property', 'error');
    }
  };

  const handleEditProperty = (prop) => {
    setEditingProperty(prop);
    setFormData({
      name: prop.name || '',
      address: prop.address || '',
      type: prop.type || 'Apartment',
      rent: prop.rent?.toString() || '',
      taxType: prop.taxType || 'property-only',
      description: prop.description || '',
      amenities: prop.amenities || [],
      image: null,
      units: [] // Units are handled separately or we can populate if needed
    });
    setIsModalOpen(true);
  };

  const handleDeleteProperty = async (prop) => {
    if (window.confirm(t('Are you sure you want to delete this property?'))) {
      try {
        await api.delete(`properties/${prop._id}`);
        setProperties(prev => prev.filter(p => p._id !== prop._id));
        showNotification('Property deleted successfully', 'success');
      } catch (error) {
        console.error('Failed to delete property:', error);
        showNotification('Failed to delete property', 'error');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      image: file
    }));
  };

  const handleAddUnit = () => {
    setFormData(prev => ({
      ...prev,
      units: [...prev.units, { unitNumber: '', floor: '', bedrooms: 0, bathrooms: 0, size: 0, rent: 0, notes: '', image: null }]
    }));
  };

  const handleRemoveUnit = (index) => {
    setFormData(prev => ({
      ...prev,
      units: prev.units.filter((_, i) => i !== index)
    }));
  };

  const handleUnitChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      units: prev.units.map((unit, i) => i === index ? { ...unit, [field]: value } : unit)
    }));
  };

  const handleUnitImageChange = (index, e) => {
    const file = e.target.files[0];
    handleUnitChange(index, 'image', file);
  };

  const taxTypeMap = {
    'property-only': 'Property Tax',
    'withholding-annual': 'Withholding + Annual',
    'withholding-property': 'Withholding + Property',
    'all-taxes': 'All Taxes',
  };

  return (
    <div id="properties-view">
      <div className="page-header">
        <div>
          <h1>{t('Properties')}</h1>
          <p>{t('View and manage all your properties')}</p>
        </div>
        <Button variant="secondary" onClick={handleAddProperty}>
          <i className="fa-solid fa-plus"></i>
          <span>{t('Add Property')}</span>
        </Button>
      </div>

      <div className="view-controls">
        <div className="search-container">
          <i className="fa-solid fa-search"></i>
          <input
            type="text"
            id="search-input"
            placeholder="Search by name or address..."
            className="form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="view-toggle">
          <button
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <i className="fa-solid fa-grid"></i>
          </button>
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <i className="fa-solid fa-list"></i>
          </button>
        </div>
      </div>

      <div id="property-list" className={viewMode}>
        {filteredProperties.map(prop => (
          <div key={prop._id} className="property-card" onClick={() => navigate(`/units?propertyId=${prop._id}`)}>
            <div className="property-image-container">
              {prop.imageUrl ? (
                <img src={getImageUrl(prop.imageUrl)} alt={prop.name} className="property-image" />
              ) : (
                <div className="property-placeholder">
                  <i className="fa-solid fa-building"></i>
                  <span>No image</span>
                </div>
              )}
            </div>
            <div className="property-content">
              <h3>{prop.name}</h3>
              <p>{prop.address}</p>
              <div className="property-details">
                Total Units: {prop.units}
              </div>
            </div>
            <div className="property-card-details">
              <div>
                <span>Default Monthly Rent</span>
                <span>ETB {prop.rent.toLocaleString()}</span>
              </div>
            </div>
            <div className="action-dropdown" style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
              <button 
                className="action-dropdown-btn" 
                style={{ background: 'rgba(255,255,255,0.8)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenActionId(openActionId === prop._id ? null : prop._id);
                }}
              >
                <i className="fa-solid fa-ellipsis-vertical"></i>
              </button>
              {openActionId === prop._id && (
              <div className="dropdown-menu show">
                <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/units?propertyId=${prop._id}`); }}>
                  <i className="fa-solid fa-eye"></i>{t('View Details')}
                </a>
                <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditProperty(prop); }}>
                  <i className="fa-solid fa-pencil"></i>{t('Edit')}
                </a>
                <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteProperty(prop); }}>
                  <i className="fa-solid fa-trash-can"></i>{t('Delete')}
                </a>
              </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <div id="empty-state" className="empty-state">
          <i className="fa-solid fa-building"></i>
          <h3>No properties found</h3>
          <p>Get started by adding a new property.</p>
        </div>
      )}

      <Modal title={editingProperty ? "Edit Property" : "Add New Property"} isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingProperty(null); }}>
        <form onSubmit={handleFormSubmit} className="property-form">
          <div className="form-group">
            <label htmlFor="name">Property Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Property Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="Apartment">Apartment</option>
              <option value="Villa">Villa</option>
              <option value="Office">Office</option>
              <option value="Commercial">Commercial</option>
              <option value="House">House</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="rent">Default Monthly Rent (ETB)</label>
            <NumberInput
              value={formData.rent}
              onChange={(value) => setFormData(prev => ({ ...prev, rent: value }))}
              placeholder="Enter rent amount"
              className="form-input"
              min={0}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="taxType">Tax Type</label>
            <select
              id="taxType"
              name="taxType"
              value={formData.taxType}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="property-only">{taxTypeMap['property-only']}</option>
              <option value="withholding-annual">{taxTypeMap['withholding-annual']}</option>
              <option value="withholding-property">{taxTypeMap['withholding-property']}</option>
              <option value="all-taxes">{taxTypeMap['all-taxes']}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-input"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">Property Image</label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
              className="form-input"
            />
            {formData.image ? (
              <div className="image-preview" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                <img 
                  src={URL.createObjectURL(formData.image)} 
                  alt="Property Preview" 
                  style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', objectFit: 'cover' }} 
                />
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>Selected: {formData.image.name}</div>
              </div>
            ) : (
              <div className="image-placeholder">
                <i className="fa-solid fa-building"></i>
                <span>No image selected</span>
              </div>
            )}
          </div>

          {(formData.type === 'Apartment' || formData.type === 'Office' || formData.type === 'Commercial') && (
            <div className="units-section">
              <h3>Units</h3>
              {formData.units.map((unit, index) => (
                <div key={index} className="unit-form">
                  <h4>Unit {index + 1}</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Unit Number</label>
                      <input
                        type="text"
                        value={unit.unitNumber}
                        onChange={(e) => handleUnitChange(index, 'unitNumber', e.target.value)}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Floor</label>
                      <input
                        type="text"
                        value={unit.floor}
                        onChange={(e) => handleUnitChange(index, 'floor', e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Bedrooms</label>
                      <NumberInput
                        value={unit.bedrooms}
                        onChange={(value) => handleUnitChange(index, 'bedrooms', value)}
                        placeholder="Enter bedrooms"
                        className="form-input"
                        min={0}
                      />
                    </div>
                    <div className="form-group">
                      <label>Bathrooms</label>
                      <NumberInput
                        value={unit.bathrooms}
                        onChange={(value) => handleUnitChange(index, 'bathrooms', value)}
                        placeholder="Enter bathrooms"
                        className="form-input"
                        min={0}
                      />
                    </div>
                    <div className="form-group">
                      <label>Size (sq ft)</label>
                      <NumberInput
                        value={unit.size}
                        onChange={(value) => handleUnitChange(index, 'size', value)}
                        placeholder="Enter size"
                        className="form-input"
                        min={0}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Rent (ETB)</label>
                    <NumberInput
                      value={unit.rent}
                      onChange={(value) => handleUnitChange(index, 'rent', value)}
                      placeholder="Enter rent"
                      className="form-input"
                      min={0}
                    />
                  </div>
                  <div className="form-group">
                    <label>Notes</label>
                    <textarea
                      value={unit.notes}
                      onChange={(e) => handleUnitChange(index, 'notes', e.target.value)}
                      className="form-input"
                      rows="2"
                    />
                  </div>
                  <div className="form-group">
                    <label>Unit Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUnitImageChange(index, e)}
                      className="form-input"
                    />
                    {unit.image ? (
                      <div className="image-preview" style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                        <img 
                          src={URL.createObjectURL(unit.image)} 
                          alt="Unit Preview" 
                          style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '4px', objectFit: 'cover' }} 
                        />
                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>Selected: {unit.image.name}</div>
                      </div>
                    ) : (
                      <div className="image-placeholder">
                        <i className="fa-solid fa-building"></i>
                        <span>No image selected</span>
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => handleRemoveUnit(index)} className="remove-unit-btn">
                    Remove Unit
                  </button>
                </div>
              ))}
              <button type="button" onClick={handleAddUnit} className="add-unit-btn">
                <i className="fa-solid fa-plus"></i> Add Unit
              </button>
            </div>
          )}

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingProperty ? "Update Property" : "Add Property"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Properties;
