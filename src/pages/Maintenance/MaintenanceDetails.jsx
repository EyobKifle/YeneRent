import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { get } from '../../utils/api'; // Assuming 'get' is exported from api.js
import { formatDate, formatCurrency } from '../../utils/utils';
import './MaintenanceDetails.css'; // Import the specific CSS for this component

const MaintenanceDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentMaintenance, setCurrentMaintenance] = useState(null);
    const [properties, setProperties] = useState([]);
    const [units, setUnits] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const MAINTENANCE_KEY = 'maintenance';
    const PROPERTY_KEY = 'properties';
    const UNIT_KEY = 'units';


    useEffect(() => {
        const fetchMaintenanceDetails = async () => {
            if (!id) {
                alert('Maintenance ID not found in URL.'); // Placeholder for notification
                navigate('/maintenance');
                return;
            }

            try {
                const [fetchedProperties, fetchedUnits, maintenance] = await Promise.all([
                    get(PROPERTY_KEY),
                    get(UNIT_KEY),
                    get(MAINTENANCE_KEY)
                ]);

                setProperties(fetchedProperties);
                setUnits(fetchedUnits);

                const foundMaintenance = maintenance.find(m => m.id === id);

                if (!foundMaintenance) {
                    alert('Maintenance request not found.'); // Placeholder for notification
                    navigate('/maintenance');
                    return;
                }
                setCurrentMaintenance(foundMaintenance);
            } catch (err) {
                console.error('Failed to fetch maintenance details:', err);
                setError('Failed to load maintenance details.');
                alert('Failed to load maintenance details.'); // Placeholder for notification
            } finally {
                setLoading(false);
            }
        };

        fetchMaintenanceDetails();
    }, [id, navigate]);

    const handleBack = () => {
        navigate('/maintenance'); // Assuming /maintenance is the list page
    };

    const handleEdit = () => {
        navigate(`/maintenance?editId=${currentMaintenance.id}`); // Redirect to maintenance list with editId
    };

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete "${currentMaintenance.title}"?`)) { // Placeholder for confirmation
            try {
                await get(MAINTENANCE_KEY, currentMaintenance.id, 'DELETE'); // Assuming 'get' can handle DELETE with a third arg
                alert('Maintenance request deleted successfully!'); // Placeholder for notification
                navigate('/maintenance');
            } catch (err) {
                console.error('Failed to delete maintenance request:', err);
                alert('Failed to delete maintenance request.'); // Placeholder for notification
            }
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return <div className="loading">Loading maintenance details...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!currentMaintenance) {
        return <div className="no-maintenance">Maintenance request not found.</div>;
    }

    const property = properties.find(p => p.id === currentMaintenance.propertyId);
    const unit = units.find(u => u.id === currentMaintenance.unitId);

    const renderImageGallery = () => {
        if (!currentMaintenance.images || currentMaintenance.images.length === 0) {
            return (
                <div className="detail-image-placeholder">
                    <i className="fa-solid fa-images"></i>
                    <p>No images available.</p>
                </div>
            );
        }

        return currentMaintenance.images.map((image, index) => (
            <div key={index} className="detail-image-preview">
                <img src={image.url} alt={image.caption || `Image ${index + 1}`} />
                <span>{image.caption || `Image ${index + 1}`}</span>
            </div>
        ));
    };

    const renderReceiptImage = () => {
        if (!currentMaintenance.receiptImage) {
            return (
                <div className="detail-image-placeholder">
                    <i className="fa-solid fa-receipt"></i>
                    <p>No receipt image.</p>
                </div>
            );
        }

        return (
            <a href={currentMaintenance.receiptImage} target="_blank" rel="noopener noreferrer" className="detail-image-wrapper">
                <img src={currentMaintenance.receiptImage} alt="Receipt" />
            </a>
        );
    };

    return (
        <main id="main-content" className="main-content">
            <div id="maintenance-details-view">
                <div className="page-header">
                    <div>
                        <button id="back-btn" onClick={handleBack} className="btn-secondary">
                            <i className="fa-solid fa-arrow-left"></i> Back to Requests
                        </button>
                        <h1 id="request-title">Maintenance Request Details</h1>
                        <p id="request-subtitle">View comprehensive information for this maintenance task.</p>
                    </div>
                    <div className="page-actions">
                        <button id="print-request-btn" onClick={handlePrint} className="btn-secondary">
                            <i className="fa-solid fa-print"></i> Print
                        </button>
                        <button id="edit-request-btn" onClick={handleEdit} className="btn-primary">
                            <i className="fa-solid fa-pencil"></i> Edit Request
                        </button>
                        <button id="delete-request-btn" onClick={handleDelete} className="btn-danger">
                            <i className="fa-solid fa-trash-can"></i> Delete Request
                        </button>
                    </div>
                </div>

                <div className="data-card">
                    <div className="maintenance-details-grid">
                        <div className="detail-section">
                            <h4>Request Information</h4>
                            <div className="detail-item"><span>Title</span><span id="detail-title">{currentMaintenance.title}</span></div>
                            <div className="detail-item"><span>Property</span><span id="detail-property">{property ? property.name : 'N/A'}</span></div>
                            <div className="detail-item"><span>Unit</span><span id="detail-unit">{unit ? unit.name : 'N/A'}</span></div>
                            <div className="detail-item"><span>Category</span><span id="detail-category">{currentMaintenance.category}</span></div>
                            <div className="detail-item"><span>Status</span><span id="detail-status">{currentMaintenance.status}</span></div>
                            <div className="detail-item"><span>Date Reported</span><span id="detail-reported-date">{formatDate(currentMaintenance.dateReported)}</span></div>
                        </div>
                        <div className="detail-section">
                            <h4>Financials & Receipt</h4>
                            <div className="detail-item"><span>Cost</span><span id="detail-cost">{formatCurrency(currentMaintenance.cost)}</span></div>
                            <div className="detail-item"><span>Receipt Number</span><span id="detail-receipt-number">{currentMaintenance.receiptNumber || 'N/A'}</span></div>
                            <div id="receipt-image-wrapper" className="detail-image-wrapper">
                                {renderReceiptImage()}
                            </div>
                        </div>
                    </div>
                    <div className="detail-section image-gallery-section">
                        <h4>Before & After Photos</h4>
                        <div className="maintenance-image-gallery">
                            {renderImageGallery()}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default MaintenanceDetails;
