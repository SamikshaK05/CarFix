import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle, Info } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import { useAuth } from '../context/AuthContext';
import { getDashboardPath } from '../components/ProtectedRoute';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleMsg, setGoogleMsg] = useState(false);

  const validateField = (name, value) => {
    let errorMsg = '';

    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) {
        errorMsg = 'Email Address is required.';
      } else if (!emailRegex.test(value.trim())) {
        errorMsg = 'Please enter a valid email address.';
      }
    }

    if (name === 'password') {
      if (!value) {
        errorMsg = 'Password is required.';
      } else if (value.length < 6) {
        errorMsg = 'Password must be at least 6 characters.';
      }
    }

    return errorMsg;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: val }));

    if (errors[name]) {
      const errorMsg = validateField(name, val);
      setErrors((prev) => ({ ...prev, [name]: errorMsg }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGoogleMsg(false);
    setApiError('');

    const emailErr = validateField('email', formData.email);
    const passErr = validateField('password', formData.password);

    if (emailErr || passErr) {
      setErrors({ email: emailErr, password: passErr });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await login(formData.email, formData.password);
      const loggedInUser = response.data?.user || response.user;
      const role = loggedInUser?.role || 'CUSTOMER';
      const redirectPath = getDashboardPath(role);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      const errorMsg = err.data?.message || err.message || 'Login failed. Please check your credentials.';
      setApiError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = () => {
    setGoogleMsg(true);
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="auth-card-header">
          <h2 className="auth-card-title">Welcome Back</h2>
          <p className="auth-card-sub">
            Sign in to manage your vehicle services with CarFix.
          </p>
        </div>

        {apiError && (
          <div className="pricing-alert-box" style={{ marginBottom: '1.25rem', padding: '1rem', borderColor: 'rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
            <AlertCircle size={20} className="alert-icon" style={{ color: '#ef4444' }} />
            <div className="alert-text">
              <p style={{ color: '#ef4444', fontWeight: 500 }}>{apiError}</p>
            </div>
          </div>
        )}

        {googleMsg && (
          <div className="pricing-alert-box" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
            <Info size={20} className="alert-icon" />
            <div className="alert-text">
              <p>Google authentication will be connected later.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email Address */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="email" className="form-label">
              Email Address <span className="required-star">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className={`form-input ${errors.email ? 'has-error' : ''}`}
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="email"
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <span className="form-error-msg" id="email-error" role="alert">
                <AlertCircle size={14} />
                {errors.email}
              </span>
            )}
          </div>

          {/* Password */}
          <PasswordInput
            id="password"
            name="password"
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            disabled={isSubmitting}
            autoComplete="current-password"
            error={errors.password}
          />

          {/* Remember Me & Forgot Password */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={isSubmitting}
                style={{ cursor: 'pointer', accentColor: 'var(--primary-accent)' }}
              />
              Remember me
            </label>
            <Link to="/forgot-password" style={{ color: 'var(--primary-accent)', fontWeight: '600', textDecoration: 'none' }}>
              Forgot Password?
            </Link>
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn-submit-form" style={{ width: '100%' }} disabled={isSubmitting}>
            <LogIn size={18} />
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Social Login UI */}
        <div className="social-login-divider">
          <span>OR</span>
        </div>

        <button type="button" className="btn-google-auth" onClick={handleGoogleAuth} disabled={isSubmitting}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="auth-footer-nav">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </div>
      </div>
    </AuthLayout>
  );
}
