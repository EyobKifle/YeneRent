import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../../utils/api';
import { formatCurrency } from '../../utils/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../../components/ui/Button';
import SharePrintModal from '../../components/ui/SharePrintModal';
import './TenantDetails.css';

export default function TenantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leases, setLeases] = useState([]);
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  
  // Share/Print State
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all necessary data to reconstruct details if specific endpoints return limited data
        const [tenantRes, leasesRes, unitsRes, propertiesRes] = await Promise.all([
             api.get('tenants'), // Fetch all tenants to find by ID if single fetch fails or returns different structure
             api.get('leases'),
             api.get('units'),
             api.get('properties')
        ]);
        
        const tenantsList = tenantRes || [];
        const foundTenant = tenantsList.find(t => (t._id || t.id) === id);
        
        if (!foundTenant) {
             // Try fetching single if list lookup failed (maybe pagination?)
             try {
                const singleRes = await api.get(`tenants/${id}`);
                setTenant(singleRes);
             } catch(e) {
                if (tenantsList.length > 0) throw new Error('Tenant not found');
                throw e;
             }
        } else {
            setTenant(foundTenant);
        }

        setLeases(leasesRes || []);
        setUnits(unitsRes || []);
        setProperties(propertiesRes.properties || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load tenant details');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const tenantLease = useMemo(() => {
      if (!tenant) return null;
      return leases.find(l => (l.tenantId === (tenant._id || tenant.id) || (typeof l.tenantId === 'object' && l.tenantId._id === (tenant._id||tenant.id))));
  }, [tenant, leases]);

  const tenantUnit = useMemo(() => {
      const uId = tenant?.unitId || tenantLease?.unitId;
      if (!uId) return null;
      const uIdStr = typeof uId === 'object' ? uId._id : uId;
      return units.find(u => (u._id || u.id) === uIdStr);
  }, [tenant, tenantLease, units]);

  const tenantProperty = useMemo(() => {
      if (!tenantUnit) return null;
      const pId = typeof tenantUnit.propertyId === 'object' ? tenantUnit.propertyId._id : tenantUnit.propertyId;
      return properties.find(p => (p._id || p.id) === pId);
  }, [tenantUnit, properties]);


  const attachments = useMemo(() => {
    // Tenant might have profile picture or documents? 
    // Assuming 'attachments' array based on previous code or specific fields
    const items = [];
    if (tenant?.profilePicture) { // Example field
        items.push({ type: 'image', name: 'Profile Picture', url: getImageUrl(tenant.profilePicture) });
    }
    // Check lease documents if linked?
    if (tenantLease) {
        if (tenantLease.leaseAgreementUrl) items.push({ type: 'document', name: 'Lease Agreement', url: getImageUrl(tenantLease.leaseAgreementUrl) });
    }
    return items;
  }, [tenant, tenantLease]);

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
            ? { title: `Tenant: ${tenant.name}`, url: window.location.href }
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

  const handleBack = () => navigate('/tenants');
  const handleEdit = () => navigate(`/tenants/${id}/edit`);
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this tenant?')) {
      try {
        await api.delete(`tenants/${id}`);
        navigate('/tenants');
      } catch {
        alert('Failed to delete tenant');
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error || !tenant) return <div className="error">{error || 'Tenant not found'}</div>;

  const fields = [
    { label: 'Name', value: tenant.name },
    { label: 'Email', value: tenant.email },
    { label: 'Phone', value: tenant.phone },
    { label: 'TIN Number', value: tenant.tinNumber || 'N/A' },
    { label: 'Status', value: tenant.status || 'Active' }, // field usually exists?
    { label: 'Property', value: tenantProperty?.name || 'N/A' },
    { label: 'Unit', value: tenantUnit?.unitNumber || 'N/A' },
    { label: 'Lease Start', value: tenantLease ? new Date(tenantLease.startDate).toLocaleDateString() : 'N/A' },
    { label: 'Lease End', value: tenantLease ? new Date(tenantLease.endDate).toLocaleDateString() : 'N/A' },
    { label: 'Emergency Contact', value: tenant.emergencyContact ? `${tenant.emergencyContact.name} (${tenant.emergencyContact.phone})` : 'N/A' },
  ];

  return (
    <div className="tenant-details-page">
      <div className="page-header">
        <div>
          <Button variant="secondary" onClick={handleBack}>
            <i className="fa-solid fa-arrow-left"></i> Back to Tenants
          </Button>
          <h1>Tenant Details: {tenant.name}</h1>
        </div>
        <div className="page-actions" style={{display:'flex', gap:10}}>
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

      <div className="data-card" style={{padding:20}}>
        <div className="tenant-details-grid" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:30}}>
          <div className="detail-section">
            <h4 style={{marginBottom:15, borderBottom:'1px solid #eee', paddingBottom:5}}>Tenant Information</h4>
            {fields.map((f, idx) => (
              <div key={idx} className="detail-item" style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f5f5f5'}}>
                <span style={{fontWeight:500, color:'#555'}}>{f.label}</span>
                <span>{f.value}</span>
              </div>
            ))}
          </div>
          
          <div className="detail-section">
             <h4 style={{marginBottom:15, borderBottom:'1px solid #eee', paddingBottom:5}}>Attachments & Files</h4>
             {attachments.length === 0 ? <p className="text-gray-500">No attachments found.</p> : (
                 <div style={{display:'grid', gap:15}}>
                     {attachments.map((att, i) => (
                         <div key={i} style={{border:'1px solid #eee', borderRadius:8, overflow:'hidden'}}>
                            {att.type === 'image' ? (
                                <img src={att.url} alt={att.name} style={{width:'100%', height:'auto', display:'block'}} />
                            ) : (
                                <div style={{padding:20, textAlign:'center', background:'#f9f9f9'}}>
                                    <i className="fa-solid fa-file-pdf fa-3x" style={{color:'#e74c3c', marginBottom:10}}></i>
                                    <p>{att.name}</p>
                                    <a href={att.url} target="_blank" rel="noreferrer" style={{color:'#2563eb', textDecoration:'underline'}}>View Document</a>
                                </div>
                            )}
                         </div>
                     ))}
                 </div>
             )}
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
    </div>
  );
}
