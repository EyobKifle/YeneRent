import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { formatCurrency, formatDate } from '../../utils/utils';
import Button from '../../components/ui/Button';
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

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `Lease Details: ${tenants.find(t => t.id === lease?.tenantId)?.name || 'N/A'}`, url: window.location.href });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard');
      } else {
        alert('Sharing is not supported on this device.');
      }
    } catch (e) {
      console.error('Share failed', e);
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

  const renderDocPreview = (url, name) => {
    if (!url) return <p className="text-sm text-gray-500">Not provided</p>;
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="document-preview-sm">
        <i className="fa-solid fa-file-lines fa-2x"></i>
        <p className="text-sm">{name || 'View File'}</p>
      </a>
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

  const tenant = tenants.find(t => t.id === lease.tenantId);
  const unit = units.find(u => u.id === lease.unitId);
  const property = unit ? properties.find(p => p.id === unit.propertyId) : null;
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
          <Button variant="secondary" onClick={handleShare}>
            <i className="fa-solid fa-share" /> Share
          </Button>
          <Button variant="secondary" onClick={handlePrint}>
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
    </div>
  );
}
