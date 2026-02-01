import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { get } from '../../utils/api'; // Assuming 'get' is exported from api.js
import { formatDate, formatCurrency, printFile } from '../../utils/utils';
import Button from '../../components/ui/Button';
import SharePrintModal from '../../components/ui/SharePrintModal';
import DocumentPreviewModal from '../../components/ui/DocumentPreviewModal';
import { getImageUrl } from '../../utils/api';
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
    
    // Share/Print State
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [printModalOpen, setPrintModalOpen] = useState(false);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState({ url: '', name: '', type: '' });

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

    const attachments = React.useMemo(() => {
        const items = [];
        if (currentUnit?.imageUrl) {
            items.push({ type: 'image', name: 'Unit Image', url: getImageUrl(currentUnit.imageUrl) });
        }
        unitDocuments.forEach(doc => {
            items.push({ type: 'document', name: doc.name, url: getImageUrl(doc.url) });
        });
        return items;
    }, [currentUnit, unitDocuments]);

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
                ? { title: `Unit: ${currentUnit.unitNumber}`, url: window.location.href }
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

    const handleEdit = () => {
        // navigate(`/units/${id}/edit`);
        alert('Edit unit');
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this unit?')) {
            try {
                await api.delete(`units/${id}`);
                alert('Unit deleted successfully');
                navigate('/units');
            } catch (err) {
                console.error('Failed to delete unit:', err);
                alert('Failed to delete unit');
            }
        }
    };

    const openDocumentModal = (doc) => {
        setPreviewFile({
            url: doc.url,
            name: doc.name,
            type: doc.type
        });
        setPreviewModalOpen(true);
    };

    const closeDocumentModal = () => {
        setPreviewModalOpen(false);
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

    const renderDocumentModal = () => null; // Replaced by DocumentPreviewModal

    return (
        <main id="main-content" className="main-content">
            <div id="unit-details-view">
                <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <Button variant="secondary" onClick={handleBack}>
                            <i className="fa-solid fa-arrow-left"></i> Back to Units
                        </Button>
                        <h1 style={{ marginTop: '10px' }}>Unit {currentUnit.unitNumber} Details</h1>
                    </div>
                    <div className="page-actions" style={{ display: 'flex', gap: '10px' }}>
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
                onClose={closeDocumentModal}
                fileUrl={previewFile.url}
                fileName={previewFile.name}
                fileType={previewFile.type}
            />
        </main>
    );
};

export default UnitDetails;
