/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { formatDate, formatCurrency, debounce, generateId, readFileAsDataURL } from '../../utils/utils';
import TaxCalculator from '../../utils/taxCalculator';
import { settingsService } from '../../utils/settingsService';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import Button from '../../components/ui/Button';
import NumberInput from '../../components/ui/NumberInput';
import DocumentPreviewModal from '../../components/ui/DocumentPreviewModal';
import './Leases.css';

// Placeholder for a generic Modal component (to be replaced by a proper UI component later)
const Modal = ({ title, children, onClose, isOpen, maxWidth = '500px' }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content-wrapper" style={{ maxWidth }}>
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <button className="close-modal-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

const Leases = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const [leases, setLeases] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [properties, setProperties] = useState([]);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLeaseModalOpen, setIsLeaseModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [currentLease, setCurrentLease] = useState(null);
    const [isRenewal, setIsRenewal] = useState(false);
    const [openActionId, setOpenActionId] = useState(null);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState({ url: '', name: '', type: '' });

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

    const LEASE_KEY = 'leases';
    const TENANT_KEY = 'tenants';
    const PROPERTY_KEY = 'properties';
    const UNIT_KEY = 'units';
    const DOCUMENT_KEY = 'documents'; // Not directly used here, but good to keep in mind
    const PAYMENT_KEY = 'payments'; // For generating payment schedules

    const fetchAllData = useCallback(async () => {
        try {
            setLoading(true);
            const [fetchedLeases, fetchedTenants, fetchedProperties, fetchedUnits] = await Promise.all([
                api.get(LEASE_KEY),
                api.get(TENANT_KEY),
                api.get(PROPERTY_KEY),
                api.get(UNIT_KEY)
            ]);
            setLeases(fetchedLeases || []);
            setTenants(fetchedTenants || []);
            setProperties(fetchedProperties.properties || []);
            setUnits(fetchedUnits || []);
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError('Failed to load data.');
            alert('Failed to load data.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchTenants = useCallback(async () => {
        try {
            const fetchedTenants = await api.get(TENANT_KEY);
            setTenants(fetchedTenants || []);
        } catch (err) {
            console.error('Failed to fetch tenants:', err);
        }
    }, []);

    const fetchProperties = useCallback(async () => {
        try {
            const fetchedProperties = await api.get(PROPERTY_KEY);
            setProperties(fetchedProperties.properties || []);
        } catch (err) {
            console.error('Failed to fetch properties:', err);
        }
    }, []);

    const fetchUnits = useCallback(async () => {
        try {
            const fetchedUnits = await api.get(UNIT_KEY);
            setUnits(fetchedUnits || []);
        } catch (err) {
            console.error('Failed to fetch units:', err);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const getLeaseStatus = useCallback((lease) => {
        const today = new Date().setHours(0, 0, 0, 0);
        const startDate = new Date(lease.startDate).setHours(0, 0, 0, 0);
        const endDate = new Date(lease.endDate).setHours(0, 0, 0, 0);

        if (today > endDate) {
            return { text: 'Expired', class: 'status-expired' };
        }
        if (today >= startDate && today <= endDate) {
            return { text: 'Active', class: 'status-active' };
        }
        return { text: 'Upcoming', class: 'status-upcoming' };
    }, []);

    // Helper to Get ID from populated object or string ID
    const getMongoId = (field) => {
        if (!field) return null;
        return typeof field === 'object' ? field._id : field;
    };

    const filteredLeases = leases.filter(lease => {
        const tenantId = getMongoId(lease.tenantId);
        const unitId = getMongoId(lease.unitId);
        
        const tenant = tenants.find(t => t._id === tenantId);
        const unit = units.find(u => u._id === unitId);
        const property = unit ? properties.find(p => p._id === getMongoId(unit.propertyId)) : null;
        
        const searchLower = searchTerm.toLowerCase();
        return (tenant && tenant.name.toLowerCase().includes(searchLower)) ||
               (property && property.name.toLowerCase().includes(searchLower)) ||
               (unit && unit.unitNumber.toLowerCase().includes(searchLower));
    });

    // --- Lease Form Modal Logic ---
    const leaseFormRef = useRef(null);
    const [formTenantId, setFormTenantId] = useState('');
    const [formPropertyId, setFormPropertyId] = useState('');
    const [formUnitId, setFormUnitId] = useState('');
    const [formStartDate, setFormStartDate] = useState('');
    const [formEndDate, setFormEndDate] = useState('');
    const [formRentAmount, setFormRentAmount] = useState('');
    const [formWithholdingAmount, setFormWithholdingAmount] = useState('');
    const [isWithholdingApplied, setIsWithholdingApplied] = useState(false);
    const [leaseAgreementFile, setLeaseAgreementFile] = useState(null);
    const [withholdingReceiptFile, setWithholdingReceiptFile] = useState(null);
    const [leaseAgreementFileName, setLeaseAgreementFileName] = useState('');
    const [withholdingReceiptFileName, setWithholdingReceiptFileName] = useState('');
    const [availableUnitsForProperty, setAvailableUnitsForProperty] = useState([]);

    // Auto-calculate withholding amount when rent changes or withholding checkbox toggles
    useEffect(() => {
        if (isWithholdingApplied && formRentAmount) {
            const taxCalculator = new TaxCalculator();
            // For lease withholding, use the withholding tax rate (15%)
            const withholdingAmount = parseFloat(formRentAmount) * taxCalculator.settings.withholdingTaxRate;
            setFormWithholdingAmount(withholdingAmount.toFixed(2));
        } else if (!isWithholdingApplied) {
            setFormWithholdingAmount('');
        }
    }, [formRentAmount, isWithholdingApplied]);

    const openLeaseModal = useCallback(async (lease = null, renewal = false) => {
        // Refresh data when opening the modal to ensure newly added tenants, properties, and units are included
        await Promise.all([fetchTenants(), fetchProperties(), fetchUnits()]);
        setCurrentLease(lease);
        setIsRenewal(renewal);
        
        const leaseTenantId = getMongoId(lease?.tenantId);
        const leaseUnitId = getMongoId(lease?.unitId);
        
        // Find property ID from the unit if available
        let leasePropertyId = '';
        if (leaseUnitId) {
            const unit = units.find(u => u._id === leaseUnitId);
            if (unit) {
                leasePropertyId = getMongoId(unit.propertyId);
            }
        }

        setFormTenantId(leaseTenantId || '');
        setFormPropertyId(leasePropertyId || '');
        setFormUnitId(leaseUnitId || '');
        setFormStartDate(renewal ? (new Date(new Date(lease.endDate).setDate(new Date(lease.endDate).getDate() + 1))).toISOString().split('T')[0] : lease?.startDate || '');
        setFormEndDate(renewal ? (new Date(new Date(lease.endDate).setFullYear(new Date(lease.endDate).getFullYear() + 1))).toISOString().split('T')[0] : lease?.endDate || '');
        setFormRentAmount(lease?.rentAmount || '');
        setFormWithholdingAmount(lease?.withholdingAmount || '');
        setIsWithholdingApplied(!!lease?.withholdingAmount);
        setLeaseAgreementFile(null);
        setWithholdingReceiptFile(null);
        setLeaseAgreementFileName(lease?.leaseAgreementName || '');
        setWithholdingReceiptFileName(lease?.withholdingReceiptName || '');
        setIsLeaseModalOpen(true);
    }, [units, fetchTenants, fetchProperties, fetchUnits]);

    useEffect(() => {
        if (formPropertyId) {
            const activeLeaseUnitIds = leases
                .filter(l => getLeaseStatus(l).text === 'Active' && l._id !== currentLease?._id)
                .map(l => getMongoId(l.unitId));
            
            const unitsForProperty = units.filter(u => {
                const uPropId = getMongoId(u.propertyId);
                return uPropId === formPropertyId && u.status === 'Available' && !activeLeaseUnitIds.includes(u._id);
            });
            setAvailableUnitsForProperty(unitsForProperty);
        } else {
            setAvailableUnitsForProperty([]);
        }
    }, [formPropertyId, units, leases, currentLease, getLeaseStatus]);

    const handleLeaseFormSubmit = async (e) => {
        e.preventDefault();

        // Basic form validation
        if (formTenantId === '' || formPropertyId === '' || formUnitId === '' || !formStartDate || !formEndDate || !formRentAmount) {
            alert('Please fill in all required fields.');
            return;
        }

        let leaseAgreementUrl = currentLease?.leaseAgreementUrl || null;
        let withholdingReceiptUrl = currentLease?.withholdingReceiptUrl || null;
        let leaseAgreementName = currentLease?.leaseAgreementName || null;
        let withholdingReceiptName = currentLease?.withholdingReceiptName || null;

        if (leaseAgreementFile) {
            leaseAgreementUrl = await readFileAsDataURL(leaseAgreementFile);
            leaseAgreementName = leaseAgreementFile.name;
        }
        if (withholdingReceiptFile) {
            withholdingReceiptUrl = await readFileAsDataURL(withholdingReceiptFile);
            withholdingReceiptName = withholdingReceiptFile.name;
        }

        const leaseData = {
            id: currentLease && !isRenewal ? currentLease._id : undefined,
            tenantId: formTenantId,
            propertyId: formPropertyId,
            unitId: formUnitId,
            startDate: formStartDate,
            endDate: formEndDate,
            rentAmount: parseFloat(formRentAmount),
            withholdingAmount: parseFloat(formWithholdingAmount) || null,
            leaseAgreementUrl,
            leaseAgreementName,
            withholdingReceiptUrl,
            withholdingReceiptName,
        };

        try {
            if (currentLease && !isRenewal) {
                await api.put(`${LEASE_KEY}/${currentLease._id}`, leaseData);
                // Optimistic update: use the string IDs in leaseData, the UI will handle safely via getMongoId
                setLeases(leases.map(l => l._id === currentLease._id ? { ...l, ...leaseData } : l));
                showNotification('Lease updated successfully!', 'success');
            } else {
                const newLease = await api.post(LEASE_KEY, leaseData);
                setLeases([...leases, newLease]);
                showNotification('Lease created successfully!', 'success');
            }

            // Update tenant and unit records
            try {
                const tenantToUpdate = tenants.find(t => t._id === leaseData.tenantId);
                if (tenantToUpdate) {
                    await api.put(`${TENANT_KEY}/${tenantToUpdate._id}`, { unitId: leaseData.unitId });
                }

                const unitToUpdate = units.find(u => u._id === leaseData.unitId);
                if (unitToUpdate) {
                    await api.put(`${UNIT_KEY}/${unitToUpdate._id}`, { tenantId: leaseData.tenantId, status: 'Occupied' });
                }
            } catch (updateErr) {
                console.error('Failed to update tenant/unit status:', updateErr);
            }

            setIsLeaseModalOpen(false);
            fetchAllData(); // Re-fetch all data to ensure consistency and proper population
        } catch (err) {
            console.error('Failed to save lease:', err);
            // Log the full error object for debugging
            console.log(JSON.stringify(err, null, 2)); 
            showNotification(`Failed to save lease: ${err.message || 'Unknown error'}`, 'error');
        }
    };

    // --- Lease Details Modal Logic ---
    const openLeaseDetailsModal = useCallback((lease) => {
        // Ensure we navigate using the ID
        const leaseId = getMongoId(lease); 
        if(leaseId) navigate(`/leases/${leaseId}`);
    }, [navigate]);

    const handleViewFile = (e, url) => {
        if (!url) return;
        if (url.startsWith('data:')) {
            e.preventDefault();
            try {
                const parts = url.split(',');
                if (parts.length < 2) return;
                const mimeMatch = parts[0].match(/:(.*?);/);
                const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
                const bstr = atob(parts[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                const blob = new Blob([u8arr], { type: mime });
                const blobUrl = URL.createObjectURL(blob);
                window.open(blobUrl, '_blank');
            } catch (err) {
                console.error('Error opening data URL:', err);
                window.open(url, '_blank'); // Fallback
            }
        }
    };

    const handlePreview = (url, name) => {
        let fileType = 'other';
        if (url.startsWith('data:application/pdf') || url.toLowerCase().split('?')[0].endsWith('.pdf')) {
          fileType = 'application/pdf';
        } else if (url.startsWith('data:image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(url.split('?')[0])) {
          fileType = 'image';
        }
        setPreviewFile({ url, name, type: fileType });
        setPreviewModalOpen(true);
    };

    const renderDocPreview = (url, name) => {
        if (!url) return <p className="text-sm text-gray-500">Not provided</p>;
        return (
            <Button 
                variant="secondary" 
                onClick={() => handlePreview(url, name)}
                style={{ fontSize: '0.8rem', padding: '4px 12px' }}
            >
                <i className="fa-solid fa-eye" style={{ marginRight: '5px' }}></i>
                Preview
            </Button>
        );
    };

    // --- Action Handlers ---
    const handleAddLease = () => openLeaseModal();

    const handleEditLease = (lease) => {
        openLeaseModal(lease);
    };

    const handleRenewLease = (leaseId) => {
        const leaseToRenew = leases.find(l => l._id === leaseId);
        if (leaseToRenew) openLeaseModal(leaseToRenew, true);
    };

    const handleDeleteLease = async (leaseId) => {
        if (window.confirm('Are you sure you want to delete this lease?')) {
            try {
                console.log('Deleting lease with ID:', leaseId);
                await api.delete(LEASE_KEY, leaseId);
                setLeases(leases.filter(l => l._id !== leaseId));
                alert('Lease deleted successfully!');
                fetchAllData(); 
            } catch (err) {
                console.error('Failed to delete lease:', err);
                alert(`Failed to delete lease: ${err.message || 'Unknown error'}`);
            }
        }
    };

    const debouncedSearch = useRef(debounce((value) => setSearchTerm(value), 300)).current;

    if (loading) {
        return (
            <div className="loading-indicator">
                <i className="fa-solid fa-spinner fa-spin"></i>
                <p>Loading leases...</p>
            </div>
        );
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <main id="main-content">
            <div id="leases-view">
                <div className="page-header">
                    <div>
                        <h1>Lease Agreements</h1>
                        <p>Manage all active, expired, and upcoming leases.</p>
                    </div>
                    {(user?.role === 'admin' || user?.role === 'property_manager' || user?.role === 'tenant' || user?.role === 'customer' || user?.role === 'owner') && (
                        <Button variant="secondary" onClick={handleAddLease}>
                            <i className="fa-solid fa-plus"></i>
                            <span>Add Lease</span>
                        </Button>
                    )}
                </div>

                <div className="data-card">
                    <div className="table-header">
                        <input
                            type="text"
                            id="search-input"
                            className="form-input"
                            placeholder="Search by tenant, property, or unit..."
                            onChange={(e) => debouncedSearch(e.target.value)}
                        />
                    </div>
                    <div className="table-container">
                        {filteredLeases.length > 0 ? (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Tenant</th>
                                        <th>Property / Unit</th>
                                        <th>Lease Period</th>
                                        <th>Withholding</th>
                                        <th>Rent</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="leases-table-body">
                                    {filteredLeases.map(lease => {
                                        const leaseId = lease._id || lease.id; // Robust ID extraction
                                        const tenantId = getMongoId(lease.tenantId);
                                        const unitId = getMongoId(lease.unitId);
                                        
                                        const tenant = tenants.find(t => (t._id || t.id) === tenantId);
                                        const unit = units.find(u => (u._id || u.id) === unitId);
                                        const unitPropertyId = getMongoId(unit?.propertyId);
                                        const property = unitPropertyId ? properties.find(p => (p._id || p.id) === unitPropertyId) : null;
                                        
                                        const status = getLeaseStatus(lease);
                                        return (
                                            <tr key={`lease-${leaseId}`}>
                                                <td>{tenant?.name || 'N/A'}</td>
                                                <td>
                                                    {property?.name || 'N/A'}
                                                    <span className="lease-property-unit"> Unit {unit?.unitNumber || 'N/A'}</span>
                                                </td>
                                                <td>{formatDate(lease.startDate)} - {formatDate(lease.endDate)}</td>
                                                <td>{lease.withholdingAmount ? formatCurrency(lease.withholdingAmount) : 'None'}</td>
                                                <td>{formatCurrency(lease.rentAmount)}</td>
                                                <td><span className={`status-badge ${status.class}`}>{status.text}</span></td>
                                                <td>
                                                    <div className="action-dropdown">
                                                        <button type="button" className="action-dropdown-btn" onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenActionId(openActionId === leaseId ? null : leaseId);
                                                        }}>
                                                            <i className="fa-solid fa-ellipsis-vertical"></i>
                                                        </button>
                                                        {openActionId === leaseId && (
                                                        <div className="dropdown-menu show">
                                                            <a key="view" href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); openLeaseDetailsModal(lease); }}>
                                                                <i className="fa-solid fa-eye"></i>View Details
                                                            </a>
                                                                 <a key="edit" href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleEditLease(lease); }}>
                                                                    <i className="fa-solid fa-pencil"></i>Edit
                                                                </a>
                                                                <a key="delete" href="#" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleDeleteLease(leaseId); }}>
                                                                    <i className="fa-solid fa-trash-can"></i>Delete
                                                                </a>
                                                        </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div id="empty-state" className="empty-state">
                                <i className="fa-solid fa-file-signature"></i>
                                <h3>No Leases Found</h3>
                                <p>Get started by adding a new lease agreement.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lease Add/Edit Modal */}
            <Modal
                title={isRenewal ? 'Renew Lease' : (currentLease ? 'Edit Lease' : 'Add New Lease')}
                isOpen={isLeaseModalOpen}
                onClose={() => setIsLeaseModalOpen(false)}
                maxWidth="700px"
            >
                <form ref={leaseFormRef} onSubmit={handleLeaseFormSubmit}>
                    <input type="hidden" id="lease-id" value={currentLease?._id || ''} />
                    <div className="form-group">
                        <div className="form-label-group">
                            <label htmlFor="lease-tenant" className="form-label">Tenant</label>
                            <a href="/tenants" target="_blank" className="form-label-action">Add New Tenant <i className="fa-solid fa-external-link-alt fa-xs"></i></a>
                        </div>
                        <select
                            id="lease-tenant"
                            className="form-input"
                            value={formTenantId}
                            onChange={(e) => setFormTenantId(e.target.value)}
                            required
                        >
                            <option key="default-tenant" value="">Select a tenant</option>
                            {tenants.filter(t => {
                                const activeLeaseTenantIds = leases
                                    .filter(l => getLeaseStatus(l).text === 'Active' && l._id !== currentLease?._id)
                                    .map(l => getMongoId(l.tenantId));
                                return !activeLeaseTenantIds.includes(t._id) || t._id === getMongoId(currentLease?.tenantId);
                            }).map(t => (
                                <option key={t._id} value={t._id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-row-columns">
                        <div className="form-group">
                            <label htmlFor="lease-property" className="form-label">Property</label>
                            <select
                                id="lease-property"
                                className="form-input"
                                value={formPropertyId}
                                onChange={(e) => {
                                    setFormPropertyId(e.target.value);
                                    setFormUnitId(''); // Reset unit when property changes
                                }}
                                required
                            >
                                <option key="default-property" value="">Select a property</option>
                                {properties.map(p => (
                                    <option key={`property-${p._id}`} value={p._id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="lease-unit" className="form-label">Unit</label>
                            <select
                                id="lease-unit"
                                className="form-input"
                                value={formUnitId}
                                onChange={(e) => setFormUnitId(e.target.value)}
                                required
                            >
                                <option key="default-unit" value="">Select a unit</option>
                                {availableUnitsForProperty.map(u => (
                                    <option key={`unit-${u._id}`} value={u._id}>Unit {u.unitNumber}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {/* ... Rest of form inputs ... */}
                    <div className="form-row-columns">
                        <div className="form-group">
                            <label htmlFor="lease-start-date" className="form-label">Start Date</label>
                            <input
                                type="date"
                                id="lease-start-date"
                                className="form-input"
                                value={formStartDate}
                                onChange={(e) => setFormStartDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="lease-end-date" className="form-label">End Date</label>
                            <input
                                type="date"
                                id="lease-end-date"
                                className="form-input"
                                value={formEndDate}
                                onChange={(e) => setFormEndDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-row-columns">
                        <div className="form-group">
                            <label htmlFor="lease-rent" className="form-label">Monthly Rent (ETB)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <NumberInput
                                    value={formRentAmount}
                                    onChange={(value) => setFormRentAmount(value)}
                                    placeholder="Enter rent amount"
                                    className="form-input"
                                    min={0}
                                    required
                                />
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.875rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={isWithholdingApplied}
                                        onChange={(e) => setIsWithholdingApplied(e.target.checked)}
                                    />
                                    Withholding Tax Applied
                                </label>
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="lease-withholding" className="form-label">Withholding Amount (Optional)</label>
                            <NumberInput
                                value={formWithholdingAmount}
                                onChange={(value) => setFormWithholdingAmount(value)}
                                placeholder="Auto-calculated if withholding applied"
                                className="form-input"
                                min={0}
                                readOnly={isWithholdingApplied}
                                disabled={isWithholdingApplied}
                            />
                        </div>
                    </div>
                    <div className="form-row-columns">
                        <div className="form-group">
                            <label htmlFor="lease-agreement-file" className="form-label">Lease Agreement</label>
                            <input
                                type="file"
                                id="lease-agreement-file"
                                className="form-input"
                                accept="image/*,.pdf"
                                onChange={(e) => setLeaseAgreementFile(e.target.files[0])}
                            />
                            <small className="form-hint" id="lease-agreement-info">
                                {leaseAgreementFile?.name || leaseAgreementFileName || 'Upload PDF or image'}
                            </small>
                        </div>
                        <div className="form-group">
                            <label htmlFor="withholding-receipt-file" className="form-label">Withholding Receipt</label>
                            <input
                                type="file"
                                id="withholding-receipt-file"
                                className="form-input"
                                accept="image/*,.pdf"
                                onChange={(e) => setWithholdingReceiptFile(e.target.files[0])}
                            />
                            <small className="form-hint" id="withholding-receipt-info">
                                {withholdingReceiptFile?.name || withholdingReceiptFileName || 'Upload PDF or image'}
                            </small>
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="close-modal-btn btn-secondary" onClick={() => setIsLeaseModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn-primary">Save Lease</button>
                    </div>
                </form>
            </Modal>

            {/* Lease Details Modal */}
            <Modal
                title={`Lease Details: ${tenants.find(t => t._id === getMongoId(currentLease?.tenantId))?.name || 'N/A'}`}
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                maxWidth="800px"
            >
                {currentLease && (
                    <div className="lease-details-grid">
                        <div className="detail-section">
                            <h4>Lease & Property</h4>
                            <div className="detail-item"><span>Tenant</span><span>{tenants.find(t => t._id === getMongoId(currentLease.tenantId))?.name || 'N/A'}</span></div>
                            <div className="detail-item">
                                <span>Property</span>
                                <span>{properties.find(p => p._id === units.find(u => u._id === getMongoId(currentLease.unitId))?.propertyId._id || units.find(u => u._id === getMongoId(currentLease.unitId))?.propertyId)?.name || 'N/A'}</span>
                            </div>
                            <div className="detail-item"><span>Unit</span><span>{units.find(u => u._id === getMongoId(currentLease.unitId))?.unitNumber || 'N/A'}</span></div>
                            <div className="detail-item"><span>Period</span><span>{formatDate(currentLease.startDate)} to {formatDate(currentLease.endDate)}</span></div>
                            <div className="detail-item"><span>Status</span><span><span className={`status-badge ${getLeaseStatus(currentLease).class}`}>{getLeaseStatus(currentLease).text}</span></span></div>
                        </div>
                        <div className="detail-section">
                            <h4>Financials</h4>
                            <div className="detail-item"><span>Monthly Rent</span><span>{formatCurrency(currentLease.rentAmount)}</span></div>
                            <div className="detail-item"><span>Withholding</span><span>{currentLease.withholdingAmount ? formatCurrency(currentLease.withholdingAmount) : 'N/A'}</span></div>
                        </div>
                        <div className="detail-section">
                            <h4>Documents</h4>
                            <div className="detail-item">
                                <span>Lease Agreement</span>
                                <span>{renderDocPreview(currentLease.leaseAgreementUrl, currentLease.leaseAgreementName)}</span>
                            </div>
                            <div className="detail-item">
                                <span>Withholding Receipt</span>
                                <span>{renderDocPreview(currentLease.withholdingReceiptUrl, currentLease.withholdingReceiptName)}</span>
                            </div>
                        </div>
                    </div>
                )}
                <div className="form-actions">
                    <button type="button" className="close-modal-btn btn-secondary" onClick={() => setIsDetailsModalOpen(false)}>Close</button>
                </div>
            </Modal>

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

export default Leases;
