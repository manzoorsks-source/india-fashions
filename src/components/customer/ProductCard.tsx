import React from 'react';
import { Product } from '../../../shared/types.js';
import { useStore } from '../../context/StoreContext.js';
import { formatINR } from '../../utils/formatters.js';
import { ShoppingBag, Eye, Clock } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelectProduct }) => {
  const { addToCart, openAdvanceOrderModal } = useStore();

  const primaryMedia = product.media?.find(m => m.is_primary) || product.media?.[0];
  const primaryVariant = product.variants?.[0];

  const totalStock = product.variants?.reduce((sum, v) => sum + v.quantity, 0) || 0;
  const isOutOfStock = totalStock === 0;
  const isLowStock = !isOutOfStock && totalStock <= (primaryVariant?.low_stock_threshold || 2);

  // Price calculations
  const minSellingPrice = Math.min(...(product.variants?.map(v => v.selling_price) || [0]));
  const minSalePrice = Math.min(
    ...(product.variants?.filter(v => v.sale_price && v.sale_price > 0).map(v => v.sale_price!) || [])
  );
  const hasSale = !isNaN(minSalePrice) && isFinite(minSalePrice) && minSalePrice < minSellingPrice;
  const currentDisplayPrice = hasSale ? minSalePrice : minSellingPrice;

  const discountPercent = hasSale ? Math.round(((minSellingPrice - minSalePrice) / minSellingPrice) * 100) : 0;

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) {
      if (primaryVariant) {
        openAdvanceOrderModal(product, primaryVariant);
      } else {
        onSelectProduct(product);
      }
    } else {
      if (primaryVariant) {
        addToCart(product, primaryVariant);
      } else {
        onSelectProduct(product);
      }
    }
  };

  return (
    <div
      onClick={() => onSelectProduct(product)}
      style={{
        backgroundColor: 'var(--color-silk-cream)',
        borderRadius: '10px',
        border: '1px solid var(--color-border-subtle)',
        boxShadow: '0 4px 12px rgba(15, 95, 86, 0.08)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 10px 24px rgba(15, 95, 86, 0.16)';
        e.currentTarget.style.borderColor = 'var(--color-gold)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 95, 86, 0.08)';
        e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
      }}
    >
      {/* Product Image Container */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '125%', overflow: 'hidden', backgroundColor: '#EDE6DA' }}>
        <img
          src={primaryMedia?.file_path || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80'}
          alt={primaryMedia?.alt_text || product.name}
          loading="lazy"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease'
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1.0)')}
        />

        {/* Badges Overlay */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '5px', zIndex: 2 }}>
          {product.campaign_label && (
            <span className="badge-festive" style={{ fontSize: '0.68rem', padding: '3px 8px' }}>
              {product.campaign_label}
            </span>
          )}
          {hasSale && (
            <span className="badge-sale" style={{ fontSize: '0.7rem' }}>
              -{discountPercent}% OFF
            </span>
          )}
          {isLowStock && (
            <span className="badge-low-stock" style={{ fontSize: '0.7rem' }}>
              Only {totalStock} left
            </span>
          )}
          {isOutOfStock && (
            <span className="badge-out-of-stock" style={{ fontSize: '0.7rem' }}>
              Out of Stock
            </span>
          )}
        </div>
      </div>

      {/* Product Information */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-gold-dark)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              {product.category_name || 'Handloom'}
            </span>
            {product.fabric && (
              <span style={{ fontSize: '0.7rem', color: 'var(--color-charcoal-muted)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                {product.fabric}
              </span>
            )}
          </div>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--color-charcoal)',
              lineHeight: 1.3,
              marginBottom: '8px',
              fontFamily: 'var(--font-sans)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {product.name}
          </h3>

          {/* Color Dots */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '12px' }}>
            {product.variants?.map(v => (
              <span
                key={v.id}
                title={v.color}
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: v.color_code || '#0F5F56',
                  border: '1.5px solid #ffffff',
                  boxShadow: '0 0 0 1px #CBD5E1',
                  display: 'inline-block'
                }}
              />
            ))}
            <span style={{ fontSize: '0.72rem', color: '#64748B', marginLeft: '4px' }}>
              {product.variants?.length} {product.variants?.length === 1 ? 'color' : 'colors'}
            </span>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-charcoal)' }}>
              {formatINR(currentDisplayPrice)}
            </span>
            {hasSale && (
              <span style={{ fontSize: '0.85rem', color: '#94A3B8', textDecoration: 'line-through' }}>
                {formatINR(minSellingPrice)}
              </span>
            )}
          </div>

          <button
            onClick={handleAction}
            className={isOutOfStock ? 'btn-outline' : 'btn-primary'}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '0.82rem',
              borderColor: isOutOfStock ? 'var(--color-maroon)' : undefined,
              color: isOutOfStock ? 'var(--color-maroon)' : undefined
            }}
          >
            {isOutOfStock ? (
              <>
                <Clock size={15} />
                <span>Advance Order</span>
              </>
            ) : (
              <>
                <ShoppingBag size={15} />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
