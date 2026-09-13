import React, { useState } from 'react';
import { useStore } from '../context/StoreContext.js';
import { apiRequest } from '../utils/api.js';
import { formatINR } from '../utils/formatters.js';
import { PaymentMethod, Order } from '../../shared/types.js';
import { ShieldCheck, MapPin, Truck, CreditCard, QrCode, Building, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';

interface CheckoutPageProps {
  onBackToCart: () => void;
  onOrderSuccess: (orderId: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onBackToCart, onOrderSuccess }) => {
  const {
    cart,
    clearCart,
    cartSubtotal,
    bundleDiscount,
    couponCode,
    couponDiscount,
    deliveryCharge,
    cartTotal,
    settings
  } = useStore();

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pincode, setPincode] = useState('560001');
  const [customerNotes, setCustomerNotes] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentReference, setPaymentReference] = useState('');

  // Distance validation state
  const [distanceKm, setDistanceKm] = useState<number>(4.5);
  const [checkingDistance, setCheckingDistance] = useState(false);
  const [distanceError, setDistanceError] = useState<string | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (cart.length === 0) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2>Your Bag is Empty</h2>
        <button onClick={onBackToCart} className="btn-primary" style={{ marginTop: '16px' }}>
          Return to Boutique
        </button>
      </div>
    );
  }

  // Check 12 km radius on pincode change
  const handlePincodeBlur = async () => {
    if (pincode.length < 6) return;
    setCheckingDistance(true);
    setDistanceError(null);

    try {
      const res = await apiRequest<{ isEligible: boolean; distanceKm: number; error?: string }>('/delivery/check', {
        method: 'POST',
        body: JSON.stringify({ pincode })
      });
      setDistanceKm(res.distanceKm);
      if (!res.isEligible) {
        setDistanceError(res.error || 'Address is beyond the 12 km delivery radius from our boutique');
      }
    } catch (e: any) {
      setDistanceError(e.message);
    } finally {
      setCheckingDistance(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !deliveryAddress) {
      setSubmitError('Please complete all required contact and delivery address fields.');
      return;
    }

    if (paymentMethod === 'IMPS_NEFT' && (!paymentReference || paymentReference.trim().length === 0)) {
      setSubmitError('Please provide your Bank IMPS / NEFT UTR Reference Number so our Head Cashier can verify your transfer.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const itemsPayload = cart.map(item => ({
        variant_id: item.variant.id,
        quantity: item.quantity
      }));

      const res = await apiRequest<{ success: boolean; order: { orderId: string; orderNumber: string } }>('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          delivery_address: deliveryAddress,
          pincode,
          payment_method: paymentMethod,
          payment_reference: paymentReference,
          customer_notes: customerNotes,
          items: itemsPayload,
          coupon_code: couponCode
        })
      });

      if (res.success && res.order) {
        clearCart();
        onOrderSuccess(res.order.orderId);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Transaction failed. Please review stock and pricing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '36px 0 60px' }}>
      <div className="container">
        <button
          onClick={onBackToCart}
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
          <span>Back to Shopping Bag</span>
        </button>

        <h1 style={{ fontSize: '2.2rem', color: 'var(--color-emerald-dark)', fontFamily: 'var(--font-serif-brand)', marginBottom: '8px' }}>
          Secure Checkout
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-charcoal-muted)', marginBottom: '32px' }}>
          Encrypted order dispatch within 12 km radius of our MG Road, Bangalore boutique.
        </p>

        {submitError && (
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: '#FEE2E2',
              color: '#991B1B',
              borderRadius: '8px',
              border: '1px solid #FCA5A5',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '24px',
              fontSize: '0.9rem'
            }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handlePlaceOrder}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(320px, 1.4fr) minmax(300px, 1fr)',
              gap: '40px',
              alignItems: 'start'
            }}
            className="checkout-layout"
          >
            {/* Left Column: Contact, Address, Payment Methods */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {/* 1. Customer Details */}
              <div style={{ backgroundColor: 'var(--color-silk-cream)', padding: '24px', borderRadius: '10px', border: '1px solid var(--color-border-subtle)' }}>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--color-charcoal)', marginBottom: '16px', fontFamily: 'var(--font-serif-brand)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--color-emerald)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem' }}>1</span>
                  Contact Information
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="form-grid">
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Full Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="e.g. Radhika Iyer"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border-subtle)', fontSize: '0.88rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Contact Phone *</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="+91 98450 XXXXX"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border-subtle)', fontSize: '0.88rem' }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Email Address (for order tracking receipt)</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    placeholder="radhika@example.com"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border-subtle)', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              {/* 2. Delivery Address & 12 km Radius Enforcement */}
              <div style={{ backgroundColor: 'var(--color-silk-cream)', padding: '24px', borderRadius: '10px', border: '1px solid var(--color-border-subtle)' }}>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--color-charcoal)', marginBottom: '16px', fontFamily: 'var(--font-serif-brand)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--color-emerald)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem' }}>2</span>
                  Delivery Address & Distance Validation
                </h3>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Street Address, Apartment, Landmark *</label>
                  <textarea
                    rows={2}
                    required
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    placeholder="e.g. Flat 301, Brigade Heritage, Lavelle Road, Bangalore"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border-subtle)', fontSize: '0.88rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Bangalore Pincode *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={pincode}
                      onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                      onBlur={handlePincodeBlur}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--color-border-subtle)', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>Delivery Radius Status</label>
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        backgroundColor: distanceError ? '#FEF2F2' : 'rgba(15, 95, 86, 0.08)',
                        border: distanceError ? '1px solid #FCA5A5' : '1px solid var(--color-emerald)',
                        fontSize: '0.82rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {distanceError ? (
                        <AlertCircle size={15} color="#DC2626" />
                      ) : (
                        <CheckCircle size={15} color="var(--color-emerald)" />
                      )}
                      <span>
                        {checkingDistance ? 'Validating distance...' : distanceError ? 'Beyond 12 km' : `Eligible (~${distanceKm} km away)`}
                      </span>
                    </div>
                  </div>
                </div>

                {distanceError && (
                  <p style={{ fontSize: '0.78rem', color: '#DC2626', marginTop: '6px' }}>
                    {distanceError}
                  </p>
                )}
              </div>

              {/* 3. Payment Method Selection */}
              <div style={{ backgroundColor: 'var(--color-silk-cream)', padding: '24px', borderRadius: '10px', border: '1px solid var(--color-border-subtle)' }}>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--color-charcoal)', marginBottom: '16px', fontFamily: 'var(--font-serif-brand)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--color-emerald)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem' }}>3</span>
                  Payment Method
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                  {/* UPI */}
                  {settings?.upi_enabled && (
                    <div
                      onClick={() => setPaymentMethod('UPI')}
                      style={{
                        padding: '14px',
                        borderRadius: '8px',
                        border: paymentMethod === 'UPI' ? '2px solid var(--color-gold)' : '1px solid var(--color-border-subtle)',
                        backgroundColor: paymentMethod === 'UPI' ? 'rgba(15, 95, 86, 0.06)' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <QrCode size={20} color="var(--color-emerald)" />
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>UPI (Instant)</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>GPay, PhonePe, Paytm</div>
                      </div>
                    </div>
                  )}

                  {/* Card */}
                  {settings?.card_enabled && (
                    <div
                      onClick={() => setPaymentMethod('CARD')}
                      style={{
                        padding: '14px',
                        borderRadius: '8px',
                        border: paymentMethod === 'CARD' ? '2px solid var(--color-gold)' : '1px solid var(--color-border-subtle)',
                        backgroundColor: paymentMethod === 'CARD' ? 'rgba(15, 95, 86, 0.06)' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <CreditCard size={20} color="var(--color-emerald)" />
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>Card</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Credit / Debit Card</div>
                      </div>
                    </div>
                  )}

                  {/* IMPS / NEFT */}
                  {settings?.imps_neft_enabled && (
                    <div
                      onClick={() => setPaymentMethod('IMPS_NEFT')}
                      style={{
                        padding: '14px',
                        borderRadius: '8px',
                        border: paymentMethod === 'IMPS_NEFT' ? '2px solid var(--color-gold)' : '1px solid var(--color-border-subtle)',
                        backgroundColor: paymentMethod === 'IMPS_NEFT' ? 'rgba(15, 95, 86, 0.06)' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <Building size={20} color="var(--color-emerald)" />
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>IMPS / NEFT</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Cashier Verification</div>
                      </div>
                    </div>
                  )}

                  {/* COD */}
                  {settings?.cod_enabled && (
                    <div
                      onClick={() => setPaymentMethod('COD')}
                      style={{
                        padding: '14px',
                        borderRadius: '8px',
                        border: paymentMethod === 'COD' ? '2px solid var(--color-gold)' : '1px solid var(--color-border-subtle)',
                        backgroundColor: paymentMethod === 'COD' ? 'rgba(15, 95, 86, 0.06)' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <Truck size={20} color="var(--color-emerald)" />
                      <div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>Cash on Delivery</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Pay upon arrival</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Conditional UI based on chosen payment method */}
                {paymentMethod === 'UPI' && (
                  <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed var(--color-emerald)' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-emerald-dark)', marginBottom: '8px' }}>
                      UPI Payment Instructions:
                    </p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-charcoal)' }}>
                      Scan the QR code or send payment to boutique UPI ID: <strong>{settings?.upi_id || 'indiafashions@okhdfcbank'}</strong>.
                    </p>
                    <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                      (Simulator: Order will be instantly registered as PAID.)
                    </p>
                  </div>
                )}

                {paymentMethod === 'CARD' && (
                  <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px dashed var(--color-emerald)' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-emerald-dark)', marginBottom: '8px' }}>
                      Card Payment Gateway Simulation:
                    </p>
                    <p style={{ fontSize: '0.82rem', color: '#64748B' }}>
                      Secure 256-bit SSL encrypted checkout. No actual card charged in evaluation environment.
                    </p>
                  </div>
                )}

                {paymentMethod === 'IMPS_NEFT' && (
                  <div style={{ padding: '16px', backgroundColor: '#FFFBEB', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                    <h4 style={{ fontSize: '0.9rem', color: '#92400E', fontWeight: 700, marginBottom: '8px' }}>
                      Boutique Bank Account Details:
                    </h4>
                    <div style={{ fontSize: '0.82rem', color: '#78350F', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '14px' }}>
                      <div>Account: <strong>{settings?.bank_account_number || '987654321098'}</strong></div>
                      <div>IFSC: <strong>{settings?.bank_ifsc || 'HDFC0001234'}</strong></div>
                      <div>Name: <strong>{settings?.bank_account_name || 'India Fashions Boutique'}</strong></div>
                      <div>Branch: <strong>{settings?.bank_branch || 'MG Road Bangalore'}</strong></div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#92400E', marginBottom: '6px' }}>
                        Enter Transaction Reference / UTR Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={paymentReference}
                        onChange={e => setPaymentReference(e.target.value)}
                        placeholder="e.g. UTR-HDFC-12345678"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #FCD34D', fontSize: '0.88rem' }}
                      />
                      <p style={{ fontSize: '0.72rem', color: '#B45309', marginTop: '4px' }}>
                        The Head Cashier will verify this UTR in the admin dashboard and advance your order to CONFIRMED.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Order Review & Pricing Breakdown */}
            <div style={{ backgroundColor: 'var(--color-silk-cream)', padding: '24px', borderRadius: '10px', border: '1px solid var(--color-border-subtle)', position: 'sticky', top: '100px' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-emerald-dark)', fontFamily: 'var(--font-serif-brand)', marginBottom: '16px' }}>
                Order Summary ({cart.length} items)
              </h3>

              {/* Items preview */}
              <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', paddingRight: '4px' }}>
                {cart.map(item => {
                  const price = item.variant.sale_price && item.variant.sale_price > 0 ? item.variant.sale_price : item.variant.selling_price;
                  return (
                    <div key={item.variant.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--color-charcoal)' }}>
                        {item.quantity}x {item.product.name} ({item.variant.color})
                      </span>
                      <strong style={{ color: 'var(--color-charcoal)' }}>{formatINR(price * item.quantity)}</strong>
                    </div>
                  );
                })}
              </div>

              {/* Price Calculation Table */}
              <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
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
                    borderTop: '1.5px solid var(--color-border-subtle)',
                    paddingTop: '10px',
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: 'var(--color-charcoal)'
                  }}
                >
                  <span>Grand Total</span>
                  <span>{formatINR(cartTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || Boolean(distanceError)}
                className="btn-primary"
                style={{ width: '100%', padding: '16px', marginTop: '24px', fontSize: '1rem' }}
              >
                {submitting ? 'Verifying Stock & Placing Order...' : `Place Order • ${formatINR(cartTotal)}`}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748B', marginTop: '14px' }}>
                <ShieldCheck size={16} color="var(--color-gold)" />
                <span>100% Genuine Handlooms • Secure Payment</span>
              </div>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .checkout-layout {
            grid-template-columns: 1fr !important;
          }
          .form-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
