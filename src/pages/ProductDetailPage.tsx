import React, { useState, useEffect } from 'react';
import { Product, ProductVariant } from '../../shared/types.js';
import { useStore } from '../context/StoreContext.js';
import { apiRequest } from '../utils/api.js';
import { formatINR } from '../utils/formatters.js';
import { ImageGalleryZoom } from '../components/customer/ImageGalleryZoom.js';
import { ProductCard } from '../components/customer/ProductCard.js';
import { ShoppingBag, Clock, MapPin, ShieldCheck, Check, Sparkles, ArrowLeft, Share2 } from 'lucide-react';

interface ProductDetailPageProps {
  productSlug: string;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ productSlug, onBack, onSelectProduct }) => {
  const { addToCart, openAdvanceOrderModal, openDeliveryModal, settings } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiRequest<{ product: Product; relatedProducts: Product[] }>(`/products/${productSlug}`)
      .then(res => {
        if (res?.product) {
          setProduct(res.product);
          setSelectedVariant(res.product.variants?.[0] || null);
          setRelatedProducts(res.relatedProducts || []);

          // Set SEO document metadata
          document.title = `${res.product.name} | ${settings?.brand_name || 'India Fashions'}`;
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [productSlug, settings?.brand_name]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-charcoal-muted)' }}>Unfolding handcrafted weave details...</p>
      </div>
    );
  }

  if (!product || !selectedVariant) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2>Product not found</h2>
        <button onClick={onBack} className="btn-primary" style={{ marginTop: '16px' }}>
          Back to Collection
        </button>
      </div>
    );
  }

  const isOutOfStock = selectedVariant.quantity <= 0;
  const isLowStock = !isOutOfStock && selectedVariant.quantity <= selectedVariant.low_stock_threshold;
  const effectivePrice = selectedVariant.sale_price && selectedVariant.sale_price > 0 ? selectedVariant.sale_price : selectedVariant.selling_price;
  const hasSale = selectedVariant.sale_price && selectedVariant.sale_price > 0 && selectedVariant.sale_price < selectedVariant.selling_price;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: '24px 0 60px' }}>
      <div className="container">
        {/* Navigation Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <button
            onClick={onBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              color: 'var(--color-emerald)',
              fontWeight: 600
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Collection</span>
          </button>

          <button
            onClick={handleShare}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              color: 'var(--color-charcoal-muted)',
              border: '1px solid var(--color-border-subtle)',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#ffffff'
            }}
          >
            <Share2 size={15} />
            <span>{copied ? 'Link Copied!' : 'Share Product'}</span>
          </button>
        </div>

        {/* Product Detail Stage */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1.1fr)',
            gap: '48px',
            alignItems: 'start'
          }}
          className="pdp-layout"
        >
          {/* Left: Gallery Zoom */}
          <div>
            <ImageGalleryZoom media={product.media} productName={product.name} />
          </div>

          {/* Right: Specifications & Purchasing Controls */}
          <div>
            {product.campaign_label && (
              <span className="badge-festive" style={{ marginBottom: '10px' }}>
                {product.campaign_label}
              </span>
            )}

            <h1
              style={{
                fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)',
                color: 'var(--color-charcoal)',
                fontFamily: 'var(--font-serif-brand)',
                lineHeight: 1.2,
                marginBottom: '8px'
              }}
            >
              {product.name}
            </h1>

            <p style={{ fontSize: '0.9rem', color: 'var(--color-emerald)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
              {product.fabric}
            </p>

            {/* Price section */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-charcoal)' }}>
                {formatINR(effectivePrice)}
              </span>
              {hasSale && (
                <>
                  <span style={{ fontSize: '1.15rem', color: '#94A3B8', textDecoration: 'line-through' }}>
                    {formatINR(selectedVariant.selling_price)}
                  </span>
                  <span className="badge-sale">
                    Save {Math.round(((selectedVariant.selling_price - selectedVariant.sale_price!) / selectedVariant.selling_price) * 100)}%
                  </span>
                </>
              )}
              <span style={{ fontSize: '0.78rem', color: '#64748B', marginLeft: 'auto' }}>
                Inclusive of all taxes
              </span>
            </div>

            {/* Description */}
            <p style={{ fontSize: '0.92rem', color: 'var(--color-charcoal-muted)', lineHeight: 1.7, marginBottom: '24px' }}>
              {product.description}
            </p>

            {/* Variant Selector: Color & Stock Feedback */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Select Weave Color: <strong style={{ color: 'var(--color-emerald)' }}>{selectedVariant.color}</strong>
                </label>
                <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  SKU: <strong>{selectedVariant.sku}</strong>
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {product.variants.map(v => {
                  const isSelected = selectedVariant.id === v.id;
                  const vOutOfStock = v.quantity <= 0;

                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        border: isSelected ? '2px solid var(--color-gold)' : '1px solid var(--color-border-subtle)',
                        backgroundColor: isSelected ? 'rgba(15, 95, 86, 0.08)' : '#ffffff',
                        position: 'relative'
                      }}
                    >
                      <span
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          backgroundColor: v.color_code || '#0F5F56',
                          border: '1.5px solid #fff',
                          boxShadow: '0 0 0 1px #CBD5E1'
                        }}
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: isSelected ? 700 : 500 }}>
                        {v.color}
                      </span>
                      {vOutOfStock && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--color-maroon)', fontWeight: 700 }}>
                          (Advance)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Real-time Variant Stock Indicator */}
            <div style={{ marginBottom: '24px' }}>
              {isOutOfStock ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '6px',
                    color: '#991B1B',
                    fontSize: '0.85rem'
                  }}
                >
                  <Clock size={16} />
                  <span>
                    <strong>Currently Out of Stock on Looms.</strong> Reserve via <strong>Advance Order</strong> and our master weaver will allocate your drape.
                  </span>
                </div>
              ) : isLowStock ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    backgroundColor: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: '6px',
                    color: '#92400E',
                    fontSize: '0.85rem'
                  }}
                >
                  <Sparkles size={16} color="#D97706" />
                  <span>
                    <strong>Limited Quantity:</strong> Only {selectedVariant.quantity} piece(s) available in this colorway!
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--color-emerald)',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}
                >
                  <Check size={16} />
                  <span>In Stock • Ready for immediate boutique dispatch</span>
                </div>
              )}
            </div>

            {/* 12 km Delivery check & estimate */}
            <div
              style={{
                backgroundColor: 'var(--color-sky-blue)',
                border: '1px solid var(--color-sky-blue-border)',
                borderRadius: '8px',
                padding: '14px 16px',
                marginBottom: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-emerald-dark)' }}>
                  <MapPin size={16} color="var(--color-emerald)" />
                  <span>Delivery within 12 km Radius</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-charcoal-muted)', marginTop: '2px' }}>
                  Dispatched from {settings?.shop_address?.split(',')[1] || 'MG Road, Bangalore'}. Same-day or next-day delivery.
                </p>
              </div>

              <button
                onClick={openDeliveryModal}
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--color-emerald)',
                  textDecoration: 'underline'
                }}
              >
                Check Pincode
              </button>
            </div>

            {/* Main Action CTAs: In-Stock Add to Cart vs Advance Order */}
            <div style={{ display: 'flex', gap: '14px', marginBottom: '32px' }}>
              {isOutOfStock ? (
                <button
                  onClick={() => openAdvanceOrderModal(product, selectedVariant)}
                  className="btn-gold"
                  style={{
                    flex: 1,
                    padding: '16px 28px',
                    fontSize: '0.98rem'
                  }}
                >
                  <Clock size={18} />
                  <span>Submit Advance Order</span>
                </button>
              ) : (
                <button
                  onClick={() => addToCart(product, selectedVariant)}
                  className="btn-primary"
                  style={{
                    flex: 1,
                    padding: '16px 28px',
                    fontSize: '0.98rem'
                  }}
                >
                  <ShoppingBag size={18} color="var(--color-gold)" />
                  <span>Add to Bag</span>
                </button>
              )}
            </div>

            {/* Fabric & Care Instructions Accordion / Specs */}
            <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '20px' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                Product Specifications & Fabric Care
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.85rem', color: 'var(--color-charcoal-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Fabric:</strong> {product.fabric}</li>
                <li><strong>Care Instructions:</strong> {product.care_instructions}</li>
                {product.category_id === 'cat-sarees' ? (
                  <li><strong>Saree Length:</strong> 6.3 meters (includes unstitched running blouse piece)</li>
                ) : (
                  <li><strong>Size / Fit:</strong> {selectedVariant.size || 'Standard Fit'}</li>
                )}
                <li><strong>Artisan Quality:</strong> Guaranteed authentic handloom & craftsmanship</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div style={{ marginTop: '80px', borderTop: '1px solid var(--color-border-subtle)', paddingTop: '40px' }}>
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--color-gold-dark)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
                You May Also Like
              </p>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--color-emerald-dark)', fontFamily: 'var(--font-serif-brand)' }}>
                Related Products & Collections
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '24px'
              }}
            >
              {relatedProducts.map(rel => (
                <ProductCard
                  key={rel.id}
                  product={rel}
                  onSelectProduct={onSelectProduct}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 860px) {
          .pdp-layout {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
        }
      `}</style>
    </div>
  );
};
