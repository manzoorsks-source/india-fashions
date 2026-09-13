import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.js';
import { apiRequest } from '../../utils/api.js';
import { X, MapPin, CheckCircle, AlertTriangle, Clock, Navigation } from 'lucide-react';

export const DeliveryCheckModal: React.FC = () => {
  const { isDeliveryModalOpen, closeDeliveryModal, settings } = useStore();
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    isEligible: boolean;
    distanceKm: number;
    maxRadiusKm: number;
    deliveryCharge: number;
    estimatedTime: string;
    error?: string;
  } | null>(null);

  if (!isDeliveryModalOpen) return null;

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincode) return;

    setLoading(true);
    try {
      const data = await apiRequest<{
        isEligible: boolean;
        distanceKm: number;
        maxRadiusKm: number;
        deliveryCharge: number;
        estimatedTime: string;
        error?: string;
      }>('/delivery/check', {
        method: 'POST',
        body: JSON.stringify({ pincode })
      });
      setResult(data);
    } catch (err: any) {
      setResult({
        isEligible: false,
        distanceKm: 25,
        maxRadiusKm: settings?.delivery_radius_km || 12,
        deliveryCharge: 0,
        estimatedTime: '',
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const data = await apiRequest<any>('/delivery/check', {
            method: 'POST',
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
          });
          setResult(data);
        } catch (err: any) {
          alert('Failed to verify location: ' + err.message);
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        alert('Could not access current location. Please enter your pincode.');
      }
    );
  };

  return (
    <div className="modal-overlay" onClick={closeDeliveryModal} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '28px' }}>
        <button
          onClick={closeDeliveryModal}
          style={{ position: 'absolute', top: '16px', right: '16px', color: '#64748B' }}
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: 'rgba(15, 95, 86, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <MapPin size={20} color="var(--color-emerald)" />
          </div>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--color-emerald-dark)', fontFamily: 'var(--font-serif-brand)' }}>
            12 km Delivery Eligibility
          </h3>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--color-charcoal-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
          Our handloom sarees are dispatched directly from our boutique at <strong>{settings?.shop_address || 'MG Road, Bangalore'}</strong> to ensure genuine care and uncreased drapes.
        </p>

        <form onSubmit={handleCheck} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-charcoal)', marginBottom: '6px' }}>
              Enter 6-Digit Delivery Pincode
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                required
                maxLength={6}
                value={pincode}
                onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 560001 or 560038"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border-subtle)',
                  fontSize: '0.92rem'
                }}
              />
              <button
                type="submit"
                disabled={loading || pincode.length < 6}
                className="btn-primary"
                style={{ padding: '10px 18px' }}
              >
                {loading ? 'Checking...' : 'Check'}
              </button>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px' }}>
              Tip: Local Bangalore pincodes (560xxx) are eligible within 12 km.
            </p>
          </div>

          <div style={{ textAlign: 'center', margin: '4px 0' }}>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>— OR —</span>
          </div>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="btn-outline"
            style={{ width: '100%', fontSize: '0.82rem', padding: '9px' }}
          >
            <Navigation size={14} />
            <span>Use My Exact Geolocation</span>
          </button>
        </form>

        {result && (
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: result.isEligible ? 'rgba(15, 95, 86, 0.08)' : '#FEF2F2',
              border: result.isEligible ? '1px solid var(--color-emerald)' : '1px solid #F87171'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              {result.isEligible ? (
                <CheckCircle size={22} color="var(--color-emerald)" />
              ) : (
                <AlertTriangle size={22} color="#DC2626" />
              )}
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: result.isEligible ? 'var(--color-emerald-dark)' : '#991B1B' }}>
                {result.isEligible ? 'Eligible for Boutique Delivery!' : 'Outside Delivery Radius'}
              </h4>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--color-charcoal)', lineHeight: 1.5, marginBottom: '8px' }}>
              {result.isEligible
                ? `Your location is approximately ${result.distanceKm} km from our boutique (within the ${result.maxRadiusKm} km limit).`
                : result.error}
            </p>

            {result.isEligible && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-emerald)', fontWeight: 600 }}>
                <Clock size={15} />
                <span>Estimated dispatch: {result.estimatedTime}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
