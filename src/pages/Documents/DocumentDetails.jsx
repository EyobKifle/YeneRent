import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../../utils/api';
import { formatDate, formatFileSize } from '../../utils/utils';
import Button from '../../components/ui/Button';
import SharePrintModal from '../../components/ui/SharePrintModal';
import './DocumentDetails.css';

const DocumentDetails = () => {
    const { documentId } = useParams();
    const navigate = useNavigate();
    const [currentDocument, setCurrentDocument] = useState(null);
    const [properties, setProperties] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [printModalOpen, setPrintModalOpen] = useState(false);

    useEffect(() => {
        const fetchDocumentDetails = async () => {
            if (!documentId) {
                alert('Document ID not found in URL.');
                navigate('/documents');
                return;
            }

            try {
                const [fetchedProperties, fetchedTenants, documentsData] = await Promise.all([
                    api.get('properties'),
                    api.get('tenants'),
                    api.get('documents')
                ]);

                setProperties(fetchedProperties.properties || fetchedProperties || []);
                setTenants(fetchedTenants || []);
                
                // Ensure documents is an array
                const documentsArray = Array.isArray(documentsData) ? documentsData : [];
                const foundDocument = documentsArray.find(doc => {
                    const docId = (doc._id || doc.id)?.toString();
                    return docId === documentId.toString();
                });

                if (!foundDocument) {
                    alert('Document not found.');
                    navigate('/documents');
                    return;
                }
                setCurrentDocument(foundDocument);
            } catch (err) {
                console.error('Failed to fetch document details:', err);
                setError('Failed to load document details.');
            } finally {
                setLoading(false);
            }
        };

        fetchDocumentDetails();
    }, [documentId, navigate]);

    const attachments = useMemo(() => {
        if (!currentDocument?.url) return [];
        const type = currentDocument.type?.startsWith('image/') ? 'image' : 'document';
        return [{
            type,
            name: currentDocument.name,
            url: getImageUrl(currentDocument.url)
        }];
    }, [currentDocument]);

    const handleAction = (mode, selection) => {
        const item = selection === 'all' ? null : attachments[selection];
        
        if (mode === 'print') {
            if (selection === 'all') {
                window.print();
            } else if (item) {
                // For PDFs, try to print the iframe content
                if (currentDocument.type === 'application/pdf') {
                    const iframe = document.querySelector('.document-preview-content iframe');
                    if (iframe) {
                        try {
                            iframe.contentWindow.print();
                        } catch (e) {
                            window.print();
                        }
                    }
                } else {
                    const w = window.open(item.url);
                    if (w) w.onload = () => w.print();
                }
            }
        } else if (mode === 'share') {
            const shareData = selection === 'all' 
                ? { title: currentDocument.name, url: window.location.href }
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

    const getFileIcon = (fileType) => {
        if (fileType?.startsWith('image/')) return { icon: 'fa-solid fa-file-image', class: 'icon-image' };
        if (fileType === 'application/pdf') return { icon: 'fa-solid fa-file-pdf', class: 'icon-pdf' };
        if (fileType?.includes('wordprocessingml')) return { icon: 'fa-solid fa-file-word', class: 'icon-doc' };
        return { icon: 'fa-solid fa-file', class: 'icon-other' };
    };

    const handleBack = () => navigate('/documents');
    
    const handleEdit = () => navigate(`/documents/${documentId}/edit`);

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete "${currentDocument.name}"?`)) {
            try {
                await api.delete(`documents/${currentDocument._id || currentDocument.id}`);
                alert('Document deleted successfully!');
                navigate('/documents');
            } catch (err) {
                console.error('Failed to delete document:', err);
                alert('Failed to delete document.');
            }
        }
    };

    if (loading) {
        return <div className="loading">Loading document details...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!currentDocument) {
        return <div className="no-document">Document not found.</div>;
    }

    let linkedToText = 'General';
    if (currentDocument.propertyId) {
        const propId = typeof currentDocument.propertyId === 'object' ? currentDocument.propertyId._id : currentDocument.propertyId;
        const property = properties.find(p => (p._id || p.id) === propId);
        linkedToText = property ? `Property: ${property.name}` : 'N/A Property';
    } else if (currentDocument.tenantId) {
        const tenantId = typeof currentDocument.tenantId === 'object' ? currentDocument.tenantId._id : currentDocument.tenantId;
        const tenant = tenants.find(t => (t._id || t.id) === tenantId);
        linkedToText = tenant ? `Tenant: ${tenant.name}` : 'N/A Tenant';
    }

    const renderDocumentPreviewContent = () => {
        if (!currentDocument.url) {
            return (
                <div className="placeholder-message">
                    <i className="fa-solid fa-file-circle-xmark"></i>
                    <p>No file available for preview.</p>
                </div>
            );
        }

        const fullUrl = getImageUrl(currentDocument.url);
        
        if (currentDocument.type?.startsWith('image/')) {
            return <img src={fullUrl} alt={currentDocument.name} />;
        } else if (currentDocument.type === 'application/pdf') {
            return <iframe src={fullUrl} title={currentDocument.name}></iframe>;
        } else {
            const { icon, class: iconClass } = getFileIcon(currentDocument.type);
            return (
                <div className="placeholder-message">
                    <i className={`${icon} ${iconClass}`}></i>
                    <p>Preview not available for this file type.</p>
                    <p>Click "Download File" to view.</p>
                </div>
            );
        }
    };

    return (
        <main id="main-content" className="main-content">
            <div id="document-details-view">
                <div className="page-header">
                    <div>
                        <Button variant="secondary" onClick={handleBack}>
                            <i className="fa-solid fa-arrow-left"></i> Back to Documents
                        </Button>
                        <h1 id="document-title">Document Details</h1>
                        <p id="document-subtitle">View comprehensive information and preview for this document.</p>
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
                    <div className="document-details-grid">
                        <div className="detail-section">
                            <h4>Document Information</h4>
                            <div className="detail-item"><span>Name</span><span id="detail-name">{currentDocument.name}</span></div>
                            <div className="detail-item"><span>Category</span><span id="detail-category">{currentDocument.category}</span></div>
                            <div className="detail-item"><span>Linked To</span><span id="detail-linked-to">{linkedToText}</span></div>
                            <div className="detail-item"><span>Size</span><span id="detail-size">{formatFileSize(currentDocument.size)}</span></div>
                            <div className="detail-item"><span>Upload Date</span><span id="detail-upload-date">{formatDate(currentDocument.uploadDate)}</span></div>
                        </div>
                        <div className="detail-section document-preview-section">
                            <h4>Document Preview</h4>
                            <div id="document-preview-content" className="document-preview-content">
                                {renderDocumentPreviewContent()}
                            </div>
                            <div className="preview-actions">
                                <a
                                    id="download-document-btn"
                                    href={currentDocument.url ? getImageUrl(currentDocument.url) : '#'}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download={currentDocument.name}
                                    className={`btn-secondary ${!currentDocument.url ? 'hidden' : ''}`}
                                >
                                    <i className="fa-solid fa-download"></i> Download File
                                </a>
                            </div>
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

export default DocumentDetails;
