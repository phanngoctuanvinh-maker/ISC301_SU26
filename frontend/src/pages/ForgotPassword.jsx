import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.message || 'Đường dẫn đặt lại mật khẩu đã được gửi về email của bạn.');
    } catch (err) {
      setError(err.message || 'Gửi yêu cầu thất bại, vui lòng kiểm tra lại email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '450px' }}>
        <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Quên Mật Khẩu</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Nhập email của bạn để nhận đường dẫn khôi phục mật khẩu tài khoản
        </p>

        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '2.5rem' }}>
            <label className="form-label">Email tài khoản</label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu'}
          </button>
        </form>

        <p style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Đã nhớ mật khẩu? <Link to="/login" style={{ fontWeight: 650 }}>Đăng nhập ngay</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
