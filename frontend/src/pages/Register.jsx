import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/auth/register', {
        full_name: fullName,
        email,
        password,
        phone
      });
      
      setSuccess('Đăng ký thành công! Đang chuyển hướng sang xác minh OTP...');
      setTimeout(() => {
        // Redirect to OTP verification page and pass the email
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '500px' }}>
        <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Đăng Ký Tài Khoản</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Tạo tài khoản mới để bắt đầu mua sắm
        </p>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Họ và Tên</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input 
              type="email" 
              className="form-control" 
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Số điện thoại</label>
            <input 
              type="tel" 
              className="form-control" 
              placeholder="0987654321"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              pattern="^0\d{9}$"
              title="Số điện thoại phải bắt đầu từ số 0 và có 10 chữ số"
              required 
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Mật khẩu</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="Mật khẩu tối thiểu 8 ký tự..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Đang đăng ký...' : 'Đăng Ký'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Đã có tài khoản? <Link to="/login" style={{ fontWeight: 600 }}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
