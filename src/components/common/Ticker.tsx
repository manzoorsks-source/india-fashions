import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext.js';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export const Ticker: React.FC = () => {
  const { tickerMessages } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Fallback messages if none loaded yet
  const messages = tickerMessages.length > 0 ? tickerMessages : [
    { id: '1', content: '✨ Festive Offers: Drape the moment with authentic Kanjivaram & Banarasi Handlooms', link_url: '/category/sarees' },
    { id: '2', content: '🎉 Today Offers: Buy 2 Sarees & Get 1 Festive Silk Bundle (T&C Apply)', link_url: '/category/sarees' },
    { id: '3', content: '🚚 Express Local Delivery: Guaranteed delivery within 12 km from our Bangalore boutique', link_url: '#' },
    { id: '4', content: '💳 Payment Information: UPI, Cards, NetBanking & COD available', link_url: '#' }
  ];

  // Auto-advance ticker every 5.5 seconds if not paused
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % messages.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [messages.length, isPaused]);

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + messages.length) % messages.length);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % messages.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    // Swipe left (next) or swipe right (prev)
    if (diff > 40) {
      handleNext();
    } else if (diff < -40) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  const currentMsg = messages[currentIndex] || messages[0];

  return (
    <div
      className="ticker-wrapper"
      style={{
        backgroundColor: 'var(--color-emerald-dark)',
        color: '#ffffff',
        borderBottom: '1px solid var(--color-gold)',
        fontSize: '0.82rem',
        letterSpacing: '0.04em',
        padding: '7px 14px',
        position: 'relative',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        userSelect: 'none'
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Announcements Ticker"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={handlePrev}
          aria-label="Previous announcement"
          style={{
            color: 'var(--color-gold)',
            display: 'flex',
            alignItems: 'center',
            padding: '2px 4px',
            borderRadius: '3px'
          }}
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          textAlign: 'center',
          padding: '0 12px',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis'
        }}
      >
        <span
          key={currentIndex}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#FAF7F2',
            fontWeight: 500,
            animation: 'fadeInRTL 0.4s ease-out'
          }}
        >
          <Sparkles size={13} color="var(--color-gold)" />
          {currentMsg.content}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--color-gold)', fontSize: '0.72rem', opacity: 0.8 }}>
          {currentIndex + 1}/{messages.length}
        </span>
        <button
          onClick={handleNext}
          aria-label="Next announcement"
          style={{
            color: 'var(--color-gold)',
            display: 'flex',
            alignItems: 'center',
            padding: '2px 4px',
            borderRadius: '3px'
          }}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <style>{`
        @keyframes fadeInRTL {
          from { opacity: 0; transform: translateX(18px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};
