import React, { useState, useMemo, useEffect } from 'react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import NumberInput from '../../components/ui/NumberInput';
import api from '../../utils/api';
import './Utilities.css';

const Utilities = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openActionId, setOpenActionId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [utilities, setUtilities] = useState([]);
  const [properties, setProperties] = useState([]);
  const [selectedUtility, setSelectedUtility] = useState(null);
  const [formData, setFormData] = useState({
    type: '',
    propertyId: '',
    amount: '',
    dueDate: '',
    status: 'Unpaid',
    billImage: null
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

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [utilitiesData, propertiesData] = await Promise.all([
          api.get('utilities'),
          api.get('properties')
        ]);
        setUtilities(utilitiesData || []);
        setProperties(propertiesData.properties || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  const filteredUtilities = useMemo(() => {
    return utilities.filter(util => {
      const property = properties.find(p => p.id === util.propertyId);
      return util.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (property?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [searchTerm, utilities, properties]);

  const handleAddUtility = () => {
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      let billUrl = null;
      let billName = null;

      // Upload image if present
      if (formData.billImage) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', formData.billImage);

        const uploadResponse = await api.post('uploads/image', formDataUpload, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        billUrl = uploadResponse.url;
        billName = formData.billImage.name;
      }

      const utilityData = {
        type: formData.type,
        propertyId: formData.propertyId,
        amount: parseFloat(formData.amount),
        dueDate: formData.dueDate,
        status: formData.status,
        billUrl,
        billName
      };

      if (selectedUtility) {
        // Update existing utility
        await api.put(`utilities/${selectedUtility.id}`, utilityData);
        setUtilities(prev => prev.map(u => u.id === selectedUtility.id ? { ...u, ...utilityData } : u));
        alert('Utility bill updated successfully');
      } else {
        // Create new utility
        const newUtility = await api.post('utilities', utilityData);
        setUtilities(prev => [newUtility, ...prev]);
        alert('Utility bill added successfully');
      }

      // Reset form and close modal
      setFormData({
        type: '',
        propertyId: '',
        amount: '',
        dueDate: '',
        status: 'Unpaid',
        billImage: null
      });
      setSelectedUtility(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving utility bill:', error);
      alert('Failed to save utility bill');
    }
  };

  const handleEditUtility = (utility) => {
    setFormData({
      type: utility.type || '',
      propertyId: utility.propertyId || '',
      amount: utility.amount || '',
      dueDate: utility.dueDate || '',
      status: utility.status || 'Unpaid',
      billImage: null
    });
    setSelectedUtility(utility);
    setIsModalOpen(true);
  };

  const handleDeleteUtility = async (utility) => {
    if (window.confirm('Are you sure you want to delete this utility bill?')) {
      try {
        await api.delete(`utilities/${utility.id}`);
        setUtilities(prev => prev.filter(u => u.id !== utility.id));
        alert('Utility bill deleted successfully');
      } catch (error) {
        console.error('Failed to delete utility bill:', error);
        alert('Failed to delete utility bill');
      }
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
  };

  const getStatusBadgeClass = (status) => {
    return status === 'Paid' ? 'status-badge status-paid' : 'status-badge status-unpaid';
  };

  return (
    <div id="utilities-view">
      <div className="page-header">
        <div>
          <h1>Utilities</h1>
          <p>Track and manage utility bills for all your properties.</p>
        </div>
        <Button className="btn" variant="secondary" onClick={handleAddUtility}>
          <i className="fa-solid fa-plus"></i>
          <span>Add Utility Bill</span>
        </Button>
      </div>

      <div className="data-card">
        <div className="table-header">
          <input
            type="text"
            id="search-input"
            className="form-input"
            placeholder="Search by type or property..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Property</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="utilities-table-body">
            {filteredUtilities.map(util => {
              const property = properties.find(p => p.id === util.propertyId);
              return (
                <tr key={util.id}>
                  <td>{util.type}</td>
                  <td>{property?.name || 'N/A'}</td>
                  <td>${util.amount ? util.amount.toFixed(2) : '0.00'}</td>
                  <td>{util.dueDate ? new Date(util.dueDate).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <span className={getStatusBadgeClass(util.status)}>
                      {util.status.charAt(0).toUpperCase() + util.status.slice(1)}
                    </span>
                  </td>
                  <td>
                  <div className="action-dropdown">
                    <button 
                      className="action-dropdown-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionId(openActionId === util.id ? null : util.id);
                      }}
                    >
                      <i className="fa-solid fa-ellipsis-vertical"></i>
                    </button>
                    {openActionId === util.id && (
                    <div className="dropdown-menu align-right show">
                      <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleEditUtility(util); }}>
                        <i className="fa-solid fa-pencil"></i>Edit
                      </a>
                      <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleDeleteUtility(util); }}>
                        <i className="fa-solid fa-trash-can"></i>Delete
                      </a>
                    </div>
                    )}
                  </div>
                </td>
              </tr>
            );})}
          </tbody>
        </table>
        </div>
      </div>

      {filteredUtilities.length === 0 && (
        <div id="empty-state" className="empty-state">
          <i className="fa-solid fa-lightbulb"></i>
          <h3>No Utility Bills Found</h3>
          <p>Get started by adding a new utility bill.</p>
        </div>
      )}

      <Modal
        title="Add Utility Bill"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <form onSubmit={handleFormSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="type">Utility Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Type</option>
              <option value="Electricity">Electricity</option>
              <option value="Water">Water</option>
              <option value="Gas">Gas</option>
              <option value="Internet">Internet</option>
              <option value="Trash">Trash</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="propertyId">Property</label>
            <select
              id="propertyId"
              name="propertyId"
              value={formData.propertyId}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Property</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>{property.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount ($)</label>
            <NumberInput
              value={formData.amount}
              onChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
              placeholder="Enter amount"
              className="form-input"
              min={0}
              step={0.01}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="dueDate">Due Date</label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange}
              required
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
              <option value="Unpaid">Unpaid</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Pending">Pending</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="billImage">Bill Image</label>
            <input
              type="file"
              id="billImage"
              name="billImage"
              accept="image/*"
              onChange={handleInputChange}
            />
            {formData.billImage && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                Selected: {formData.billImage.name}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Utility Bill
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Utilities;
