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
  const { settings, activeCampaign } = useStore();

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
      {/* Hero Campaign Section */}
      <HeroCampaign onExploreClick={onExploreCollection} activeCampaign={activeCampaign} />

      {/* Right-to-Left Product Showcase Carousel */}
      <ProductCarousel
        title="Royal Saree Showcase"
        subtitle="Drape the moment • Right to Left Gallery"
        products={products.slice(0, 6)}
        onSelectProduct={onSelectProduct}
      />

      {/* Festive Campaign Sale Banner with Countdown - Only show when active festive offer is ongoing */}
      {activeCampaign && activeCampaign.is_active && (
        <section id="festive-offer" style={{ margin: '40px 0' }}>
          <div className="container">
            <div
              style={{
                background: 'linear-gradient(135deg, #6A1B29 0%, #4D121D 100%)',
                border: '2px solid var(--color-gold)',
                borderRadius: '12px',
                padding: '36px 32px',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '24px',
                boxShadow: '0 8px 24px rgba(106, 27, 41, 0.25)'
              }}
            >
              <div style={{ maxWidth: '600px' }}>
                <span className="badge-festive" style={{ marginBottom: '12px', backgroundColor: 'var(--color-emerald)', borderColor: 'var(--color-gold)' }}>
                  {activeCampaign.label || 'Exclusive Festive Edit'}
                </span>
                <h3 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-serif-brand)', color: 'var(--color-gold-light)', marginBottom: '8px' }}>
                  {activeCampaign.name}
                </h3>
                <p style={{ fontSize: '0.95rem', color: '#F8E9EC', lineHeight: 1.6, fontFamily: 'var(--font-serif-body)' }}>
                  {activeCampaign.description || 'Select any three handcrafted heirloom sarees for weddings and festive celebrations. Automatically calculated in your bag with server cost protection.'}
                </p>
                {activeCampaign.discount_percentage ? (
                  <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(212, 175, 55, 0.2)', border: '1px solid var(--color-gold)', borderRadius: '6px', padding: '6px 14px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-gold-bright)' }}>
                    <Sparkles size={14} color="var(--color-gold)" />
                    <span>Special Festive Discount: {activeCampaign.discount_percentage}% OFF across weaves</span>
                  </div>
                ) : null}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeCampaign.show_countdown && activeCampaign.end_at && (
                  <CountdownBadge endAt={activeCampaign.end_at} />
                )}

                <button
                  onClick={onExploreCollection}
                  className="btn-gold"
                  style={{ width: '100%', padding: '12px 24px' }}
                >
                  <span>Shop Festive Sarees</span>
                  <ArrowRight size={16} />
                </button>
              </div>
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
