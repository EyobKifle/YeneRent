import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../../utils/api';
import { formatCurrency, formatDate, printFile } from '../../utils/utils';
import Button from '../../components/ui/Button';
import SharePrintModal from '../../components/ui/SharePrintModal';
import DocumentPreviewModal from '../../components/ui/DocumentPreviewModal';
import './LeaseDetails.css';

export default function LeaseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lease, setLease] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState({ url: '', name: '', type: '' });

  useEffect(() => {
    const fetchLease = async () => {
      try {
        setLoading(true);
        const [leaseData, tenantsData, propertiesData, unitsData] = await Promise.all([
          api.get(`/leases/${id}`),
          api.get('/tenants'),
          api.get('/properties'),
          api.get('/units')
        ]);
        setLease(leaseData);
        setTenants(tenantsData || []);
        setProperties(propertiesData.properties || []);
        setUnits(unitsData || []);
      } catch (err) {
        console.error(err);
        setFetchError('Failed to load lease details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchLease();
    }
  }, [id]);

  const attachments = useMemo(() => {
      const items = [];
      if (lease?.leaseAgreementUrl) {
          const url = getImageUrl(lease.leaseAgreementUrl);
          const isPdf = lease.leaseAgreementUrl.toLowerCase().endsWith('.pdf');
          items.push({ type: isPdf ? 'pdf' : 'image', name: lease.leaseAgreementName || 'Lease Agreement', url });
      }
      if (lease?.withholdingReceiptUrl) {
          const url = getImageUrl(lease.withholdingReceiptUrl);
          const isPdf = lease.withholdingReceiptUrl.toLowerCase().endsWith('.pdf');
          items.push({ type: isPdf ? 'pdf' : 'image', name: lease.withholdingReceiptName || 'Withholding Receipt', url });
      }
      return items;
  }, [lease]);

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
            ? { title: `Lease Details`, url: window.location.href }
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

  const handleBack = () => {
    navigate('/leases');
  };

  const handleEdit = () => {
    navigate(`/leases/${id}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this lease?')) {
      try {
        await api.delete(`/leases/${id}`);
        navigate('/leases');
      } catch {
        alert('Failed to delete lease');
      }
    }
  };

  const getLeaseStatus = (lease) => {
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
      <div style={{ marginTop: '8px', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Button 
          variant="secondary" 
          onClick={() => handlePreview(url, name)}
          style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
        >
          <i className="fa-solid fa-eye"></i> Preview
        </Button>
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (fetchError) {
    return <div className="error">Error: {fetchError}</div>;
  }

  if (!lease) {
    return <div className="no-lease">Lease not found.</div>;
  }

  const leaseTenantId = lease.tenantId?._id || lease.tenantId;
  const leaseUnitId = lease.unitId?._id || lease.unitId;
  
  const tenant = tenants.find(t => (t._id || t.id) === leaseTenantId);
  const unit = units.find(u => (u._id || u.id) === leaseUnitId);
  const unitPropertyId = unit?.propertyId?._id || unit?.propertyId;
  const property = unitPropertyId ? properties.find(p => (p._id || p.id) === unitPropertyId) : null;
  const status = getLeaseStatus(lease);

  const fields = [
    { label: 'Tenant', value: tenant?.name || 'N/A' },
    { label: 'Property', value: property?.name || 'N/A' },
    { label: 'Unit', value: unit?.unitNumber || 'N/A' },
    { label: 'Period', value: `${formatDate(lease.startDate)} to ${formatDate(lease.endDate)}` },
    { label: 'Status', value: status.text },
    { label: 'Monthly Rent', value: formatCurrency(lease.rentAmount) },
    { label: 'Withholding', value: lease.withholdingAmount ? formatCurrency(lease.withholdingAmount) : 'N/A' },
  ];

  return (
    <div className="lease-details-page">
      <div className="page-header">
        <div>
          <Button variant="secondary" onClick={handleBack}>
            <i className="fa-solid fa-arrow-left"></i> Back to Leases
          </Button>
          <h1>Lease Details: {tenant?.name || 'N/A'}</h1>
          <p>View comprehensive information for this lease.</p>
        </div>
        <div className="page-actions">
          <Button variant="secondary" onClick={() => setShareModalOpen(true)}>
            <i className="fa-solid fa-share" /> Share
          </Button>
          <Button variant="secondary" onClick={() => setPrintModalOpen(true)}>
            <i className="fa-solid fa-print" /> Print
          </Button>
          <Button variant="primary" onClick={handleEdit}>
            <i className="fa-solid fa-edit" /> Edit
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <i className="fa-solid fa-trash" /> Delete
          </Button>
        </div>
      </div>

      <div className="data-card">
        <div className="lease-details-grid">
          <div className="detail-section">
            <h4>Lease & Property</h4>
            {fields.slice(0, 5).map((f, idx) => (
              <div key={idx} className="detail-item">
                <span>{f.label}</span>
                <span>{f.value}</span>
              </div>
            ))}
          </div>
          <div className="detail-section">
            <h4>Financials</h4>
            {fields.slice(5).map((f, idx) => (
              <div key={idx} className="detail-item">
                <span>{f.label}</span>
                <span>{f.value}</span>
              </div>
            ))}
          </div>
          <div className="detail-section">
            <h4>Documents</h4>
            <div className="detail-item">
              <span>Lease Agreement</span>
              <span>{renderDocPreview(lease.leaseAgreementUrl, lease.leaseAgreementName)}</span>
            </div>
            <div className="detail-item">
              <span>Withholding Receipt</span>
              <span>{renderDocPreview(lease.withholdingReceiptUrl, lease.withholdingReceiptName)}</span>
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
    </div>
  );
}
