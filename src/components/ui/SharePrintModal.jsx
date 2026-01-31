import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

// items: [{ type: 'document'|'image'|'file', name, url }]
const SharePrintModal = ({ isOpen, onClose, title = "Share or Print", mode = "share", items = [], onAction }) => {
  const [selectedItem, setSelectedItem] = useState('all'); // 'all' or item index

  if (!isOpen) return null;

  const handleConfirm = () => {
    onAction(selectedItem);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === 'share' ? 'Share' : 'Print'}>
      <div className="share-print-modal">
        <p style={{ marginBottom: 16 }}>Select what you want to {mode}:</p>
        
        <div className="option-list" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <label className="radio-option" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, border: '1px solid #eee', borderRadius: 6, cursor: 'pointer' }}>
            <input 
              type="radio" 
              name="selection" 
              value="all" 
              checked={selectedItem === 'all'} 
              onChange={() => setSelectedItem('all')}
            />
            <span>Entire Document (Details + Attachments)</span>
          </label>

          {items.map((item, idx) => (
            <label key={idx} className="radio-option" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, border: '1px solid #eee', borderRadius: 6, cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="selection" 
                value={idx} 
                checked={selectedItem === idx} 
                onChange={() => setSelectedItem(idx)}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className={`fa-solid ${item.type === 'image' ? 'fa-image' : 'fa-file'}`}></i>
                {item.name || `Attachment ${idx + 1}`}
              </span>
            </label>
          ))}
        </div>

        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirm}>
            {mode === 'share' ? 'Share' : 'Print'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default SharePrintModal;
