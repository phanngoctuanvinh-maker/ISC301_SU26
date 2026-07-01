import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AiFootMeasure.css';

function AiFootMeasure() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Trạng thái các bước
  const [step, setStep] = useState(1); // 1: Upload, 2: Calibrate, 3: Report
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [stylePreference, setStylePreference] = useState('lifestyle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Kích thước thật của ảnh để tính toán tỷ lệ
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const containerRef = useRef(null);
  const imgRef = useRef(null);

  // Tọa độ các điểm định vị (tính theo phần trăm của container 0-100 để responsive)
  const [markers, setMarkers] = useState({
    paperTop: { x: 50, y: 15 },
    paperBottom: { x: 50, y: 85 },
    footHeel: { x: 50, y: 75 },
    footToe: { x: 50, y: 25 },
    widthLeft: { x: 35, y: 50 },
    widthRight: { x: 65, y: 50 }
  });

  const [activeMarker, setActiveMarker] = useState(null);

  // Kết quả đo đạc trả về từ Backend
  const [report, setReport] = useState(null);

  // Khi tải ảnh lên
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setError('');
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setStep(2);
      };
      reader.readAsDataURL(file);
    }
  };

  // Cài đặt kích thước container khi ảnh load xong
  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setImageSize({ width: naturalWidth, height: naturalHeight });
    updateContainerBounds();
  };

  const updateContainerBounds = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    }
  };

  useEffect(() => {
    window.addEventListener('resize', updateContainerBounds);
    return () => window.removeEventListener('resize', updateContainerBounds);
  }, []);

  // Xử lý kéo thả Marker bằng chuột / cảm ứng
  const handleMouseDown = (markerKey) => (e) => {
    e.preventDefault();
    setActiveMarker(markerKey);
  };

  const handleMouseMove = (e) => {
    if (!activeMarker || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let clientX = e.clientX;
    let clientY = e.clientY;

    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    // Tính phần trăm tọa độ tương đối trong ảnh
    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;

    // Giới hạn trong khoảng 0-100
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    setMarkers((prev) => ({
      ...prev,
      [activeMarker]: { x, y }
    }));
  };

  const handleMouseUp = () => {
    setActiveMarker(null);
  };

  useEffect(() => {
    if (activeMarker) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [activeMarker]);

  // Gửi tọa độ lên API Backend để tính toán đo đạc
  const handleSubmitSizing = async () => {
    setLoading(true);
    setError('');
    try {
      // Vì markers lưu ở đơn vị % nên chuyển đổi thành tọa độ ảo để Backend tính tỷ lệ khoảng cách
      // Backend dùng công thức tỷ lệ khoảng cách pixel nên đơn vị % hay px đều cho kết quả y hệt nhau
      const payload = {
        paperPoints: [
          { x: markers.paperTop.x, y: markers.paperTop.y },
          { x: markers.paperBottom.x, y: markers.paperBottom.y }
        ],
        footPoints: [
          { x: markers.footHeel.x, y: markers.footHeel.y },
          { x: markers.footToe.x, y: markers.footToe.y }
        ],
        widthPoints: [
          { x: markers.widthLeft.x, y: markers.widthLeft.y },
          { x: markers.widthRight.x, y: markers.widthRight.y }
        ],
        stylePreference
      };

      const res = await api.post('/ai/measure', payload);
      setReport(res.data);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Lỗi phân tích hình ảnh bàn chân.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container ai-measure-page" style={{ padding: '2.5rem 1.5rem' }}>
      <div className="ai-measure-header">
        <h1 className="gradient-text">📏 Đo Size Bàn Chân Bằng AI</h1>
        <p className="subtitle">
          Sử dụng ảnh chụp bàn chân cùng vật dụng hiệu chuẩn để tính size giày chuẩn EU chính xác 99%.
        </p>
      </div>

      {step === 1 && (
        <div className="glass-card measure-step-card flex flex-col gap-6">
          <div className="guide-box">
            <h3>💡 Hướng dẫn chụp ảnh để đạt độ chính xác cao nhất:</h3>
            <ol>
              <li>Đặt một **tờ giấy A4** phẳng trên sàn nhà, sát mép tường.</li>
              <li>Đặt bàn chân của bạn lên tờ giấy, gót chân chạm nhẹ vào mép tường.</li>
              <li>Chụp ảnh từ trên xuống thẳng góc (vuông góc 90 độ với sàn nhà), đảm bảo thấy rõ toàn bộ tờ giấy A4 và bàn chân.</li>
            </ol>
            <div className="mock-instruction-img" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px dashed var(--glass-border)',
              borderRadius: '8px',
              padding: '1rem',
              textAlign: 'center',
              margin: '1rem 0 0 0',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem'
            }}>
              📸 <em>Chụp thẳng từ trên xuống thấy rõ gót chân chạm tường và toàn bộ tờ giấy A4.</em>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phong cách giày bạn quan tâm:</label>
            <div className="style-preference-options flex gap-4">
              {['lifestyle', 'running', 'basketball', 'formal'].map((pref) => (
                <button
                  key={pref}
                  type="button"
                  className={`btn ${stylePreference === pref ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setStylePreference(pref)}
                  style={{ flex: 1, padding: '0.6rem', fontSize: '0.85rem', textTransform: 'capitalize' }}
                >
                  {pref === 'lifestyle' && '👟 Hằng ngày'}
                  {pref === 'running' && '🏃 Chạy bộ'}
                  {pref === 'basketball' && '🏀 Bóng rổ'}
                  {pref === 'formal' && '👔 Công sở'}
                </button>
              ))}
            </div>
          </div>

          <div className="upload-container text-center">
            <input
              type="file"
              accept="image/*"
              id="foot-photo-upload"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="foot-photo-upload" className="btn btn-primary btn-large" style={{ padding: '1.25rem 2.5rem', fontSize: '1.1rem', cursor: 'pointer' }}>
              📸 Tải ảnh hoặc Chụp ảnh ngay
            </label>
            <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Hỗ trợ PNG, JPG, WEBP dung lượng tối đa 5MB.
            </p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="glass-card measure-step-card flex flex-col gap-4">
          <div className="guide-box warning-guide">
            <h4>🎯 Bước 2: Kéo các điểm định vị trùng khớp với hình ảnh bên dưới:</h4>
            <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <li>🔴 **Điểm Giấy (Đỏ)**: Kéo vào Mép Trên và Mép Dưới của tờ giấy A4.</li>
              <li>🔵 **Chiều Dài Chân (Xanh Dương)**: Kéo vào Gót Chân và Đầu Ngón Chân dài nhất.</li>
              <li>🟢 **Chiều Rộng Chân (Xanh Lá)**: Kéo vào Mép Trái và Mép Phải nơi rộng nhất bàn chân.</li>
            </ul>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <div 
            className="calibration-container" 
            ref={containerRef}
            style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto', overflow: 'hidden', borderRadius: '12px', border: '2px solid var(--primary-light)' }}
          >
            <img
              ref={imgRef}
              src={imagePreview}
              alt="Calibrating Foot"
              onLoad={handleImageLoad}
              style={{ width: '100%', display: 'block', pointerEvents: 'none' }}
            />

            {/* SVG overlay to render linking lines and guidelines */}
            <svg 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
            >
              {/* Paper Reference line (Red) */}
              <line 
                x1={`${markers.paperTop.x}%`} y1={`${markers.paperTop.y}%`}
                x2={`${markers.paperBottom.x}%`} y2={`${markers.paperBottom.y}%`}
                stroke="#ef4444" strokeWidth="2.5" strokeDasharray="5,5"
              />
              {/* Foot Length line (Blue) */}
              <line 
                x1={`${markers.footHeel.x}%`} y1={`${markers.footHeel.y}%`}
                x2={`${markers.footToe.x}%`} y2={`${markers.footToe.y}%`}
                stroke="var(--primary)" strokeWidth="3"
              />
              {/* Foot Width line (Green) */}
              <line 
                x1={`${markers.widthLeft.x}%`} y1={`${markers.widthLeft.y}%`}
                x2={`${markers.widthRight.x}%`} y2={`${markers.widthRight.y}%`}
                stroke="var(--accent)" strokeWidth="3"
              />
            </svg>

            {/* Draggable Handles */}
            {/* Paper Top Handle (Red) */}
            <div 
              className="calibration-handle handle-red" 
              style={{ left: `${markers.paperTop.x}%`, top: `${markers.paperTop.y}%` }}
              onMouseDown={handleMouseDown('paperTop')}
              onTouchStart={handleMouseDown('paperTop')}
              title="Mép Trên Giấy A4"
            >
              📄
            </div>
            {/* Paper Bottom Handle (Red) */}
            <div 
              className="calibration-handle handle-red" 
              style={{ left: `${markers.paperBottom.x}%`, top: `${markers.paperBottom.y}%` }}
              onMouseDown={handleMouseDown('paperBottom')}
              onTouchStart={handleMouseDown('paperBottom')}
              title="Mép Dưới Giấy A4"
            >
              📄
            </div>

            {/* Foot Heel Handle (Blue) */}
            <div 
              className="calibration-handle handle-blue" 
              style={{ left: `${markers.footHeel.x}%`, top: `${markers.footHeel.y}%` }}
              onMouseDown={handleMouseDown('footHeel')}
              onTouchStart={handleMouseDown('footHeel')}
              title="Gót chân"
            >
              🦶
            </div>
            {/* Foot Toe Handle (Blue) */}
            <div 
              className="calibration-handle handle-blue" 
              style={{ left: `${markers.footToe.x}%`, top: `${markers.footToe.y}%` }}
              onMouseDown={handleMouseDown('footToe')}
              onTouchStart={handleMouseDown('footToe')}
              title="Ngón chân dài nhất"
            >
              🦶
            </div>

            {/* Width Left Handle (Green) */}
            <div 
              className="calibration-handle handle-green" 
              style={{ left: `${markers.widthLeft.x}%`, top: `${markers.widthLeft.y}%` }}
              onMouseDown={handleMouseDown('widthLeft')}
              onTouchStart={handleMouseDown('widthLeft')}
              title="Mép rộng bên trái"
            >
              ↔️
            </div>
            {/* Width Right Handle (Green) */}
            <div 
              className="calibration-handle handle-green" 
              style={{ left: `${markers.widthRight.x}%`, top: `${markers.widthRight.y}%` }}
              onMouseDown={handleMouseDown('widthRight')}
              onTouchStart={handleMouseDown('widthRight')}
              title="Mép rộng bên phải"
            >
              ↔️
            </div>
          </div>

          <div className="flex gap-4" style={{ marginTop: '1rem' }}>
            <button
              onClick={() => { setStep(1); setSelectedImage(null); }}
              className="btn btn-secondary"
              style={{ flex: 1 }}
              disabled={loading}
            >
              Chọn ảnh khác
            </button>
            <button
              onClick={handleSubmitSizing}
              className="btn btn-primary"
              style={{ flex: 2 }}
              disabled={loading}
            >
              {loading ? '🔮 Đang quét & đo...' : '✨ Tiến hành đo chân'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && report && (
        <div className="glass-card measure-step-card flex flex-col gap-6 anim-fade-in">
          <div className="report-success-banner text-center" style={{ padding: '1rem 0' }}>
            <div className="scan-success-icon" style={{ fontSize: '3rem', animation: 'bounce 1s infinite' }}>🎉</div>
            <h2 className="gradient-text">Đo Kích Thước Thành Công!</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Hồ sơ size chân AI của bạn đã được cập nhật.</p>
          </div>

          <div className="report-dashboard grid grid-cols-3 gap-6" style={{ width: '100%' }}>
            {/* Length card */}
            <div className="report-widget text-center">
              <span className="widget-icon">📐</span>
              <h4>Chiều Dài Chân</h4>
              <p className="widget-value">{report.footLengthCm} cm</p>
            </div>
            
            {/* Size Card */}
            <div className="report-widget text-center highlight-widget">
              <span className="widget-icon">👟</span>
              <h4>Size Giày Khuyên Dùng</h4>
              <p className="widget-value text-glow">EU {report.shoeSizeMeasured}</p>
            </div>

            {/* Width card */}
            <div className="report-widget text-center">
              <span className="widget-icon">↔️</span>
              <h4>Độ Rộng Bàn Chân</h4>
              <p className="widget-value" style={{ textTransform: 'capitalize' }}>
                {report.footWidth === 'wide' && 'Bè Rộng (Wide)'}
                {report.footWidth === 'narrow' && 'Thon Gọn (Narrow)'}
                {report.footWidth === 'medium' && 'Bình Thường (Medium)'}
              </p>
            </div>
          </div>

          <div className="size-tips-box">
            <h4>💡 Lời khuyên chọn size từ AI Assistant:</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {report.footWidth === 'wide' ? (
                <span>
                  Bàn chân của bạn có chiều ngang **bè rộng** ({report.footWidthCm}cm). Đối với những dòng giày thể thao có phom dáng ôm sát (như Nike Air Force 1, Adidas Ultraboost), chúng tôi khuyên bạn nên chọn **tăng 0.5 đến 1 size** (tức size **EU {report.shoeSizeMeasured + 1}**) để tránh cảm giác bị bó chặt hai bên hông chân.
                </span>
              ) : report.footWidth === 'narrow' ? (
                <span>
                  Bàn chân của bạn có kiểu dáng **thon gọn** ({report.footWidthCm}cm). Bạn có thể tự tin chọn đúng size tiêu chuẩn **EU {report.shoeSizeMeasured}** cho hầu hết các dòng Sneaker mà không lo bị tuột gót hay quá lỏng chân.
                </span>
              ) : (
                <span>
                  Bàn chân của bạn có kích cỡ **bình thường chuẩn** ({report.footWidthCm}cm). Chọn đúng size đề xuất **EU {report.shoeSizeMeasured}** sẽ đem lại sự vừa vặn và thoải mái tối đa cho cả hoạt động đi chơi lẫn tập luyện thể thao.
                </span>
              )}
            </p>
          </div>

          <div className="action-buttons flex gap-4">
            <button 
              onClick={() => { setStep(1); setSelectedImage(null); }} 
              className="btn btn-secondary" 
              style={{ flex: 1 }}
            >
              Đo lại chân
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="btn btn-primary" 
              style={{ flex: 1 }}
            >
              🛍️ Mua sắm ngay với Điểm Phù Hợp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AiFootMeasure;
