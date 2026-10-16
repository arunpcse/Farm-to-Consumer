import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/api';
import './ForgotPassword.css';

function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Request reset, 2: Enter token & new password
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [infoToken, setInfoToken] = useState('');

  async function handleRequestToken(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.forgotPassword(email.trim());
      setSuccess('Reset token generated! For this demo/test environment, the token is provided below.');
      setResetToken(data.resetToken);
      setInfoToken(data.resetToken);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to generate reset token. Make sure email is registered.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!resetToken.trim()) {
      setError('Please provide the reset token.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      const data = await authService.resetPassword({
        resetToken: resetToken.trim(),
        newPassword
      });
      setSuccess(data.message || 'Password reset successfully! You can now log in.');
      setStep(3); // Completed state
    } catch (err) {
      setError(err.message || 'Failed to reset password. Token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="forgot-page">
      <div className="forgot-box">
        <div className="forgot-header">
          <span className="forgot-icon">🔑</span>
          <h1>Reset Password</h1>
          <p className="forgot-subtitle">Recover access to your FreshHarvest account</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {step === 1 && (
          <form onSubmit={handleRequestToken}>
            <p className="step-description">
              Enter your email address and we will generate a secure reset token for your account.
            </p>

            <div className="form-group">
              <label htmlFor="forgot-email">Registered Email</label>
              <input
                id="forgot-email"
                type="email"
                placeholder="e.g. yourname@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Processing...' : 'Send Reset Code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            {infoToken && (
              <div className="token-display-box">
                <span className="token-label">Demo Reset Token:</span>
                <code className="token-code">{infoToken}</code>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="reset-token">Reset Token</label>
              <input
                id="reset-token"
                type="text"
                placeholder="Paste your reset token"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="new-password">New Password (min. 6 characters)</label>
              <input
                id="new-password"
                type="password"
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirm New Password</label>
              <input
                id="confirm-password"
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="reset-completed-box">
            <span className="check-icon">✓</span>
            <h3>Password Reset Complete!</h3>
            <p>Your password has been securely updated. You can now log in with your new credentials.</p>
            <Link to="/login" className="submit-btn direct-link">
              Go to Login
            </Link>
          </div>
        )}

        <div className="forgot-footer">
          <Link to="/login">← Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
