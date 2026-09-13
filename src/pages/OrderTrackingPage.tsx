import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../../shared/types.js';
import { apiRequest } from '../utils/api.js';
import { formatINR, formatDateTime } from '../utils/formatters.js';
import { Search, Package, Truck, CheckCircle2, Clock, AlertTriangle, Building, ArrowLeft, Bell } from 'lucide-react';

interface OrderTrackingPageProps {
  initialOrderId?: string | null;
  onBackToStore: () => void;
}

export const OrderTrackingPage: React.FC<OrderTrackingPageProps> = ({ initialOrderId, onBackToStore }) => {
  const [searchTerm, setSearchTerm] = useState(initialOrderId || 'IF-2026-1002');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupOrder = async (queryTerm: string) => {
    if (!queryTerm) return;
    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest<{ order: Order }>(`/orders/${encodeURIComponent(queryTerm.trim())}`);
      if (res?.order) {
        setOrder(res.order);
      }
    } catch (err: any) {
      setError(err.message || 'Order not found. Please verify your Order Number.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderId) {
      lookupOrder(initialOrderId);
    } else {
      lookupOrder('IF-2026-1002');
    }
  }, [initialOrderId]);

  const milestones: { key: OrderStatus; label: string; desc: string }[] = [
    { key: 'PLACED', label: 'Order Placed', desc: 'Received at Bangalore boutique' },
    { key: 'CONFIRMED', label: 'Confirmed', desc: 'Payment validated & handloom inspected' },
    { key: 'PACKED', label: 'Handloom Packed', desc: 'Folded in breathable muslin & boxed' },
    { key: 'SHIPPED', label: 'Out for Delivery', desc: 'Express driver en route within 12 km' },
    { key: 'DELIVERED', label: 'Delivered', desc: 'Handed over with signature' }
  ];

  const getMilestoneIndex = (status: OrderStatus) => {
    switch (status) {
      case 'PLACED': return 0;
      case 'CONFIRMED': return 1;
      case 'PACKED': return 2;
      case 'SHIPPED': return 3;
      case 'DELIVERED': return 4;
      default: return 0;
    }
  };

  const currentIndex = order ? getMilestoneIndex(order.status) : 0;
  const isCancelled = order?.status === 'CANCELLED';
  const isReturned = order?.status === 'RETURNED';

  return (
    <div style={{ padding: '36px 0 60px' }}>
      <div className="container" style={{ maxWidth: '880px' }}>
        <button
          onClick={onBackToStore}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85rem',
            color: 'var(--color-emerald)',
            fontWeight: 600,
            marginBottom: '20px'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Store</span>
        </button>

        <h1 style={{ fontSize: '2.2rem', color: 'var(--color-emerald-dark)', fontFamily: 'var(--font-serif-brand)', marginBottom: '8px' }}>
          Track Your Order
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-charcoal-muted)', marginBottom: '28px' }}>
          Live status updates from our boutique workshop to your doorstep.
        </p>

        {/* Search Box */}
        <div style={{ backgroundColor: 'var(--color-silk-cream)', padding: '20px', borderRadius: '10px', border: '1px solid var(--color-border-subtle)', marginBottom: '32px' }}>
          <form
            onSubmit={e => { e.preventDefault(); lookupOrder(searchTerm); }}
            style={{ display: 'flex', gap: '10px' }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Enter Order # (e.g. IF-2026-1002)"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border-subtle)',
                  fontSize: '0.92rem'
                }}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '12px 24px' }}>
              <Search size={16} />
              <span>{loading ? 'Locating...' : 'Track'}</span>
            </button>
          </form>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px', fontSize: '0.78rem', color: '#64748B' }}>
            <span>Try sample orders:</span>
            {['IF-2026-1001', 'IF-2026-1002', 'IF-2026-1003'].map(id => (
              <button
                key={id}
                onClick={() => { setSearchTerm(id); lookupOrder(id); }}
                style={{ color: 'var(--color-emerald)', textDecoration: 'underline', fontWeight: 600 }}
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ padding: '16px', backgroundColor: '#FEF2F2', color: '#991B1B', borderRadius: '8px', border: '1px solid #FECACA', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        {/* Order Details View */}
        {order && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Summary Card */}
            <div style={{ backgroundColor: 'var(--color-silk-cream)', padding: '24px', borderRadius: '10px', border: '1px solid var(--color-border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                    Order Number
                  </span>
                  <h3 style={{ fontSize: '1.4rem', color: 'var(--color-charcoal)', fontWeight: 800 }}>
                    {order.order_number}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                    Placed on {formatDateTime(order.created_at)}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      backgroundColor:
                        order.payment_status === 'PAID' ? 'rgba(15, 95, 86, 0.15)' :
                        order.payment_status === 'VERIFICATION_REQUIRED' ? '#FEF3C7' : '#FEE2E2',
                      color:
                        order.payment_status === 'PAID' ? 'var(--color-emerald)' :
                        order.payment_status === 'VERIFICATION_REQUIRED' ? '#92400E' : '#991B1B',
                      border:
                        order.payment_status === 'PAID' ? '1px solid var(--color-emerald)' :
                        order.payment_status === 'VERIFICATION_REQUIRED' ? '1px solid #F59E0B' : '1px solid #EF4444'
                    }}
                  >
                    Payment: {order.payment_status.replace('_', ' ')}
                  </span>

                  <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                    Method: <strong>{order.payment_method}</strong>
                  </span>
                </div>
              </div>

              {/* Special alert if verification required for IMPS */}
              {order.payment_status === 'VERIFICATION_REQUIRED' && (
                <div style={{ padding: '14px', backgroundColor: '#FFFBEB', borderRadius: '8px', border: '1px solid #FCD34D', marginBottom: '24px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Clock size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#92400E' }}>
                      IMPS / NEFT Verification Pending
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: '#78350F', marginTop: '2px', lineHeight: 1.5 }}>
                      We have received your Bank Transfer Reference: <strong>{order.payment_reference || 'N/A'}</strong>. The Head Cashier will verify the bank reconciliation queue and advance your status.
                    </p>
                  </div>
                </div>
              )}

              {/* Milestone Tracker Bar */}
              <div style={{ margin: '32px 0 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${milestones.length}, 1fr)`, gap: '8px', position: 'relative' }}>
                  {milestones.map((m, idx) => {
                    const isPassed = idx <= currentIndex && !isCancelled;
                    const isCurrent = idx === currentIndex && !isCancelled;

                    return (
                      <div key={m.key} style={{ textAlign: 'center', position: 'relative' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            backgroundColor: isPassed ? 'var(--color-emerald)' : '#E2E8F0',
                            color: isPassed ? '#ffffff' : '#94A3B8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 8px',
                            fontWeight: 700,
                            border: isCurrent ? '3px solid var(--color-gold)' : 'none',
                            boxShadow: isCurrent ? '0 0 0 3px rgba(212,175,55,0.3)' : 'none'
                          }}
                        >
                          {isPassed ? <CheckCircle2 size={18} /> : idx + 1}
                        </div>
                        <p style={{ fontSize: '0.78rem', fontWeight: isPassed ? 700 : 500, color: isPassed ? 'var(--color-charcoal)' : '#94A3B8' }}>
                          {m.label}
                        </p>
                        <p style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '2px' }}>
                          {m.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Items & Delivery Information */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }} className="details-grid">
              <div style={{ backgroundColor: 'var(--color-silk-cream)', padding: '20px', borderRadius: '10px', border: '1px solid var(--color-border-subtle)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>Items in this Weave Box</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {order.items?.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', paddingBottom: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                      <div>
                        <strong>{item.product_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {item.color} • {item.size} (Qty: {item.quantity})
                        </div>
                      </div>
                      <span style={{ fontWeight: 700 }}>{formatINR(item.total_price)}</span>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.95rem' }}>
                  <span>Total Paid</span>
                  <span>{formatINR(order.total_amount)}</span>
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--color-silk-cream)', padding: '20px', borderRadius: '10px', border: '1px solid var(--color-border-subtle)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>Delivery Destination</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-charcoal)', lineHeight: 1.5, marginBottom: '8px' }}>
                  <strong>{order.customer_name}</strong><br />
                  {order.delivery_address}<br />
                  Pincode: {order.pincode}
                </p>
                <p style={{ fontSize: '0.78rem', color: '#64748B' }}>
                  Phone: {order.customer_phone}
                </p>

                <div style={{ marginTop: '14px', padding: '8px 12px', backgroundColor: 'var(--color-sky-blue)', borderRadius: '6px', fontSize: '0.78rem' }}>
                  <strong>Distance:</strong> {order.distance_km} km from Bangalore Boutique (Within 12 km radius limit)
                </div>

                <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--color-emerald-dark)' }}>
                  <Bell size={14} color="var(--color-emerald)" />
                  <span>SMS and WhatsApp notifications active</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .details-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
