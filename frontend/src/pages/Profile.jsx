import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Profile() {
  const [profile, setProfile] = useState(null);
  
  // Profile Update Form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('other');
  const [dob, setDob] = useState('');
  
  // Change Password Form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/profile');
      const user = response.data;
      setProfile(user);
      
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setGender(user.gender || 'other');
      if (user.date_of_birth) {
        // format ISO date string to YYYY-MM-DD for date input
        setDob(user.date_of_birth.substring(0, 10));
      }
    } catch (err) {
      setError(err.message || 'Không thể lấy thông tin cá nhân');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await api.put('/profile', {
        full_name: fullName,
        phone: phone || null,
        gender,
        date_of_birth: dob || null
      });
      
      // Update local storage user information
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      localUser.full_name = fullName;
      localStorage.setItem('user', JSON.stringify(localUser));

      setProfile(response.data);
      setSuccess('Cập nhật thông tin cá nhân thành công!');
    } catch (err) {
      setError(err.message || 'Cập nhật thất bại');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    try {
      await api.put('/profile/change-password', {
        old_password: oldPassword,
        new_password: newPassword
      });
      setPwdSuccess('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setPwdError(err.message || 'Mật khẩu cũ không chính xác');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setAvatarUploading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put('/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update local user details avatar if displayed in Navbar
      const updatedUser = response.data;
      setProfile(updatedUser);
      setSuccess('Cập nhật ảnh đại diện thành công!');
    } catch (err) {
      setError(err.message || 'Không thể tải ảnh lên');
    } finally {
      setAvatarUploading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '4rem' }}>
        <h3>Đang tải dữ liệu hồ sơ...</h3>
      </div>
    );
  }

  const avatarUrl = profile?.avatar 
    ? (profile.avatar.startsWith('http') ? profile.avatar : `http://localhost:8080${profile.avatar}`)
    : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
      <h1 style={{ marginBottom: '2rem', fontSize: '2rem' }}>Hồ Sơ Cá Nhân</h1>

      <div className="grid grid-cols-3 gap-6" style={{ alignItems: 'start' }}>
        {/* Left Side: Avatar Panel */}
        <div className="glass-card flex flex-col items-center gap-4">
          <img 
            src={avatarUrl} 
            alt="Avatar" 
            className="avatar" 
            style={{ width: '120px', height: '120px', border: '4px solid var(--accent)', boxShadow: 'var(--shadow-md)' }} 
          />
          <div style={{ textAlign: 'center' }}>
            <h3>{profile?.full_name}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{profile?.email}</p>
            <span className="badge badge-secondary" style={{ marginTop: '0.5rem', textTransform: 'capitalize' }}>
              Vai trò: {profile?.role}
            </span>
          </div>

          <div style={{ width: '100%', marginTop: '1rem' }}>
            <label className="btn btn-secondary" style={{ display: 'block', textAlign: 'center', width: '100%', position: 'relative' }}>
              {avatarUploading ? 'Đang tải ảnh...' : 'Thay ảnh đại diện'}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange} 
                style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                disabled={avatarUploading}
              />
            </label>
          </div>
        </div>

        {/* Center: Info Form */}
        <div className="glass-card" style={{ gridColumn: 'span 2' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.3rem' }}>Cập nhật thông tin tài khoản</h2>
          
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleUpdateProfile}>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Họ và Tên</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Giới tính</label>
                <select 
                  className="form-control" 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Ngày sinh</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary">
              Lưu thay đổi
            </button>
          </form>

          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '2rem 0' }} />

          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.3rem' }}>Đổi mật khẩu</h2>
          
          {pwdError && <div className="alert alert-danger">{pwdError}</div>}
          {pwdSuccess && <div className="alert alert-success">{pwdSuccess}</div>}

          <form onSubmit={handleChangePassword}>
            <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Mật khẩu cũ</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mật khẩu mới</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mật khẩu mới ít nhất 8 ký tự..."
                  required 
                />
              </div>
            </div>

            <button type="submit" className="btn btn-secondary">
              Đổi mật khẩu
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
