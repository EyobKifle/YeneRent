import React, { useState, useMemo, useEffect } from 'react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import api from '../../utils/api';
import { useLanguage } from '../../contexts/LanguageContext';
import '/src/pages/Utilities/Utilities.css';

const Utilities = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [openActionId, setOpenActionId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    property: '',
    amount: '',
    dueDate: '',
    status: 'unpaid',
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

  // Mock data - in a real app, this would come from an API
  const utilities = [
    { id: 1, type: 'Electricity', property: '123 Main St', amount: 150.00, dueDate: '2023-10-15', status: 'unpaid' },
    { id: 2, type: 'Water', property: '456 Elm St', amount: 75.50, dueDate: '2023-10-20', status: 'paid' },
    // Add more mock data as needed
  ];

  const filteredUtilities = useMemo(() => {
    return utilities.filter(util =>
      util.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      util.property.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, utilities]);

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
        property: formData.property,
        amount: parseFloat(formData.amount),
        dueDate: formData.dueDate,
        status: formData.status,
        billUrl,
        billName
      };

      // In a real app, this would make an API call to save the utility bill
      console.log('Adding utility bill:', utilityData);

      // Reset form and close modal
      setFormData({
        type: '',
        property: '',
        amount: '',
        dueDate: '',
        status: 'unpaid',
        billImage: null
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding utility bill:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStatusBadgeClass = (status) => {
    return status === 'paid' ? 'status-badge status-paid' : 'status-badge status-unpaid';
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
            {filteredUtilities.map(util => (
              <tr key={util.id}>
                <td>{util.type}</td>
                <td>{util.property}</td>
                <td>${util.amount.toFixed(2)}</td>
                <td>{util.dueDate}</td>
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
                      <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); alert('Edit utility bill'); }}>
                        <i className="fa-solid fa-pencil"></i>Edit
                      </a>
                      <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); alert('Delete utility bill'); }}>
                        <i className="fa-solid fa-trash-can"></i>Delete
                      </a>
                    </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
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
            <label htmlFor="property">Property</label>
            <select
              id="property"
              name="property"
              value={formData.property}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Property</option>
              <option value="123 Main St">123 Main St</option>
              <option value="456 Elm St">456 Elm St</option>
              <option value="789 Oak Ave">789 Oak Ave</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount ($)</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              step="0.01"
              min="0"
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
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
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
