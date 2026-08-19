import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { KeyRound, CheckCircle2, AlertCircle, ArrowLeft, LogIn } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import { resetPassword } from '../api/auth.api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateField = (name, value, allData = formData) => {
    let errorMsg = '';

    if (name === 'password') {
      if (!value) {
        errorMsg = 'New password is required.';
      } else if (value.length < 8) {
        errorMsg = 'Password must be at least 8 characters.';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        errorMsg = 'Password must contain uppercase, lowercase & a number.';
      }
    }

    if (name === 'confirmPassword') {
      if (!value) {
        errorMsg = 'Please confirm your password.';
      } else if (value !== allData.password) {
        errorMsg = 'Passwords do not match.';
      }
    }

    return errorMsg;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      const errorMsg = validateField(name, value, { ...formData, [name]: value });
      setErrors((prev) => ({ ...prev, [name]: errorMsg }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!token) {
      setApiError('Invalid or missing reset token.');
      return;
    }

    const passErr = validateField('password', formData.password);
    const confirmErr = validateField('confirmPassword', formData.confirmPassword);

    if (passErr || confirmErr) {
      setErrors({ password: passErr, confirmPassword: confirmErr });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await resetPassword(token, formData.password);
      if (response && response.success) {
        setIsSuccess(true);
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3500);
      } else {
        throw new Error(response?.message || 'Password reset failed.');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
      setApiError(err.data?.message || err.message || 'Invalid or expired reset token. Please request a new link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="auth-card-header">
          <h2 className="auth-card-title">Set New Password</h2>
          <p className="auth-card-sub">
            Please enter your new password below to complete the reset process.
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

        {isSuccess ? (
          <div>
            <div className="form-success-banner" role="status" style={{ marginBottom: '1.5rem' }}>
              <CheckCircle2 size={24} className="success-icon" />
              <div className="success-content">
                <h4 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Password Reset Successful!</h4>
                <p style={{ marginTop: '0.3rem' }}>
                  Your password has been updated. Redirecting to sign in page...
                </p>
              </div>
            </div>

            <Link to="/login" className="btn-submit-form" style={{ width: '100%', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <LogIn size={18} /> Sign In Now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <PasswordInput
              id="password"
              name="password"
              label="New Password"
              placeholder="Enter new password"
              value={formData.password}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="new-password"
              error={errors.password}
            />

            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm New Password"
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="new-password"
              error={errors.confirmPassword}
            />

            <button type="submit" className="btn-submit-form" style={{ width: '100%', marginTop: '1rem' }} disabled={isSubmitting}>
              <KeyRound size={18} />
              {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="auth-footer-nav" style={{ marginTop: '1.5rem' }}>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
