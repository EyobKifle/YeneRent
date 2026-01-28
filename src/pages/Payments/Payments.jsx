import React, { useState, useEffect, useMemo } from 'react';
import api from '../../utils/api';
import { formatCurrency, formatDate, getPaymentStatus, debounce } from '../../utils/utils';
import { Card } from '../../components/ui/Card';
import StatsCard from '../../components/ui/StatsCard';
import Button from '../../components/ui/Button';
import RecordPaymentModal from '../../components/ui/RecordPaymentModal';
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
    const [payments, setPayments] = useState([]);
    const [leases, setLeases] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [properties, setProperties] = useState([]);
    const [units, setUnits] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [openActionId, setOpenActionId] = useState(null);
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

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
                setProperties(propertiesData);
                setUnits(unitsData);
            } catch (error) {
                console.error("Failed to fetch payments data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const enrichedPayments = useMemo(() => {
        return payments.map(payment => {
            const lease = leases.find(l => l.id === payment.leaseId);
            const tenant = lease ? tenants.find(t => t.id === lease.tenantId) : null;
            const property = lease ? properties.find(p => p.id === lease.propertyId) : null;
            const unit = lease ? units.find(u => u.id === lease.unitId) : null;
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

    if (loading) {
        return <div>Loading...</div>;
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
                        renderRow={(payment) => (
                            <tr key={payment.id}>
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
                                                setOpenActionId(openActionId === payment.id ? null : payment.id);
                                            }}
                                        >
                                            <i className="fa-solid fa-ellipsis-vertical"></i>
                                        </button>
                                        {openActionId === payment.id && (
                                        <div className="dropdown-menu align-right show">
                                            <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); alert('View payment details'); }}><i className="fa-solid fa-eye"></i>{t('View Details')}</a>
                                            <a href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); alert('Download receipt'); }}><i className="fa-solid fa-download"></i>{t('Receipt')}</a>
                                        </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
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
                onClose={() => setIsRecordModalOpen(false)}
                onPaymentRecorded={handlePaymentRecorded}
            />
        </div>
    );
};

export default Payments;
