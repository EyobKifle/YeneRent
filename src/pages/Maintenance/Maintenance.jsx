import React, { useState, useMemo, useEffect } from 'react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import '../../styles/pages/Maintenance.css';

const Maintenance = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openActionId, setOpenActionId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    property: '',
    status: 'pending',
    reportedDate: '',
    cost: ''
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
  const maintenanceRequests = [
    {
      id: 1,
      title: 'Leaky Faucet',
      property: 'Sunset Apartments',
      status: 'pending',
      reportedDate: '2023-10-15',
      cost: 150.00
    },
    {
      id: 2,
      title: 'Broken Light Fixture',
      property: 'Green Valley Villas',
      status: 'in-progress',
      reportedDate: '2023-10-20',
      cost: 75.50
    },
    {
      id: 3,
      title: 'Clogged Drain',
      property: 'Sunset Apartments',
      status: 'completed',
      reportedDate: '2023-10-10',
      cost: 200.00
    },
    // Add more mock data as needed
  ];

  const filteredRequests = useMemo(() => {
    return maintenanceRequests.filter(request =>
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, maintenanceRequests]);

  const handleAddRequest = () => {
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would make an API call
    console.log('Adding maintenance request:', formData);
    // Reset form and close modal
    setFormData({
      title: '',
      property: '',
      status: 'pending',
      reportedDate: '',
      cost: ''
    });
    setIsModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-badge status-pending';
      case 'in-progress':
        return 'status-badge status-in-progress';
      case 'completed':
        return 'status-badge status-completed';
      default:
        return 'status-badge';
    }
  };

  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  };

  return (
    <div id="maintenance-view">
      <div className="page-header">
        <div>
          <h1>Maintenance Requests</h1>
          <p>Track and manage all maintenance tasks.</p>
        </div>
        <Button variant="secondary" onClick={handleAddRequest}>
          <i className="fa-solid fa-plus"></i>
          <span>Add Request</span>
        </Button>
      </div>

      <div className="data-card">
        <div className="table-header">
          <input
            type="text"
            id="search-input"
            className="form-input"
            placeholder="Search by title, property, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Property</th>
              <th>Status</th>
              <th>Reported Date</th>
              <th>Cost</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="maintenance-list">
            {filteredRequests.map(request => (
              <tr key={request.id}>
                <td>{request.title}</td>
                <td>{request.property}</td>
                <td>
                  <span className={getStatusBadgeClass(request.status)}>
                    {formatStatus(request.status)}
                  </span>
                </td>
                <td>{request.reportedDate}</td>
                <td>${request.cost.toFixed(2)}</td>
                <td>
                  <div className="action-dropdown">
                    <button 
                      className="action-dropdown-btn" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionId(openActionId === request.id ? null : request.id);
                      }}
                    >
                      <i className="fa-solid fa-ellipsis-vertical"></i>
                    </button>
                    {openActionId === request.id && (
                    <div className="dropdown-menu align-right show">
                      <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); alert('View maintenance request'); }}>
                        <i className="fa-solid fa-eye"></i>View Details
                      </a>
                      <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); alert('Edit maintenance request'); }}>
                        <i className="fa-solid fa-pencil"></i>Edit
                      </a>
                      <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); alert('Delete maintenance request'); }}>
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

      {filteredRequests.length === 0 && (
        <div id="empty-state" className="empty-state">
          <i className="fa-solid fa-screwdriver-wrench"></i>
          <h3>No Maintenance Requests</h3>
          <p>Get started by adding a new maintenance request.</p>
        </div>
      )}

      <Modal
        title="Add Maintenance Request"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <form onSubmit={handleFormSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="title">Request Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Leaky Faucet, Broken Light Fixture"
              required
            />
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
              <option value="Sunset Apartments">Sunset Apartments</option>
              <option value="Green Valley Villas">Green Valley Villas</option>
              <option value="123 Main St">123 Main St</option>
              <option value="456 Elm St">456 Elm St</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="reportedDate">Reported Date</label>
            <input
              type="date"
              id="reportedDate"
              name="reportedDate"
              value={formData.reportedDate}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="cost">Estimated Cost ($)</label>
            <input
              type="number"
              id="cost"
              name="cost"
              value={formData.cost}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              placeholder="0.00"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Maintenance Request
            </button>
          </div>
        </form>
      </Modal>
      <div id="maintenance-details-modal"></div>
    </div>
  );
};

export default Maintenance;
