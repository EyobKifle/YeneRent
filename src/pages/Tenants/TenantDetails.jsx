import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { formatCurrency } from '../../utils/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../../components/ui/Button';
import './TenantDetails.css';

export default function TenantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/tenants/${id}`);
        setTenant(response.data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTenant();
    }
  }, [id]);

  const handleBack = () => {
    navigate('/tenants');
  };

  const handleEdit = () => {
    navigate(`/tenants/${id}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this tenant?')) {
      try {
        await api.delete(`/tenants/${id}`);
        navigate('/tenants');
      } catch {
        alert('Failed to delete tenant');
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `Tenant Details: ${tenant.name}`, url: window.location.href });
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

  const primaryAttachment = useMemo(() => tenant?.attachments && tenant.attachments.length > 0 ? tenant.attachments[0] : null, [tenant]);

  const renderPreview = () => {
    if (!primaryAttachment) return null;
    const type = (primaryAttachment.type || '').toLowerCase();
    if (type.startsWith('image/')) {
      return (
        <div className="details-preview">
          <img src={primaryAttachment.url} alt={primaryAttachment.name || 'Attachment'} style={{ maxWidth: '100%', borderRadius: 6 }} />
        </div>
      );
    }
    if (type === 'application/pdf') {
      return (
        <div className="details-preview" style={{ height: 400 }}>
          <iframe title="PDF Preview" src={primaryAttachment.url} style={{ width: '100%', height: '100%', border: 'none' }} />
        </div>
      );
    }
    return (
      <div className="details-preview">
        <a href={primaryAttachment.url} target="_blank" rel="noreferrer">Open attachment</a>
      </div>
    );
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!tenant) {
    return <div className="no-tenant">Tenant not found.</div>;
  }

  const fields = [
    { label: 'Name', value: tenant.name },
    { label: 'Email', value: tenant.email },
    { label: 'Phone', value: tenant.phone },
    { label: 'Address', value: tenant.address },
    { label: 'Unit', value: tenant.unit?.name || 'N/A' },
    { label: 'Lease Start', value: tenant.leaseStart ? new Date(tenant.leaseStart).toLocaleDateString(language) : 'N/A' },
    { label: 'Lease End', value: tenant.leaseEnd ? new Date(tenant.leaseEnd).toLocaleDateString(language) : 'N/A' },
    { label: 'Monthly Rent', value: formatCurrency(tenant.monthlyRent || 0) },
    { label: 'Balance', value: formatCurrency(tenant.balance || 0) },
    { label: 'Status', value: tenant.status },
  ];

  return (
    <div className="tenant-details-page">
      <div className="page-header">
        <div>
          <Button variant="secondary" onClick={handleBack}>
            <i className="fa-solid fa-arrow-left"></i> Back to Tenants
          </Button>
          <h1>Tenant Details: {tenant.name}</h1>
          <p>View comprehensive information for this tenant.</p>
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
        <div className="tenant-details-grid">
          <div className="detail-section">
            <h4>Tenant Information</h4>
            {fields.map((f, idx) => (
              <div key={idx} className="detail-item">
                <span>{f.label}</span>
                <span>{f.value}</span>
              </div>
            ))}
          </div>
          {primaryAttachment && (
            <div className="detail-section">
              <h4>Attachment</h4>
              {renderPreview()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
