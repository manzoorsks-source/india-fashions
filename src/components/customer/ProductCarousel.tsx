import React, { useRef } from 'react';
import { Product } from '../../../shared/types.js';
import { ProductCard } from './ProductCard.js';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface ProductCarouselProps {
  title: string;
  subtitle?: string;
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const ProductCarousel: React.FC<ProductCarouselProps> = ({ title, subtitle, products, onSelectProduct }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section style={{ margin: '48px 0', position: 'relative' }}>
      <div className="container">
        {/* Section Header with Controls */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            {subtitle && (
              <p style={{ fontSize: '0.78rem', color: 'var(--color-gold-dark)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '4px' }}>
                {subtitle}
              </p>
            )}
            <h2 style={{ fontSize: '1.8rem', color: 'var(--color-emerald-dark)', fontFamily: 'var(--font-serif-brand)' }}>
              {title}
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '1px solid var(--color-gold)',
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 8px rgba(15, 95, 86, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-emerald-dark)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--color-gold)';
                e.currentTarget.style.backgroundColor = 'var(--color-emerald)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--color-gold)';
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = 'var(--color-emerald-dark)';
              }}
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '1px solid var(--color-gold)',
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 8px rgba(15, 95, 86, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-emerald-dark)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--color-gold)';
                e.currentTarget.style.backgroundColor = 'var(--color-emerald)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--color-gold)';
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.color = 'var(--color-emerald-dark)';
              }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Carousel Slider with R-to-L / smooth touch scroll */}
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: '20px',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            paddingBottom: '16px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {products.map(product => (
            <div
              key={product.id}
              style={{
                flex: '0 0 280px',
                scrollSnapAlign: 'start'
              }}
            >
              <ProductCard product={product} onSelectProduct={onSelectProduct} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
