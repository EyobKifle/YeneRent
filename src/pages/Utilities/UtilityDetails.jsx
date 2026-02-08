import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../../utils/api';
import Button from '../../components/ui/Button';
import { printFile } from '../../utils/utils';
import SharePrintModal from '../../components/ui/SharePrintModal';
import DocumentPreviewModal from '../../components/ui/DocumentPreviewModal';

export default function UtilityDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [utility, setUtility] = useState(null);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Share/Print State
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState({ url: '', name: '', type: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // We might need to fetch all utilities to find one or fetch strictly by ID if endpoint supports it.
        // Assuming /utilities/:id exists as per standard REST, but previous code used array find.
        // Let's try direct fetch, if 404 fallback to finding in list is safer if backend is weird.
        // But backend routes show router.get('/:id', ...), so direct fetch should work.
        const res = await api.get(`utilities/${id}`);
        setUtility(res);
        
        if (res.propertyId) {
            // propertyId might be populated object or string
            const propId = typeof res.propertyId === 'object' ? res.propertyId._id : res.propertyId;
            try {
                const propRes = await api.get(`properties`); // Fetch all or single?
                // Optimization: fetch single if possible, currently we fetch all properties usually.
                // Let's stick to simple if we can.
                const p = propRes.properties.find(x => x._id === propId || x.id === propId);
                setProperty(p);
                            } catch (err) {
                console.error('Failed to fetch property for utility:', err);
            }
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load utility details');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const attachments = useMemo(() => {
    if (!utility?.receiptUrl) return [];
    return [{
        type: 'image',
        name: utility.receiptName || 'Receipt',
        url: getImageUrl(utility.receiptUrl)
    }];
  }, [utility]);

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
            ? { title: `Utility: ${utility.type}`, url: window.location.href }
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

  const handlePreview = (url, name, type) => {
    let fileType = type;
    if (!fileType) {
        if (url.toLowerCase().split('?')[0].endsWith('.pdf')) {
            fileType = 'application/pdf';
        } else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url.split('?')[0])) {
            fileType = 'image';
        } else {
            fileType = 'other';
        }
    }
    setPreviewFile({ url, name, type: fileType });
    setPreviewModalOpen(true);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this utility bill?')) {
        try {
            await api.delete(`utilities/${id}`);
            alert('Utility bill deleted successfully');
            navigate('/utilities');
        } catch (err) {
            console.error('Failed to delete utility bill:', err);
            alert('Failed to delete utility bill');
        }
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error || !utility) return <div className="p-8 text-center text-red-500">{error || 'Utility not found'}</div>;

  return (
    <div className="utility-details-page">
      <div className="page-header">
        <div>
          <Button variant="secondary" onClick={() => navigate('/utilities')}>
            <i className="fa-solid fa-arrow-left"></i> Back
          </Button>
          <h1>{utility.type} Bill Details</h1>
          <p>Due Date: {new Date(utility.dueDate).toLocaleDateString()}</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" onClick={() => setShareModalOpen(true)}>
            <i className="fa-solid fa-share"></i> Share
          </Button>
          <Button variant="secondary" onClick={() => setPrintModalOpen(true)}>
            <i className="fa-solid fa-print"></i> Print
          </Button>
          <Button variant="primary" onClick={() => navigate(`/utilities?editId=${id}`)}>
             <i className="fa-solid fa-pencil"></i> Edit
          </Button>
          <Button variant="danger" onClick={handleDelete}>
             <i className="fa-solid fa-trash-can"></i> Delete
          </Button>
        </div>
      </div>

      <div className="data-card" style={{ padding: 20, marginTop: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
                <h3>Information</h3>
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={rowStyle}><strong>Property:</strong> <span>{property?.name || 'N/A'}</span></div>
                    <div style={rowStyle}><strong>Provider:</strong> <span>{utility.provider || 'N/A'}</span></div>
                    <div style={rowStyle}><strong>Bill Number:</strong> <span>{utility.billNumber || 'N/A'}</span></div>
                    <div style={rowStyle}><strong>Amount:</strong> <span>${Number(utility.amount).toFixed(2)}</span></div>
                    <div style={rowStyle}><strong>Status:</strong> <span className={`status-badge status-${(utility.status||'').toLowerCase()}`}>{utility.status}</span></div>
                    {utility.reading && (
                         <div style={rowStyle}><strong>Readings:</strong> <span>Prev: {utility.reading.previous} | Curr: {utility.reading.current}</span></div>
                    )}
                </div>
            </div>
            
            {attachments.length > 0 && (
                <div>
                    <h3 style={{ marginBottom: 15 }}>Receipt</h3>
                    {(() => {
                        const attachment = attachments[0];
                        const fullUrl = attachment.url;
                        const isPdf = fullUrl.toLowerCase().split('?')[0].endsWith('.pdf') || attachment.name.toLowerCase().endsWith('.pdf');
                        
                        const renderContainer = (content) => (
                            <div className="detail-image-preview" style={{width: '100%', border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: 'white', padding: '0.75rem'}}>
                                {content}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                    <span style={{fontWeight: 'bold', fontSize: '0.9rem'}}>{attachment.name}</span>
                                    <Button variant="secondary" onClick={() => handlePreview(fullUrl, attachment.name, isPdf ? 'application/pdf' : 'image')} style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                                        Preview
                                    </Button>
                                </div>
                            </div>
                        );

                        if (isPdf) {
                            return renderContainer(
                                <div style={{ height: '200px', width: '100%', overflow: 'hidden', backgroundColor: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <iframe 
                                        src={fullUrl + "#toolbar=0&navpanes=0&scrollbar=0"} 
                                        title="Receipt PDF" 
                                        style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }} 
                                    />
                                </div>
                            );
                        }

                        return renderContainer(
                            <img 
                                src={fullUrl} 
                                alt={attachment.name} 
                                onClick={() => handlePreview(fullUrl, attachment.name, 'image')} 
                                style={{ cursor: 'pointer', height: '200px', objectFit: 'cover', width: '100%', borderRadius: '4px' }} 
                            />
                        );
                    })()}
                </div>
            )}
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

const rowStyle = { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: 5 };
