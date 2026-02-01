import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../../utils/api';
import Button from './Button';
import { printFile } from '../../utils/utils';
import './DocumentPreviewModal.css';

export default function DocumentPreviewModal({ isOpen, onClose, fileUrl, fileName, fileType }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && fileUrl) {
      setLoading(true);
      setError(null);
      setCurrentPage(1);
      
      // For PDFs, we'll use an iframe and estimate pages
      // For images, totalPages = 1
      if (isPDF(fileUrl)) {
        // PDF handling - we'll load it in an iframe
        setTotalPages(1); // Will be updated if we can detect pages
      } else if (isImage(fileUrl)) {
        setTotalPages(1);
      }
      
      setLoading(false);
    }
  }, [isOpen, fileUrl]);

  const isPDF = (url) => {
    if (!url) return false;
    if (url.startsWith('data:application/pdf')) return true;
    if (url.startsWith('blob:')) return fileType === 'application/pdf';
    return url.toLowerCase().split('?')[0].endsWith('.pdf') || fileType === 'application/pdf';
  };

  const isImage = (url) => {
    if (!url) return false;
    if (url.startsWith('data:image/')) return true;
    if (url.startsWith('blob:')) return fileType?.startsWith('image/');
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url.split('?')[0]) || fileType?.startsWith('image/');
  };

  const isWord = (url) => {
    if (!url) return false;
    if (fileType === 'application/msword' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return true;
    return /\.(doc|docx)$/i.test(url.split('?')[0]);
  };

  const isExcel = (url) => {
    if (!url) return false;
    if (fileType === 'application/vnd.ms-excel' || fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return true;
    return /\.(xls|xlsx)$/i.test(url.split('?')[0]);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrint = () => {
    const fullUrl = getImageUrl(fileUrl);
    printFile(fullUrl);
  };

  const handleDownload = () => {
    const fullUrl = getImageUrl(fileUrl);
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = fileName || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  const fullUrl = getImageUrl(fileUrl);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="document-preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="preview-modal-header">
          <div className="preview-modal-title">
            <i className="fa-solid fa-file-lines"></i>
            <span>{fileName || 'Document Preview'}</span>
          </div>
          <button className="preview-modal-close" onClick={onClose}>
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        <div className="preview-modal-body">
          {loading && (
            <div className="preview-loading">
              <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
              <p>Loading preview...</p>
            </div>
          )}

          {error && (
            <div className="preview-error">
              <i className="fa-solid fa-exclamation-triangle fa-2x"></i>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {isPDF(fileUrl) && (
                <iframe
                  src={`${fullUrl}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=0`}
                  title={fileName || 'PDF Preview'}
                  className="preview-iframe"
                  onLoad={() => setLoading(false)}
                />
              )}

              {isImage(fileUrl) && (
                <div className="preview-image-container">
                  <img
                    src={fullUrl}
                    alt={fileName || 'Image Preview'}
                    className="preview-image"
                    onLoad={() => setLoading(false)}
                    onError={() => setError('Failed to load image')}
                  />
                </div>
              )}
              
              {(isWord(fileUrl) || isExcel(fileUrl)) && (
                   <div className="preview-office-container" style={{width: '100%', height: '100%'}}>
                       <div style={{
                           display: 'flex', 
                           flexDirection: 'column', 
                           alignItems: 'center', 
                           justifyContent: 'center', 
                           height: '100%', 
                           backgroundColor: '#f3f4f6', 
                           color: '#4b5563',
                           textAlign: 'center',
                           padding: '2rem'
                       }}>
                           <i className={`fa-solid ${isWord(fileUrl) ? 'fa-file-word' : 'fa-file-excel'} fa-4x`} style={{ marginBottom: '1rem', color: isWord(fileUrl) ? '#2b579a' : '#1d6f42' }}></i>
                           <h3 style={{fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem'}}>{fileName || 'Document'}</h3>
                           <p style={{marginBottom: '1.5rem'}}>
                               Previewing {isWord(fileUrl) ? 'Word' : 'Excel'} documents requires downloading.
                           </p>
                           <Button variant="primary" onClick={handleDownload}>
                                <i className="fa-solid fa-download"></i> Download to View
                           </Button>
                       </div>
                   </div>
              )}

              {!isPDF(fileUrl) && !isImage(fileUrl) && !isWord(fileUrl) && !isExcel(fileUrl) && (
                <div className="preview-unsupported">
                  <i className="fa-solid fa-file fa-3x"></i>
                  <p>Preview not available for this file type</p>
                  <p className="preview-hint">Please download the file to view it</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="preview-modal-footer">
          <div className="preview-navigation">
            {isPDF(fileUrl) && totalPages > 1 && (
              <>
                <Button
                  variant="secondary"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <i className="fa-solid fa-chevron-left"></i> Previous
                </Button>
                <span className="preview-page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next <i className="fa-solid fa-chevron-right"></i>
                </Button>
              </>
            )}
          </div>

          <div className="preview-actions">
            <Button variant="secondary" onClick={handleDownload}>
              <i className="fa-solid fa-download"></i> Download
            </Button>
            <Button variant="secondary" onClick={handlePrint}>
              <i className="fa-solid fa-print"></i> Print
            </Button>
            <Button variant="primary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
