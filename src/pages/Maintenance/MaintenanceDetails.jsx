import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../../utils/api';
import { formatDate, formatCurrency } from '../../utils/utils';
import Button from '../../components/ui/Button';
import SharePrintModal from '../../components/ui/SharePrintModal';
import './MaintenanceDetails.css';

const MaintenanceDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentMaintenance, setCurrentMaintenance] = useState(null);
    const [properties, setProperties] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [printModalOpen, setPrintModalOpen] = useState(false);

    useEffect(() => {
        const fetchMaintenanceDetails = async () => {
            if (!id) {
                alert('Maintenance ID not found in URL.');
                navigate('/maintenance');
                return;
            }

            try {
                const [fetchedProperties, fetchedUnits, maintenanceData] = await Promise.all([
                    api.get('properties'),
                    api.get('units'),
                    api.get('maintenance')
                ]);

                setProperties(fetchedProperties.properties || fetchedProperties || []);
                setUnits(fetchedUnits || []);
                
                // Ensure maintenance is an array
                const maintenanceArray = Array.isArray(maintenanceData) ? maintenanceData : [];
                const foundMaintenance = maintenanceArray.find(m => {
                    const mId = (m._id || m.id)?.toString();
                    return mId === id.toString();
                });

                if (!foundMaintenance) {
                    alert('Maintenance request not found.');
                    navigate('/maintenance');
                    return;
                }
                setCurrentMaintenance(foundMaintenance);
            } catch (err) {
                console.error('Failed to fetch maintenance details:', err);
                setError('Failed to load maintenance details.');
            } finally {
                setLoading(false);
            }
        };

        fetchMaintenanceDetails();
    }, [id, navigate]);

    const attachments = useMemo(() => {
        const items = [];
        if (currentMaintenance?.receiptImage) {
            items.push({ type: 'image', name: 'Receipt', url: getImageUrl(currentMaintenance.receiptImage) });
        }
        if (currentMaintenance?.images && Array.isArray(currentMaintenance.images)) {
            currentMaintenance.images.forEach((img, idx) => {
                items.push({
                    type: 'image',
                    name: img.caption || `Image ${idx + 1}`,
                    url: getImageUrl(img.url)
                });
            });
        }
        return items;
    }, [currentMaintenance]);

    const handleAction = (mode, selection) => {
        const item = selection === 'all' ? null : attachments[selection];
        
        if (mode === 'print') {
            if (selection === 'all') {
                window.print();
            } else if (item) {
                const w = window.open(item.url);
                if (w) w.onload = () => w.print();
            }
        } else if (mode === 'share') {
            const shareData = selection === 'all' 
                ? { title: `Maintenance: ${currentMaintenance.title}`, url: window.location.href }
                : { title: item.name, url: item.url };

            if (navigator.share) {
                navigator.share(shareData).catch(console.error);
            } else if (navigator.clipboard) {
                navigator.clipboard.writeText(shareData.url).then(() => alert('Link copied'));
            }
        }
        setShareModalOpen(false);
        setPrintModalOpen(false);
    };

    const handleBack = () => navigate('/maintenance');

    const handleEdit = () => navigate(`/maintenance/${id}/edit`);

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete "${currentMaintenance.title}"?`)) {
            try {
                await api.delete(`maintenance/${currentMaintenance._id || currentMaintenance.id}`);
                alert('Maintenance request deleted successfully!');
                navigate('/maintenance');
            } catch (err) {
                console.error('Failed to delete maintenance request:', err);
                alert('Failed to delete maintenance request.');
            }
        }
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

    const propId = typeof currentMaintenance.propertyId === 'object' ? currentMaintenance.propertyId._id : currentMaintenance.propertyId;
    const unitId = typeof currentMaintenance.unitId === 'object' ? currentMaintenance.unitId._id : currentMaintenance.unitId;
    
    const property = properties.find(p => (p._id || p.id) === propId);
    const unit = units.find(u => (u._id || u.id) === unitId);

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
                <img src={getImageUrl(image.url)} alt={image.caption || `Image ${index + 1}`} />
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
            <a href={getImageUrl(currentMaintenance.receiptImage)} target="_blank" rel="noopener noreferrer" className="detail-image-wrapper">
                <img src={getImageUrl(currentMaintenance.receiptImage)} alt="Receipt" />
            </a>
        );
    };

    return (
        <main id="main-content" className="main-content">
            <div id="maintenance-details-view">
                <div className="page-header">
                    <div>
                        <Button variant="secondary" onClick={handleBack}>
                            <i className="fa-solid fa-arrow-left"></i> Back to Requests
                        </Button>
                        <h1 id="request-title">Maintenance Request Details</h1>
                        <p id="request-subtitle">View comprehensive information for this maintenance task.</p>
                    </div>
                    <div className="page-actions">
                        <Button variant="secondary" onClick={() => setShareModalOpen(true)}>
                            <i className="fa-solid fa-share"></i> Share
                        </Button>
                        <Button variant="secondary" onClick={() => setPrintModalOpen(true)}>
                            <i className="fa-solid fa-print"></i> Print
                        </Button>
                        <Button variant="primary" onClick={handleEdit}>
                            <i className="fa-solid fa-pencil"></i> Edit
                        </Button>
                        <Button variant="danger" onClick={handleDelete}>
                            <i className="fa-solid fa-trash-can"></i> Delete
                        </Button>
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

            <SharePrintModal 
                isOpen={shareModalOpen} 
                onClose={() => setShareModalOpen(false)} 
                mode="share"
                items={attachments}
                onAction={(sel) => handleAction('share', sel)}
            />
            
            <SharePrintModal 
                isOpen={printModalOpen} 
                onClose={() => setPrintModalOpen(false)} 
                mode="print"
                items={attachments}
                onAction={(sel) => handleAction('print', sel)}
            />
        </main>
    );
};

export default MaintenanceDetails;
