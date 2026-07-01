import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './FlashSaleBanner.css';

function FlashSaleBanner() {
  const [flashSale, setFlashSale] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveFlashSale();
    
    // Poll flash sale data every 15 seconds to update sold stock counts in real time
    const pollInterval = setInterval(() => {
      fetchActiveFlashSale();
    }, 15000);

    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    if (!flashSale) return;

    const timer = setInterval(() => {
      calculateTimeLeft();
    }, 1000);

    return () => clearInterval(timer);
  }, [flashSale]);

  const fetchActiveFlashSale = async () => {
    try {
      const res = await api.get('/flashsales/active');
      setFlashSale(res.data || null);
    } catch (err) {
      console.error('Error fetching active flash sale:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeLeft = () => {
    if (!flashSale) return;

    const now = new Date().getTime();
    const startTime = new Date(flashSale.start_time).getTime();
    const endTime = new Date(flashSale.end_time).getTime();
    
    let targetTime = flashSale.status === 'active' ? endTime : startTime;
    let difference = targetTime - now;

    if (difference <= 0) {
      // Session has transition state (e.g. upcoming -> active or active -> ended)
      fetchActiveFlashSale();
      return;
    }

    const hours = Math.floor(difference / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    setTimeLeft({
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0')
    });
  };

  if (loading) return null;
  if (!flashSale) return null;

  const isActive = flashSale.status === 'active';
  const labelText = isActive ? 'Kết thúc sau:' : 'Bắt đầu sau:';

  return (
    <div className="flashsale-container" style={{ marginBottom: '1.5rem', padding: '1.25rem 2rem' }}>
      <div className="flashsale-header" style={{ marginBottom: 0 }}>
        <div className="flashsale-title-section">
          <span className="flashsale-icon-fire">⚡</span>
          <h2 className="flashsale-title">{flashSale.name || 'FLASH SALE GIỜ VÀNG'}</h2>
        </div>

        <div className="flashsale-timer-section">
          <span className="flashsale-timer-label">{labelText}</span>
          <div className="flashsale-countdown">
            <span className="flashsale-time-box">{timeLeft.hours}</span>
            <span className="flashsale-time-colon">:</span>
            <span className="flashsale-time-box">{timeLeft.minutes}</span>
            <span className="flashsale-time-colon">:</span>
            <span className="flashsale-time-box">{timeLeft.seconds}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlashSaleBanner;
