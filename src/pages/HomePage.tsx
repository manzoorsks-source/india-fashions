import React, { useState, useEffect } from 'react';
import { Product } from '../../shared/types.js';
import { apiRequest } from '../utils/api.js';
import { HeroCampaign } from '../components/customer/HeroCampaign.js';
import { ProductCard } from '../components/customer/ProductCard.js';
import { TrustPoints } from '../components/customer/TrustPoints.js';
import { useStore } from '../context/StoreContext.js';
import { Sparkles, ArrowRight, Clock, ArrowUpRight, ChevronRight } from 'lucide-react';

interface HomePageProps {
  onSelectProduct: (product: Product) => void;
  onExploreCollection: () => void;
  onSelectCategory?: (slug: string) => void;
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

const CATEGORY_SHOWCASE = [
  {
    slug: 'sarees',
    name: 'Heirloom Sarees',
    icon: '🥻',
    subtitle: 'Kanjivaram • Banarasi • Chanderi',
    countText: '12 Masterpieces',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600'
  },
  {
    slug: 'punjabi-dresses',
    name: 'Punjabi Dresses',
    icon: '👗',
    subtitle: 'Surat Chanderi • Patiala Zari • Anarkali',
    countText: '4 Designer Suits',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600'
  },
  {
    slug: 'kurti',
    name: 'Designer Kurtis',
    icon: '🌸',
    subtitle: 'Lucknowi Chikankari • Banarasi Brocades',
    countText: '2 Artisanal Sets',
    image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600'
  },
  {
    slug: 'lehenga',
    name: 'Royal Lehengas',
    icon: '💃',
    subtitle: 'Bridal Banarasi Silk • Velvet Heavy Zari',
    countText: '2 Bridal Ensembles',
    image: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&q=80&w=600'
  },
  {
    slug: 'children',
    name: 'Children Festive',
    icon: '👧',
    subtitle: 'Pure Silk Pattu Pavadai • Kurta Dhotis',
    countText: '2 Festive Outfits',
    image: 'https://images.unsplash.com/photo-1621786030684-4c6382f480c8?auto=format&fit=crop&q=80&w=600'
  }
];

interface CategorySectionConfig {
  slug: string;
  name: string;
  icon: string;
  subtitle: string;
  title: string;
  description: string;
  displayLimit: number;
}

const CATEGORY_SECTIONS: CategorySectionConfig[] = [
  {
    slug: 'sarees',
    name: 'Sarees',
    icon: '🥻',
    subtitle: 'Royal Heritage Handlooms',
    title: 'Heirloom Sarees Collection',
    description: 'Timeless Kanchipuram pure mulberry silks, Varanasi antique kadwa brocades, and luminous Chanderi tissue drapes.',
    displayLimit: 6
  },
  {
    slug: 'punjabi-dresses',
    name: 'Punjabi Dresses',
    icon: '👗',
    subtitle: 'Bespoke Salwar & Festive Suits',
    title: 'Designer Punjabi Dresses & Salwar Suits',
    description: 'Rich handcrafted Punjabi suits, Surat Chanderi embroidered sets, Patiala heavy zari salwar suits, and celebratory Anarkalis.',
    displayLimit: 6
  },
  {
    slug: 'kurti',
    name: 'Kurtis',
    icon: '🌸',
    subtitle: 'Artisanal Everyday & Festive Elegance',
    title: 'Festive Kurtis & Straight Sets',
    description: 'Pure Lucknowi Chikankari hand embroidery and Banarasi brocade straight kurtis tailored for versatile elegance.',
    displayLimit: 6
  },
  {
    slug: 'lehenga',
    name: 'Lehengas',
    icon: '💃',
    subtitle: 'Grand Celebratory Ensembles',
    title: 'Royal Bridal & Festive Lehengas',
    description: 'Grand semi-stitched Banarasi silk bridal lehengas and heavy velvet zari cholis tailored for royal weddings and celebrations.',
    displayLimit: 6
  },
  {
    slug: 'children',
    name: 'Children',
    icon: '👧',
    subtitle: 'Little Royalty Ensembles',
    title: 'Children Heritage Festive Wear',
    description: 'Traditional pure silk Pattu Pavadai sets for young princesses and Jacquard silk kurta dhoti sets for young princes.',
    displayLimit: 6
  }
];

export const HomePage: React.FC<HomePageProps> = ({
  onSelectProduct,
  onExploreCollection,
  onSelectCategory
}) => {
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

  const getCategoryProducts = (slug: string) => {
    return products.filter(p => {
      if (p.category_slug === slug) return true;
      if (p.category_id === `cat-${slug}`) return true;
      if (slug === 'punjabi-dresses' && p.category_name?.toLowerCase().includes('punjabi')) return true;
      if (slug === 'sarees' && p.category_name?.toLowerCase().includes('saree')) return true;
      if (slug === 'kurti' && p.category_name?.toLowerCase().includes('kurti')) return true;
      if (slug === 'lehenga' && p.category_name?.toLowerCase().includes('lehenga')) return true;
      if (slug === 'children' && p.category_name?.toLowerCase().includes('child')) return true;
      return false;
    });
  };

  const heroProduct = products.find(p => p.homepage_placement === 'HERO')
    || products.find(p => p.is_featured)
    || products[0];

  const categoryDefs = [
    { slug: 'sarees', name: 'Heirloom Sarees', icon: '🥻' },
    { slug: 'punjabi-dresses', name: 'Punjabi Dresses', icon: '👗' },
    { slug: 'kurti', name: 'Designer Kurtis', icon: '🌸' },
    { slug: 'lehenga', name: 'Royal Lehengas', icon: '💃' },
    { slug: 'children', name: 'Children Festive', icon: '👧' }
  ];

  const categorySlides = categoryDefs.map(cat => {
    const catProds = products.filter(p => {
      const matchesCat =
        p.category_slug === cat.slug ||
        p.category_id === `cat-${cat.slug}` ||
        (cat.slug === 'punjabi-dresses' && p.category_name?.toLowerCase().includes('punjabi')) ||
        (cat.slug === 'sarees' && p.category_name?.toLowerCase().includes('saree')) ||
        (cat.slug === 'kurti' && (p.category_name?.toLowerCase().includes('kurti') || p.category_id === 'cat-kurti')) ||
        (cat.slug === 'lehenga' && (p.category_name?.toLowerCase().includes('lehenga') || p.category_id === 'cat-lehenga')) ||
        (cat.slug === 'children' && (p.category_name?.toLowerCase().includes('child') || p.category_id === 'cat-children'));

      if (!matchesCat) return false;

      const photo = p.media?.find(m => m.is_primary)?.file_path || p.media?.[0]?.file_path;
      const isValidPhoto = photo && (photo.startsWith('http') || photo.startsWith('/uploads'));
      return Boolean(isValidPhoto);
    });

    const heroProd =
      catProds.find(p => p.homepage_placement === 'HERO') ||
      catProds.find(p => p.is_featured) ||
      catProds[0] ||
      null;

    return {
      slug: cat.slug,
      name: cat.name,
      icon: cat.icon,
      product: heroProd
    };
  }).filter((slide): slide is { slug: string; name: string; icon: string; product: Product } => slide.product !== null);

  return (
    <div style={{ backgroundColor: '#bce1f0', minHeight: '100vh', transition: 'background-color 0.3s ease' }}>
      {/* 1. Hero Campaign Banner Section */}
      <HeroCampaign
        onExploreClick={onExploreCollection}
        activeCampaign={activeCampaign}
        activeCampaigns={activeCampaigns}
        onSelectCampaign={setActiveCampaign}
        heroProduct={heroProduct}
        categorySlides={categorySlides}
        onSelectProduct={onSelectProduct}
      />

      {/* 2. Shop By Category Visual Cards Section */}
      <section id="shop-by-category" style={{ margin: '40px 0 30px' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-gold-dark)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 800 }}>
              Royal Indian Weaves & Couture
            </span>
            <h2 style={{ fontSize: '2.1rem', color: 'var(--color-emerald-dark)', fontFamily: 'var(--font-serif-brand)', marginTop: '4px' }}>
              Shop By Category
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--color-charcoal-muted)', maxWidth: '620px', margin: '6px auto 0' }}>
              Select a category below to explore dedicated heirloom handlooms and bespoke silhouettes.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '18px'
            }}
          >
            {CATEGORY_SHOWCASE.map(cat => {
              const count = getCategoryProducts(cat.slug).length;
              return (
                <div
                  key={cat.slug}
                  onClick={() => {
                    const el = document.getElementById(`${cat.slug}-section`);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    } else if (onSelectCategory) {
                      onSelectCategory(cat.slug);
                    }
                  }}
                  style={{
                    position: 'relative',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: '0 6px 16px rgba(15, 95, 86, 0.12)',
                    border: '1.5px solid var(--color-gold)',
                    backgroundColor: '#0F5F56',
                    height: '240px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(15, 95, 86, 0.25)';
                    e.currentTarget.style.borderColor = 'var(--color-gold-bright)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(15, 95, 86, 0.12)';
                    e.currentTarget.style.borderColor = 'var(--color-gold)';
                  }}
                >
                  {/* Background Image */}
                  <img
                    src={cat.image}
                    alt={cat.name}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      filter: 'brightness(0.75)',
                      transition: 'transform 0.5s ease'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1.0)')}
                  />

                  {/* Gradient Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(to top, rgba(10, 35, 30, 0.92) 0%, rgba(10, 35, 30, 0.35) 60%, rgba(0,0,0,0.1) 100%)',
                      zIndex: 1
                    }}
                  />

                  {/* Top Badge */}
                  <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}>
                    <span
                      style={{
                        backgroundColor: 'rgba(212, 175, 55, 0.95)',
                        color: '#0A433D',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                      }}
                    >
                      {count > 0 ? `${count} Designs` : cat.countText}
                    </span>
                  </div>

                  {/* Content */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '100%',
                      padding: '16px',
                      zIndex: 2,
                      color: '#ffffff'
                    }}
                  >
                    <span style={{ fontSize: '1.4rem', display: 'block', marginBottom: '2px' }}>{cat.icon}</span>
                    <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-serif-brand)', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                      {cat.name}
                    </h3>
                    <p style={{ fontSize: '0.72rem', color: '#E2E8F0', opacity: 0.9, lineHeight: 1.3, marginBottom: '8px' }}>
                      {cat.subtitle}
                    </p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-gold-bright)', fontWeight: 700 }}>
                      <span>View Collection</span>
                      <ArrowUpRight size={14} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Festive Campaign Sale Banners with Countdown - Displays ALL Active Campaigns */}
      {activeCampaigns && activeCampaigns.length > 0 && (
        <section id="festive-offer" style={{ margin: '40px 0 50px' }}>
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

      {/* 4. Sequential Category-Wise Showcase Sections */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748B' }}>
          Loading handcrafted weaves & silhouettes...
        </div>
      ) : (
        CATEGORY_SECTIONS.map((cat, idx) => {
          const catProducts = getCategoryProducts(cat.slug);
          if (catProducts.length === 0) return null;
          const displayProducts = catProducts.slice(0, cat.displayLimit);

          return (
            <section
              key={cat.slug}
              id={`${cat.slug}-section`}
              style={{
                padding: '48px 0',
                borderTop: idx === 0 ? 'none' : '1px solid rgba(15, 95, 86, 0.15)',
                position: 'relative'
              }}
            >
              {/* Backwards compatibility anchor for saree collection */}
              {cat.slug === 'sarees' && (
                <div id="saree-collection" style={{ position: 'relative', top: '-80px' }} />
              )}

              <div className="container">
                {/* Section Header with Prominent Arrow Mark Button */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    marginBottom: '28px',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--color-gold-dark)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>{cat.icon}</span>
                      <span>{cat.subtitle}</span>
                    </span>
                    <h2
                      style={{
                        fontSize: '2.1rem',
                        color: 'var(--color-emerald-dark)',
                        fontFamily: 'var(--font-serif-brand)',
                        marginTop: '4px',
                        marginBottom: '6px'
                      }}
                    >
                      {cat.title}
                    </h2>
                    <p
                      style={{
                        fontSize: '0.92rem',
                        color: 'var(--color-charcoal-muted)',
                        maxWidth: '680px',
                        margin: 0
                      }}
                    >
                      {cat.description}
                    </p>
                  </div>

                  {/* Prominent Category Arrow Mark Button */}
                  <button
                    onClick={() => onSelectCategory?.(cat.slug)}
                    id={`btn-open-category-${cat.slug}`}
                    aria-label={`View all ${cat.name}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '12px',
                      backgroundColor: '#ffffff',
                      color: 'var(--color-emerald-dark)',
                      border: '1.5px solid var(--color-gold)',
                      padding: '10px 22px',
                      borderRadius: '30px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(15, 95, 86, 0.12)',
                      transition: 'all 0.25s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor = 'var(--color-emerald)';
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(15, 95, 86, 0.25)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.color = 'var(--color-emerald-dark)';
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(15, 95, 86, 0.12)';
                    }}
                  >
                    <span>View All {cat.name} ({catProducts.length})</span>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-emerald-dark)',
                        flexShrink: 0
                      }}
                    >
                      <ArrowRight size={16} />
                    </div>
                  </button>
                </div>

                {/* Category Products Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '24px'
                  }}
                >
                  {displayProducts.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelectProduct={onSelectProduct}
                    />
                  ))}
                </div>

                {/* Bottom View All Category Action Link */}
                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                  <button
                    onClick={() => onSelectCategory?.(cat.slug)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-emerald-dark)',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      transition: 'gap 0.2s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = 'var(--color-maroon)';
                      e.currentTarget.style.gap = '12px';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = 'var(--color-emerald-dark)';
                      e.currentTarget.style.gap = '8px';
                    }}
                  >
                    <span>Explore complete {catProducts.length} {cat.name} designs in catalog</span>
                    <ArrowRight size={16} color="var(--color-gold)" />
                  </button>
                </div>
              </div>
            </section>
          );
        })
      )}

      {/* 5. Trust Points Section */}
      <TrustPoints />
    </div>
  );
};
