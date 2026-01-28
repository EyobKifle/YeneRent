import React, { useState, useMemo, useEffect } from 'react';
import '../../styles/pages/Properties.css';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import api from '../../utils/api';

const Properties = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
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

        const uploadResponse = await api.post('uploads/image', formDataUpload, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        imageUrl = uploadResponse.url;
      }

      // Upload unit images and prepare units data
      const processedUnits = [];
      for (const unit of formData.units) {
        let unitImageUrl = null;
        if (unit.image) {
          const formDataUpload = new FormData();
          formDataUpload.append('file', unit.image);

          const uploadResponse = await api.post('uploads/image', formDataUpload, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
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
        units: processedUnits
      };

      // Create property
      const newProperty = await api.post('properties', propertyData);

      // Update local state
      setProperties(prev => [newProperty, ...prev]);

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
    } catch (error) {
      console.error('Error creating property:', error);
      // Handle error (could show error message to user)
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
          <h1>Properties</h1>
          <p>View and manage all your properties</p>
        </div>
        <Button variant="secondary" onClick={handleAddProperty}>
          <i className="fa-solid fa-plus"></i>
          <span>Add Property</span>
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
          <div key={prop.id} className="property-card">
            <div className="property-image-container">
              {prop.image ? (
                <img src={prop.image} alt={prop.name} className="property-image" />
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

      <Modal title="Add New Property" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
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
            <input
              type="number"
              id="rent"
              name="rent"
              value={formData.rent}
              onChange={handleInputChange}
              required
              min="0"
              className="form-input"
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
            {!formData.image && (
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
                      <input
                        type="number"
                        value={unit.bedrooms}
                        onChange={(e) => handleUnitChange(index, 'bedrooms', parseInt(e.target.value) || 0)}
                        className="form-input"
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Bathrooms</label>
                      <input
                        type="number"
                        value={unit.bathrooms}
                        onChange={(e) => handleUnitChange(index, 'bathrooms', parseInt(e.target.value) || 0)}
                        className="form-input"
                        min="0"
                      />
                    </div>
                    <div className="form-group">
                      <label>Size (sq ft)</label>
                      <input
                        type="number"
                        value={unit.size}
                        onChange={(e) => handleUnitChange(index, 'size', parseInt(e.target.value) || 0)}
                        className="form-input"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Rent (ETB)</label>
                    <input
                      type="number"
                      value={unit.rent}
                      onChange={(e) => handleUnitChange(index, 'rent', parseInt(e.target.value) || 0)}
                      className="form-input"
                      min="0"
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
                    {!unit.image && (
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
              Add Property
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Properties;
