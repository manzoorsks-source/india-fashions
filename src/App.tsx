import React, { useState } from 'react';
import { StoreProvider } from './context/StoreContext.js';
import { AuthProvider } from './context/AuthContext.js';
import { Ticker } from './components/common/Ticker.js';
import { Navbar } from './components/common/Navbar.js';
import { Footer } from './components/common/Footer.js';
import { CartDrawer } from './components/customer/CartDrawer.js';
import { AdvanceOrderModal } from './components/customer/AdvanceOrderModal.js';
import { DeliveryCheckModal } from './components/customer/DeliveryCheckModal.js';

import { HomePage } from './pages/HomePage.js';
import { CategoryPage } from './pages/CategoryPage.js';
import { ProductDetailPage } from './pages/ProductDetailPage.js';
import { CheckoutPage } from './pages/CheckoutPage.js';
import { OrderTrackingPage } from './pages/OrderTrackingPage.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { Product } from '../shared/types.js';

export const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<'store' | 'admin' | 'tracking'>('store');
  const [activePage, setActivePage] = useState<'home' | 'category' | 'pdp' | 'checkout'>('home');
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null);

  const handleSelectProduct = (product: Product) => {
    setSelectedProductSlug(product.slug || product.id);
    setActivePage('pdp');
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

      {/* Main Brand Navbar with Role Simulator */}
      <Navbar
        currentView={currentView}
        setCurrentView={view => {
          setCurrentView(view);
          if (view === 'store') setActivePage('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSearchClick={() => {
          setCurrentView('store');
          setActivePage('category');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1 }}>
        {currentView === 'admin' ? (
          <AdminDashboardPage />
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
                onExploreCollection={() => {
                  setActivePage('category');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            )}

            {activePage === 'category' && (
              <CategoryPage onSelectProduct={handleSelectProduct} />
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
      {currentView !== 'admin' && <Footer />}
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
