import React, { useState } from 'react';
import { StoreProvider } from './context/StoreContext.js';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Ticker } from './components/common/Ticker.js';
import { Navbar } from './components/common/Navbar.js';
import { Footer } from './components/common/Footer.js';
import { CartDrawer } from './components/customer/CartDrawer.js';
import { AdvanceOrderModal } from './components/customer/AdvanceOrderModal.js';
import { DeliveryCheckModal } from './components/customer/DeliveryCheckModal.js';
import { AdminLoginModal } from './components/common/AdminLoginModal.js';

import { HomePage } from './pages/HomePage.js';
import { CategoryPage } from './pages/CategoryPage.js';
import { ProductDetailPage } from './pages/ProductDetailPage.js';
import { CheckoutPage } from './pages/CheckoutPage.js';
import { OrderTrackingPage } from './pages/OrderTrackingPage.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { Product } from '../shared/types.js';

export const AppContent: React.FC = () => {
  const { currentRole, logout } = useAuth();
  const [currentView, setCurrentView] = useState<'store' | 'admin' | 'tracking'>('store');
  const [activePage, setActivePage] = useState<'home' | 'category' | 'pdp' | 'checkout'>('home');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);

  const handleSelectProduct = (product: Product) => {
    setSelectedProductSlug(product.slug || product.id);
    setActivePage('pdp');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (slug: string) => {
    setSelectedCategorySlug(slug);
    setCurrentView('store');
    setActivePage('category');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOrderSuccess = (orderId: string) => {
    setTrackedOrderId(orderId);
    setCurrentView('tracking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Ticker at the very top of storefront */}
      <Ticker />

      {/* Main Brand Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={view => {
          if (view === 'admin' && currentRole !== 'SUPER_ADMIN') {
            setIsAdminLoginModalOpen(true);
            return;
          }
          setCurrentView(view);
          if (view === 'store') setActivePage('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSearchClick={() => {
          setCurrentView('store');
          setActivePage('category');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectCategory={handleSelectCategory}
        onOpenAdminLogin={() => {
          setIsAdminLoginModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1 }}>
        {currentView === 'admin' ? (
          currentRole === 'SUPER_ADMIN' ? (
            <AdminDashboardPage onBackToStore={async () => {
              await logout();
              setCurrentView('store');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} />
          ) : (
            <div style={{ padding: '80px 20px', textAlign: 'center', backgroundColor: '#F8FAFC', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ maxWidth: '420px', width: '100%', padding: '36px 28px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 12px 30px rgba(0,0,0,0.08)', border: '1.5px solid var(--color-gold)' }}>
                <h2 style={{ fontSize: '1.3rem', fontFamily: 'var(--font-serif-brand)', color: 'var(--color-emerald-dark)', marginBottom: '8px' }}>
                  Super Admin Access Required
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.5, marginBottom: '24px' }}>
                  The Boutique Operations Console is strictly restricted to Super Admin personnel. Please authenticate to proceed.
                </p>
                <button
                  onClick={() => setIsAdminLoginModalOpen(true)}
                  className="btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '0.9rem', fontWeight: 700 }}
                >
                  Super Admin Sign In
                </button>
                <button
                  onClick={() => setCurrentView('store')}
                  className="btn-outline"
                  style={{ width: '100%', marginTop: '12px', padding: '10px', fontSize: '0.85rem' }}
                >
                  Return to Storefront
                </button>
              </div>
            </div>
          )
        ) : currentView === 'tracking' ? (
          <OrderTrackingPage
            initialOrderId={trackedOrderId}
            onBackToStore={() => {
              setCurrentView('store');
              setActivePage('home');
            }}
          />
        ) : (
          <>
            {activePage === 'home' && (
              <HomePage
                onSelectProduct={handleSelectProduct}
                onSelectCategory={handleSelectCategory}
                onExploreCollection={() => handleSelectCategory('all')}
              />
            )}

            {activePage === 'category' && (
              <CategoryPage
                selectedCategory={selectedCategorySlug}
                onSelectCategory={(slug) => setSelectedCategorySlug(slug)}
                onSelectProduct={handleSelectProduct}
              />
            )}

            {activePage === 'pdp' && selectedProductSlug && (
              <ProductDetailPage
                productSlug={selectedProductSlug}
                onBack={() => setActivePage('category')}
                onSelectProduct={handleSelectProduct}
              />
            )}

            {activePage === 'checkout' && (
              <CheckoutPage
                onBackToCart={() => setActivePage('category')}
                onOrderSuccess={handleOrderSuccess}
              />
            )}
          </>
        )}
      </div>

      {/* Slide-over Cart Drawer */}
      <CartDrawer
        onProceedToCheckout={() => {
          setCurrentView('store');
          setActivePage('checkout');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Advance Order Modal for Out-of-Stock Items */}
      <AdvanceOrderModal />

      {/* 12 km Delivery Radius Checker Modal */}
      <DeliveryCheckModal />

      {/* Royal Heritage Boutique Footer (shown in customer mode) */}
      {currentView !== 'admin' && (
        <Footer
          onOpenAdminLogin={() => {
            setIsAdminLoginModalOpen(true);
          }}
        />
      )}

      {/* Super Admin Security Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onSuccess={() => {
          setCurrentView('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </StoreProvider>
  );
}
