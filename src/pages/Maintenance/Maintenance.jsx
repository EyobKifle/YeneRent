import React, { useState, useMemo, useEffect } from 'react';
import Button from '../../components/ui/Button';
import '../../styles/pages/Maintenance.css';

const Maintenance = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openActionId, setOpenActionId] = useState(null);

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
    // Placeholder: Open modal to add maintenance request
    console.log('Add maintenance request');
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

      <div id="maintenance-modal"></div>
      <div id="maintenance-details-modal"></div>
    </div>
  );
};

export default Maintenance;
