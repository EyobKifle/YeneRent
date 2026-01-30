import { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import NumberInput from './NumberInput';
import api from '../../utils/api';

const RecordPaymentModal = ({ isOpen, onClose, onPaymentRecorded }) => {
  const [formData, setFormData] = useState({
    leaseId: '',
    amount: '',
    type: 'Rent',
    withholdingAmount: '',
    date: new Date().toISOString().split('T')[0], // Today's date
    dueDate: '',
    method: '',
    status: 'Paid',
    transactionNumber: '',
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
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.amount && formData.type === 'Rent') {
      const withholding = parseFloat(formData.amount) * 0.15;
      setFormData(prev => ({ ...prev, withholdingAmount: withholding.toFixed(2) }));
    } else {
      setFormData(prev => ({ ...prev, withholdingAmount: '' }));
    }
  }, [formData.amount, formData.type]);

  const fetchLeases = async () => {
    try {
      const leasesData = await api.get('leases');
      setLeases(leasesData || []);
    } catch (error) {
      console.error('Error fetching leases:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0] || null
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
      const selectedLease = leases.find(lease => lease.id === formData.leaseId);
      if (!selectedLease) {
        throw new Error('Selected lease not found');
      }

      let receiptUrl = null;
      let receiptName = null;

      // Upload image if present
      if (formData.receiptImage) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', formData.receiptImage);

        const uploadResponse = await api.post('uploads/image', formDataUpload, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        receiptUrl = uploadResponse.url;
        receiptName = formData.receiptImage.name;
      }

      const paymentData = {
        leaseId: formData.leaseId,
        tenantId: selectedLease.tenantId,
        propertyId: selectedLease.propertyId,
        amount: parseFloat(formData.amount),
        type: formData.type,
        withholdingAmount: parseFloat(formData.withholdingAmount) || 0,
        date: formData.date,
        dueDate: formData.dueDate,
        method: formData.method,
        status: formData.status,
        transactionNumber: formData.transactionNumber || undefined,
        receiptNumber: formData.receiptNumber || undefined,
        invoiceNumber: formData.invoiceNumber || undefined,
        receiptUrl,
        receiptName,
        notes: formData.notes || undefined
      };

      const newPayment = await api.post('payments', paymentData);
      onPaymentRecorded(newPayment);
      handleClose();
    } catch (error) {
      console.error('Error recording payment:', error);
      if (error.errors) {
        setErrors(error.errors.reduce((acc, err) => ({ ...acc, [err.path]: err.msg }), {}));
      } else if (error.error) {
        setErrors({ general: error.error });
      } else {
        setErrors({ general: 'Failed to record payment' });
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
      withholdingAmount: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      method: '',
      status: 'Paid',
      transactionNumber: '',
      receiptNumber: '',
      invoiceNumber: '',
      notes: '',
      receiptImage: null
    });
    setErrors({});
    onClose();
  };

  const paymentMethods = [
    { value: 'CBE Bank', label: 'CBE Bank', icon: 'fa-solid fa-building-columns' },
    { value: 'Cash', label: 'Cash', icon: 'fa-solid fa-money-bill-wave' },
    { value: 'TeleBirr', label: 'TeleBirr', icon: 'fa-solid fa-mobile-screen-button' }
  ];

  return (
    <Modal title="Record Payment" isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="modal-form">
        {errors.general && (
          <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
            {errors.general}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="leaseId">Lease *</label>
          <select
            id="leaseId"
            name="leaseId"
            value={formData.leaseId}
            onChange={handleInputChange}
            className={errors.leaseId ? 'error' : ''}
          >
            <option value="">Select Lease</option>
            {leases.map(lease => (
              <option key={lease.id} value={lease.id}>
                {lease.tenantId?.name || 'Unknown Tenant'} - {lease.propertyId?.name || 'Unknown Property'} (Unit {lease.unitId?.unitNumber || 'N/A'})
              </option>
            ))}
          </select>
          {errors.leaseId && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem' }}>{errors.leaseId}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount *</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            className={errors.amount ? 'error' : ''}
          />
          {errors.amount && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem' }}>{errors.amount}</span>}
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

        <div className="form-group">
          <label htmlFor="withholdingAmount">Withholding Amount</label>
          <input
            type="number"
            id="withholdingAmount"
            name="withholdingAmount"
            value={formData.withholdingAmount}
            onChange={handleInputChange}
            step="0.01"
            min="0"
            readOnly
          />
        </div>

        <div className="form-group">
          <label htmlFor="date">Payment Date *</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className={errors.date ? 'error' : ''}
          />
          {errors.date && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem' }}>{errors.date}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="dueDate">Due Date *</label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleInputChange}
            className={errors.dueDate ? 'error' : ''}
          />
          {errors.dueDate && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem' }}>{errors.dueDate}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="method">Payment Method *</label>
          <select
            id="method"
            name="method"
            value={formData.method}
            onChange={handleInputChange}
            className={errors.method ? 'error' : ''}
          >
            <option value="">Select Payment Method</option>
            {paymentMethods.map(method => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
          {errors.method && <span className="error-text" style={{ color: 'red', fontSize: '0.875rem' }}>{errors.method}</span>}
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
          <label htmlFor="transactionNumber">Transaction Number</label>
          <input
            type="text"
            id="transactionNumber"
            name="transactionNumber"
            value={formData.transactionNumber}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="receiptNumber">Receipt Number</label>
          <input
            type="text"
            id="receiptNumber"
            name="receiptNumber"
            value={formData.receiptNumber}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="invoiceNumber">Invoice Number</label>
          <input
            type="text"
            id="invoiceNumber"
            name="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="receiptImage">Receipt Image</label>
          <input
            type="file"
            id="receiptImage"
            name="receiptImage"
            accept="image/*"
            onChange={handleInputChange}
          />
          {formData.receiptImage && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
              Selected: {formData.receiptImage.name}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
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
            {loading ? 'Recording...' : 'Record Payment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RecordPaymentModal;
