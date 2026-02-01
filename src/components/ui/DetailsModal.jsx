import React, { useMemo, useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import DocumentPreviewModal from './DocumentPreviewModal';
import { getImageUrl } from '../../utils/api';

// fields: [{ label, value }]
// attachments: [{ url, type, name }]
export default function DetailsModal({ isOpen, title, onClose, fields = [], attachments = [], permalink }) {
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState({ url: '', name: '', type: '' });
  const primaryAttachment = useMemo(() => attachments && attachments.length > 0 ? attachments[0] : null, [attachments]);

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleShare = async () => {
    try {
      if (canShare) {
        await navigator.share({ title: title || 'Details', url: permalink || window.location.href });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(permalink || window.location.href);
        alert('Link copied to clipboard');
      } else {
        alert('Sharing is not supported on this device.');
      }
    } catch (e) {
      console.error('Share failed', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePreview = (url, name, type) => {
    setPreviewFile({ url, name, type });
    setPreviewModalOpen(true);
  };

  const renderPreview = (att) => {
    if (!att || !att.url) return null;
    const fullUrl = getImageUrl(att.url);
    const type = (att.type || '').toLowerCase();
    
    // Robust type detection
    const isImage = type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|avif)$/i.test(att.url);
    const isPdf = type === 'application/pdf' || type.includes('pdf') || att.url.toLowerCase().endsWith('.pdf');
    
    if (isImage) {
      return (
        <div className="details-preview" style={{ marginTop: '1rem', textAlign: 'center' }}>
          <img src={fullUrl} alt={att.name || 'Attachment'} style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
          <div style={{ marginTop: '8px' }}>
            <Button 
              variant="secondary" 
              onClick={() => handlePreview(att.url, att.name || 'Image', type)}
              style={{ fontSize: '0.8rem', padding: '4px 12px' }}
            >
              <i className="fa-solid fa-eye" style={{ marginRight: '8px' }} />
              Preview & Actions
            </Button>
          </div>
        </div>
      );
    }
    
    if (isPdf) {
      return (
        <div className="details-preview" style={{ height: 450, marginTop: '1rem', display: 'flex', flexDirection: 'column', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
          <iframe title="PDF Preview" src={fullUrl} style={{ width: '100%', flex: 1, border: 'none' }} />
          <div style={{ padding: '10px', textAlign: 'center', background: '#f9f9f9', borderTop: '1px solid #eee' }}>
            <Button 
              variant="secondary" 
              onClick={() => handlePreview(att.url, att.name || 'PDF', type)}
              style={{ fontSize: '0.8rem', padding: '4px 12px' }}
            >
              <i className="fa-solid fa-eye" style={{ marginRight: '8px' }} />
              Preview & Actions
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="details-preview" style={{ marginTop: '1rem', textAlign: 'center' }}>
        <Button 
          variant="secondary" 
          onClick={() => handlePreview(att.url, att.name || 'File', type)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
        >
          <i className="fa-solid fa-eye" /> Preview & Actions: {att.name || 'File'}
        </Button>
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="details-modal-body">
        <div className="details-actions" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Button variant="secondary" onClick={handleShare}><i className="fa-solid fa-share" /> Share</Button>
          <Button variant="secondary" onClick={handlePrint}><i className="fa-solid fa-print" /> Print</Button>
        </div>
        {fields && fields.length > 0 && (
          <div className="details-fields" style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
            {fields.map((f, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', padding: '6px 0' }}>
                <strong>{f.label}</strong>
                <span>{f.value}</span>
              </div>
            ))}
          </div>
        )}
        {attachments && attachments.length > 0 && (
          <div className="details-attachments" style={{ display: 'grid', gap: '1rem' }}>
            {attachments.map((att, idx) => (
              <div key={idx} className="attachment-wrapper">
                {attachments.length > 1 && <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem' }}>Attachment {idx + 1}: {att.name}</div>}
                {renderPreview(att)}
              </div>
            ))}
          </div>
        )}
      </div>
      <DocumentPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        fileUrl={previewFile.url}
        fileName={previewFile.name}
        fileType={previewFile.type}
      />
    </Modal>
  );
}
