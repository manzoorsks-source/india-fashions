import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.js';
import { apiRequest } from '../../utils/api.js';
import { X, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export const AdvanceOrderModal: React.FC = () => {
  const { advanceOrderProduct, closeAdvanceOrderModal } = useStore();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!advanceOrderProduct) return null;

  const { product, variant } = advanceOrderProduct;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      setErrorMessage('Please provide your name and contact phone number.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await apiRequest<{ success: boolean; message: string }>('/advance-orders', {
        method: 'POST',
        body: JSON.stringify({
          product_id: product.id,
          variant_id: variant.id,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          notes
        })
      });

      setSuccessMessage(res.message);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit advance order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeAdvanceOrderModal} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '28px' }}>
        {/* Close Button */}
        <button
          onClick={closeAdvanceOrderModal}
          style={{ position: 'absolute', top: '16px', right: '16px', color: '#64748B' }}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        {successMessage ? (
          <div style={{ textAlign: 'center', padding: '24px 8px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'rgba(15, 95, 86, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <CheckCircle size={36} color="var(--color-emerald)" />
            </div>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--color-emerald-dark)', marginBottom: '12px', fontFamily: 'var(--font-serif-brand)' }}>
              Advance Order Reserved
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-charcoal)', lineHeight: 1.6, marginBottom: '24px' }}>
              {successMessage}
            </p>
            <div style={{ padding: '12px', backgroundColor: 'var(--color-sky-blue)', borderRadius: '6px', fontSize: '0.82rem', color: 'var(--color-charcoal-muted)', marginBottom: '24px' }}>
              <strong>Reserved Weave:</strong> {product.name} — {variant.color} ({variant.sku})
            </div>
            <button onClick={closeAdvanceOrderModal} className="btn-primary" style={{ width: '100%' }}>
              Return to Collection
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(106, 27, 41, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Clock size={18} color="var(--color-maroon)" />
              </div>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--color-emerald-dark)', fontFamily: 'var(--font-serif-brand)' }}>
                Artisan Advance Order
              </h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--color-charcoal-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
              This handcrafted weave is currently on the master looms. Reserve your piece today and our boutique concierge will prioritize your order upon completion.
            </p>

            {/* Selected Product Summary */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px',
                backgroundColor: '#ffffff',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '8px',
                marginBottom: '20px'
              }}
            >
              <img
                src={product.media?.[0]?.file_path || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=200&q=80'}
                alt={product.name}
                style={{ width: '56px', height: '70px', objectFit: 'cover', borderRadius: '4px' }}
              />
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
                  {product.name}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-emerald)', fontWeight: 600 }}>
                  Color: {variant.color} • {variant.size}
                </p>
                <span className="badge-out-of-stock" style={{ marginTop: '4px' }}>
                  Currently Out of Stock (Eligible for Advance Booking)
                </span>
              </div>
            </div>

            {errorMessage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontSize: '0.82rem', marginBottom: '16px' }}>
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '4px' }}>
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Ananya Sen"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border-subtle)', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '4px' }}>
                  Contact Phone (WhatsApp / SMS notifications) *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="+91 98450 XXXXX"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border-subtle)', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '4px' }}>
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="ananya@example.com"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border-subtle)', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '4px' }}>
                  Special Weaving / Blouse Stitching Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Required for Diwali family function on Nov 1st"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-border-subtle)', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={closeAdvanceOrderModal}
                  className="btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold"
                  style={{ flex: 2 }}
                >
                  {loading ? 'Submitting Reservation...' : 'Submit Advance Order'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
