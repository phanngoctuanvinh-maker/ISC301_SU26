import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

function VerifyOtp() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      setError('Không tìm thấy email cần xác thực. Vui lòng quay lại trang đăng ký.');
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/auth/verify-otp', { email, otp });
      setSuccess('Xác minh tài khoản thành công! Đang chuyển hướng sang Đăng nhập...');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setError('');
    setSuccess('');
    setResending(true);

    try {
      await api.post('/auth/resend-otp', { email });
      setSuccess('Đã gửi lại mã OTP mới vào email của bạn.');
    } catch (err) {
      setError(err.message || 'Không thể gửi lại OTP, vui lòng thử lại');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '450px' }}>
        <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Xác Minh Tài Khoản</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Nhập mã OTP 6 số đã được gửi đến email:<br />
          <strong style={{ color: 'var(--text-primary)' }}>{email || 'N/A'}</strong>
        </p>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Mã OTP (6 chữ số)</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="123456"
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
              required 
              disabled={!email}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }} disabled={loading || !email}>
            {loading ? 'Đang xác minh...' : 'Xác Minh'}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
          <button 
            type="button" 
            onClick={handleResend} 
            className="btn btn-secondary" 
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            disabled={resending || !email}
          >
            {resending ? 'Đang gửi...' : 'Gửi lại mã OTP'}
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/register')} 
            className="btn btn-secondary" 
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'transparent', border: 'none' }}
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerifyOtp;
