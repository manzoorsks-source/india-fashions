import React from 'react';
import { useStore } from '../../context/StoreContext.js';
import { MapPin, Phone, Mail, Clock, ShieldCheck, Award, Heart, KeyRound } from 'lucide-react';

interface FooterProps {
  onOpenAdminLogin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdminLogin }) => {
  const { settings } = useStore();
  const brandName = settings?.brand_name || 'India Fashions';

  return (
    <footer style={{ backgroundColor: 'var(--color-emerald-dark)', color: '#FAF7F2', marginTop: '60px', borderTop: '2px solid var(--color-gold)' }}>
      <div className="container" style={{ padding: '48px 20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '32px', marginBottom: '40px' }}>
          {/* Brand Heritage column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  backgroundColor: 'var(--color-emerald)',
                  border: '1px solid var(--color-gold)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-serif-brand)', fontWeight: 800 }}>IF</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--color-gold)' }}>{brandName}</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#D1E5EB', lineHeight: 1.6, marginBottom: '16px' }}>
              Curators of royal Indian textile heritage. Every saree is handpicked from master weaver clusters across Kanchipuram, Varanasi, Patan, and Paithan.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-gold)' }}>
              <Award size={16} />
              <span>Silk Mark Certified Handlooms</span>
            </div>
          </div>

          {/* Boutique & Delivery radius */}
          <div>
            <h4 style={{ fontSize: '1rem', color: 'var(--color-gold)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Boutique Location
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#D1E5EB' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <MapPin size={16} color="var(--color-gold)" style={{ flexShrink: 0, marginTop: '3px' }} />
                <span>{settings?.shop_address || 'Shop 14, Royal Silk Arcade, MG Road, Bangalore 560001'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="var(--color-gold)" />
                <span>Mon – Sun: 10:30 AM – 9:00 PM</span>
              </div>
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  border: '1px dashed var(--color-gold)',
                  borderRadius: '6px',
                  fontSize: '0.78rem'
                }}
              >
                <strong>Local Express Delivery:</strong> Within a {settings?.delivery_radius_km || 12} km radius from our boutique.
              </div>
            </div>
          </div>

          {/* Customer Care */}
          <div>
            <h4 style={{ fontSize: '1rem', color: 'var(--color-gold)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Customer Concierge
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#D1E5EB' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={16} color="var(--color-gold)" />
                <span>{settings?.contact_phone || '+91 98450 12345'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} color="var(--color-gold)" />
                <span>{settings?.contact_email || 'care@indiafashions.com'}</span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '6px' }}>
                Need drapery guidance or custom blouse stitching? Call our boutique stylist.
              </p>
            </div>
          </div>

          {/* Payment & Security */}
          <div>
            <h4 style={{ fontSize: '1rem', color: 'var(--color-gold)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Secure Payment Options
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#D1E5EB', marginBottom: '12px' }}>
              Encrypted, transaction-safe checkout:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['UPI (GPay / PhonePe)', 'Credit & Debit Cards', 'NetBanking', 'IMPS / NEFT', 'COD'].map(p => (
                <span
                  key={p}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(212,175,55,0.3)',
                    color: '#FAF7F2',
                    fontSize: '0.72rem',
                    padding: '3px 8px',
                    borderRadius: '4px'
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: '1px solid rgba(212, 175, 55, 0.2)',
            paddingTop: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.78rem',
            color: '#94A3B8'
          }}
        >
          <p>© {new Date().getFullYear()} {brandName}. Handcrafted with heritage pride.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Royal Heritage Fashion Platform</span>
            <button
              onClick={onOpenAdminLogin}
              aria-label="Staff Key"
              title="Staff"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748B',
                opacity: 0.3,
                cursor: 'pointer',
                padding: '2px 4px',
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              <KeyRound size={12} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
