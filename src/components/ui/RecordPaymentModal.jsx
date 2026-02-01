import { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import api from '../../utils/api';
import { useNotification } from '../../contexts/NotificationContext';

const RecordPaymentModal = ({ isOpen, onClose, onPaymentRecorded, editPayment = null }) => {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState({
    leaseId: '',
    amount: '',
    type: 'Rent',
    includeWithholding: false,
    withholdingAmount: '',
    date: new Date().toISOString().split('T')[0], // Today's date
    dueDate: '',
    method: '',
    status: 'Paid',
    receiptNumber: '',
    invoiceNumber: '',
    notes: '',
    receiptImage: null
  });
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchLeases();
      if (editPayment) {
        setFormData({
          leaseId: editPayment.leaseId?._id || editPayment.leaseId || '',
          amount: editPayment.amount?.toString() || '',
          type: editPayment.type || 'Rent',
          includeWithholding: editPayment.withholdingAmount > 0,
          withholdingAmount: editPayment.withholdingAmount?.toString() || '',
          date: editPayment.date ? new Date(editPayment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          dueDate: editPayment.dueDate ? new Date(editPayment.dueDate).toISOString().split('T')[0] : '',
          method: editPayment.method || '',
          status: editPayment.status || 'Paid',
          receiptNumber: editPayment.receiptNumber || '',
          invoiceNumber: editPayment.invoiceNumber || '',
          notes: editPayment.notes || '',
          receiptImage: null
        });
      }
    }
  }, [isOpen, editPayment]);

  // Auto-populate fields when lease is selected
  useEffect(() => {
    if (formData.leaseId && leases.length > 0) {
      const selectedLease = leases.find(lease => (lease._id || lease.id) === formData.leaseId);
      if (selectedLease) {
        const rentAmount = selectedLease.rentAmount || 0;
        
        // Calculate next due date based on lease start date or existing payments
        const startDate = new Date(selectedLease.startDate);
        const today = new Date();
        const monthsDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
        const nextDueDate = new Date(startDate);
        nextDueDate.setMonth(startDate.getMonth() + monthsDiff + 1);
        
        setFormData(prev => ({
          ...prev,
          amount: rentAmount.toString(),
          dueDate: nextDueDate.toISOString().split('T')[0],
          includeWithholding: true // Default to true for Rent
        }));
      }
    }
  }, [formData.leaseId, leases]);

  // Update withholding when amount or type changes (only if includeWithholding is checked)
  useEffect(() => {
    if (formData.includeWithholding && formData.amount && formData.type === 'Rent') {
      const withholding = parseFloat(formData.amount) * 0.15;
      setFormData(prev => ({ ...prev, withholdingAmount: withholding.toFixed(2) }));
    } else if (!formData.includeWithholding) {
      setFormData(prev => ({ ...prev, withholdingAmount: '0' }));
    }
  }, [formData.amount, formData.type, formData.includeWithholding]);

  const fetchLeases = async () => {
    try {
      const leasesData = await api.get('leases');
      setLeases(leasesData || []);
    } catch (error) {
      console.error('Error fetching leases:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, files, checked } = e.target;
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0] || null
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.leaseId) newErrors.leaseId = 'Lease is required';
    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    if (!formData.date) newErrors.date = 'Payment date is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
    if (!formData.method) newErrors.method = 'Payment method is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const selectedLease = leases.find(lease => (lease._id || lease.id) === formData.leaseId);
      if (!selectedLease) {
        throw new Error('Selected lease not found');
      }

      let receiptUrl = null;
      let receiptName = null;

      // Upload image if present
      if (formData.receiptImage) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', formData.receiptImage);

        const uploadResponse = await api.post('uploads/document', formDataUpload);

        receiptUrl = uploadResponse.url;
        receiptName = formData.receiptImage.name;
      }

      const paymentData = {
        leaseId: formData.leaseId,
        tenantId: selectedLease.tenantId?._id || selectedLease.tenantId,
        propertyId: selectedLease.propertyId?._id || selectedLease.propertyId,
        amount: parseFloat(formData.amount),
        type: formData.type,
        withholdingAmount: formData.includeWithholding ? parseFloat(formData.withholdingAmount) || 0 : 0,
        date: formData.date,
        dueDate: formData.dueDate,
        method: formData.method,
        status: formData.status,
        receiptNumber: formData.receiptNumber || undefined,
        invoiceNumber: formData.invoiceNumber || undefined,
        receiptUrl,
        receiptName,
        notes: formData.notes || undefined
      };

      const pId = editPayment?._id || editPayment?.id;
      let result;
      if (pId) {
        result = await api.put(`payments/${pId}`, paymentData);
        showNotification('Payment updated successfully!', 'success');
      } else {
        result = await api.post('payments', paymentData);
        showNotification('Payment recorded successfully!', 'success');
      }
      
      onPaymentRecorded(result);
      handleClose();
    } catch (error) {
      console.error('Error recording payment:', error);
      const errorMessage = error.message || error.error || 'Failed to record payment';
      showNotification(`Error: ${errorMessage}`, 'error');
      if (error.errors) {
        setErrors(error.errors.reduce((acc, err) => ({ ...acc, [err.path]: err.msg }), {}));
      } else if (error.error) {
        setErrors({ general: error.error });
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      leaseId: '',
      amount: '',
      type: 'Rent',
      includeWithholding: false,
      withholdingAmount: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      method: '',
      status: 'Paid',
      receiptNumber: '',
      invoiceNumber: '',
      notes: '',
      receiptImage: null
    });
    setErrors({});
    onClose();
  };

  const paymentMethods = [
    { value: 'Bank Transfer', label: 'Bank Transfer', icon: 'fa-solid fa-building-columns' },
    { value: 'Cash', label: 'Cash', icon: 'fa-solid fa-money-bill-wave' },
    { value: 'CBE Birr', label: 'CBE Birr', icon: 'fa-solid fa-mobile-screen-button' },
    { value: 'Dashen Bank', label: 'Dashen Bank', icon: 'fa-solid fa-building-columns' },
    { value: 'Awash International Bank', label: 'Awash International Bank', icon: 'fa-solid fa-building-columns' },
    { value: 'Other', label: 'Other', icon: 'fa-solid fa-ellipsis' }
  ];

  return (
    <Modal title="Record Payment" isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="modal-form">
        {errors.general && (
          <div className="error-message" style={{ color: 'red', marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#fee', borderRadius: '4px' }}>
            {errors.general}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="leaseId">Lease <span style={{color: 'red'}}>*</span></label>
          <select
            id="leaseId"
            name="leaseId"
            value={formData.leaseId}
            onChange={handleInputChange}
            className={errors.leaseId ? 'error' : ''}
            style={errors.leaseId ? { borderColor: 'red' } : {}}
          >
            <option value="">Select Lease</option>
            {leases.map(lease => (
              <option key={lease._id || lease.id} value={lease._id || lease.id}>
                {lease.tenantId?.name || 'Unknown Tenant'} - {lease.propertyId?.name || 'Unknown Property'} (Unit {lease.unitId?.unitNumber || 'N/A'})
              </option>
            ))}
          </select>
          {errors.leaseId && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem', display: 'block', marginTop: '0.25rem' }}>{errors.leaseId}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount <span style={{color: 'red'}}>*</span></label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            className={errors.amount ? 'error' : ''}
            style={errors.amount ? { borderColor: 'red' } : {}}
          />
          {errors.amount && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem', display: 'block', marginTop: '0.25rem' }}>{errors.amount}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="type">Payment Type</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
          >
            <option value="Rent">Rent</option>
            <option value="Deposit">Deposit</option>
            <option value="Late Fee">Late Fee</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Utility">Utility</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {formData.type === 'Rent' && (
          <div className="form-group">
            <label className="checkbox-container">
              <input
                type="checkbox"
                id="includeWithholding"
                name="includeWithholding"
                checked={formData.includeWithholding}
                onChange={handleInputChange}
                className="checkbox-input"
                disabled // Made read-only as per request
              />
              <span className="checkbox-custom"></span>
              <span className="checkbox-label">
                Include Withholding Tax (15%) - <small style={{color: '#666'}}>Determined by system</small>
              </span>
            </label>
          </div>
        )}


        {formData.includeWithholding && formData.type === 'Rent' && (
          <div className="form-group">
            <label htmlFor="withholdingAmount">Withholding Amount (Read-only)</label>
            <input
              type="number"
              id="withholdingAmount"
              name="withholdingAmount"
              value={formData.withholdingAmount}
              step="0.01"
              min="0"
              readOnly
              style={{ backgroundColor: '#f9f9f9', cursor: 'not-allowed', color: '#666' }}
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="date">Payment Date <span style={{color: 'red'}}>*</span></label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className={errors.date ? 'error' : ''}
            style={errors.date ? { borderColor: 'red' } : {}}
          />
          {errors.date && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem', display: 'block', marginTop: '0.25rem' }}>{errors.date}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="dueDate">Due Date <span style={{color: 'red'}}>*</span></label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleInputChange}
            className={errors.dueDate ? 'error' : ''}
            style={errors.dueDate ? { borderColor: 'red' } : {}}
          />
          {errors.dueDate && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem', display: 'block', marginTop: '0.25rem' }}>{errors.dueDate}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="method">Payment Method <span style={{color: 'red'}}>*</span></label>
          <select
            id="method"
            name="method"
            value={formData.method}
            onChange={handleInputChange}
            className={errors.method ? 'error' : ''}
            style={errors.method ? { borderColor: 'red' } : {}}
          >
            <option value="">Select Payment Method</option>
            {paymentMethods.map(method => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
          {errors.method && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem', display: 'block', marginTop: '0.25rem' }}>{errors.method}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
          >
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
            <option value="Failed">Failed</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="receiptNumber">Receipt Number (Optional)</label>
          <input
            type="text"
            id="receiptNumber"
            name="receiptNumber"
            value={formData.receiptNumber}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="invoiceNumber">Invoice Number (Optional)</label>
          <input
            type="text"
            id="invoiceNumber"
            name="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="receiptImage">Receipt / Attachment (Optional)</label>
          <input
            type="file"
            id="receiptImage"
            name="receiptImage"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            onChange={handleInputChange}
          />
          {formData.receiptImage ? (
            <div className="attachment-preview" style={{ marginTop: '1rem', border: '1px solid #ddd', borderRadius: '8px', padding: '8px', position: 'relative' }}>
              {formData.receiptImage.type.startsWith('image/') ? (
                <img 
                  src={URL.createObjectURL(formData.receiptImage)} 
                  alt="Receipt Preview" 
                  style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px', display: 'block', margin: '0 auto' }} 
                />
              ) : formData.receiptImage.type === 'application/pdf' ? (
                <div style={{ height: '300px' }}>
                  <iframe 
                    src={URL.createObjectURL(formData.receiptImage) + "#toolbar=0"} 
                    title="PDF Preview"
                    style={{ width: '100%', height: '100%', border: 'none', borderRadius: '4px' }}
                  />
                </div>
              ) : formData.receiptImage.name.match(/\.(docx?|xlsx?)$/i) ? (
                <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                  <i className={`fa-solid ${formData.receiptImage.name.match(/\.xlsx?$/i) ? 'fa-file-excel' : 'fa-file-word'} fa-3x`} style={{ color: formData.receiptImage.name.match(/\.xlsx?$/i) ? '#1d6f42' : '#2b579a', marginBottom: '10px' }}></i>
                  <p>{formData.receiptImage.name}</p>
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>Document will be converted to PDF after upload</p>
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                  <i className="fa-solid fa-file fa-3x" style={{ color: '#666', marginBottom: '10px' }}></i>
                  <p>{formData.receiptImage.name}</p>
                </div>
              )}
              <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px', textAlign: 'center' }}>
                Selected: {formData.receiptImage.name} ({(formData.receiptImage.size / (1024)).toFixed(1)} KB)
              </div>
            </div>
          ) : (
            <div className="image-placeholder" style={{ border: '2px dashed #ddd', borderRadius: '8px', padding: '20px', textAlign: 'center', color: '#999' }}>
                <i className="fa-solid fa-receipt fa-2x" style={{ marginBottom: '10px' }}></i>
                <p>No receipt or document selected (PDF, Image, Word, or Excel)</p>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes (Optional)</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows="3"
          />
        </div>

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? (editPayment ? 'Updating...' : 'Recording...') : (editPayment ? 'Update Payment' : 'Record Payment')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RecordPaymentModal;
