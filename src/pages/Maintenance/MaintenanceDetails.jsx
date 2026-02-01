import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../../utils/api';
import { formatDate, formatCurrency, printFile } from '../../utils/utils';
import Button from '../../components/ui/Button';
import SharePrintModal from '../../components/ui/SharePrintModal';
import DocumentPreviewModal from '../../components/ui/DocumentPreviewModal';
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
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState({ url: '', name: '', type: '' });

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
                    api.get(`maintenance/${id}`)
                ]);

                setProperties(fetchedProperties.properties || fetchedProperties || []);
                setUnits(fetchedUnits || []);
                setCurrentMaintenance(maintenanceData);
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
        if (currentMaintenance?.receiptUrl) {
            const url = getImageUrl(currentMaintenance.receiptUrl);
            const isPdf = currentMaintenance.receiptUrl.toLowerCase().endsWith('.pdf');
            items.push({ 
                type: isPdf ? 'pdf' : 'image', 
                name: currentMaintenance.receiptName || 'Receipt', 
                url 
            });
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
                printFile(item.url);
            }
        } else if (mode === 'share') {
            const shareData = selection === 'all' 
                ? { title: `Maintenance: ${currentMaintenance.title}`, url: window.location.href }
                : { title: item?.name || 'Attachment', url: item?.url || window.location.href };

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
    
    const handlePreview = (url, name, type) => {
        setPreviewFile({ url, name, type });
        setPreviewModalOpen(true);
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

    const propId = currentMaintenance.propertyId?._id || currentMaintenance.propertyId;
    const unitId = currentMaintenance.unitId?._id || currentMaintenance.unitId;
    
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

        const beforeImg = currentMaintenance.images.find(img => img.caption === 'Before');
        const afterImg = currentMaintenance.images.find(img => img.caption === 'After');
        const otherImages = currentMaintenance.images.filter(img => img.caption !== 'Before' && img.caption !== 'After');

        const renderImageItem = (image, index, label) => (
            <div key={index} className="detail-image-preview" style={{width: '100%'}}>
                <img 
                    src={getImageUrl(image.url)} 
                    alt={label || image.caption || `Image ${index + 1}`} 
                    onClick={() => handlePreview(image.url, label || image.caption || `Image ${index + 1}`, 'image')} 
                    style={{ cursor: 'pointer', height: '200px', objectFit: 'cover', width: '100%' }} 
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                    <span style={{fontWeight: label ? 'bold' : 'normal'}}>{label || image.caption || `Image ${index + 1}`}</span>
                    <Button variant="secondary" onClick={() => handlePreview(image.url, label || image.caption || `Image ${index + 1}`, 'image')} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                        Preview
                    </Button>
                </div>
            </div>
        );

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
                {(beforeImg || afterImg) && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                        {beforeImg && renderImageItem(beforeImg, 'before', 'Before Work')}
                        {afterImg && renderImageItem(afterImg, 'after', 'After Work')}
                    </div>
                )}
                
                {otherImages.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {otherImages.map((image, index) => renderImageItem(image, index))}
                    </div>
                )}
            </div>
        );
    };


    const renderReceiptImage = () => {
        if (!currentMaintenance.receiptUrl) {
            return (
                <div className="detail-image-placeholder">
                    <i className="fa-solid fa-receipt"></i>
                    <p>No receipt attachment.</p>
                </div>
            );
        }

        const fullUrl = getImageUrl(currentMaintenance.receiptUrl);
        const isPdf = currentMaintenance.receiptUrl.toLowerCase().endsWith('.pdf');
        const receiptName = currentMaintenance.receiptName || 'Receipt';

        const renderContainer = (content) => (
            <div className="detail-image-preview" style={{width: '100%'}}>
                {content}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                    <span style={{fontWeight: 'bold'}}>Receipt</span>
                    <Button variant="secondary" onClick={() => handlePreview(currentMaintenance.receiptUrl, receiptName, isPdf ? 'application/pdf' : 'image')} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                        Preview
                    </Button>
                </div>
            </div>
        );

        if (isPdf) {
            return renderContainer(
                <div style={{ height: '200px', width: '100%', overflow: 'hidden', backgroundColor: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <iframe 
                        src={fullUrl + "#toolbar=0&navpanes=0&scrollbar=0"} 
                        title="Receipt PDF" 
                        style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }} 
                    />
                </div>
            );
        }

        return renderContainer(
            <img 
                src={fullUrl} 
                alt={receiptName} 
                onClick={() => handlePreview(currentMaintenance.receiptUrl, receiptName, 'image')} 
                style={{ cursor: 'pointer', height: '200px', objectFit: 'cover', width: '100%' }} 
            />
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
                            <div className="detail-item"><span>Unit</span><span id="detail-unit">{unit ? unit.unitNumber : 'N/A'}</span></div>
                            <div className="detail-item"><span>Category</span><span id="detail-category">{currentMaintenance.category}</span></div>
                            <div className="detail-item"><span>Status</span><span id="detail-status">{currentMaintenance.status}</span></div>
                            <div className="detail-item"><span>Date Reported</span><span id="detail-reported-date">{formatDate(currentMaintenance.reportedDate)}</span></div>
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

            <DocumentPreviewModal
                isOpen={previewModalOpen}
                onClose={() => setPreviewModalOpen(false)}
                fileUrl={previewFile.url}
                fileName={previewFile.name}
                fileType={previewFile.type}
            />
        </main>
    );
};

export default MaintenanceDetails;
