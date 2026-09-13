import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.js';
import { Sparkles } from 'lucide-react';

export const Ticker: React.FC = () => {
  const { tickerMessages } = useStore();
  const [isPaused, setIsPaused] = useState(false);

  // Fallback messages if none loaded yet
  const baseMessages = tickerMessages.length > 0 ? tickerMessages : [
    { id: '1', content: '✨ Festive Offers: Drape the moment with authentic Kanjivaram & Banarasi Handlooms', link_url: '#' },
    { id: '2', content: '🎉 Today Offers: Buy 2 Sarees & Get 1 Festive Silk Bundle (T&C Apply)', link_url: '#' },
    { id: '3', content: '🚚 Express Local Delivery: Guaranteed delivery within 12 km from our Bangalore boutique', link_url: '#' },
    { id: '4', content: '👑 100% Genuine Handlooms: Certified Silk Mark & Master Artisan Craft', link_url: '#' },
    { id: '5', content: '💳 Payment Information: UPI, Cards, NetBanking & COD available', link_url: '#' }
  ];

  // Duplicate the messages list 2 times to ensure seamless infinite looping without gaps
  const displayList = [...baseMessages, ...baseMessages];

  return (
    <div
      className="ticker-container"
      style={{
        backgroundColor: '#072A26',
        color: '#FAF7F2',
        borderBottom: '1px solid var(--color-gold)',
        fontSize: '0.82rem',
        letterSpacing: '0.04em',
        padding: '8px 0',
        position: 'relative',
        zIndex: 40,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center'
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      aria-label="Announcements Ticker"
    >
      <div
        className="ticker-track"
        style={{
          display: 'flex',
          alignItems: 'center',
          width: 'max-content',
          animation: 'ticker-scroll-rtl 80s linear infinite',
          animationPlayState: isPaused ? 'paused' : 'running',
          willChange: 'transform'
        }}
      >
        {displayList.map((msg, idx) => (
          <div
            key={`${msg.id}-${idx}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0 28px',
              color: '#FAF7F2',
              fontWeight: 500,
              cursor: 'default'
            }}
          >
            <Sparkles size={13} color="var(--color-gold-bright)" style={{ flexShrink: 0 }} />
            <span>{msg.content}</span>
            <span style={{ color: 'var(--color-gold)', opacity: 0.6, marginLeft: '18px' }}>✦</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes ticker-scroll-rtl {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
};
