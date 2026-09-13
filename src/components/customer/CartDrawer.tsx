import React from 'react';
import { useStore } from '../../context/StoreContext.js';
import { formatINR } from '../../utils/formatters.js';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Sparkles, Tag } from 'lucide-react';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const {
    cart,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    updateCartQuantity,
    removeFromCart,
    cartCount,
    cartSubtotal,
    bundleDiscount,
    couponCode,
    setCouponCode,
    couponDiscount,
    deliveryCharge,
    cartTotal,
    settings
  } = useStore();

  if (!isCartDrawerOpen) return null;

  const freeThreshold = settings?.free_delivery_threshold || 2999;
  const netSubtotal = cartSubtotal - bundleDiscount - couponDiscount;
  const amountNeededForFreeDelivery = Math.max(0, freeThreshold - netSubtotal);

  return (
    <div
      className="modal-overlay"
      onClick={() => setIsCartDrawerOpen(false)}
      style={{ justifyContent: 'flex-end', padding: 0 }}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          height: '100vh',
          backgroundColor: 'var(--color-silk-cream)',
          borderLeft: '2px solid var(--color-gold)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          animation: 'slideInRight 0.3s ease-out'
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid var(--color-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} color="var(--color-emerald)" />
            <h3 style={{ fontSize: '1.15rem', color: 'var(--color-emerald-dark)', fontFamily: 'var(--font-serif-brand)' }}>
              Your Silk Bag ({cartCount})
            </h3>
          </div>

          <button
            onClick={() => setIsCartDrawerOpen(false)}
            aria-label="Close cart drawer"
            style={{ color: '#64748B', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Free Delivery Bar */}
        <div
          style={{
            backgroundColor: amountNeededForFreeDelivery === 0 ? 'rgba(15, 95, 86, 0.1)' : 'var(--color-sky-blue)',
            padding: '10px 20px',
            fontSize: '0.78rem',
            color: 'var(--color-charcoal)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderBottom: '1px solid var(--color-border-subtle)'
          }}
        >
          <Sparkles size={14} color="var(--color-gold)" />
          {amountNeededForFreeDelivery === 0 ? (
            <span style={{ fontWeight: 600, color: 'var(--color-emerald-dark)' }}>
              🎉 Congratulations! You have unlocked FREE Express Boutique Delivery (within 12 km).
            </span>
          ) : (
            <span>
              Add <strong>{formatINR(amountNeededForFreeDelivery)}</strong> more for <strong>FREE Delivery</strong> within 12 km!
            </span>
          )}
        </div>

        {/* 2+1 Offer Highlight Banner */}
        {settings?.offer_2_plus_1_enabled && (
          <div
            style={{
              backgroundColor: 'rgba(106, 27, 41, 0.08)',
              borderBottom: '1px dashed var(--color-maroon)',
              padding: '8px 20px',
              fontSize: '0.75rem',
              color: 'var(--color-maroon-dark)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span><strong>Festive 2 + 1 Bundle:</strong> Buy 2 Sarees & Get 1 Free!</span>
            {bundleDiscount > 0 ? (
              <span className="badge-festive" style={{ fontSize: '0.65rem' }}>
                Saved {formatINR(bundleDiscount)}
              </span>
            ) : (
              <span style={{ color: '#64748B' }}>{3 - (cartCount % 3)} more to qualify</span>
            )}
          </div>
        )}

        {/* Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
              <ShoppingBag size={48} color="#CBD5E1" style={{ margin: '0 auto 16px' }} />
              <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '6px' }}>Your shopping bag is empty</p>
              <p style={{ fontSize: '0.85rem', marginBottom: '20px' }}>Discover handpicked Kanjivaram and Banarasi weaves.</p>
              <button onClick={() => setIsCartDrawerOpen(false)} className="btn-primary">
                Explore Sarees
              </button>
            </div>
          ) : (
            cart.map(item => {
              const effectivePrice = item.variant.sale_price && item.variant.sale_price > 0 ? item.variant.sale_price : item.variant.selling_price;
              const hasSale = item.variant.sale_price && item.variant.sale_price > 0 && item.variant.sale_price < item.variant.selling_price;

              return (
                <div
                  key={item.variant.id}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--color-border-subtle)',
                    borderRadius: '8px'
                  }}
                >
                  <img
                    src={item.product.media?.[0]?.file_path || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=200&q=80'}
                    alt={item.product.name}
                    style={{ width: '64px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                  />

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-charcoal)', lineHeight: 1.2 }}>
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.variant.id)}
                          style={{ color: '#94A3B8', padding: '2px' }}
                          title="Remove item"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--color-emerald)', fontWeight: 500, marginTop: '2px' }}>
                        {item.variant.color} • {item.variant.size}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
                          {formatINR(effectivePrice * item.quantity)}
                        </span>
                        {hasSale && (
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8', textDecoration: 'line-through' }}>
                            {formatINR(item.variant.selling_price * item.quantity)}
                          </span>
                        )}
                      </div>

                      {/* Quantity Stepper */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          border: '1px solid var(--color-border-subtle)',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}
                      >
                        <button
                          onClick={() => updateCartQuantity(item.variant.id, item.quantity - 1)}
                          style={{ padding: '4px 8px', color: 'var(--color-charcoal)' }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ padding: '2px 8px', fontSize: '0.82rem', fontWeight: 600 }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(item.variant.id, item.quantity + 1)}
                          disabled={item.quantity >= item.variant.quantity}
                          style={{ padding: '4px 8px', color: 'var(--color-charcoal)' }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer & Checkout Breakdown */}
        {cart.length > 0 && (
          <div
            style={{
              padding: '20px',
              borderTop: '1px solid var(--color-border-subtle)',
              backgroundColor: '#ffffff'
            }}
          >
            {/* Coupon Code Input */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Coupon (e.g. FESTIVE10)"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border-subtle)',
                    fontSize: '0.82rem'
                  }}
                />
              </div>
              <button
                onClick={() => {}}
                style={{
                  padding: '8px 14px',
                  backgroundColor: 'var(--color-sky-blue)',
                  color: 'var(--color-emerald-dark)',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: '1px solid var(--color-sky-blue-border)'
                }}
              >
                Apply
              </button>
            </div>

            {/* Price Calculations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                <span>Subtotal</span>
                <span>{formatINR(cartSubtotal)}</span>
              </div>

              {bundleDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-maroon)', fontWeight: 600 }}>
                  <span>2 + 1 Festive Bundle Discount</span>
                  <span>-{formatINR(bundleDiscount)}</span>
                </div>
              )}

              {couponDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-emerald)', fontWeight: 600 }}>
                  <span>Coupon Discount</span>
                  <span>-{formatINR(couponDiscount)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                <span>Boutique Express Delivery (12 km)</span>
                <span>{deliveryCharge === 0 ? <strong style={{ color: 'var(--color-emerald)' }}>FREE</strong> : formatINR(deliveryCharge)}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid var(--color-border-subtle)',
                  paddingTop: '8px',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: 'var(--color-charcoal)'
                }}
              >
                <span>Estimated Total</span>
                <span>{formatINR(cartTotal)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsCartDrawerOpen(false);
                onProceedToCheckout();
              }}
              className="btn-primary"
              style={{ width: '100%', padding: '14px' }}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};
