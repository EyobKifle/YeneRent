import React, { useState, useMemo, useEffect } from 'react';
import Button from '../../components/ui/Button';
import '/src/pages/Utilities/Utilities.css';

const Utilities = () => {
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
    // Placeholder: Open modal to add utility
    console.log('Add utility bill');
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

      <div id="utility-modal"></div>
    </div>
  );
};

export default Utilities;
