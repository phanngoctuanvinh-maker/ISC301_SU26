import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import './SupportWidget.css';

function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFormFilled, setIsFormFilled] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [unread, setUnread] = useState(false);

  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  // Check login state and local storage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userString = localStorage.getItem('user');

    if (token && userString) {
      try {
        const user = JSON.parse(userString);
        const userSession = `user_${user.id}`;
        setSessionId(userSession);
        setName(user.full_name || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
        setIsFormFilled(true);
      } catch (e) {
        console.error('Error parsing user storage:', e);
      }
    } else {
      const storedSession = localStorage.getItem('support_session_id');
      const storedName = localStorage.getItem('support_name');
      const storedEmail = localStorage.getItem('support_email');
      const storedPhone = localStorage.getItem('support_phone');

      if (storedSession) {
        setSessionId(storedSession);
        setName(storedName || '');
        setEmail(storedEmail || '');
        setPhone(storedPhone || '');
        setIsFormFilled(true);
      }
    }
  }, []);

  // Poll for messages when open
  useEffect(() => {
    if (isOpen && sessionId) {
      fetchMessages();
      pollingRef.current = setInterval(fetchMessages, 4000);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isOpen, sessionId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/support/messages?session_id=${sessionId}`);
      const fetched = response.data || [];
      
      // If widget is closed and new message received from admin, highlight unread
      if (!isOpen && fetched.length > messages.length) {
        const lastMsg = fetched[fetched.length - 1];
        if (lastMsg.sender_type === 'admin') {
          setUnread(true);
        }
      }
      
      setMessages(fetched);
    } catch (err) {
      console.error('Error fetching support messages:', err);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert('Vui lòng nhập tên và email của bạn');
      return;
    }

    const newSessionId = `guest_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    localStorage.setItem('support_session_id', newSessionId);
    localStorage.setItem('support_name', name.trim());
    localStorage.setItem('support_email', email.trim());
    localStorage.setItem('support_phone', phone.trim());

    setSessionId(newSessionId);
    setIsFormFilled(true);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      const payload = {
        session_id: sessionId,
        name: name,
        email: email,
        message: message.trim()
      };

      const response = await api.post('/support/messages', payload);
      setMessages(prev => [...prev, response.data]);
      setMessage('');
    } catch (err) {
      alert(err.message || 'Không thể gửi tin nhắn. Vui lòng thử lại sau.');
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnread(false);
    }
  };

  return (
    <div className="support-widget-container">
      {/* Floating Chat Button */}
      <button 
        className={`support-widget-toggle ${unread ? 'unread-glow' : ''}`} 
        onClick={toggleChat}
        title="Chăm sóc khách hàng"
      >
        {isOpen ? (
          <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>✕</span>
        ) : (
          <span style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            💬
            {unread && <span className="support-widget-badge">1</span>}
          </span>
        )}
      </button>

      {/* Expanded Chat Box */}
      {isOpen && (
        <div className="support-widget-chatbox glass-card">
          <div className="support-chat-header">
            <h4>Hỗ Trợ Trực Tuyến</h4>
            <small>Myshoes luôn sẵn sàng phục vụ bạn</small>
          </div>

          {!isFormFilled ? (
            /* User registration form (for Guests) */
            <form onSubmit={handleFormSubmit} className="support-chat-form">
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', textAlign: 'center' }}>
                Vui lòng cung cấp thông tin liên hệ để chúng tôi hỗ trợ tốt nhất:
              </p>
              
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Tên của bạn *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  placeholder="Nguyễn Văn A"
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Email *</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  placeholder="username@example.com"
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Số điện thoại (tùy chọn)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="0912345678"
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem' }}>
                Bắt đầu trò chuyện
              </button>
            </form>
          ) : (
            /* Active Chat screen */
            <div className="support-chat-messages-area">
              <div className="support-chat-messages-list">
                <div className="support-message-bubble admin">
                  <div className="msg-content">
                    Xin chào {name}! Cảm ơn bạn đã liên hệ với Myshoes. Chúng tôi có thể giúp gì cho bạn hôm nay?
                  </div>
                </div>

                {messages.map((msg) => {
                  const isAdmin = msg.sender_type === 'admin';
                  return (
                    <div key={msg.id} className={`support-message-bubble ${isAdmin ? 'admin' : 'customer'}`}>
                      <div className="msg-content">
                        {msg.message}
                      </div>
                      <small className="msg-time">
                        {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="support-chat-input-bar">
                <input 
                  type="text" 
                  placeholder="Nhập tin nhắn..." 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="form-control support-chat-input"
                />
                <button type="submit" className="support-chat-send-btn">
                  ➤
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SupportWidget;
