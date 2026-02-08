import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import DetailsModal from '../../components/ui/DetailsModal';
import NumberInput from '../../components/ui/NumberInput';
import { formatDate } from '../../utils/utils';
import api from '../../utils/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import '../../styles/pages/Maintenance.css';

const Maintenance = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showNotification } = useNotification();
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
  const [receiptFile, setReceiptFile] = useState(null);
  const [beforeImageFile, setBeforeImageFile] = useState(null);
  const [afterImageFile, setAfterImageFile] = useState(null);

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

  const enrichedRequests = useMemo(() => {
    return maintenanceRequests.map(request => {
      const propId = request.propertyId?._id || request.propertyId;
      const property = properties.find(p => (p._id || p.id) === propId);
      return { ...request, propertyName: property?.name || request.property || 'N/A' };
    });
  }, [maintenanceRequests, properties]);

  const filteredRequests = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return enrichedRequests.filter(request =>
      (request.title || '').toLowerCase().includes(s) ||
      (request.propertyName || '').toLowerCase().includes(s) ||
      (request.status || '').toLowerCase().includes(s)
    );
  }, [searchTerm, enrichedRequests]);

  const handleAddRequest = () => {
    setIsModalOpen(true);
  };

  const handleViewDetails = (request) => {
    navigate(`/maintenance/${request._id || request.id}`);
  };

  const handleEditRequest = (request) => {
    navigate(`/maintenance/${request._id || request.id}/edit`);
  };

  const handleDeleteRequest = async (request) => {
    const requestId = request._id || request.id;
    if (window.confirm('Are you sure you want to delete this maintenance request?')) {
      try {
        await api.delete(`maintenance/${requestId}`);
        setMaintenanceRequests(prev => prev.filter(r => (r._id || r.id) !== requestId));
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
        const requestId = selectedMaintenance._id || selectedMaintenance.id;
        await api.put(`maintenance/${requestId}`, maintenanceData);
        setMaintenanceRequests(prev => prev.map(r => (r._id || r.id) === requestId ? { ...r, ...maintenanceData } : r));
        showNotification('Maintenance request updated successfully', 'success');
      } else {
        // Upload files if they exist
        let receiptUrl = null;
        let receiptName = null;
        const images = [];

        if (receiptFile) {
          const formData = new FormData();
          formData.append('file', receiptFile);
          try {
            const response = await api.post('uploads/document', formData);
            if (response && response.url) {
              receiptUrl = response.url;
              receiptName = response.originalName || receiptFile.name;
            }
          } catch (uploadError) {
            console.error('Failed to upload receipt:', uploadError);
            showNotification('Failed to upload receipt, but creating request...', 'warning');
          }
        }

        if (beforeImageFile) {
          const formData = new FormData();
          formData.append('file', beforeImageFile);
          try {
            const response = await api.post('uploads/image', formData);
            if (response && response.url) {
              images.push({ url: response.url, caption: 'Before' });
            }
          } catch (uploadError) {
            console.error('Failed to upload before image:', uploadError);
          }
        }

        if (afterImageFile) {
          const formData = new FormData();
          formData.append('file', afterImageFile);
          try {
             const response = await api.post('uploads/image', formData);
             if (response && response.url) {
               images.push({ url: response.url, caption: 'After' });
             }
          } catch (uploadError) {
            console.error('Failed to upload after image:', uploadError);
          }
        }

        const maintenanceDataPayload = {
          ...maintenanceData,
          receiptUrl,
          receiptName,
          images
        };

        if (selectedMaintenance) {
           // Edit logic would go here but this block currently doesn't handle files for edit properly as implemented in Maintenance.jsx
           // Maintenance.jsx's handleFormSubmit handles both Add and Edit (lines 119-124 vs 126-128)
           // However, for Add Request (modal), selectedMaintenance is null.
           // For Edit, it navigates to /edit page usually, but context menu has 'Edit' which sets selectedMaintenance and open modal?
           // Wait, handleEditRequest in Maintenance.jsx:88 navigates: navigate(`/maintenance/${request._id || request.id}/edit`);
           // But lines 250 in JSX calls handleEditRequest.
           // So the Modal in Maintenance.jsx is ONLY for ADDING?
           // Let's check handleAddRequest (line 80): sets modal Open.
           // handleEditRequest navigates away.
           // But handleFormSubmit has: if (selectedMaintenance) ...
           // It seems selectedMaintenance is never set in the current code flow for the Modal, because 'Edit' button navigates to a new page.
           // I will assume this Modal is primarly for ADD.
           // So I will update the 'else' block mainly, or both.
           // Since selectedMaintenance logic exists, I'll update maintenanceDataPayload to be used.
        }

        // Create new request
        const newRequest = await api.post('maintenance', maintenanceDataPayload);
        setMaintenanceRequests(prev => [newRequest, ...prev]);
        showNotification('Maintenance request added successfully', 'success');
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
      setReceiptFile(null);
      setBeforeImageFile(null);
      setAfterImageFile(null);
      setSelectedMaintenance(null);
      setIsModalOpen(false);

      // Re-fetch to ensure consistency
      const maintenanceDataFetched = await api.get('maintenance');
      setMaintenanceRequests(maintenanceDataFetched || []);
    } catch (error) {
      console.error('Failed to save maintenance request:', error);
      showNotification('Failed to save maintenance request', 'error');
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
      case 'paid':
        return 'status-badge status-completed'; // Reuse completed style or define new one
      default:
        return 'status-badge';
    }
  };

  const formatStatus = (status) => {
    return t(status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' '));
  };

  return (
    <div id="maintenance-view">
      <div className="page-header">
        <div>
          <h1>{t("Maintenance Requests")}</h1>
          <p>{t("Track and manage all maintenance tasks.")}</p>
        </div>
        <Button variant="secondary" onClick={handleAddRequest}>
          <i className="fa-solid fa-plus"></i>
          <span>{t("Add Request")}</span>
        </Button>
      </div>

      <div className="data-card">
        <div className="table-header">
          <input
            type="text"
            id="search-input"
            className="form-input"
            placeholder={t("Search by title, property, or status...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="loading-indicator">
            <i className="fa-solid fa-spinner fa-spin"></i>
            <p>{t("Loading maintenance requests...")}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t("Title")}</th>
                  <th>{t("Property")}</th>
                  <th>{t("Status")}</th>
                  <th>{t("Reported Date")}</th>
                  <th>{t("Cost")}</th>
                  <th>{t("Actions")}</th>
                </tr>
              </thead>
              <tbody id="maintenance-list">
                {filteredRequests.map(request => {
                  const requestId = request._id || request.id;
                  return (
                  <tr key={requestId}>
                    <td>{request.title}</td>
                    <td>{request.propertyName}</td>
                    <td>
                      <span className={getStatusBadgeClass(request.status)}>
                        {formatStatus(request.status)}
                      </span>
                    </td>
                    <td>{formatDate(request.reportedDate)}</td>
                    <td>{request.cost ? `ETB ${request.cost.toFixed(2)}` : 'ETB 0.00'}</td>
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
                        <div className="dropdown-menu show">
                          <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleViewDetails(request); }}>
                            <i className="fa-solid fa-eye"></i>{t("View Details")}
                          </a>
                          <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleEditRequest(request); }}>
                            <i className="fa-solid fa-pencil"></i>{t("Edit")}
                          </a>
                          <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleDeleteRequest(request); }}>
                            <i className="fa-solid fa-trash-can"></i>{t("Delete")}
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
          <h3>{t("No Maintenance Requests")}</h3>
          <p>{t("Get started by adding a new maintenance request.")}</p>
        </div>
      )}

      <Modal
        title={t("Add Maintenance Request")}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <form onSubmit={handleFormSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="title">{t("Request Title")}</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder={t("e.g., Leaky Faucet, Broken Light Fixture")}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="property">{t("Property")}</label>
            <select
              id="propertyId"
              name="propertyId"
              value={formData.propertyId}
              onChange={handleInputChange}
              required
            >
              <option value="">{t("Select Property")}</option>
              {properties.map(prop => (
                <option key={prop._id} value={prop._id}>{prop.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="category">{t("Category")}</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
            >
              <option value="Other">{t("Other")}</option>
              <option value="Plumbing">{t("Plumbing")}</option>
              <option value="Electrical">{t("Electrical")}</option>
              <option value="HVAC">{t("HVAC")}</option>
              <option value="Structural">{t("Structural")}</option>
              <option value="Appliance">{t("Appliance")}</option>
              <option value="Cleaning">{t("Cleaning")}</option>
              <option value="Security">{t("Security")}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority">{t("Priority")}</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
            >
              <option value="Low">{t("Low")}</option>
              <option value="Medium">{t("Medium")}</option>
              <option value="High">{t("High")}</option>
              <option value="Urgent">{t("Urgent")}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="status">{t("Status")}</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="pending">{t("Pending")}</option>
              <option value="in-progress">{t("In Progress")}</option>
              <option value="completed">{t("Completed")}</option>
              <option value="paid">{t("Paid")}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="reportedDate">{t("Reported Date")}</label>
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
            <label htmlFor="cost">{t("Estimated Cost (ETB)")}</label>
            <NumberInput
              value={formData.cost}
              onChange={(value) => setFormData(prev => ({ ...prev, cost: value }))}
              placeholder="0.00"
              min={0}
              step={0.01}
            />
          </div>

           <div className="form-group">
            <label htmlFor="receipt">{t("Receipt (Image/PDF)")}</label>
            <input
              type="file"
              id="receipt"
              name="receipt"
              accept="image/*,.pdf"
              onChange={(e) => setReceiptFile(e.target.files[0])}
            />
          </div>

          <div className="form-group">
            <label htmlFor="beforeImage">{t("Before Image")}</label>
            <input
              type="file"
              id="beforeImage"
              name="beforeImage"
              accept="image/*"
              onChange={(e) => setBeforeImageFile(e.target.files[0])}
            />
          </div>

          <div className="form-group">
            <label htmlFor="afterImage">{t("After Image")}</label>
            <input
              type="file"
              id="afterImage"
              name="afterImage"
              accept="image/*"
              onChange={(e) => setAfterImageFile(e.target.files[0])}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
              {t("Cancel")}
            </button>
            <button type="submit" className="btn-primary">
              {t("Add Maintenance Request")}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Maintenance;
