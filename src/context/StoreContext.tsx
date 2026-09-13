import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StoreSettings, TickerMessage, Product, ProductVariant, CartItem, SaleCampaign } from '../../shared/types.js';
import { apiRequest } from '../utils/api.js';

interface StoreContextType {
  settings: StoreSettings | null;
  tickerMessages: TickerMessage[];
  activeCampaign: SaleCampaign | null;
  activeCampaigns: SaleCampaign[];
  setActiveCampaign: (c: SaleCampaign | null) => void;
  cart: CartItem[];
  addToCart: (product: Product, variant: ProductVariant, quantity?: number) => void;
  updateCartQuantity: (variantId: string, quantity: number) => void;
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  bundleDiscount: number;
  couponCode: string;
  setCouponCode: (code: string) => void;
  couponDiscount: number;
  deliveryCharge: number;
  cartTotal: number;
  refreshSettings: () => Promise<void>;
  refreshTicker: () => Promise<void>;
  refreshCampaign: () => Promise<void>;
  advanceOrderProduct: { product: Product; variant: ProductVariant } | null;
  openAdvanceOrderModal: (product: Product, variant: ProductVariant) => void;
  closeAdvanceOrderModal: () => void;
  isDeliveryModalOpen: boolean;
  openDeliveryModal: () => void;
  closeDeliveryModal: () => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
}

