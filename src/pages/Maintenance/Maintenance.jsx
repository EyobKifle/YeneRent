import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import DetailsModal from '../../components/ui/DetailsModal';
import NumberInput from '../../components/ui/NumberInput';
import api from '../../utils/api';
import '../../styles/pages/Maintenance.css';

const Maintenance = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [openActionId, setOpenActionId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    propertyId: '',
    category: 'Other',
    priority: 'Medium',
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

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [maintenanceData, propertiesData] = await Promise.all([
          api.get('maintenance'),
          api.get('properties')
        ]);
        setMaintenanceRequests(maintenanceData || []);
        setProperties(propertiesData.properties || []);
      } catch (error) {
        console.error('Failed to fetch maintenance data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  const handleViewDetails = (request) => {
    navigate(`/maintenance/${request.id}`);
  };

  const handleEditRequest = (request) => {
    navigate(`/maintenance/${request.id}/edit`);
  };

  const handleDeleteRequest = async (request) => {
    if (window.confirm('Are you sure you want to delete this maintenance request?')) {
      try {
        await api.delete(`maintenance/${request.id}`);
        setMaintenanceRequests(prev => prev.filter(r => r.id !== request.id));
        alert('Maintenance request deleted successfully');
      } catch (error) {
        console.error('Failed to delete maintenance request:', error);
        alert('Failed to delete maintenance request');
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const maintenanceData = {
        title: formData.title,
        propertyId: formData.propertyId,
        category: formData.category,
        priority: formData.priority,
        status: formData.status,
        reportedDate: formData.reportedDate,
        cost: parseFloat(formData.cost) || 0
      };

      if (selectedMaintenance) {
        // Update existing request
        await api.put(`maintenance/${selectedMaintenance.id}`, maintenanceData);
        setMaintenanceRequests(prev => prev.map(r => r.id === selectedMaintenance.id ? { ...r, ...maintenanceData } : r));
        alert('Maintenance request updated successfully');
      } else {
        // Create new request
        const newRequest = await api.post('maintenance', maintenanceData);
        setMaintenanceRequests(prev => [newRequest, ...prev]);
        alert('Maintenance request added successfully');
      }

      // Reset form and close modal
      setFormData({
        title: '',
        propertyId: '',
        category: 'Other',
        priority: 'Medium',
        status: 'pending',
        reportedDate: '',
        cost: ''
      });
      setSelectedMaintenance(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to save maintenance request:', error);
      alert('Failed to save maintenance request');
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
        {loading ? (
          <div className="loading-indicator">
            <i className="fa-solid fa-spinner fa-spin"></i>
            <p>Loading maintenance requests...</p>
          </div>
        ) : (
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
                {filteredRequests.map(request => {
                  const requestId = request._id || request.id;
                  return (
                  <tr key={requestId}>
                    <td>{request.title}</td>
                    <td>{request.property}</td>
                    <td>
                      <span className={getStatusBadgeClass(request.status)}>
                        {formatStatus(request.status)}
                      </span>
                    </td>
                    <td>{request.reportedDate}</td>
                    <td>${request.cost ? request.cost.toFixed(2) : '0.00'}</td>
                    <td>
                      <div className="action-dropdown">
                        <button
                          className="action-dropdown-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionId(openActionId === requestId ? null : requestId);
                          }}
                        >
                          <i className="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                        {openActionId === requestId && (
                        <div className="dropdown-menu align-right show">
                          <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleViewDetails(request); }}>
                            <i className="fa-solid fa-eye"></i>View Details
                          </a>
                          <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleEditRequest(request); }}>
                            <i className="fa-solid fa-pencil"></i>Edit
                          </a>
                          <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleDeleteRequest(request); }}>
                            <i className="fa-solid fa-trash-can"></i>Delete
                          </a>
                        </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
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
              id="propertyId"
              name="propertyId"
              value={formData.propertyId}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Property</option>
              {properties.map(prop => (
                <option key={prop._id} value={prop._id}>{prop.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
            >
              <option value="Other">Other</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Electrical">Electrical</option>
              <option value="HVAC">HVAC</option>
              <option value="Structural">Structural</option>
              <option value="Appliance">Appliance</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Security">Security</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
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
            <NumberInput
              value={formData.cost}
              onChange={(value) => setFormData(prev => ({ ...prev, cost: value }))}
              placeholder="0.00"
              min={0}
              step={0.01}
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

    </div>
  );
};

export default Maintenance;
