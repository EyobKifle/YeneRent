import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../../utils/api';
import { formatDate, formatCurrency, printFile } from '../../utils/utils';
import Button from '../../components/ui/Button';
import SharePrintModal from '../../components/ui/SharePrintModal';
import DocumentPreviewModal from '../../components/ui/DocumentPreviewModal';
import './PaymentDetails.css';

const PaymentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentPayment, setCurrentPayment] = useState(null);
    const [properties, setProperties] = useState([]);
    const [units, setUnits] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState({ url: '', name: '', type: '' });

    useEffect(() => {
        const fetchPaymentDetails = async () => {
            if (!id) {
                alert('Payment ID not found in URL.');
                navigate('/payments');
                return;
            }

            try {
                const [fetchedProperties, fetchedUnits, fetchedTenants, paymentData] = await Promise.all([
                    api.get('properties'),
                    api.get('units'),
                    api.get('tenants'),
                    api.get(`payments/${id}`)
                ]);

                setProperties(fetchedProperties.properties || fetchedProperties || []);
                setUnits(fetchedUnits || []);
                setTenants(fetchedTenants || []);
                setCurrentPayment(paymentData);
            } catch (err) {
                console.error('Failed to fetch payment details:', err);
                setError('Failed to load payment details.');
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentDetails();
    }, [id, navigate]);

    const attachments = useMemo(() => {
        if (!currentPayment?.receiptUrl) return [];
        const isPdf = currentPayment.receiptUrl.toLowerCase().endsWith('.pdf') || (currentPayment.receiptName && currentPayment.receiptName.toLowerCase().endsWith('.pdf'));
        return [{
            type: isPdf ? 'pdf' : 'image',
            name: currentPayment.receiptName || 'Receipt',
            url: getImageUrl(currentPayment.receiptUrl)
        }];
    }, [currentPayment]);

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
                ? { title: `Payment Receipt`, url: window.location.href }
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

    const handleBack = () => navigate('/payments');

    const handleEdit = () => navigate(`/payments?editId=${currentPayment._id || currentPayment.id}`);

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete this payment?`)) {
            try {
                await api.delete(`payments/${currentPayment._id || currentPayment.id}`);
                alert('Payment deleted successfully!');
                navigate('/payments');
            } catch (err) {
                console.error('Failed to delete payment:', err);
                alert('Failed to delete payment.');
            }
        }
    };

    if (loading) {
        return <div className="loading">Loading payment details...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!currentPayment) {
        return <div className="no-payment">Payment not found.</div>;
    }

    const tenantId = typeof currentPayment.tenantId === 'object' ? currentPayment.tenantId._id : currentPayment.tenantId;
    const propertyId = typeof currentPayment.propertyId === 'object' ? currentPayment.propertyId._id : currentPayment.propertyId;
    const unitId = typeof currentPayment.unitId === 'object' ? currentPayment.unitId._id : currentPayment.unitId;

    const tenant = tenants.find(t => (t._id || t.id) === tenantId);
    const property = properties.find(p => (p._id || p.id) === propertyId);
    const unit = units.find(u => (u._id || u.id) === unitId);

    const propertyUnitText = property && unit ? `${property.name} / ${unit.name}` : property ? property.name : unit ? unit.name : 'N/A';

    const handlePreview = (url, name, type) => {
        const fileUrl = url || currentPayment?.receiptUrl;
        if (!fileUrl) return;
        
        const isPdf = fileUrl.toLowerCase().endsWith('.pdf');
        
        setPreviewFile({ 
            url: fileUrl, 
            name: name || currentPayment?.receiptName || 'Receipt', 
            type: type || (isPdf ? 'application/pdf' : 'image')
        });
        setPreviewModalOpen(true);
    };

    const renderReceiptImage = () => {
        if (!currentPayment.receiptUrl) {
            return (
                <div className="detail-image-placeholder">
                    <i className="fa-solid fa-receipt"></i>
                    <p>No receipt attachment.</p>
                </div>
            );
        }

        const fullUrl = getImageUrl(currentPayment.receiptUrl);
        const fileName = currentPayment.receiptName || 'Receipt';
        const isPdf = currentPayment.receiptUrl.toLowerCase().endsWith('.pdf') || (currentPayment.receiptName && currentPayment.receiptName.toLowerCase().endsWith('.pdf'));
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(currentPayment.receiptUrl) || (currentPayment.receiptName && /\.(jpg|jpeg|png|gif|webp)$/i.test(currentPayment.receiptName));
        const isWord = /\.(doc|docx)$/i.test(currentPayment.receiptUrl) || (currentPayment.receiptName && /\.(doc|docx)$/i.test(currentPayment.receiptName));
        const isExcel = /\.(xls|xlsx)$/i.test(currentPayment.receiptUrl) || (currentPayment.receiptName && /\.(xls|xlsx)$/i.test(currentPayment.receiptName));
        
        let fileType = 'other';
        if (isPdf) fileType = 'application/pdf';
        else if (isImage) fileType = 'image';
        else if (isWord) fileType = 'application/msword';
        else if (isExcel) fileType = 'application/vnd.ms-excel';

        const renderContainer = (content) => (
            <div className="detail-image-preview" style={{width: '100%', border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: 'white', padding: '0.75rem'}}>
                {content}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <span style={{fontWeight: 'bold', fontSize: '0.9rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '150px'}} title={fileName}>{fileName}</span>
                    <Button variant="secondary" onClick={() => handlePreview(currentPayment.receiptUrl, fileName, fileType)} style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
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

        if (isImage) {
            return renderContainer(
                <img 
                    src={fullUrl} 
                    alt={fileName} 
                    onClick={() => handlePreview(currentPayment.receiptUrl, fileName, 'image')} 
                    style={{ cursor: 'pointer', height: '200px', objectFit: 'cover', width: '100%', borderRadius: '4px' }} 
                />
            );
        }

        // Word/Excel/Other
        let iconClass = 'fa-solid fa-file';
        let iconColor = '#6b7280';
        
        if (isWord) {
            iconClass = 'fa-solid fa-file-word';
            iconColor = '#2b579a';
        } else if (isExcel) {
            iconClass = 'fa-solid fa-file-excel';
            iconColor = '#1d6f42';
        }

        return renderContainer(
            <div style={{ height: '200px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                <i className={`${iconClass} fa-3x`} style={{ color: iconColor, marginBottom: '10px' }}></i>
                <p style={{fontSize: '0.8rem', color: '#666'}}>Preview in modal</p>
            </div>
        );
    };

    return (
        <main id="main-content" className="main-content">
            <div id="payment-details-view">
                <div className="page-header">
                    <div>
                        <Button variant="secondary" onClick={handleBack}>
                            <i className="fa-solid fa-arrow-left"></i> Back to Payments
                        </Button>
                        <h1 id="payment-title">Payment Details</h1>
                        <p id="payment-subtitle">View comprehensive information and receipt for this payment.</p>
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
                            <h4>Payment Information</h4>
                            <div className="detail-item"><span>Tenant</span><span id="detail-tenant">{tenant ? tenant.name : 'N/A'}</span></div>
                            <div className="detail-item"><span>Property / Unit</span><span id="detail-property">{propertyUnitText}</span></div>
                            <div className="detail-item"><span>Payment For</span><span id="detail-type">{currentPayment.type}</span></div>
                            <div className="detail-item"><span>Amount</span><span id="detail-amount">{formatCurrency(currentPayment.amount)}</span></div>
                            <div className="detail-item"><span>Due Date</span><span id="detail-due-date">{formatDate(currentPayment.dueDate)}</span></div>
                            <div className="detail-item"><span>Payment Date</span><span id="detail-payment-date">{formatDate(currentPayment.paymentDate)}</span></div>
                            <div className="detail-item"><span>Payment Method</span><span id="detail-method">{currentPayment.method}</span></div>
                            <div className="detail-item"><span>Receipt Number</span><span id="detail-receipt-number">{currentPayment.receiptNumber || 'N/A'}</span></div>
                            <div className="detail-item"><span>Invoice Number</span><span id="detail-invoice-number">{currentPayment.invoiceNumber || 'N/A'}</span></div>
                        </div>
                        <div className="detail-section">
                            <h4>Receipt</h4>
                            <div id="receipt-image-wrapper" className="detail-image-wrapper">
                                {renderReceiptImage()}
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

export default PaymentDetails;