const defaultSettings: StoreSettings = {
  brand_name: 'India Fashions',
  tagline: 'Handcrafted Heritage & Festive Weaves',
  shop_address: 'Shop 14, Royal Silk Arcade, MG Road, Bangalore 560001',
  shop_latitude: 12.9716,
  shop_longitude: 77.5946,
  delivery_radius_km: 12,
  delivery_base_charge: 50,
  free_delivery_threshold: 2999,
  cod_enabled: true,
  upi_enabled: true,
  card_enabled: true,
  imps_neft_enabled: true,
  bank_account_name: 'India Fashions Boutique Pvt Ltd',
  bank_account_number: '987654321098',
  bank_ifsc: 'HDFC0001234',
  bank_branch: 'MG Road Heritage Branch',
  upi_id: 'indiafashions@okhdfcbank',
  contact_phone: '+91 98450 12345',
  contact_email: 'care@indiafashions.com',
  offer_2_plus_1_enabled: true
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<SaleCampaign[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<SaleCampaign | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('if_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [couponCode, setCouponCode] = useState<string>('');
  const [advanceOrderProduct, setAdvanceOrderProduct] = useState<{ product: Product; variant: ProductVariant } | null>(null);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState<boolean>(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('if_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to persist cart', e);
    }
  }, [cart]);

  const refreshSettings = async () => {
    try {
      const data = await apiRequest<{ settings: StoreSettings }>('/settings');
      if (data?.settings) {
        setSettings(data.settings);
        // Dynamically update document title if changed in admin
        document.title = `${data.settings.brand_name} | Royal Heritage Weaves`;
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  };

  const refreshTicker = async () => {
    try {
      const data = await apiRequest<{ messages: TickerMessage[] }>('/ticker');
      if (data?.messages) {
        setTickerMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to load ticker', err);
    }
  };

  const refreshCampaign = async () => {
    try {
      const data = await apiRequest<{ campaigns: SaleCampaign[] }>('/sales/active');
      if (data?.campaigns && data.campaigns.length > 0) {
        setActiveCampaigns(data.campaigns);
        setActiveCampaign(prev => {
          if (prev && data.campaigns.some(c => c.id === prev.id)) {
            return data.campaigns.find(c => c.id === prev.id) || data.campaigns[0];
          }
          return data.campaigns[0];
        });
      } else {
        setActiveCampaigns([]);
        setActiveCampaign(null);
      }
    } catch (err) {
      console.error('Failed to load active campaign', err);
      setActiveCampaigns([]);
      setActiveCampaign(null);
    }
  };

  // Initial load & SSE connection with Fallback Polling
  useEffect(() => {
    refreshSettings();
    refreshTicker();
    refreshCampaign();

    let sse: EventSource | null = null;
    let fallbackInterval: any = null;

    try {
      sse = new EventSource('/api/events');

      sse.addEventListener('settings_updated', (e: any) => {
        refreshSettings();
      });

      sse.addEventListener('ticker_updated', () => {
        refreshTicker();
      });

      sse.addEventListener('campaign_updated', () => {
        refreshCampaign();
      });

      sse.onerror = () => {
        // Fallback polling for unreliable networks every 12 seconds
        if (!fallbackInterval) {
          fallbackInterval = setInterval(() => {
            refreshSettings();
            refreshTicker();
            refreshCampaign();
          }, 12000);
        }
      };
    } catch (e) {
      fallbackInterval = setInterval(() => {
        refreshSettings();
        refreshTicker();
        refreshCampaign();
      }, 12000);
    }

    return () => {
      if (sse) sse.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, []);

  const addToCart = (product: Product, variant: ProductVariant, quantity: number = 1) => {
    if (variant.quantity <= 0) {
      // Trigger advance order modal for out of stock
      openAdvanceOrderModal(product, variant);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.variant.id === variant.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, variant.quantity);
        return prev.map(item =>
          item.variant.id === variant.id ? { ...item, quantity: newQty } : item
        );
      } else {
        return [...prev, { product, variant, quantity: Math.min(quantity, variant.quantity) }];
      }
    });

    setIsCartDrawerOpen(true);
  };

  const updateCartQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.variant.id === variantId ? { ...item, quantity: Math.min(quantity, item.variant.quantity) } : item
      )
    );
  };

  const removeFromCart = (variantId: string) => {
    setCart(prev => prev.filter(item => item.variant.id !== variantId));
  };

  const clearCart = () => {
    setCart([]);
    setCouponCode('');
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartSubtotal = cart.reduce((sum, item) => {
    const price = item.variant.sale_price && item.variant.sale_price > 0 ? item.variant.sale_price : item.variant.selling_price;
    return sum + price * item.quantity;
  }, 0);

  // 2 + 1 Bundle discount calculation
  let bundleDiscount = 0;
  if (settings?.offer_2_plus_1_enabled && cartCount >= 3) {
    const unitPrices: number[] = [];
    for (const item of cart) {
      const price = item.variant.sale_price && item.variant.sale_price > 0 ? item.variant.sale_price : item.variant.selling_price;
      for (let i = 0; i < item.quantity; i++) {
        unitPrices.push(price);
      }
    }
    unitPrices.sort((a, b) => a - b); // Cheapest first
    const bundleCount = Math.floor(unitPrices.length / 3);
    for (let b = 0; b < bundleCount; b++) {
      bundleDiscount += unitPrices[b]; // cheapest item free
    }
  }

  // Coupon discount
  let couponDiscount = 0;
  if (couponCode.toUpperCase().trim() === 'FESTIVE10') {
    couponDiscount = Math.round((cartSubtotal - bundleDiscount) * 0.10);
  } else if (couponCode.toUpperCase().trim() === 'WELCOME5') {
    couponDiscount = Math.round((cartSubtotal - bundleDiscount) * 0.05);
  }

  const netSubtotal = Math.max(0, cartSubtotal - bundleDiscount - couponDiscount);
  const deliveryCharge = netSubtotal >= (settings?.free_delivery_threshold || 2999) || netSubtotal === 0 ? 0 : (settings?.delivery_base_charge || 50);
  const cartTotal = netSubtotal + deliveryCharge;

  const openAdvanceOrderModal = (product: Product, variant: ProductVariant) => {
    setAdvanceOrderProduct({ product, variant });
  };

  const closeAdvanceOrderModal = () => {
    setAdvanceOrderProduct(null);
  };

  const openDeliveryModal = () => setIsDeliveryModalOpen(true);
  const closeDeliveryModal = () => setIsDeliveryModalOpen(false);

  return (
    <StoreContext.Provider
      value={{
        settings,
        tickerMessages,
        activeCampaign,
        activeCampaigns,
        setActiveCampaign,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotal,
        bundleDiscount,
        couponCode,
        setCouponCode,
        couponDiscount,
        deliveryCharge,
        cartTotal,
        refreshSettings,
        refreshTicker,
        refreshCampaign,
        advanceOrderProduct,
        openAdvanceOrderModal,
        closeAdvanceOrderModal,
        isDeliveryModalOpen,
        openDeliveryModal,
        closeDeliveryModal,
        isCartDrawerOpen,
        setIsCartDrawerOpen
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
