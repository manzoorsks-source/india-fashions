import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { SaleCampaign } from '../../../shared/types.js';

interface HeroCampaignProps {
  onExploreClick: () => void;
  activeCampaign?: SaleCampaign | null;
  activeCampaigns?: SaleCampaign[];
  onSelectCampaign?: (campaign: SaleCampaign) => void;
}

export const HeroCampaign: React.FC<HeroCampaignProps> = ({
  onExploreClick,
  activeCampaign,
  activeCampaigns = [],
  onSelectCampaign
}) => {
  const isOfferActive = Boolean(activeCampaign && activeCampaign.is_active) || activeCampaigns.length > 0;

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '480px',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0A433D 0%, #0F5F56 60%, #16796E 100%)',
        color: '#ffffff',
        overflow: 'hidden',
        borderBottom: '2px solid var(--color-gold)'
      }}
    >
      {/* Decorative Gold & Textile Background Accents */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle at 80% 20%, rgba(212, 175, 55, 0.18) 0%, transparent 50%),
                            radial-gradient(circle at 20% 80%, rgba(106, 27, 41, 0.25) 0%, transparent 60%)`,
          pointerEvents: 'none'
        }}
      />

      <div
        className="container"
        style={{
          position: 'relative',
          zIndex: 10,
          padding: '60px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          alignItems: 'center',
          gap: '40px'
        }}
      >
        {/* Left Headline & Campaign Copy */}
        <div style={{ maxWidth: '580px' }}>
          {activeCampaigns && activeCampaigns.length > 1 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
              {activeCampaigns.map(camp => {
                const isSelected = activeCampaign?.id === camp.id;
                return (
                  <button
                    key={camp.id}
                    type="button"
                    onClick={() => {
                      onSelectCampaign?.(camp);
                      const el = document.getElementById(`campaign-${camp.id}`) || document.getElementById('festive-offer');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: isSelected ? 'var(--color-gold)' : 'rgba(212, 175, 55, 0.2)',
                      border: '1px solid var(--color-gold)',
                      borderRadius: '999px',
                      padding: '5px 14px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: isSelected ? 'var(--color-emerald-dark)' : 'var(--color-gold-bright)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 2px 10px rgba(212, 175, 55, 0.4)' : 'none'
                    }}
                    title={`Click to view ${camp.name}`}
                  >
                    <Sparkles size={13} color={isSelected ? 'var(--color-emerald-dark)' : 'var(--color-gold)'} />
                    <span>{camp.name} ({camp.discount_percentage}% OFF)</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid var(--color-gold)',
                borderRadius: '999px',
                padding: '4px 12px',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--color-gold-light)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '20px'
              }}
            >
              <Sparkles size={13} color="var(--color-gold)" />
              {isOfferActive ? (
                <span>{activeCampaign?.label || 'Festive Edit'} • {activeCampaign?.name} {activeCampaign?.discount_percentage ? `(${activeCampaign.discount_percentage}% OFF)` : ''}</span>
              ) : (
                <span>Heritage Handlooms • Master Weaves</span>
              )}
            </div>
          )}

          <h2
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
              fontFamily: 'var(--font-serif-brand)',
              fontWeight: 700,
              lineHeight: 1.15,
              color: '#FFFFFF',
              marginBottom: '16px'
            }}
          >
            Drape the <span style={{ color: 'var(--color-gold-bright)', fontStyle: 'italic' }}>Moment.</span>
          </h2>

          <p
            style={{
              fontSize: '1.05rem',
              fontFamily: 'var(--font-serif-body)',
              color: '#E0ECEE',
              lineHeight: 1.6,
              marginBottom: '28px'
            }}
          >
            Embrace timeless grandeur with handpicked Kanjivaram pure mulberry silks, luminous Chanderi tissue, and bespoke Banarasi Kadwa brocades. Handwoven by master looms for cherished celebrations.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
            <button
              onClick={onExploreClick}
              className="btn-gold"
              style={{ padding: '14px 28px', fontSize: '0.95rem' }}
            >
              <span>Explore Collection</span>
              <ArrowRight size={16} />
            </button>

            {isOfferActive ? (
              <a
                href="#festive-offer"
                className="btn-outline"
                style={{
                  borderColor: 'var(--color-gold)',
                  color: '#FAF7F2',
                  padding: '12px 24px'
                }}
              >
                View Festive Offers ({activeCampaigns.length > 1 ? `${activeCampaigns.length} Active Sales` : `${activeCampaign?.discount_percentage}% OFF`})
              </a>
            ) : (
              <a
                href="#saree-collection"
                className="btn-outline"
                style={{
                  borderColor: 'var(--color-gold)',
                  color: '#FAF7F2',
                  padding: '12px 24px'
                }}
              >
                Browse Curated Silks
              </a>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '32px', fontSize: '0.8rem', color: '#D1E5EB' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} color="var(--color-gold)" />
              100% Genuine Handlooms
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} color="var(--color-gold)" />
              12 km Express Dispatch
            </span>
          </div>
        </div>

        {/* Right Visual Moodboard / Hero Showcase */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '420px',
              borderRadius: '12px',
              border: '2px solid var(--color-gold)',
              boxShadow: 'var(--shadow-gold)',
              overflow: 'hidden',
              backgroundColor: 'var(--color-emerald-dark)'
            }}
          >
            <img
              src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"
              alt="Handwoven Kanjeevaram pure silk saree with antique gold zari"
              style={{ width: '100%', height: '420px', objectFit: 'cover', display: 'block' }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                insetInline: 0,
                padding: '20px',
                background: 'linear-gradient(to top, rgba(10, 40, 37, 0.95), transparent)',
                color: '#ffffff'
              }}
            >
              <span className="badge-festive" style={{ marginBottom: '6px' }}>Featured Masterpiece</span>
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', fontFamily: 'var(--font-serif-brand)' }}>
                Kanjeevaram Pure Mulberry Silk
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-gold-light)' }}>
                Emerald Green & Ruby Zari Pallu
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
