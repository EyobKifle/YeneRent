import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { get } from '../../utils/api'; // Assuming 'get' is exported from api.js
import { formatDate, formatCurrency } from '../../utils/utils';
import './UnitDetails.css'; // Import the specific CSS for this component

const UnitDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentUnit, setCurrentUnit] = useState(null);
    const [properties, setProperties] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [leases, setLeases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedDocument, setSelectedDocument] = useState(null);

    const UNIT_KEY = 'units';
    const PROPERTY_KEY = 'properties';
    const TENANT_KEY = 'tenants';
    const DOCUMENT_KEY = 'documents';
    const LEASE_KEY = 'leases';

    useEffect(() => {
        const fetchUnitDetails = async () => {
            if (!id) {
                alert('Unit ID not found in URL.'); // Placeholder for notification
                navigate('/units');
                return;
            }

            try {
                const [fetchedProperties, fetchedTenants, fetchedDocuments, fetchedLeases, units] = await Promise.all([
                    get(PROPERTY_KEY),
                    get(TENANT_KEY),
                    get(DOCUMENT_KEY),
                    get(LEASE_KEY),
                    get(UNIT_KEY)
                ]);

                setProperties(fetchedProperties);
                setTenants(fetchedTenants);
                setDocuments(fetchedDocuments);
                setLeases(fetchedLeases);

                // Ensure units is an array
                const unitsArray = Array.isArray(units) ? units : [];
                const foundUnit = unitsArray.find(u => {
                    const uId = (u._id || u.id)?.toString();
                    return uId === id.toString();
                });

                if (!foundUnit) {
                    alert('Unit not found.');
                    navigate('/units');
                    return;
                }
                setCurrentUnit(foundUnit);
            } catch (err) {
                console.error('Failed to fetch unit details:', err);
                setError('Failed to load unit details.');
                alert('Failed to load unit details.'); // Placeholder for notification
            } finally {
                setLoading(false);
            }
        };

        fetchUnitDetails();
    }, [id, navigate]);

    const handleBack = () => {
        navigate('/units'); // Assuming /units is the list page
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const openDocumentModal = (doc) => {
        setSelectedDocument(doc);
    };

    const closeDocumentModal = () => {
        setSelectedDocument(null);
    };

    if (loading) {
        return <div className="loading">Loading unit details...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!currentUnit) {
        return <div className="no-unit">Unit not found.</div>;
    }

    const currentUnitId = currentUnit._id || currentUnit.id;
    const property = properties.find(p => (p._id || p.id) === (currentUnit.propertyId?._id || currentUnit.propertyId));
    const unitTenants = tenants.filter(t => (t.unitId?._id || t.unitId) === currentUnitId);
    const unitDocuments = documents.filter(d => (d.unitId?._id || d.unitId) === currentUnitId);
    const unitLeases = leases.filter(l => (l.unitId?._id || l.unitId) === currentUnitId);

    const renderOverview = () => (
        <div className="details-summary-card">
            <div className="summary-item">
                <span className="summary-label">Unit Name</span>
                <span className="summary-value">{currentUnit.name}</span>
            </div>
            <div className="summary-item">
                <span className="summary-label">Property</span>
                <span className="summary-value">{property ? property.name : 'N/A'}</span>
            </div>
            <div className="summary-item">
                <span className="summary-label">Rent</span>
                <span className="summary-value">{formatCurrency(currentUnit.rent)}</span>
            </div>
            <div className="summary-item">
                <span className="summary-label">Status</span>
                <span className="summary-value">{currentUnit.status}</span>
            </div>
            <div className="summary-item">
                <span className="summary-label">Tenants</span>
                <span className="summary-value">{unitTenants.length}</span>
            </div>
            <div className="summary-item">
                <span className="summary-label">Leases</span>
                <span className="summary-value">{unitLeases.length}</span>
            </div>
        </div>
    );

    const renderTenants = () => (
        <div className="data-card">
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Lease Start</th>
                        <th>Lease End</th>
                    </tr>
                </thead>
                <tbody>
                    {unitTenants.length === 0 ? (
                        <tr><td colSpan={5} className="text-center p-4">No tenants assigned to this unit.</td></tr>
                    ) : unitTenants.map(tenant => {
                        const tId = tenant._id || tenant.id;
                        const lease = unitLeases.find(l => (l.tenantId?._id || l.tenantId) === tId);
                        return (
                            <tr key={tId}>
                                <td>{tenant.name}</td>
                                <td>{tenant.email}</td>
                                <td>{tenant.phone}</td>
                                <td>{lease ? formatDate(lease.startDate) : 'N/A'}</td>
                                <td>{lease ? formatDate(lease.endDate) : 'N/A'}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    const renderDocuments = () => (
        <div className="data-card">
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Upload Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {unitDocuments.length === 0 ? (
                        <tr><td colSpan={4} className="text-center p-4">No documents for this unit.</td></tr>
                    ) : unitDocuments.map(doc => (
                        <tr key={doc._id || doc.id}>
                            <td>{doc.name}</td>
                            <td>{doc.category}</td>
                            <td>{formatDate(doc.uploadDate)}</td>
                            <td>
                                <button onClick={() => openDocumentModal(doc)} className="btn-secondary">View</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderDocumentModal = () => {
        if (!selectedDocument) return null;

        return (
            <div className="modal-overlay" onClick={closeDocumentModal}>
                <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>{selectedDocument.name}</h2>
                        <button className="close-modal-btn" onClick={closeDocumentModal}>&times;</button>
                    </div>
                    <div id="modal-body" className="document-view">
                        <div className="document-preview">
                            {selectedDocument.type && selectedDocument.type.startsWith('image/') ? (
                                <img src={selectedDocument.url} alt={selectedDocument.name} />
                            ) : selectedDocument.type === 'application/pdf' ? (
                                <iframe src={selectedDocument.url} title={selectedDocument.name}></iframe>
                            ) : (
                                <p>Preview not available for this file type.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <main id="main-content" className="main-content">
            <div id="unit-details-view">
                <button onClick={handleBack} className="btn-secondary back-btn">
                    <i className="fa-solid fa-arrow-left"></i> Back to Units
                </button>

                {renderOverview()}

                <div className="unit-details-tabs">
                    <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => handleTabChange('overview')}>Overview</button>
                    <button className={`tab-btn ${activeTab === 'tenants' ? 'active' : ''}`} onClick={() => handleTabChange('tenants')}>Tenants</button>
                    <button className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => handleTabChange('documents')}>Documents</button>
                </div>

                <div className={`tab-content ${activeTab === 'overview' ? 'active' : ''}`}>
                    {renderOverview()}
                </div>

                <div className={`tab-content ${activeTab === 'tenants' ? 'active' : ''}`}>
                    {renderTenants()}
                </div>

                <div className={`tab-content ${activeTab === 'documents' ? 'active' : ''}`}>
                    {renderDocuments()}
                </div>

                {renderDocumentModal()}
            </div>
        </main>
    );
};

export default UnitDetails;
