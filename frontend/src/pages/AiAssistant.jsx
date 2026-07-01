import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import './AiAssistant.css';

function AiAssistant() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Xin chào! Tôi là Trợ lý Chọn Giày AI của SHOES STORE. Hãy chia sẻ cho tôi biết nhu cầu của bạn (ví dụ: cần tìm giày chạy bộ êm chân, giày đi chơi nam năng động, hoặc giày công sở dưới 2 triệu...) để tôi tư vấn và gợi ý outfit phù hợp nhất nhé! ✨',
      recommended_products: [],
      outfit_recommendations: []
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  
  const messagesEndRef = useRef(null);

  // Cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Tải hồ sơ size chân của User nếu đã đăng nhập
  useEffect(() => {
    if (token) {
      api.get('/ai/profile')
        .then(res => {
          if (res.data) {
            setUserProfile(res.data);
          }
        })
        .catch(() => {});
    }
  }, [token]);

  // Gửi tin nhắn tới AI
  const handleSendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: text
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Gửi toàn bộ lịch sử tin nhắn để AI giữ ngữ cảnh
      const chatHistory = [...messages, userMessage].map(msg => ({
        sender: msg.sender,
        text: msg.text
      }));

      const res = await api.post('/ai/chat', { messages: chatHistory });
      
      const aiResponse = {
        id: Date.now() + 1,
        sender: 'ai',
        text: res.data.text,
        recommended_products: res.data.recommended_products || [],
        outfit_recommendations: res.data.outfit_recommendations || []
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: 'Rất tiếc, hệ thống đang bận xử lý. Bạn vui lòng thử lại sau giây lát nhé!',
          recommended_products: [],
          outfit_recommendations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage(inputText);
    }
  };

  // Các nút câu hỏi gợi ý khảo sát nhanh
  const quickPrompts = [
    "👟 Tìm giày chạy bộ chuyên dụng",
    "✨ Gợi ý Sneaker nam đi chơi thời trang",
    "👔 Tư vấn giày Loafer tây công sở",
    "🏷️ Tìm các mẫu giày đang giảm giá tốt"
  ];

  return (
    <div className="container ai-assistant-page flex flex-col" style={{ flex: 1, padding: '2rem 1.5rem', maxHeight: 'calc(100vh - 80px)' }}>
      {/* Promo banner đo chân nếu chưa có dữ liệu */}
      {!userProfile?.foot_length_cm && (
        <div className="measure-promo-banner glass-card flex items-center justify-between" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', borderRadius: '12px' }}>
          <div className="flex items-center gap-4">
            <span style={{ fontSize: '2rem' }}>📐</span>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Đo kích thước chân bằng AI để tư vấn chuẩn xác hơn</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Công cụ đo chính xác form dáng chân bè, thon giúp AI chọn size giày chuẩn xác nhất cho bạn.
              </p>
            </div>
          </div>
          <Link to="/ai-measure" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
            📏 Đo ngay chỉ 1 phút
          </Link>
        </div>
      )}

      {userProfile?.foot_length_cm && (
        <div className="measure-promo-banner size-saved-banner glass-card flex items-center gap-3" style={{ padding: '0.75rem 1.25rem', marginBottom: '1.5rem', borderRadius: '12px', borderLeft: '4px solid var(--accent)' }}>
          <span>🎯</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            Hồ sơ AI: Kích thước chân {userProfile.foot_length_cm}cm, chân {userProfile.foot_width === 'wide' ? 'Bè Rộng' : userProfile.foot_width === 'narrow' ? 'Thon Gọn' : 'Bình Thường'} (Size đề xuất EU {userProfile.shoe_size_measured})
          </span>
          <Link to="/ai-measure" style={{ marginLeft: 'auto', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)' }}>
            Đo lại 🔄
          </Link>
        </div>
      )}

      {/* Main chat interface */}
      <div className="chat-window-wrapper glass-card flex flex-col" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: 0 }}>
        
        {/* Chat window body */}
        <div className="chat-messages-container" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {messages.map((msg) => (
            <div key={msg.id} className={`message-bubble-wrapper ${msg.sender === 'user' ? 'user' : 'ai'}`}>
              <div className="message-sender-avatar">
                {msg.sender === 'user' ? '👤' : '🤖'}
              </div>
              
              <div className="message-content-box flex flex-col gap-3">
                <div className="message-text-bubble">
                  {msg.text.split('\n').map((line, i) => (
                    <p key={i} style={{ margin: '0.2rem 0' }}>{line}</p>
                  ))}
                </div>

                {/* Render đề cử sản phẩm trực quan */}
                {msg.recommended_products && msg.recommended_products.length > 0 && (
                  <div className="recommended-products-container flex flex-col gap-2">
                    <h5 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0 0' }}>
                      👟 Sản phẩm đề xuất từ cửa hàng:
                    </h5>
                    <div className="chat-products-grid">
                      {msg.recommended_products.map((p) => (
                        <div key={p.id} style={{ minWidth: '190px' }}>
                          <ProductCard product={p} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Render gợi ý phối Outfit đồ */}
                {msg.outfit_recommendations && msg.outfit_recommendations.length > 0 && (
                  <div className="outfit-recommendations-wrapper">
                    <h5 style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 700, margin: '0.75rem 0 0.5rem 0' }}>
                      👗 Set phối Outfit gợi ý đi kèm:
                    </h5>
                    <div className="outfit-grid">
                      {msg.outfit_recommendations.map((item, idx) => (
                        <div key={idx} className="outfit-item-card">
                          <span className="outfit-icon">
                            {item.type === 'socks' && '🧦'}
                            {item.type === 'laces' && '🪢'}
                            {item.type === 'top' && '👕'}
                            {item.type === 'bottom' && '🩳'}
                          </span>
                          <div className="outfit-details">
                            <h6 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>{item.name}</h6>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Màu: {item.color}</span>
                            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                              💡 {item.reason}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="message-bubble-wrapper ai">
              <div className="message-sender-avatar">🤖</div>
              <div className="message-content-box">
                <div className="message-text-bubble loading-bubble">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Survey Prompts (Chỉ hiển thị khi không đang tải và ở các bước đầu) */}
        {!loading && messages.length <= 2 && (
          <div className="quick-prompts-container flex flex-wrap gap-2" style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--bg-tertiary)', borderTop: '1px solid var(--glass-border)' }}>
            {quickPrompts.map((p, idx) => (
              <button 
                key={idx} 
                onClick={() => handleSendMessage(p.slice(2))} 
                className="btn btn-secondary quick-prompt-btn"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', borderRadius: '20px' }}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Chat input form */}
        <div className="chat-input-panel flex gap-3" style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-secondary)' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập câu hỏi hoặc nhu cầu chọn giày của bạn..."
            className="form-control"
            style={{ borderRadius: '24px', paddingLeft: '1.25rem' }}
            disabled={loading}
          />
          <button
            onClick={() => handleSendMessage(inputText)}
            className="btn btn-primary"
            style={{ borderRadius: '24px', padding: '0.75rem 1.75rem', minWidth: '100px' }}
            disabled={loading || !inputText.trim()}
          >
            Gửi 🚀
          </button>
        </div>

      </div>
    </div>
  );
}

export default AiAssistant;
