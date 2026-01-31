import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getImageUrl } from '../../utils/api';
import Button from '../../components/ui/Button';
import SharePrintModal from '../../components/ui/SharePrintModal';

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
            } catch (ignore) {}
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
            // Open image in new window to print
            const w = window.open(item.url);
            if (w) {
                w.onload = () => { w.print(); }
            }
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
          <Button variant="primary" onClick={() => navigate(`/utilities`)}>
             Edit (in list)
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
                    <h3>Receipt</h3>
                    <div style={{ marginTop: 10 }}>
                        <img src={attachments[0].url} alt="Receipt" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #ddd' }} />
                    </div>
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
    </div>
  );
}

const rowStyle = { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: 5 };
