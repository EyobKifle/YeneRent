import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import { formatCurrency, formatDate, getPaymentStatus, debounce } from '../../utils/utils';
import { Card } from '../../components/ui/Card';
import StatsCard from '../../components/ui/StatsCard';
import Button from '../../components/ui/Button';
import RecordPaymentModal from '../../components/ui/RecordPaymentModal';
import DetailsModal from '../../components/ui/DetailsModal';
import { useLanguage } from '../../contexts/LanguageContext';
import './Payments.css';

const SimpleTable = ({ headers, data, renderRow }) => (
    <div className="table-container">
        <table className="data-table">
            <thead>
                <tr>
                    {headers.map((header) => <th key={header}>{header}</th>)}
                </tr>
            </thead>
            <tbody>
                {data.map(renderRow)}
            </tbody>
        </table>
    </div>
);

const Payments = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [payments, setPayments] = useState([]);
    const [leases, setLeases] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [properties, setProperties] = useState([]);
    const [units, setUnits] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [openActionId, setOpenActionId] = useState(null);
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [editingPayment, setEditingPayment] = useState(null);

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

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [paymentsData, leasesData, tenantsData, propertiesData, unitsData] = await Promise.all([
                    api.get('payments'),
                    api.get('leases'),
                    api.get('tenants'),
                    api.get('properties'),
                    api.get('units'),
                ]);
                setPayments(paymentsData);
                setLeases(leasesData);
                setTenants(tenantsData);
                setProperties(propertiesData.properties || propertiesData);
                setUnits(unitsData);
            } catch (error) {
                console.error("Failed to fetch payments data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Handle editId from URL
    useEffect(() => {
        const editId = searchParams.get('editId');
        if (editId && payments.length > 0) {
            const paymentToEdit = payments.find(p => (p._id || p.id) === editId);
            if (paymentToEdit) {
                handleEditPayment(paymentToEdit);
                setSearchParams({}, { replace: true });
            }
        }
    }, [searchParams, payments, setSearchParams]);

    const enrichedPayments = useMemo(() => {
        return payments.map(payment => {
            const paymentLeaseId = payment.leaseId?._id || payment.leaseId;
            const lease = leases.find(l => (l._id || l.id) === paymentLeaseId);
            
            const leaseTenantId = lease?.tenantId?._id || lease?.tenantId;
            const tenant = leaseTenantId ? tenants.find(t => (t._id || t.id) === leaseTenantId) : null;
            
            const leasePropertyId = lease?.propertyId?._id || lease?.propertyId;
            const property = leasePropertyId ? properties.find(p => (p._id || p.id) === leasePropertyId) : null;
            
            const leaseUnitId = lease?.unitId?._id || lease?.unitId;
            const unit = leaseUnitId ? units.find(u => (u._id || u.id) === leaseUnitId) : null;
            
            const status = getPaymentStatus(payment);
            return { ...payment, tenant, property, unit, status };
        }).sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
    }, [payments, leases, tenants, properties, units]);

    const filteredPayments = useMemo(() => {
        if (!searchTerm) return enrichedPayments;
        const lowercasedFilter = searchTerm.toLowerCase();
        return enrichedPayments.filter(p =>
            p.tenant?.name.toLowerCase().includes(lowercasedFilter) ||
            p.property?.name.toLowerCase().includes(lowercasedFilter)
        );
    }, [enrichedPayments, searchTerm]);

    const stats = useMemo(() => {
        const totalCollected = payments
            .filter(p => p.status === 'Paid')
            .reduce((sum, p) => sum + p.amount, 0);

        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthCollected = payments
            .filter(p => p.status === 'Paid' && new Date(p.date) >= firstDayOfMonth)
            .reduce((sum, p) => sum + p.amount, 0);

        const overduePayments = enrichedPayments.filter(p => p.status.text === 'Overdue');
        const overdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0);

        return {
            totalCollected,
            thisMonthCollected,
            overdueAmount,
            overdueCount: overduePayments.length,
        };
    }, [payments, enrichedPayments]);

    const handleSearch = debounce((event) => {
        setSearchTerm(event.target.value);
    }, 300);

    const handlePaymentRecorded = async () => {
        // Refresh payments data
        try {
            const paymentsData = await api.get('payments');
            setPayments(paymentsData);
        } catch (error) {
            console.error("Failed to refresh payments data", error);
        }
    };

    const handleViewDetails = (payment) => {
        navigate(`/payments/${payment._id || payment.id}`);
    };

    const handleEditPayment = (payment) => {
        setEditingPayment(payment);
        setIsRecordModalOpen(true);
    };

    const handleDeletePayment = async (payment) => {
        const paymentId = payment._id || payment.id;
        if (window.confirm(t('Are you sure you want to delete this payment?'))) {
            try {
                await api.delete(`payments/${paymentId}`);
                setPayments(prev => prev.filter(p => (p._id || p.id) !== paymentId));
                showNotification('Payment deleted successfully', 'success');
            } catch (error) {
                console.error('Failed to delete payment:', error);
                showNotification('Failed to delete payment', 'error');
            }
        }
    };

    if (loading) {
        return (
            <div className="loading-indicator">
                <i className="fa-solid fa-spinner fa-spin"></i>
                <p>Loading payments...</p>
            </div>
        );
    }

    return (
        <div id="payments-view">
            <div className="page-header">
                <div>
                    <h1>{t('Payment Schedule')}</h1>
                    <p>{t('Track all scheduled, paid, and overdue rent payments.')}</p>
                </div>
                <Button variant="secondary" onClick={() => setIsRecordModalOpen(true)}>
                    <i className="fa-solid fa-plus"></i>
                    {t('Record Payment')}
                </Button>
            </div>

            <div className="stats-grid">
                <StatsCard title={t('Total Collected')} value={formatCurrency(stats.totalCollected)} />
                <StatsCard title={t('This Month')} value={formatCurrency(stats.thisMonthCollected)} />
                <StatsCard title={t('Total Overdue Amount')} value={formatCurrency(stats.overdueAmount)} />
                <StatsCard title={t('Overdue Payments')} value={stats.overdueCount} />
            </div>

            <Card>
                <div className="table-header">
                    <input
                        type="text"
                        className="form-input"
                        placeholder={t('Search by tenant or property...')}
                        onChange={handleSearch}
                    />
                </div>
                {filteredPayments.length > 0 ? (
                    <SimpleTable
                        headers={[t('Tenant'), t('Property / Unit'), t('Due Date'), t('Amount'), t('Status'), t('Actions')]}
                        data={filteredPayments}
                        renderRow={(payment) => {
                            const paymentId = payment._id || payment.id;
                            return (
                                <tr key={paymentId}>
                                    <td>{payment.tenant?.name || 'N/A'}</td>
                                    <td>{`${payment.property?.name || 'N/A'} ${payment.unit ? `(Unit ${payment.unit.unitNumber})` : ''}`}</td>
                                    <td>{formatDate(payment.dueDate)}</td>
                                    <td>{formatCurrency(payment.amount)}</td>
                                    <td><span className={`status-badge ${payment.status.class}`}>{payment.status.text}</span></td>
                                    <td>
                                        <div className="action-dropdown">
                                            <button
                                                className="action-dropdown-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenActionId(openActionId === paymentId ? null : paymentId);
                                                }}
                                            >
                                                <i className="fa-solid fa-ellipsis-vertical"></i>
                                            </button>
                                            {openActionId === paymentId && (
                                            <div className="dropdown-menu show">
                                                <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleViewDetails(payment); }}><i className="fa-solid fa-eye"></i>{t('View Details')}</a>
                                                <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleEditPayment(payment); }}><i className="fa-solid fa-pencil"></i>{t('Edit')}</a>
                                                <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleDeletePayment(payment); }}><i className="fa-solid fa-trash-can"></i>{t('Delete')}</a>
                                            </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        }}
                    />
                ) : (
                    <div className="empty-state">
                        <i className="fa-solid fa-receipt"></i>
                        <h3>{t('No Payments Found')}</h3>
                        <p>{t('Get started by recording a new payment.')}</p>
                    </div>
                )}
            </Card>
            <RecordPaymentModal
                isOpen={isRecordModalOpen}
                onClose={() => { setIsRecordModalOpen(false); setEditingPayment(null); }}
                onPaymentRecorded={handlePaymentRecorded}
                editPayment={editingPayment}
            />


        </div>
    );
};

export default Payments;
