import React, { useState, useMemo } from 'react';
import '../../styles/pages/Properties.css';

const Properties = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Mock data - in a real app, this would come from an API
  const properties = [
    {
      id: 1,
      name: 'Sunset Apartments',
      address: '123 Main St, Addis Ababa',
      image: null, // No image for demo
      units: 10,
      rent: 5000,
      taxType: 'property-only'
    },
    {
      id: 2,
      name: 'Green Valley Villas',
      address: '456 Oak Ave, Addis Ababa',
      image: null,
      units: 5,
      rent: 8000,
      taxType: 'withholding-annual'
    },
    // Add more mock data as needed
  ];

  const filteredProperties = useMemo(() => {
    return properties.filter(prop =>
      prop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prop.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, properties]);

  const handleAddProperty = () => {
    // Placeholder: Open modal to add property
    console.log('Add property');
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
        <button id="add-property-btn" className="btn-primary" onClick={handleAddProperty}>
          <i className="fa-solid fa-plus"></i>
          <span>Add Property</span>
        </button>
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

      <div id="property-modal"></div>
    </div>
  );
};

export default Properties;
