import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { get } from '../../utils/api'; // Assuming 'get' is exported from api.js
import { formatDate, formatCurrency } from '../../utils/utils';
import './PaymentDetails.css'; // Import the specific CSS for this component

const PaymentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentPayment, setCurrentPayment] = useState(null);
    const [properties, setProperties] = useState([]);
    const [units, setUnits] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const PAYMENT_KEY = 'payments';
    const PROPERTY_KEY = 'properties';
    const UNIT_KEY = 'units';
    const TENANT_KEY = 'tenants';

    useEffect(() => {
        const fetchPaymentDetails = async () => {
            if (!id) {
                alert('Payment ID not found in URL.'); // Placeholder for notification
                navigate('/payments');
                return;
            }

            try {
                const [fetchedProperties, fetchedUnits, fetchedTenants, payments] = await Promise.all([
                    get(PROPERTY_KEY),
                    get(UNIT_KEY),
                    get(TENANT_KEY),
                    get(PAYMENT_KEY)
                ]);

                setProperties(fetchedProperties);
                setUnits(fetchedUnits);
                setTenants(fetchedTenants);

                const foundPayment = payments.find(p => p.id === id);

                if (!foundPayment) {
                    alert('Payment not found.'); // Placeholder for notification
                    navigate('/payments');
                    return;
                }
                setCurrentPayment(foundPayment);
            } catch (err) {
                console.error('Failed to fetch payment details:', err);
                setError('Failed to load payment details.');
                alert('Failed to load payment details.'); // Placeholder for notification
            } finally {
                setLoading(false);
            }
        };

        fetchPaymentDetails();
    }, [id, navigate]);

    const handleBack = () => {
        navigate('/payments'); // Assuming /payments is the list page
    };

    const handleEdit = () => {
        navigate(`/payments?editId=${currentPayment.id}`); // Redirect to payments list with editId
    };

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete this payment?`)) { // Placeholder for confirmation
            try {
                await get(PAYMENT_KEY, currentPayment.id, 'DELETE'); // Assuming 'get' can handle DELETE with a third arg
                alert('Payment deleted successfully!'); // Placeholder for notification
                navigate('/payments');
            } catch (err) {
                console.error('Failed to delete payment:', err);
                alert('Failed to delete payment.'); // Placeholder for notification
            }
        }
    };

    const handlePrint = () => {
        window.print();
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

    const tenant = tenants.find(t => t.id === currentPayment.tenantId);
    const property = properties.find(p => p.id === currentPayment.propertyId);
    const unit = units.find(u => u.id === currentPayment.unitId);

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
            <a href={currentPayment.receiptImage} target="_blank" rel="noopener noreferrer" className="detail-image-wrapper">
                <img src={currentPayment.receiptImage} alt="Receipt" />
            </a>
        );
    };

    return (
        <main id="main-content" className="main-content">
            <div id="payment-details-view">
                <div className="page-header">
                    <div>
                        <button id="back-btn" onClick={handleBack} className="btn-secondary">
                            <i className="fa-solid fa-arrow-left"></i> Back to Payments
                        </button>
                        <h1 id="payment-title">Payment Details</h1>
                        <p id="payment-subtitle">View comprehensive information and receipt for this payment.</p>
                    </div>
                    <div className="page-actions">
                        <button id="print-btn" onClick={handlePrint} className="btn-secondary">
                            <i className="fa-solid fa-print"></i> Print
                        </button>
                        <button id="edit-btn" onClick={handleEdit} className="btn-primary">
                            <i className="fa-solid fa-pencil"></i> Edit Payment
                        </button>
                        <button id="delete-btn" onClick={handleDelete} className="btn-danger">
                            <i className="fa-solid fa-trash-can"></i> Delete Payment
                        </button>
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
        </main>
    );
};

export default PaymentDetails;
