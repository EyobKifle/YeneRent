import React, { useState } from 'react';
import './Setup.css';
import api from '../../utils/api';

const Setup = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [receiptImage, setReceiptImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: billingCycle === 'monthly' ? 29.99 : 299.99,
      features: [
        'Up to 5 properties',
        'Basic reporting',
        'Email support',
        'Mobile app access'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      price: billingCycle === 'monthly' ? 99.99 : 999.99,
      features: [
        'Up to 50 properties',
        'Advanced reporting',
        'Priority support',
        'API access',
        'Custom integrations'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: billingCycle === 'monthly' ? 299.99 : 2999.99,
      features: [
        'Unlimited properties',
        'Full analytics suite',
        'Dedicated support',
        'White-label solution',
        'Custom development'
      ]
    }
  ];

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
  };

  const handleBillingCycleChange = (cycle) => {
    setBillingCycle(cycle);
    setSelectedPlan(null); // Reset selection when cycle changes
  };

  const handleFileChange = (e) => {
    setReceiptImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlan) {
      setMessage('Please select a plan');
      return;
    }
    if (!receiptImage) {
      setMessage('Please upload a payment receipt');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Upload receipt image first
      const formData = new FormData();
      formData.append('file', receiptImage);

      const uploadResponse = await api.post('uploads/image', formData);

      // Create subscription
      const selectedPlanData = plans.find(p => p.id === selectedPlan);
      const subscriptionData = {
        plan: selectedPlan,
        billingCycle,
        amount: selectedPlanData.price,
        receiptUrl: uploadResponse.url,
        receiptName: receiptImage.name
      };

      await api.post('subscriptions', subscriptionData);

      setMessage('Subscription setup successful! Your account will be activated shortly.');
    } catch (error) {
      console.error('Error setting up subscription:', error);
      setMessage(error.error || 'Failed to setup subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-header">
        <h1>Choose Your Plan</h1>
        <p>Select the perfect plan for your property management needs</p>
      </div>

      <form className="setup-form" onSubmit={handleSubmit}>
        <div className="plan-selection">
          <h2>Select Billing Cycle</h2>
          <div className="billing-cycle">
            <button
              type="button"
              className={billingCycle === 'monthly' ? 'active' : ''}
              onClick={() => handleBillingCycleChange('monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              className={billingCycle === 'yearly' ? 'active' : ''}
              onClick={() => handleBillingCycleChange('yearly')}
            >
              Yearly
              <span style={{ fontSize: '12px', marginLeft: '5px' }}>Save 20%</span>
            </button>
          </div>

          <h2>Choose Your Plan</h2>
          <div className="plans-grid">
            {plans.map(plan => (
              <div
                key={plan.id}
                className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                {plan.popular && <div className="popular-badge">Most Popular</div>}
                <h3>{plan.name}</h3>
                <div className="price">
                  ${plan.price}
                  <span>/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                <ul>
                  {plan.features.map((feature, index) => (
                    <li key={index}>✓ {feature}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="payment-section">
          <h2>Payment Information</h2>
          <div className="receipt-upload">
            <label htmlFor="receipt">Upload Payment Receipt *</label>
            <input
              type="file"
              id="receipt"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
            {receiptImage ? (
              <div className="image-preview" style={{ marginTop: '10px' }}>
                <img 
                  src={URL.createObjectURL(receiptImage)} 
                  alt="Receipt Preview" 
                  style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px', border: '1px solid #ddd' }} 
                />
                <div style={{ marginTop: '5px', fontSize: '14px', color: '#666' }}>
                  Selected: {receiptImage.name}
                </div>
              </div>
            ) : (
              <div className="image-placeholder" style={{ border: '2px dashed #ddd', borderRadius: '8px', padding: '20px', textAlign: 'center', color: '#999', marginTop: '10px' }}>
                <i className="fa-solid fa-file-invoice-dollar fa-2x" style={{ marginBottom: '10px' }}></i>
                <p>Please upload your payment receipt image</p>
              </div>
            )}
          </div>
        </div>

        {message && (
          <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          className="submit-btn"
          disabled={loading || !selectedPlan || !receiptImage}
        >
          {loading ? 'Processing...' : 'Complete Setup'}
        </button>
      </form>
    </div>
  );
};

export default Setup;
