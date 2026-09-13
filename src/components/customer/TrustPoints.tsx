import React from 'react';
import { Award, Truck, ShieldCheck, RefreshCw } from 'lucide-react';
import { useStore } from '../../context/StoreContext.js';

export const TrustPoints: React.FC = () => {
  const { settings } = useStore();
  const radius = settings?.delivery_radius_km || 12;

  const points = [
    {
      icon: <Award size={28} color="var(--color-gold)" />,
      title: '100% Genuine Handlooms',
      description: 'Silk Mark certified pure silks woven on traditional pit and jacquard looms.'
    },
    {
      icon: <Truck size={28} color="var(--color-gold)" />,
      title: `${radius} km Express Delivery`,
      description: 'Dispatched directly from our Bangalore boutique with real-time driver updates.'
    },
    {
      icon: <ShieldCheck size={28} color="var(--color-gold)" />,
      title: 'Secure Multi-Method Checkout',
      description: 'Pay via Instant UPI, Credit/Debit Cards, IMPS/NEFT, or Cash on Delivery.'
    },
    {
      icon: <RefreshCw size={28} color="var(--color-gold)" />,
      title: 'Live Order Milestone Tracking',
      description: 'Transparent tracking from packed to dispatched, delivered right to your doorstep.'
    }
  ];

  return (
    <section style={{ backgroundColor: 'var(--color-silk-cream)', padding: '48px 0', borderTop: '1px solid var(--color-border-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '28px' }}>
          {points.map((pt, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid var(--color-border-light)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--color-emerald-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {pt.icon}
              </div>

              <div>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: '4px' }}>
                  {pt.title}
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-charcoal-muted)', lineHeight: 1.5 }}>
                  {pt.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
