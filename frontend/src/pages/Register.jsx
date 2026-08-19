import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import PasswordInput from '../components/PasswordInput';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password strength score calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', classStr: '' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', classStr: 'weak' };
    if (score === 3) return { score: 2, label: 'Medium', classStr: 'medium' };
    return { score: 3, label: 'Strong', classStr: 'strong' };
  };

  const strengthInfo = getPasswordStrength(formData.password);

  const validateField = (name, value, allData = formData) => {
    let errorMsg = '';

    if (name === 'fullName') {
      if (!value.trim()) {
        errorMsg = 'Full Name is required.';
      } else if (value.trim().length < 2) {
        errorMsg = 'Full Name must be at least 2 characters.';
      }
    }

    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) {
        errorMsg = 'Email Address is required.';
      } else if (!emailRegex.test(value.trim())) {
        errorMsg = 'Please enter a valid email address.';
      }
    }

    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '');
      if (!value.trim()) {
        errorMsg = 'Phone Number is required.';
      } else if (digitsOnly.length !== 10) {
        errorMsg = 'Please enter a valid 10-digit mobile number.';
      }
    }

    if (name === 'password') {
      if (!value) {
        errorMsg = 'Password is required.';
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

    if (name === 'agreeTerms') {
      if (!value) {
        errorMsg = 'You must agree to the Terms & Conditions.';
      }
    }

    return errorMsg;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    const updatedData = { ...formData, [name]: val };

    setFormData(updatedData);

    if (errors[name]) {
      const errorMsg = validateField(name, val, updatedData);
      setErrors((prev) => ({ ...prev, [name]: errorMsg }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessMsg('');

    const nameErr = validateField('fullName', formData.fullName);
    const emailErr = validateField('email', formData.email);
    const phoneErr = validateField('phone', formData.phone);
    const passErr = validateField('password', formData.password);
    const confirmErr = validateField('confirmPassword', formData.confirmPassword);
    const termsErr = validateField('agreeTerms', formData.agreeTerms);

    const activeErrors = {
      fullName: nameErr,
      email: emailErr,
      phone: phoneErr,
      password: passErr,
      confirmPassword: confirmErr,
      agreeTerms: termsErr,
    };

    const hasErrors = Object.values(activeErrors).some((err) => err !== '');

    if (hasErrors) {
      setErrors(activeErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const response = await register({
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: 'CUSTOMER',
      });

      if (response && response.success) {
        setSuccessMsg('Account created successfully! Redirecting to sign in...');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1500);
      }
    } catch (err) {
      const errorMsg = err.data?.message || err.message || 'Registration failed. Please check your details.';
      setApiError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <div className="auth-card-header">
          <h2 className="auth-card-title">Create Your Account</h2>
          <p className="auth-card-sub">
            Create an account to manage your vehicle services with CarFix.
          </p>
        </div>

        {successMsg && (
          <div className="form-success-banner" role="status" style={{ marginBottom: '1.25rem' }}>
            <CheckCircle2 size={22} className="success-icon" />
            <div className="success-content">
              <h4>Registration Successful</h4>
              <p>{successMsg}</p>
            </div>
          </div>
        )}

        {apiError && (
          <div className="pricing-alert-box" style={{ marginBottom: '1.25rem', padding: '1rem', borderColor: 'rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.08)' }}>
            <AlertCircle size={20} className="alert-icon" style={{ color: '#ef4444' }} />
            <div className="alert-text">
              <p style={{ color: '#ef4444', fontWeight: 500 }}>{apiError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="fullName" className="form-label">
              Full Name <span className="required-star">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              className={`form-input ${errors.fullName ? 'has-error' : ''}`}
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="name"
              aria-invalid={errors.fullName ? 'true' : 'false'}
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
            />
            {errors.fullName && (
              <span className="form-error-msg" id="fullName-error" role="alert">
                <AlertCircle size={14} />
                {errors.fullName}
              </span>
            )}
          </div>

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

          {/* Phone Number */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="phone" className="form-label">
              Phone Number <span className="required-star">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className={`form-input ${errors.phone ? 'has-error' : ''}`}
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="tel"
              aria-invalid={errors.phone ? 'true' : 'false'}
              aria-describedby={errors.phone ? 'phone-error' : undefined}
            />
            {errors.phone && (
              <span className="form-error-msg" id="phone-error" role="alert">
                <AlertCircle size={14} />
                {errors.phone}
              </span>
            )}
          </div>

          {/* Password */}
          <PasswordInput
            id="password"
            name="password"
            label="Password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
            disabled={isSubmitting}
            autoComplete="new-password"
            error={errors.password}
          />

          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="password-strength-bar">
              <div
                className={`strength-segment ${
                  strengthInfo.score >= 1 ? `active-${strengthInfo.classStr}` : ''
                }`}
              ></div>
              <div
                className={`strength-segment ${
                  strengthInfo.score >= 2 ? `active-${strengthInfo.classStr}` : ''
                }`}
              ></div>
              <div
                className={`strength-segment ${
                  strengthInfo.score >= 3 ? `active-${strengthInfo.classStr}` : ''
                }`}
              ></div>
              <span className={`strength-text ${strengthInfo.classStr}`}>
                {strengthInfo.label}
              </span>
            </div>
          )}

          {/* Confirm Password */}
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={isSubmitting}
            autoComplete="new-password"
            error={errors.confirmPassword}
          />

          {/* Terms Checkbox */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                disabled={isSubmitting}
                style={{ marginTop: '0.2rem', cursor: 'pointer', accentColor: 'var(--primary-accent)' }}
              />
              <span>
                I agree to the{' '}
                <Link to="/terms" style={{ color: 'var(--primary-accent)', fontWeight: '600' }}>
                  Terms & Conditions
                </Link>{' '}
                and{' '}
                <Link to="/privacy" style={{ color: 'var(--primary-accent)', fontWeight: '600' }}>
                  Privacy Policy
                </Link>
                . <span className="required-star">*</span>
              </span>
            </label>
            {errors.agreeTerms && (
              <span className="form-error-msg" role="alert" style={{ marginTop: '0.3rem' }}>
                <AlertCircle size={14} />
                {errors.agreeTerms}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn-submit-form" style={{ width: '100%' }} disabled={isSubmitting}>
            <UserPlus size={18} />
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer-nav">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </AuthLayout>
  );
}
