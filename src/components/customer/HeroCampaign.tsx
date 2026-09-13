import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { SaleCampaign, Product } from '../../../shared/types.js';

export interface CategorySlide {
  slug: string;
  name: string;
  icon: string;
  product: Product;
}

interface HeroCampaignProps {
  onExploreClick: () => void;
  activeCampaign?: SaleCampaign | null;
  activeCampaigns?: SaleCampaign[];
  onSelectCampaign?: (campaign: SaleCampaign) => void;
  heroProduct?: Product | null;
  onSelectProduct?: (product: Product) => void;
  categorySlides?: CategorySlide[];
}

export const HeroCampaign: React.FC<HeroCampaignProps> = ({
  onExploreClick,
  activeCampaign,
  activeCampaigns = [],
  onSelectCampaign,
  heroProduct,
  onSelectProduct,
  categorySlides = []
}) => {
  const isOfferActive = Boolean(activeCampaign && activeCampaign.is_active) || activeCampaigns.length > 0;

  // Build slides array: prioritize categorySlides if provided, else fallback to heroProduct
  const slides: CategorySlide[] = categorySlides.length > 0
    ? categorySlides
    : heroProduct
      ? [{ slug: 'featured', name: heroProduct.category_name || 'Featured', icon: '✨', product: heroProduct }]
      : [];

  const [activeIdx, setActiveIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto right-to-left scroll timer (3.8 seconds per slide)
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % slides.length);
    }, 3800);

    return () => clearInterval(timer);
  }, [slides.length, isPaused]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx(prev => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIdx(prev => (prev + 1) % slides.length);
  };

  const currentSlide = slides[activeIdx] || null;

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '500px',
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
          padding: '50px 20px',
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

        {/* Right Visual Category Showcase Slider (Right to Left Scrolling) */}
        <div
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Main Carousel Frame */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '430px',
              height: '460px',
              borderRadius: '16px',
              border: '2.5px solid var(--color-gold)',
              boxShadow: '0 12px 35px rgba(0,0,0,0.4), 0 0 20px rgba(212, 175, 55, 0.3)',
              overflow: 'hidden',
              backgroundColor: 'var(--color-emerald-dark)',
              cursor: currentSlide ? 'pointer' : 'default'
            }}
            onClick={() => currentSlide?.product && onSelectProduct?.(currentSlide.product)}
          >
            {/* Sliding Track for Smooth Right-to-Left Transition */}
            <div
              style={{
                display: 'flex',
                width: `${slides.length * 100}%`,
                height: '100%',
                transform: `translateX(-${(activeIdx * 100) / (slides.length || 1)}%)`,
                transition: 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)'
              }}
            >
              {slides.map((slide, idx) => {
                const p = slide.product;
                const photoUrl =
                  p.media?.find(m => m.is_primary)?.file_path ||
                  p.media?.[0]?.file_path ||
                  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80';

                // Pricing and Festive Discount Calculation
                const variant = p.variants?.[0];
                const sellingPrice = variant?.selling_price || 0;
                const customSalePrice = variant?.sale_price;
                const campaignDiscount = activeCampaign && activeCampaign.is_active ? activeCampaign.discount_percentage : 0;

                let festivePrice = customSalePrice || (campaignDiscount > 0 ? Math.round(sellingPrice * (1 - campaignDiscount / 100)) : null);
                let discountPercentage = 0;
                if (customSalePrice && sellingPrice > customSalePrice) {
                  discountPercentage = Math.round(((sellingPrice - customSalePrice) / sellingPrice) * 100);
                } else if (campaignDiscount > 0) {
                  discountPercentage = campaignDiscount;
                }

                const hasFestiveOffer = Boolean(discountPercentage > 0 && festivePrice && festivePrice < sellingPrice);

                return (
                  <div
                    key={`${slide.slug}-${p.id}-${idx}`}
                    style={{
                      width: `${100 / (slides.length || 1)}%`,
                      height: '100%',
                      position: 'relative',
                      flexShrink: 0
                    }}
                  >
                    {/* Background Product Image */}
                    <img
                      src={photoUrl}
                      alt={p.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block'
                      }}
                      onError={e => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80';
                      }}
                    />

                    {/* Top Floating Badges */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '14px',
                        left: '14px',
                        right: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px',
                        zIndex: 4
                      }}
                    >
                      {/* Festive Offer Highlight Badge */}
                      {hasFestiveOffer ? (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'linear-gradient(135deg, #B91C1C 0%, #DC2626 100%)',
                            color: '#FFFFFF',
                            border: '1.5px solid var(--color-gold-bright)',
                            borderRadius: '999px',
                            padding: '5px 12px',
                            boxShadow: '0 4px 15px rgba(220, 38, 38, 0.5), 0 0 10px rgba(212, 175, 55, 0.4)'
                          }}
                        >
                          <Sparkles size={13} color="var(--color-gold-bright)" />
                          <span style={{ fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            {activeCampaign?.name ? `${activeCampaign.name} (${discountPercentage}% OFF)` : `Festive Offer • ${discountPercentage}% OFF`}
                          </span>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: 'rgba(10, 40, 37, 0.85)',
                            backdropFilter: 'blur(6px)',
                            border: '1px solid var(--color-gold)',
                            borderRadius: '999px',
                            padding: '4px 10px',
                            color: 'var(--color-gold-bright)',
                            fontSize: '0.72rem',
                            fontWeight: 700
                          }}
                        >
                          <Sparkles size={12} color="var(--color-gold)" />
                          <span>{p.campaign_label || 'Handcrafted Luxury'}</span>
                        </div>
                      )}

                      {/* Category Pill */}
                      <div
                        style={{
                          backgroundColor: 'rgba(10, 40, 37, 0.9)',
                          backdropFilter: 'blur(6px)',
                          border: '1px solid rgba(212, 175, 55, 0.6)',
                          color: '#FFFFFF',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}
                      >
                        <span>{slide.icon}</span>
                        <span>{slide.name}</span>
                      </div>
                    </div>

                    {/* Gradient Dark Overlay & Product Info at Bottom */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        insetInline: 0,
                        padding: '24px 20px 18px',
                        background: 'linear-gradient(to top, rgba(8, 30, 28, 0.98) 0%, rgba(10, 40, 37, 0.85) 60%, transparent 100%)',
                        color: '#ffffff',
                        zIndex: 3
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '1.25rem',
                          color: '#ffffff',
                          fontFamily: 'var(--font-serif-brand)',
                          margin: '0 0 4px 0',
                          lineHeight: 1.3,
                          textShadow: '0 2px 4px rgba(0,0,0,0.4)'
                        }}
                      >
                        {p.name}
                      </h3>

                      <p
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--color-gold-light)',
                          margin: '0 0 10px 0',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {p.fabric || 'Pure Artisanal Handloom Craft'}
                      </p>

                      {/* Pricing & Festive Discount Highlight */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          {hasFestiveOffer && festivePrice ? (
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-gold-bright)', textShadow: '0 0 10px rgba(212, 175, 55, 0.4)' }}>
                                ₹{festivePrice.toLocaleString('en-IN')}
                              </span>
                              <span style={{ fontSize: '0.82rem', color: '#94A3B8', textDecoration: 'line-through' }}>
                                ₹{sellingPrice.toLocaleString('en-IN')}
                              </span>
                              <span style={{ fontSize: '0.7rem', backgroundColor: '#DC2626', color: '#fff', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                                {discountPercentage}% OFF
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-gold-bright)' }}>
                              ₹{sellingPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>

                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.78rem',
                            color: 'var(--color-gold-bright)',
                            fontWeight: 700,
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(212, 175, 55, 0.15)',
                            border: '1px solid rgba(212, 175, 55, 0.3)'
                          }}
                        >
                          <span>Explore</span>
                          <ArrowRight size={13} />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Left & Right Arrow Navigation Controls */}
            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous Category"
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(10, 40, 37, 0.85)',
                    border: '1px solid var(--color-gold)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-gold)'; e.currentTarget.style.color = 'var(--color-emerald-dark)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(10, 40, 37, 0.85)'; e.currentTarget.style.color = '#ffffff'; }}
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next Category"
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(10, 40, 37, 0.85)',
                    border: '1px solid var(--color-gold)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 10,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--color-gold)'; e.currentTarget.style.color = 'var(--color-emerald-dark)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(10, 40, 37, 0.85)'; e.currentTarget.style.color = '#ffffff'; }}
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Bottom Progress Bar Indicator */}
            {slides.length > 1 && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  insetInline: 0,
                  height: '3px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  zIndex: 20
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${((activeIdx + 1) / slides.length) * 100}%`,
                    backgroundColor: 'var(--color-gold-bright)',
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>
            )}
          </div>

          {/* Interactive Category Selector Pills Below Slider */}
          {slides.length > 1 && (
            <div
              style={{
                display: 'flex',
                gap: '6px',
                justifyContent: 'center',
                marginTop: '14px',
                flexWrap: 'wrap',
                maxWidth: '430px'
              }}
            >
              {slides.map((s, idx) => {
                const isActive = idx === activeIdx;
                return (
                  <button
                    key={s.slug}
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '999px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: isActive ? '1.5px solid var(--color-gold-bright)' : '1px solid rgba(212, 175, 55, 0.25)',
                      backgroundColor: isActive ? 'var(--color-gold)' : 'rgba(10, 40, 37, 0.65)',
                      color: isActive ? 'var(--color-emerald-dark)' : '#E2E8F0',
                      boxShadow: isActive ? '0 2px 10px rgba(212, 175, 55, 0.35)' : 'none',
                      transition: 'all 0.2s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span>{s.icon}</span>
                    <span>{s.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
