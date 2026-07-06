import { useState, useRef, useEffect } from 'react';
import api from '../../api/api';
import './OtpVerification.css';

/**
 * OtpVerification — OTP entry panel shown when request.status === 'Approved'.
 * Props:
 *   requestId  — the EditRequest._id
 *   onSuccess  — callback when OTP verified (receives { request, stock })
 *   onClose    — closes the panel
 */
export default function OtpVerification({ requestId, onSuccess, onClose }) {
  const [digits,    setDigits]    = useState(['', '', '', '', '', '']);
  const [loading,   setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const [countdown, setCountdown] = useState(0); // cooldown for resend
  const inputRefs = useRef([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const otp = digits.join('');

  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleaned;
    setDigits(newDigits);
    setError('');

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
      e.preventDefault();
    }
  };

  const handleVerify = async () => {
    if (otp.length < 6) {
      setError('Please enter all 6 digits.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post(`/api/requests/${requestId}/verify-otp`, { otp });
      setSuccess('OTP verified! You can now edit the record.');
      setTimeout(() => onSuccess(), 800);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    try {
      await api.post(`/api/requests/${requestId}/resend-otp`);
      setSuccess('A new OTP has been sent to your email.');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      // Start 30s cooldown
      setCountdown(30);
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel otp-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">🔐 Enter OTP</h2>
            <p className="modal-subtitle">Enter the 6-digit code sent to your registered email.</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="otp-body">
          <div className="otp-icon-ring">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>

          {error   && <div className="alert-error">{error}</div>}
          {success && <div className="alert-success">{success}</div>}

          <div className="otp-input-group" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                className="otp-digit"
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                aria-label={`OTP digit ${i + 1}`}
              />
            ))}
          </div>

          <p className="otp-hint">
            ⏱ OTP expires in <strong>5 minutes</strong>. Check your spam folder if you don't see the email.
          </p>

          <div className="otp-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleVerify}
              disabled={loading || otp.length < 6}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              className="btn btn-ghost"
              onClick={handleResend}
              disabled={resending || countdown > 0}
            >
              {resending
                ? 'Sending...'
                : countdown > 0
                  ? `Resend in ${countdown}s`
                  : '🔄 Resend OTP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
