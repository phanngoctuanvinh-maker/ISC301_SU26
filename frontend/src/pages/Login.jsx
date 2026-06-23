import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if google API is loaded
    const initializeGoogleSignIn = () => {
      if (window.google && window.google.accounts) {
        if (!window.google_initialized) {
          window.google.accounts.id.initialize({
            client_id: "692041190359-0s3ue359u3q2tj949dg3a4ddhsockit9.apps.googleusercontent.com",
            callback: handleGoogleLoginSuccess
          });
          window.google_initialized = true;
        }

        window.google.accounts.id.renderButton(
          document.getElementById("googleBtn"),
          { 
            theme: "outline", 
            size: "large", 
            width: 386,
            text: "signin_with",
            shape: "rectangular"
          }
        );
      }
    };

    // Retry initialization in case script loads slowly
    const timer = setInterval(() => {
      if (window.google) {
        initializeGoogleSignIn();
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const handleGoogleLoginSuccess = async (response) => {
    setError('');
    setLoading(true);
    
    try {
      const apiResponse = await api.post('/auth/google', {
        credential: response.credential
      });
      
      // Store token and user info in localStorage
      localStorage.setItem('token', apiResponse.data.token);
      localStorage.setItem('user', JSON.stringify(apiResponse.data.user));
      
      navigate('/');
    } catch (err) {
      setError(err.message || 'Đăng nhập Google thất bại, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Store token and user info in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      navigate('/');
    } catch (err) {
      setError(err.message || 'Sai thông tin đăng nhập');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '450px' }}>
        <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Đăng Nhập</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Đăng nhập vào tài khoản Shoes Store của bạn
        </p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
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

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label">Mật khẩu</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--text-secondary)' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--glass-border)' }} />
          <span style={{ padding: '0 0.75rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Hoặc</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--glass-border)' }} />
        </div>

        <div id="googleBtn" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}></div>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Chưa có tài khoản? <Link to="/register" style={{ fontWeight: 600 }}>Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
