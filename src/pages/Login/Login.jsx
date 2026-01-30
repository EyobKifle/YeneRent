import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import AlertPanel from '../../components/ui/AlertPanel';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('demo@user.com'); // Pre-filled for demo
    const [password, setPassword] = useState('password'); // Pre-filled for demo
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();
    const { t } = useLanguage();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        try {
            const result = await login(email, password);
            if (result.success) {
                navigate(result.redirectTo || '/dashboard'); // Redirect based on role
            } else {
                setError(result.error || 'Login failed');
            }
        } catch (error) {
            setError(error.message || 'An unexpected error occurred');
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <h1 data-i18n="Rental System">{t('Rental System')}</h1>
                        <p data-i18n="Sign in to manage your properties">{t('Sign in to manage your properties')}</p>
                    </div>
                    {error && <AlertPanel type="error" message={error} />}
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
