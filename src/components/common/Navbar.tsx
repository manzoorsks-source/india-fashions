import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { ShoppingBag, Search, MapPin, Truck, Shield, Menu, X, User as UserIcon, ChevronDown, Sparkles } from 'lucide-react';
import { UserRole } from '../../../shared/types.js';

interface NavbarProps {
  currentView: 'store' | 'admin' | 'tracking';
  setCurrentView: (view: 'store' | 'admin' | 'tracking') => void;
  onSearchClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setCurrentView, onSearchClick }) => {
  const { settings, cartCount, setIsCartDrawerOpen, openDeliveryModal } = useStore();
  const { currentRole, currentUser, switchRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const brandName = settings?.brand_name || 'India Fashions';
  const tagline = settings?.tagline || 'Royal Heritage Handwoven Weaves';

  const categories = [
    { name: 'Sarees', slug: 'sarees', active: true, tag: 'Primary Collection' },
    { name: 'Punjabi Dresses', slug: 'punjabi-dresses', active: false, tag: 'Coming Soon' },
    { name: 'Children', slug: 'children', active: false, tag: 'Coming Soon' },
    { name: 'Kurti', slug: 'kurti', active: false, tag: 'Coming Soon' },
    { name: 'Lehenga', slug: 'lehenga', active: false, tag: 'Coming Soon' },
    { name: 'Salwar Suit', slug: 'salwar-suit', active: false, tag: 'Coming Soon' },
    { name: "Men's Ethnic", slug: 'mens-ethnic', active: false, tag: 'Coming Soon' },
    { name: 'Accessories', slug: 'accessories', active: false, tag: 'Coming Soon' },
  ];

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'var(--color-silk-cream)', boxShadow: 'var(--shadow-sm)' }}>
      {/* Top Demo Bar for Instant Role Switching */}
      <div
        style={{
          backgroundColor: '#1E293B',
          color: '#F8FAFC',
          fontSize: '0.75rem',
          padding: '4px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ backgroundColor: 'var(--color-gold)', color: '#000', padding: '1px 6px', borderRadius: '3px', fontWeight: 700 }}>
            ROLE SIMULATOR
          </span>
          <span>Active Role: <strong>{currentRole}</strong> {currentUser ? `(${currentUser.name})` : '(Customer View)'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ opacity: 0.7 }}>Switch Role:</span>
          {(['CUSTOMER', 'SUPER_ADMIN', 'ADMIN', 'HEAD_CASHIER', 'INVENTORY_EXECUTIVE', 'POS_CASHIER'] as const).map(role => (
            <button
              key={role}
              onClick={() => {
                switchRole(role as UserRole | 'CUSTOMER');
                if (role !== 'CUSTOMER' && currentView === 'store') {
                  setCurrentView('admin');
                } else if (role === 'CUSTOMER') {
                  setCurrentView('store');
                }
              }}
              style={{
                backgroundColor: currentRole === role ? 'var(--color-emerald)' : 'rgba(255,255,255,0.12)',
                color: currentRole === role ? '#fff' : '#CBD5E1',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: currentRole === role ? 700 : 400,
                border: currentRole === role ? '1px solid var(--color-gold)' : 'none'
              }}
            >
              {role.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Boutique Header */}
      <div className="container" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Mobile menu trigger */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ display: 'none', color: 'var(--color-emerald)' }}
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Brand Logo & Royal Heritage Monogram */}
        <div
          onClick={() => setCurrentView('store')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              backgroundColor: 'var(--color-emerald)',
              border: '1.5px solid var(--color-gold)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(15,95,86,0.2)'
            }}
          >
            <span style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-serif-brand)', fontWeight: 800, fontSize: '1.25rem' }}>
              IF
            </span>
          </div>

          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-emerald)', lineHeight: 1.1, letterSpacing: '0.05em' }}>
              {brandName}
            </h1>
            <p style={{ fontSize: '0.68rem', color: 'var(--color-gold-dark)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600 }}>
              {tagline}
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button
            onClick={() => setCurrentView('store')}
            style={{
              fontWeight: currentView === 'store' ? 700 : 500,
              color: currentView === 'store' ? 'var(--color-emerald)' : 'var(--color-charcoal)',
              fontSize: '0.92rem',
              borderBottom: currentView === 'store' ? '2px solid var(--color-gold)' : '2px solid transparent',
              paddingBottom: '4px'
            }}
          >
            Home
          </button>

          {/* Categories Dropdown */}
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setCategoryDropdownOpen(true)}
            onMouseLeave={() => setCategoryDropdownOpen(false)}
          >
            <button
              style={{
                fontWeight: 600,
                color: 'var(--color-charcoal)',
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                paddingBottom: '4px'
              }}
            >
              Categories <ChevronDown size={14} />
            </button>

            {categoryDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '240px',
                  backgroundColor: 'var(--color-silk-cream)',
                  border: '1px solid var(--color-gold)',
                  borderRadius: '6px',
                  boxShadow: 'var(--shadow-md)',
                  padding: '8px 0',
                  zIndex: 100
                }}
              >
                {categories.map(cat => (
                  <div
                    key={cat.slug}
                    onClick={() => {
                      setCurrentView('store');
                      setCategoryDropdownOpen(false);
                      const el = document.getElementById('saree-collection');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{
                      padding: '8px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      backgroundColor: cat.active ? 'rgba(15, 95, 86, 0.06)' : 'transparent'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(15, 95, 86, 0.1)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = cat.active ? 'rgba(15, 95, 86, 0.06)' : 'transparent')}
                  >
                    <span style={{ fontSize: '0.88rem', fontWeight: cat.active ? 700 : 500, color: 'var(--color-charcoal)' }}>
                      {cat.name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: cat.active ? 'var(--color-emerald)' : '#E2E8F0',
                        color: cat.active ? '#ffffff' : '#64748B'
                      }}
                    >
                      {cat.tag}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={openDeliveryModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--color-charcoal-muted)',
              fontSize: '0.88rem',
              fontWeight: 500
            }}
          >
            <MapPin size={16} color="var(--color-emerald)" />
            <span>12 km Delivery Check</span>
          </button>

          <button
            onClick={() => setCurrentView('tracking')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: currentView === 'tracking' ? 'var(--color-emerald)' : 'var(--color-charcoal-muted)',
              fontSize: '0.88rem',
              fontWeight: currentView === 'tracking' ? 700 : 500
            }}
          >
            <Truck size={16} />
            <span>Track Order</span>
          </button>
        </nav>

        {/* Right Actions: Search, Admin Toggle, Cart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {onSearchClick && (
            <button
              onClick={onSearchClick}
              aria-label="Search collection"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--color-sky-blue)',
                color: 'var(--color-charcoal)'
              }}
            >
              <Search size={18} />
            </button>
          )}

          {/* Admin Dashboard Entry Button */}
          <button
            onClick={() => setCurrentView(currentView === 'admin' ? 'store' : 'admin')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: currentView === 'admin' ? '1.5px solid var(--color-gold)' : '1px solid var(--color-border-subtle)',
              backgroundColor: currentView === 'admin' ? 'var(--color-emerald)' : '#ffffff',
              color: currentView === 'admin' ? '#ffffff' : 'var(--color-emerald)',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Shield size={14} color={currentView === 'admin' ? 'var(--color-gold)' : 'var(--color-emerald)'} />
            <span>{currentView === 'admin' ? 'Customer Store' : 'Admin Portal'}</span>
          </button>

          {/* Cart Trigger */}
          <button
            onClick={() => setIsCartDrawerOpen(true)}
            aria-label="View Shopping Cart"
            style={{
              position: 'relative',
              backgroundColor: 'var(--color-emerald)',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(15,95,86,0.25)'
            }}
          >
            <ShoppingBag size={18} color="var(--color-gold)" />
            <span style={{ fontSize: '0.88rem' }}>Cart</span>
            {cartCount > 0 && (
              <span
                style={{
                  backgroundColor: 'var(--color-maroon)',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  borderRadius: '999px',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--color-gold)'
                }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: 'var(--color-silk-cream)',
            borderTop: '1px solid var(--color-border-subtle)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <button
            onClick={() => { setCurrentView('store'); setMobileMenuOpen(false); }}
            style={{ textAlign: 'left', fontWeight: 600, padding: '8px 0', color: 'var(--color-emerald)' }}
          >
            Home & Featured Sarees
          </button>
          <button
            onClick={() => { openDeliveryModal(); setMobileMenuOpen(false); }}
            style={{ textAlign: 'left', fontWeight: 500, padding: '8px 0', color: 'var(--color-charcoal)' }}
          >
            12 km Delivery Check
          </button>
          <button
            onClick={() => { setCurrentView('tracking'); setMobileMenuOpen(false); }}
            style={{ textAlign: 'left', fontWeight: 500, padding: '8px 0', color: 'var(--color-charcoal)' }}
          >
            Track My Order
          </button>
          <button
            onClick={() => { setCurrentView(currentView === 'admin' ? 'store' : 'admin'); setMobileMenuOpen(false); }}
            style={{ textAlign: 'left', fontWeight: 600, padding: '8px 0', color: 'var(--color-maroon)' }}
          >
            Operations Admin Dashboard
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </header>
  );
};
