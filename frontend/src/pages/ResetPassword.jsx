import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Mã xác nhận khôi phục mật khẩu không tồn tại hoặc đã hết hạn.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    // Basic password validation matching Joi register rules (8 chars, 1 uppercase, 1 number)
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự, chứa ít nhất 1 chữ cái viết hoa và 1 số.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password', { token, password });
      setMessage(response.message || 'Đặt lại mật khẩu thành công! Đang chuyển hướng về trang đăng nhập...');
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Đặt lại mật khẩu thất bại. Đường dẫn có thể đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '450px' }}>
        <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Đặt Lại Mật Khẩu</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Nhập mật khẩu mới cho tài khoản của bạn
        </p>

        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        {!token ? (
          <div style={{ textAlign: 'center', margin: '2rem 0' }}>
            <p style={{ color: 'var(--danger)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Đường dẫn khôi phục mật khẩu không hợp lệ hoặc thiếu mã xác nhận (Token).
            </p>
            <Link to="/forgot-password" className="btn btn-secondary" style={{ fontSize: '0.9rem' }}>
              Yêu cầu liên kết mới
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Mật khẩu mới</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="Tối thiểu 8 ký tự, 1 chữ hoa, 1 số"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                disabled={loading || !!message}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Xác nhận mật khẩu mới</label>
              <input 
                type="password" 
                className="form-control" 
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required 
                disabled={loading || !!message}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading || !!message}>
              {loading ? 'Đang cập nhật...' : 'Đổi Mật Khẩu'}
            </button>
          </form>
        )}

        <p style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Quay lại <Link to="/login" style={{ fontWeight: 650 }}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
