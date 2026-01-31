import React, { useMemo } from 'react';
import Modal from './Modal';
import Button from './Button';
import { getImageUrl } from '../../utils/api';

// fields: [{ label, value }]
// attachments: [{ url, type, name }]
export default function DetailsModal({ isOpen, title, onClose, fields = [], attachments = [], permalink }) {
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

  const renderPreview = (att) => {
    if (!att || !att.url) return null;
    const fullUrl = getImageUrl(att.url);
    const type = (att.type || '').toLowerCase();
    
    if (type.startsWith('image/')) {
      return (
        <div className="details-preview">
          <img src={fullUrl} alt={att.name || 'Attachment'} style={{ maxWidth: '100%', borderRadius: 6 }} />
        </div>
      );
    }
    if (type === 'application/pdf') {
      return (
        <div className="details-preview" style={{ height: 400 }}>
          <iframe title="PDF Preview" src={fullUrl} style={{ width: '100%', height: '100%', border: 'none' }} />
        </div>
      );
    }
    return (
      <div className="details-preview">
        <a href={att.url} target="_blank" rel="noreferrer">Open attachment</a>
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
        {renderPreview(primaryAttachment)}
      </div>
    </Modal>
  );
}
