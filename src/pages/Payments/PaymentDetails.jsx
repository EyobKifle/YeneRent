import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../../utils/api';
import { formatDate, formatCurrency } from '../../utils/utils';
import Button from '../../components/ui/Button';
import SharePrintModal from '../../components/ui/SharePrintModal';
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

    useEffect(() => {
        const fetchPaymentDetails = async () => {
            if (!id) {
                alert('Payment ID not found in URL.');
                navigate('/payments');
                return;
            }

            try {
                const [fetchedProperties, fetchedUnits, fetchedTenants, paymentsData] = await Promise.all([
                    api.get('properties'),
                    api.get('units'),
                    api.get('tenants'),
                    api.get('payments')
                ]);

                setProperties(fetchedProperties.properties || fetchedProperties || []);
                setUnits(fetchedUnits || []);
                setTenants(fetchedTenants || []);
                
                // Ensure payments is an array
                const paymentsArray = Array.isArray(paymentsData) ? paymentsData : [];
                const foundPayment = paymentsArray.find(p => {
                    const pId = (p._id || p.id)?.toString();
                    return pId === id.toString();
                });

                if (!foundPayment) {
                    alert('Payment not found.');
                    navigate('/payments');
                    return;
                }
                setCurrentPayment(foundPayment);
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
        if (!currentPayment?.receiptImage) return [];
        return [{
            type: 'image',
            name: 'Receipt',
            url: getImageUrl(currentPayment.receiptImage)
        }];
    }, [currentPayment]);

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
                ? { title: `Payment Receipt`, url: window.location.href }
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

    const renderReceiptImage = () => {
        if (!currentPayment.receiptImage) {
            return (
                <div className="detail-image-placeholder">
                    <i className="fa-solid fa-receipt"></i>
                    <p>No receipt image.</p>
                </div>
            );
        }

        return (
            <a href={getImageUrl(currentPayment.receiptImage)} target="_blank" rel="noopener noreferrer" className="detail-image-wrapper">
                <img src={getImageUrl(currentPayment.receiptImage)} alt="Receipt" />
            </a>
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
        </main>
    );
};

export default PaymentDetails;
