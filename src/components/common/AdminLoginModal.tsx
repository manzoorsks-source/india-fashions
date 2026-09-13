import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { KeyRound, Lock, Eye, EyeOff, X, AlertCircle, ShieldCheck } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('owner@indiafashions.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email.trim(), password.trim());
      setLoading(false);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid credentials or non-admin access');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(10, 25, 23, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          border: '1.5px solid var(--color-gold)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: 'var(--color-emerald-dark)',
            color: '#ffffff',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid var(--color-gold)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: 'rgba(212, 175, 55, 0.2)',
                border: '1px solid var(--color-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <KeyRound size={20} color="var(--color-gold-bright)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontFamily: 'var(--font-serif-brand)', margin: 0, color: '#FFFFFF' }}>
                Super Admin Access
              </h2>
              <p style={{ fontSize: '0.72rem', color: 'var(--color-gold-light)', margin: 0 }}>
                Operations Console • Authorized Personnel Only
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              color: '#CBD5E1',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#FEE2E2',
                color: '#991B1B',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                marginBottom: '16px',
                border: '1px solid #FCA5A5'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
              Super Admin Email or Username
            </label>
            <input
              type="text"
              required
              id="input-admin-email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="owner@indiafashions.com or admin"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
              Master Security Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                id="input-admin-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{
                  width: '100%',
                  padding: '10px 38px 10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '2px'
                }}
                aria-label="Toggle password view"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Discreet Credentials Helper */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px dashed #CBD5E1',
              borderRadius: '6px',
              padding: '8px 12px',
              marginBottom: '20px',
              fontSize: '0.74rem',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>
              🔑 Default: <strong>owner@indiafashions.com</strong> / <strong>admin123</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                setEmail('owner@indiafashions.com');
                setPassword('admin123');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-emerald)',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.72rem',
                textDecoration: 'underline'
              }}
            >
              Fill
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              style={{ flex: 1, padding: '10px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-admin-login-submit"
              disabled={loading}
              className="btn-primary"
              style={{
                flex: 1.5,
                padding: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontWeight: 700
              }}
            >
              <ShieldCheck size={18} />
              <span>{loading ? 'Verifying...' : 'Unlock Console'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
