import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('demo@user.com'); // Pre-filled for demo
    const [password, setPassword] = useState('password'); // Pre-filled for demo
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/dashboard'); // Redirect to dashboard on successful login
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
                        <p data-i18n="Sign in to manage your properties">Sign in to manage your properties</p>
                    </div>
                    <form id="login-form" className="login-form" onSubmit={handleSubmit}>
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
                            <div className="password-input-container">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    className="form-input"
                                    placeholder="Enter your password"
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label="Toggle password visibility"
                                >
                                    <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                </button>
                            </div>
                        </div>
                        <p className="forgot-password">
                            <a href="#" data-i18n="Forgot your password?">Forgot your password?</a>
                        </p>

                        <button type="submit" className="btn-primary" data-i18n="Sign In">Sign In</button>

                        <p className="signup-link">
                            <a href="/signup" data-i18n="Don't have an account? Sign up">Don't have an account? Sign up</a>
                        </p>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
