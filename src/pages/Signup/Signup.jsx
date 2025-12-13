import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Signup.css';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      await signup(email, password, name);
      navigate('/dashboard'); // Redirect to dashboard on successful signup
    } catch (error) {
      alert(error.message); // Display error message
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1 data-i18n="Rental System">Rental System</h1>
            <p data-i18n="Create your account">Create your account</p>
          </div>
          <form id="signup-form" className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name" className="form-label" data-i18n="Full Name">Full Name</label>
              <input
                type="text"
                id="name"
                className="form-input"
                placeholder="Enter your full name"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label" data-i18n="Email Address">Email Address</label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="Enter your email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label" data-i18n="Password">Password</label>
              <input
                type="password"
                id="password"
                className="form-input"
                placeholder="Enter your password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password" className="form-label" data-i18n="Confirm Password">Confirm Password</label>
              <input
                type="password"
                id="confirm-password"
                className="form-input"
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <p className="forgot-password">
              <a href="/login" data-i18n="Already have an account? Sign in">Already have an account? Sign in</a>
            </p>
            <button type="submit" className="btn-primary" data-i18n="Sign Up">Sign Up</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
