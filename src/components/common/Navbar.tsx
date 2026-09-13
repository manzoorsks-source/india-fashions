import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { ShoppingBag, Search, MapPin, Truck, Menu, X, ChevronDown, Sparkles, KeyRound } from 'lucide-react';
import { UserRole } from '../../../shared/types.js';

interface NavbarProps {
  currentView: 'store' | 'admin' | 'tracking';
  setCurrentView: (view: 'store' | 'admin' | 'tracking') => void;
  onSearchClick?: () => void;
  onSelectCategory?: (slug: string) => void;
  onOpenAdminLogin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onSearchClick,
  onSelectCategory,
  onOpenAdminLogin
}) => {
  const { settings, cartCount, setIsCartDrawerOpen, openDeliveryModal } = useStore();
  const { currentRole, currentUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const brandName = settings?.brand_name || 'India Fashions';
  const tagline = settings?.tagline || 'Royal Heritage Handwoven Weaves';

  const categories = [
    { name: 'All Collections', slug: 'all', active: true, tag: 'Full Catalog' },
    { name: 'Sarees', slug: 'sarees', active: true, tag: '12 Designs' },
    { name: 'Punjabi Dresses', slug: 'punjabi-dresses', active: true, tag: '4 Designs' },
    { name: 'Kurti', slug: 'kurti', active: true, tag: '2 Designs' },
    { name: 'Lehenga', slug: 'lehenga', active: true, tag: '2 Designs' },
    { name: 'Children', slug: 'children', active: true, tag: '2 Designs' },
    { name: 'Salwar Suit', slug: 'salwar-suit', active: false, tag: 'Coming Soon' },
    { name: "Men's Ethnic", slug: 'mens-ethnic', active: false, tag: 'Coming Soon' },
    { name: 'Accessories', slug: 'accessories', active: false, tag: 'Coming Soon' },
  ];

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'var(--color-silk-cream)', boxShadow: 'var(--shadow-sm)' }}>
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
                      setCategoryDropdownOpen(false);
                      if (onSelectCategory) {
                        onSelectCategory(cat.slug);
                      } else {
                        setCurrentView('store');
                      }
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

          {/* Discreet Staff Key Symbol (Unobtrusive for customers) */}
          <button
            onClick={() => {
              if (onOpenAdminLogin) {
                onOpenAdminLogin();
              }
            }}
            aria-label="Staff Key"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              opacity: 0.35,
              marginLeft: '4px'
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.35')}
          >
            <KeyRound size={15} />
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
            Home
          </button>

          <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '10px' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-gold-dark)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>
              Shop By Category
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {categories.filter(c => c.active).map(c => (
                <button
                  key={c.slug}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onSelectCategory) {
                      onSelectCategory(c.slug);
                    } else {
                      setCurrentView('store');
                    }
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--color-border-subtle)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--color-charcoal)'
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

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
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenAdminLogin?.(); }}
              style={{ background: 'none', border: 'none', color: '#94A3B8', opacity: 0.3, cursor: 'pointer', padding: '6px' }}
              aria-label="Staff Key"
            >
              <KeyRound size={14} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 960px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </header>
  );
};
