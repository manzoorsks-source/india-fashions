import React, { useState, useEffect } from 'react';
import { Product } from '../../shared/types.js';
import { apiRequest } from '../utils/api.js';
import { HeroCampaign } from '../components/customer/HeroCampaign.js';
import { ProductCarousel } from '../components/customer/ProductCarousel.js';
import { ProductCard } from '../components/customer/ProductCard.js';
import { TrustPoints } from '../components/customer/TrustPoints.js';
import { useStore } from '../context/StoreContext.js';
import { Sparkles, ArrowRight, Clock } from 'lucide-react';

interface HomePageProps {
  onSelectProduct: (product: Product) => void;
  onExploreCollection: () => void;
}

const CountdownBadge: React.FC<{ endAt: string }> = ({ endAt }) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calculate = () => {
      const diff = new Date(endAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [endAt]);

  if (!timeLeft) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: '8px 16px',
        borderRadius: '6px',
        border: '1px solid rgba(212,175,55,0.4)',
        fontSize: '0.85rem'
      }}
    >
      <Clock size={16} color="var(--color-gold)" />
      <span>
        Offer Ends in: {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}{timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
      </span>
    </div>
  );
};

export const HomePage: React.FC<HomePageProps> = ({ onSelectProduct, onExploreCollection }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings, activeCampaign, activeCampaigns, setActiveCampaign } = useStore();

  useEffect(() => {
    apiRequest<{ products: Product[] }>('/products')
      .then(res => {
        if (res?.products) {
          setProducts(res.products);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const featuredSarees = products.filter(p => p.is_featured);
  const newArrivals = products.filter(p => p.homepage_placement === 'NEW_ARRIVAL' || p.campaign_label === 'New arrival');

  return (
    <div style={{ backgroundColor: '#bce1f0', minHeight: '100vh', transition: 'background-color 0.3s ease' }}>
      {/* Hero Campaign Section with Multiple Active Campaign Badges */}
      <HeroCampaign
        onExploreClick={onExploreCollection}
        activeCampaign={activeCampaign}
        activeCampaigns={activeCampaigns}
        onSelectCampaign={setActiveCampaign}
      />

      {/* Right-to-Left Product Showcase Carousel */}
      <ProductCarousel
        title="Royal Saree Showcase"
        subtitle="Drape the moment • Right to Left Gallery"
        products={products.slice(0, 6)}
        onSelectProduct={onSelectProduct}
      />

      {/* Festive Campaign Sale Banners with Countdown - Displays ALL Active Campaigns */}
      {activeCampaigns && activeCampaigns.length > 0 && (
        <section id="festive-offer" style={{ margin: '40px 0' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-gold-dark)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 800 }}>
                Auspicious Festive Edits ({activeCampaigns.length} Active Offers)
              </span>
              <h2 style={{ fontSize: '2rem', color: 'var(--color-emerald-dark)', fontFamily: 'var(--font-serif-brand)', marginTop: '4px' }}>
                Exclusive Festive Celebration Offers
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: activeCampaigns.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '24px'
              }}
            >
              {activeCampaigns.map((camp, idx) => {
                const isSelected = activeCampaign?.id === camp.id;
                return (
                  <div
                    key={camp.id}
                    id={`campaign-${camp.id}`}
                    style={{
                      background: idx % 2 === 0
                        ? 'linear-gradient(135deg, #0A433D 0%, #0F5F56 100%)'
                        : 'linear-gradient(135deg, #6A1B29 0%, #4D121D 100%)',
                      border: isSelected ? '3px solid var(--color-gold-bright)' : '2px solid var(--color-gold)',
                      borderRadius: '14px',
                      padding: '32px 28px',
                      color: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: isSelected
                        ? '0 12px 32px rgba(212, 175, 55, 0.35)'
                        : (idx % 2 === 0 ? '0 8px 24px rgba(15, 95, 86, 0.25)' : '0 8px 24px rgba(106, 27, 41, 0.25)'),
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                        <span
                          className="badge-festive"
                          style={{
                            backgroundColor: 'rgba(212, 175, 55, 0.2)',
                            borderColor: 'var(--color-gold)',
                            color: 'var(--color-gold-bright)',
                            fontWeight: 800
                          }}
                        >
                          {camp.label || 'Festive Edit'}
                        </span>

                        {camp.discount_percentage ? (
                          <span
                            style={{
                              backgroundColor: 'var(--color-gold)',
                              color: 'var(--color-emerald-dark)',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '0.85rem',
                              fontWeight: 800,
                              letterSpacing: '0.02em',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                            }}
                          >
                            {camp.discount_percentage}% OFF
                          </span>
                        ) : null}
                      </div>

                      <h3 style={{ fontSize: '1.6rem', fontFamily: 'var(--font-serif-brand)', color: '#ffffff', marginBottom: '10px' }}>
                        {camp.name}
                      </h3>

                      <p style={{ fontSize: '0.92rem', color: '#F8E9EC', lineHeight: 1.6, fontFamily: 'var(--font-serif-body)', marginBottom: '18px' }}>
                        {camp.description || 'Celebrate auspicious moments in heirloom Indian weaves with curated discounts and 2+1 festive bundles.'}
                      </p>

                      {camp.discount_percentage ? (
                        <div style={{ marginBottom: '18px', display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(212, 175, 55, 0.15)', border: '1px solid var(--color-gold)', borderRadius: '6px', padding: '6px 14px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-gold-bright)' }}>
                          <Sparkles size={14} color="var(--color-gold)" />
                          <span>Special Festive Savings: {camp.discount_percentage}% OFF across weaves</span>
                        </div>
                      ) : null}
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {camp.show_countdown && camp.end_at && (
                        <CountdownBadge endAt={camp.end_at} />
                      )}

                      <button
                        onClick={onExploreCollection}
                        className="btn-gold"
                        style={{ width: '100%', padding: '12px 24px', fontSize: '0.9rem' }}
                      >
                        <span>Shop {camp.name}</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured Sarees Grid */}
      <section id="saree-collection" style={{ margin: '48px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-gold-dark)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, marginBottom: '6px' }}>
              Masterpiece Catalog
            </p>
            <h2 style={{ fontSize: '2.2rem', color: 'var(--color-emerald-dark)', fontFamily: 'var(--font-serif-brand)' }}>
              Handpicked Festive Sarees
            </h2>
            <div className="royal-divider">
              <span className="royal-motif" />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
              Loading handcrafted drapes...
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '24px'
              }}
            >
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelectProduct={onSelectProduct}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trust Points */}
      <TrustPoints />
    </div>
  );
};
