import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useStore } from '../context/StoreContext.js';
import { apiRequest } from '../utils/api.js';
import { formatINR, formatDateTime } from '../utils/formatters.js';
import {
  Product,
  ProductVariant,
  Order,
  AdvanceOrder,
  InventoryMovement,
  SaleCampaign,
  TickerMessage,
  AuditLog,
  StoreSettings,
  OrderStatus,
  PaymentStatus,
  UserRole
} from '../../shared/types.js';
import {
  LayoutDashboard,
  ShoppingBag,
  Image as ImageIcon,
  Boxes,
  Sparkles,
  ClipboardList,
  Clock,
  Settings,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  RefreshCw,
  Eye,
  FileText,
  Lock,
  Search,
  ExternalLink,
  Calendar,
  PauseCircle,
  PlayCircle,
  X,
  ArrowLeft,
  LogOut
} from 'lucide-react';

type AdminTab =
  | 'overview'
  | 'catalog'
  | 'media'
  | 'inventory'
  | 'sales'
  | 'orders'
  | 'advance-orders'
  | 'settings';

interface AdminDashboardPageProps {
  onBackToStore?: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onBackToStore }) => {
  const { currentRole, currentUser, logout, canManageCatalog, canViewCostPrice, canVerifyPayments, canManageInventory, canManageUsers, canManageSettings, canProcessRefunds } = useAuth();
  const { settings, refreshSettings, refreshTicker } = useStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(false);

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [advanceOrders, setAdvanceOrders] = useState<AdvanceOrder[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [campaigns, setCampaigns] = useState<SaleCampaign[]>([]);
  const [tickerList, setTickerList] = useState<TickerMessage[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  // Modals & Action States
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProductForMedia, setSelectedProductForMedia] = useState<Product | null>(null);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [inventoryModalMode, setInventoryModalMode] = useState<'RESTOCK_EXISTING' | 'ADD_NEW_ARTICLE'>('RESTOCK_EXISTING');
  const [receiveModalItem, setReceiveModalItem] = useState<any | null>(null);
  const [receiveQuantity, setReceiveQuantity] = useState('10');
  const [receivePoRef, setReceivePoRef] = useState('');
  const [newArticleForm, setNewArticleForm] = useState({
    name: '',
    sku: 'ART-SR-101',
    category_id: 'cat-sarees',
    fabric: 'Pure Handloom Silk with Zari Weave',
    color: 'Royal Crimson & Gold',
    color_code: '#6A1B29',
    size: 'Free Size (6.3m with blouse)',
    cost_price: '6500',
    selling_price: '11999',
    quantity: '10',
    low_stock_threshold: '2',
    photo_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80'
  });

  const resetNewArticleForm = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setNewArticleForm({
      name: '',
      sku: `ART-SR-${randomSuffix}`,
      category_id: 'cat-sarees',
      fabric: 'Pure Handloom Silk with Zari Weave',
      color: 'Royal Crimson & Gold',
      color_code: '#6A1B29',
      size: 'Free Size (6.3m with blouse)',
      cost_price: '6500',
      selling_price: '11999',
      quantity: '10',
      low_stock_threshold: '2',
      photo_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80'
    });
  };
  const [adjustModalItem, setAdjustModalItem] = useState<any | null>(null);
  const [adjustQtyChange, setAdjustQtyChange] = useState('-1');
  const [adjustReason, setAdjustReason] = useState('Damaged zari thread during display');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);
  const [isNewTickerModalOpen, setIsNewTickerModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputProductRef = React.useRef<HTMLInputElement>(null);
  const fileInputArticleRef = React.useRef<HTMLInputElement>(null);

  const handleUploadPhotoFile = async (file: File, target: 'product' | 'newArticle') => {
    if (!file) return;
    const formData = new FormData();
    formData.append('photos', file);
    if (target === 'product' && editingProduct) {
      formData.append('product_id', editingProduct.id);
      formData.append('is_primary', 'true');
    }

    try {
      setIsUploadingPhoto(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to upload photo');
      }

      const data = await res.json();
      const uploadedPath = data.file_path || (data.media && data.media[0]?.file_path);
      if (uploadedPath) {
        if (target === 'product') {
          setProductFormData(prev => ({ ...prev, photo_url: uploadedPath }));
        } else {
          setNewArticleForm(prev => ({ ...prev, photo_url: uploadedPath }));
        }
        showNotification('Photo uploaded from device successfully!');
      }
    } catch (err: any) {
      showNotification(err.message || 'Image upload failed', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Product Form State for New / Edit Modal
  const [productFormData, setProductFormData] = useState({
    name: '',
    category_id: 'cat-sarees',
    fabric: 'Pure Mulberry Silk with 2G Gold Zari',
    care_instructions: 'Dry clean only. Store wrapped in soft unbleached muslin cloth with natural cedar balls.',
    description: '',
    campaign_label: 'Festive edit',
    homepage_placement: 'FEATURED' as 'NONE' | 'HERO' | 'FEATURED' | 'NEW_ARRIVAL',
    status: 'PUBLISHED' as 'PUBLISHED' | 'DRAFT' | 'ARCHIVED',
    is_featured: true,
    sku: '',
    color: 'Royal Crimson Maroon',
    color_code: '#6A1B29',
    size: 'Free Size (6.3m with blouse)',
    cost_price: '8000',
    selling_price: '14500',
    sale_price: '12999',
    quantity: '5',
    low_stock_threshold: '2',
    photo_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80',
    alt_text: ''
  });

  // Campaign Form State
  const [editingCampaign, setEditingCampaign] = useState<SaleCampaign | null>(null);
  const [campaignFormData, setCampaignFormData] = useState({
    name: '',
    label: 'Festive edit',
    description: '',
    discount_percentage: '15',
    start_at: '',
    end_at: '',
    is_active: true,
    show_countdown: true
  });

  const [brandNameInput, setBrandNameInput] = useState(settings?.brand_name || 'India Fashions');
  const [taglineInput, setTaglineInput] = useState(settings?.tagline || 'Handcrafted Heritage & Festive Weaves');
  const [shopAddressInput, setShopAddressInput] = useState(settings?.shop_address || 'Shop 14, Royal Silk Arcade, MG Road, Bangalore 560001');
  const [deliveryRadiusInput, setDeliveryRadiusInput] = useState(settings?.delivery_radius_km || 12);
  const [codEnabledInput, setCodEnabledInput] = useState(settings?.cod_enabled ?? true);
  const [offer2Plus1Input, setOffer2Plus1Input] = useState(settings?.offer_2_plus_1_enabled ?? true);

  // Sync settings inputs when settings change
  useEffect(() => {
    if (settings) {
      setBrandNameInput(settings.brand_name);
      setTaglineInput(settings.tagline);
      setShopAddressInput(settings.shop_address);
      setDeliveryRadiusInput(settings.delivery_radius_km);
      setCodEnabledInput(settings.cod_enabled);
      setOffer2Plus1Input(settings.offer_2_plus_1_enabled);
    }
  }, [settings]);

  // Load active tab data
  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const [pRes, oRes, advRes, invRes] = await Promise.all([
          apiRequest<{ products: Product[] }>('/products'),
          apiRequest<{ orders: Order[] }>('/orders').catch(() => ({ orders: [] })),
          apiRequest<{ advanceOrders: AdvanceOrder[] }>('/advance-orders').catch(() => ({ advanceOrders: [] })),
          apiRequest<{ items: any[] }>('/inventory').catch(() => ({ items: [] }))
        ]);
        setProducts(pRes.products || []);
        setOrders(oRes.orders || []);
        setAdvanceOrders(advRes.advanceOrders || []);
        setInventoryItems(invRes.items || []);
      } else if (activeTab === 'catalog') {
        const res = await apiRequest<{ products: Product[] }>('/products');
        setProducts(res.products || []);
      } else if (activeTab === 'media') {
        const res = await apiRequest<{ products: Product[] }>('/products');
        const prods = res.products || [];
        setProducts(prods);
        setSelectedProductForMedia(prev => {
          if (prev) {
            return prods.find(p => p.id === prev.id) || (prods.length > 0 ? prods[0] : null);
          }
          return prods.length > 0 ? prods[0] : null;
        });
      } else if (activeTab === 'inventory') {
        const [invRes, movRes] = await Promise.all([
          apiRequest<{ items: any[] }>('/inventory'),
          apiRequest<{ movements: InventoryMovement[] }>('/inventory/movements')
        ]);
        setInventoryItems(invRes.items || []);
        setMovements(movRes.movements || []);
      } else if (activeTab === 'sales') {
        const res = await apiRequest<{ campaigns: SaleCampaign[] }>('/sales');
        setCampaigns(res.campaigns || []);
      } else if (activeTab === 'orders') {
        const res = await apiRequest<{ orders: Order[] }>('/orders');
        setOrders(res.orders || []);
      } else if (activeTab === 'advance-orders') {
        const res = await apiRequest<{ advanceOrders: AdvanceOrder[] }>('/advance-orders');
        setAdvanceOrders(res.advanceOrders || []);
      } else if (activeTab === 'settings') {
        const [tickRes, usersRes] = await Promise.all([
          apiRequest<{ messages: TickerMessage[] }>('/ticker/admin').catch(() => ({ messages: [] })),
          canManageUsers ? apiRequest<{ users: any[] }>('/auth/users').catch(() => ({ users: [] })) : Promise.resolve({ users: [] })
        ]);
        setTickerList(tickRes.messages || []);
        setUsersList(usersRes.users || []);
      }
    } catch (err: any) {
      console.error('Failed to load tab data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // --- Handlers ---
  // Inventory Receive Stock (Existing SKU)
  const handleReceiveStock = async () => {
    if (!receiveModalItem) {
      showNotification('Please select a valid saree SKU to restock', 'error');
      return;
    }
    const qty = parseInt(receiveQuantity, 10);
    if (isNaN(qty) || qty < 1) {
      showNotification('Quantity to add must be at least 1 unit (1 to infinity). Negative or zero inventory is strictly forbidden.', 'error');
      return;
    }

    try {
      await apiRequest('/inventory/receive', {
        method: 'POST',
        body: JSON.stringify({
          variant_id: receiveModalItem.variant_id,
          quantity: qty,
          reference_note: receivePoRef || 'Weaver Restock Delivery PO# ' + Math.floor(1000 + Math.random() * 9000)
        })
      });
      showNotification(`Stock added: +${qty} units to SKU ${receiveModalItem.sku}`);
      setIsInventoryModalOpen(false);
      loadData();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  // Inventory Add New Article / SKU to Stock
  const handleAddNewArticleFromInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newArticleForm.name.trim();
    const sku = newArticleForm.sku.trim();
    const fabric = newArticleForm.fabric.trim();
    const cost = parseFloat(newArticleForm.cost_price) || 0;
    const selling = parseFloat(newArticleForm.selling_price) || 0;
    const qty = parseInt(newArticleForm.quantity, 10);

    if (!name) {
      showNotification('Please enter the saree/article name', 'error');
      return;
    }
    if (!sku) {
      showNotification('Please enter a unique SKU code', 'error');
      return;
    }
    if (!fabric) {
      showNotification('Please enter the fabric details', 'error');
      return;
    }
    if (isNaN(qty) || qty < 1) {
      showNotification('Initial stock quantity must be at least 1 unit (1 to infinity). Negative or zero inventory is strictly forbidden.', 'error');
      return;
    }
    if (selling < cost) {
      showNotification(`Pricing Safeguard: Selling price (₹${selling}) cannot be lower than cost price (₹${cost})`, 'error');
      return;
    }

    try {
      await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify({
          name,
          category_id: newArticleForm.category_id,
          fabric,
          care_instructions: 'Dry clean only. Store wrapped in soft unbleached muslin cloth with natural cedar balls.',
          description: `${name} — handcrafted artisanal luxury weave with fine detailing.`,
          campaign_label: 'New Arrival',
          homepage_placement: 'NEW_ARRIVAL',
          status: 'PUBLISHED',
          is_featured: 1,
          variants: [
            {
              sku,
              size: newArticleForm.size || 'Free Size (6.3m with blouse)',
              color: newArticleForm.color || 'Standard',
              color_code: newArticleForm.color_code || '#0F5F56',
              cost_price: cost,
              selling_price: selling,
              quantity: qty,
              low_stock_threshold: parseInt(newArticleForm.low_stock_threshold, 10) || 2
            }
          ],
          media: [
            {
              file_path: newArticleForm.photo_url || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80',
              alt_text: name,
              is_primary: 1
            }
          ]
        })
      });

      showNotification(`New article "${name}" (SKU: ${sku}) created with +${qty} units initial stock!`);
      setIsInventoryModalOpen(false);
      loadData();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  // Inventory Manual Adjust
  const handleAdjustStock = async () => {
    if (!adjustModalItem) return;
    try {
      await apiRequest('/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          variant_id: adjustModalItem.variant_id,
          quantity_change: parseInt(adjustQtyChange, 10),
          reason: adjustReason
        })
      });
      showNotification(`Stock adjusted for SKU ${adjustModalItem.sku}`);
      setAdjustModalItem(null);
      loadData();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  // IMPS / NEFT Payment Verification (Head Cashier & Super Admin)
  const handleVerifyPayment = async (orderId: string, approved: boolean) => {
    try {
      await apiRequest(`/orders/${orderId}/verify-payment`, {
        method: 'POST',
        body: JSON.stringify({ approved, note: approved ? 'UTR confirmed in bank portal' : 'Payment discrepancy' })
      });
      showNotification(approved ? 'IMPS Payment VERIFIED & Order Confirmed!' : 'IMPS Payment Rejected');
      loadData();
      if (selectedOrderDetails) {
        setSelectedOrderDetails(null);
      }
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  // Advance Order Status Allocation
  const handleAdvanceOrderStatus = async (id: string, status: string) => {
    try {
      await apiRequest(`/advance-orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, notification_sent: true })
      });
      showNotification(`Advance order marked as ${status}. Customer notification dispatched.`);
      loadData();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  // Product Modal Handlers
  const openNewProductModal = () => {
    setEditingProduct(null);
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    setProductFormData({
      name: 'Banarasi Handloom Katan Silk Brocade Saree',
      category_id: 'cat-sarees',
      fabric: 'Pure Handloom Katan Silk with Antique Gold Kadwa Weave',
      care_instructions: 'Strictly dry clean. Store wrapped in soft unbleached muslin cloth with natural cedar balls.',
      description: 'An opulent royal heirloom drape woven by Varanasi master artisans, enriched with intricate floral meenakari bootis and a majestic zari pallu.',
      campaign_label: 'Festive edit',
      homepage_placement: 'FEATURED',
      status: 'PUBLISHED',
      is_featured: true,
      sku: `BK-KAT-${randomSuffix}`,
      color: 'Royal Crimson & Gold',
      color_code: '#6A1B29',
      size: 'Free Size (6.3m with blouse)',
      cost_price: '8500',
      selling_price: '14999',
      sale_price: '12999',
      quantity: '5',
      low_stock_threshold: '2',
      photo_url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80',
      alt_text: 'Handcrafted Banarasi Katan Silk Saree'
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (p: Product) => {
    setEditingProduct(p);
    const v = p.variants?.[0];
    setProductFormData({
      name: p.name,
      category_id: p.category_id,
      fabric: p.fabric,
      care_instructions: p.care_instructions,
      description: p.description,
      campaign_label: p.campaign_label || 'Festive edit',
      homepage_placement: p.homepage_placement || 'NONE',
      status: p.status,
      is_featured: p.is_featured,
      sku: v?.sku || '',
      color: v?.color || '',
      color_code: v?.color_code || '#0F5F56',
      size: v?.size || 'Free Size (6.3m with blouse)',
      cost_price: v?.cost_price !== undefined ? String(v.cost_price) : '6000',
      selling_price: v?.selling_price !== undefined ? String(v.selling_price) : '9999',
      sale_price: v?.sale_price ? String(v.sale_price) : '',
      quantity: v?.quantity !== undefined ? String(v.quantity) : '1',
      low_stock_threshold: v?.low_stock_threshold !== undefined ? String(v.low_stock_threshold) : '2',
      photo_url: p.media?.find(m => m.is_primary)?.file_path || p.media?.[0]?.file_path || '',
      alt_text: p.media?.[0]?.alt_text || p.name
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(productFormData.cost_price) || 0;
    const selling = parseFloat(productFormData.selling_price) || 0;
    const sale = productFormData.sale_price ? parseFloat(productFormData.sale_price) : null;

    if (selling < cost) {
      showNotification(`Pricing Safeguard: Selling price (₹${selling}) cannot be lower than cost price (₹${cost})`, 'error');
      return;
    }
    if (sale && sale < cost) {
      showNotification(`Pricing Safeguard: Sale price (₹${sale}) cannot be lower than cost price (₹${cost})`, 'error');
      return;
    }

    try {
      if (editingProduct) {
        await apiRequest(`/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: productFormData.name,
            category_id: productFormData.category_id,
            fabric: productFormData.fabric,
            care_instructions: productFormData.care_instructions,
            description: productFormData.description,
            campaign_label: productFormData.campaign_label,
            homepage_placement: productFormData.homepage_placement,
            status: productFormData.status,
            is_featured: productFormData.is_featured ? 1 : 0,
            photo_url: productFormData.photo_url || undefined,
            variants: [
              {
                id: editingProduct.variants?.[0]?.id,
                sku: productFormData.sku,
                size: productFormData.size,
                color: productFormData.color,
                color_code: productFormData.color_code,
                cost_price: cost,
                selling_price: selling,
                sale_price: sale,
                low_stock_threshold: parseInt(productFormData.low_stock_threshold, 10) || 2
              }
            ]
          })
        });
        showNotification('Product updated successfully!');
      } else {
        await apiRequest('/products', {
          method: 'POST',
          body: JSON.stringify({
            name: productFormData.name,
            category_id: productFormData.category_id,
            fabric: productFormData.fabric,
            care_instructions: productFormData.care_instructions,
            description: productFormData.description,
            campaign_label: productFormData.campaign_label,
            homepage_placement: productFormData.homepage_placement,
            status: productFormData.status,
            is_featured: productFormData.is_featured ? 1 : 0,
            photo_url: productFormData.photo_url || undefined,
            variants: [
              {
                sku: productFormData.sku,
                size: productFormData.size,
                color: productFormData.color,
                color_code: productFormData.color_code,
                cost_price: cost,
                selling_price: selling,
                sale_price: sale,
                quantity: parseInt(productFormData.quantity, 10) || 0,
                low_stock_threshold: parseInt(productFormData.low_stock_threshold, 10) || 2
              }
            ],
            media: [
              {
                file_path: productFormData.photo_url || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80',
                alt_text: productFormData.alt_text || productFormData.name,
                is_primary: 1
              }
            ]
          })
        });
        showNotification('New product created and published to catalog!');
      }

      setIsProductModalOpen(false);
      loadData();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  // Media Management Handlers
  const handleSetPrimaryMedia = async (mediaId: string) => {
    if (!selectedProductForMedia) return;
    try {
      // 1. Optimistic instant UI update
      setSelectedProductForMedia(prev => {
        if (!prev) return null;
        return {
          ...prev,
          media: prev.media.map(m => ({
            ...m,
            is_primary: m.id === mediaId
          }))
        };
      });

      // 2. Persist to server
      await apiRequest(`/media/${mediaId}/set-primary`, { method: 'POST' });
      showNotification('★ Primary display photo updated successfully!');

      // 3. Sync full product data from server
      const res = await apiRequest<{ products: Product[] }>('/products');
      const prods = res.products || [];
      setProducts(prods);
      const fresh = prods.find(p => p.id === selectedProductForMedia.id);
      if (fresh) setSelectedProductForMedia(fresh);
    } catch (err: any) {
      showNotification(err.message, 'error');
      loadData();
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!selectedProductForMedia) return;
    if (!window.confirm('Are you sure you want to delete this photo from the gallery?')) return;
    try {
      // 1. Optimistically remove from state
      setSelectedProductForMedia(prev => {
        if (!prev) return null;
        return {
          ...prev,
          media: prev.media.filter(m => m.id !== mediaId)
        };
      });

      // 2. Call delete endpoint
      await apiRequest(`/media/${mediaId}`, { method: 'DELETE' });
      showNotification('Photo deleted from gallery');

      // 3. Sync with server
      const res = await apiRequest<{ products: Product[] }>('/products');
      const prods = res.products || [];
      setProducts(prods);
      const fresh = prods.find(p => p.id === selectedProductForMedia.id);
      if (fresh) setSelectedProductForMedia(fresh);
    } catch (err: any) {
      showNotification(err.message, 'error');
      loadData();
    }
  };

  const toLocalIso = (dateStr?: string) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const mins = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${mins}`;
  };

  const handleOpenNewCampaign = () => {
    setEditingCampaign(null);
    const now = new Date();
    const future = new Date(Date.now() + 14 * 86400000);
    setCampaignFormData({
      name: '',
      label: 'Festive edit',
      description: '',
      discount_percentage: '15',
      start_at: toLocalIso(now.toISOString()),
      end_at: toLocalIso(future.toISOString()),
      is_active: true,
      show_countdown: true
    });
    setIsNewCampaignModalOpen(true);
  };

  const handleOpenEditCampaign = (camp: SaleCampaign) => {
    setEditingCampaign(camp);
    setCampaignFormData({
      name: camp.name,
      label: camp.label || 'Festive edit',
      description: camp.description || '',
      discount_percentage: camp.discount_percentage !== undefined ? String(camp.discount_percentage) : '15',
      start_at: toLocalIso(camp.start_at),
      end_at: toLocalIso(camp.end_at),
      is_active: Boolean(camp.is_active),
      show_countdown: Boolean(camp.show_countdown)
    });
    setIsNewCampaignModalOpen(true);
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(campaignFormData.end_at) <= new Date(campaignFormData.start_at)) {
      showNotification('To Date (End Date) must be after From Date (Start Date)', 'error');
      return;
    }

    try {
      const payload = {
        name: campaignFormData.name,
        label: campaignFormData.label,
        description: campaignFormData.description,
        discount_percentage: parseFloat(campaignFormData.discount_percentage) || 0,
        start_at: new Date(campaignFormData.start_at).toISOString(),
        end_at: new Date(campaignFormData.end_at).toISOString(),
        is_active: campaignFormData.is_active ? 1 : 0,
        show_countdown: campaignFormData.show_countdown ? 1 : 0,
        apply_to: 'ALL'
      };

      if (editingCampaign) {
        await apiRequest(`/sales/${editingCampaign.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showNotification('Festive campaign updated successfully!');
      } else {
        await apiRequest('/sales', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showNotification('Festive campaign scheduled!');
      }

      setIsNewCampaignModalOpen(false);
      setEditingCampaign(null);
      loadData();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const handleToggleCampaignStatus = async (camp: SaleCampaign) => {
    try {
      await apiRequest(`/sales/${camp.id}/toggle`, { method: 'PATCH' });
      showNotification(`Campaign "${camp.name}" status updated.`);
      loadData();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const handleDeleteCampaign = async (camp: SaleCampaign) => {
    if (!window.confirm(`Are you sure you want to delete campaign "${camp.name}"?`)) return;
    try {
      await apiRequest(`/sales/${camp.id}`, { method: 'DELETE' });
      showNotification(`Campaign "${camp.name}" deleted.`);
      loadData();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  // Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify({
          brand_name: brandNameInput,
          tagline: taglineInput,
          shop_address: shopAddressInput,
          delivery_radius_km: parseFloat(String(deliveryRadiusInput)),
          cod_enabled: codEnabledInput,
          offer_2_plus_1_enabled: offer2Plus1Input
        })
      });
      await refreshSettings();
      showNotification('Store settings saved successfully! Brand name updated dynamically.');
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  // View Audit Logs
  const handleOpenAuditLogs = async () => {
    try {
      const res = await apiRequest<{ logs: AuditLog[] }>('/settings/audit-logs');
      setAuditLogs(res.logs || []);
      setIsAuditModalOpen(true);
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex' }}>
      {/* Left Sidebar Navigation */}
      <aside
        style={{
          width: '260px',
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #1E293B',
          flexShrink: 0
        }}
      >
        {/* Operations Header */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #1E293B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'var(--color-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--color-gold)', fontWeight: 800, fontSize: '0.85rem' }}>IF</span>
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC' }}>
              Boutique Ops
            </h2>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '4px' }}>
            {currentUser?.name || 'Staff Console'} • <strong>{currentRole}</strong>
          </p>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {[
            { key: 'overview', label: 'Overview & Metrics', icon: <LayoutDashboard size={18} /> },
            { key: 'catalog', label: 'Product Catalog', icon: <ShoppingBag size={18} />, hidden: !canManageCatalog },
            { key: 'media', label: 'Media & Gallery', icon: <ImageIcon size={18} />, hidden: !canManageCatalog },
            { key: 'inventory', label: 'Inventory Matrix', icon: <Boxes size={18} />, hidden: !canManageInventory },
            { key: 'sales', label: 'Sales & Campaigns', icon: <Sparkles size={18} />, hidden: !canManageCatalog },
            { key: 'orders', label: 'Orders & Payments', icon: <ClipboardList size={18} /> },
            { key: 'advance-orders', label: 'Advance Orders', icon: <Clock size={18} /> },
            { key: 'settings', label: 'Store Settings', icon: <Settings size={18} />, hidden: !canManageSettings }
          ].map(item => {
            if (item.hidden) return null;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key as AdminTab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 700 : 500,
                  backgroundColor: isActive ? 'var(--color-emerald)' : 'transparent',
                  color: isActive ? '#ffffff' : '#94A3B8',
                  textAlign: 'left',
                  transition: 'all 0.15s'
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {onBackToStore && (
            <button
              onClick={async () => {
                await logout();
                if (onBackToStore) onBackToStore();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'var(--color-gold-bright)',
                fontSize: '0.82rem',
                fontWeight: 700,
                padding: '8px 12px',
                backgroundColor: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid var(--color-gold)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <ArrowLeft size={15} />
              <span>Return to Storefront</span>
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
            <button
              onClick={handleOpenAuditLogs}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#94A3B8',
                fontSize: '0.78rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 0'
              }}
            >
              <FileText size={14} />
              <span>Audit Trail</span>
            </button>

            <button
              onClick={async () => {
                await logout();
                if (onBackToStore) onBackToStore();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#F87171',
                fontSize: '0.78rem',
                fontWeight: 600,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 0'
              }}
              title="Sign Out Super Admin"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Stage */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
        {/* Top bar notification banner */}
        {actionMessage && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '8px',
              backgroundColor: actionMessage.type === 'success' ? '#DCFCE7' : '#FEE2E2',
              color: actionMessage.type === 'success' ? '#166534' : '#991B1B',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.88rem',
              fontWeight: 600
            }}
          >
            {actionMessage.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', color: '#0F172A', fontWeight: 800 }}>
                  Store Operations Overview
                </h1>
                <p style={{ fontSize: '0.88rem', color: '#64748B' }}>
                  Live metrics for {settings?.brand_name || 'India Fashions'}
                </p>
              </div>

              <button onClick={loadData} className="btn-outline" style={{ fontSize: '0.82rem', padding: '8px 14px' }}>
                <RefreshCw size={14} />
                <span>Refresh Live State</span>
              </button>
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
              {[
                {
                  label: 'Today’s Sales Volume',
                  value: formatINR(orders.filter(o => o.payment_status === 'PAID').reduce((sum, o) => sum + o.total_amount, 0)),
                  color: 'var(--color-emerald)'
                },
                {
                  label: 'Pending Orders',
                  value: orders.filter(o => o.status === 'PLACED' || o.status === 'CONFIRMED').length,
                  color: '#2563EB'
                },
                {
                  label: 'Payment Verifications',
                  value: orders.filter(o => o.payment_status === 'VERIFICATION_REQUIRED').length,
                  color: '#D97706',
                  tag: 'IMPS/NEFT'
                },
                {
                  label: 'Low Stock Weaves',
                  value: inventoryItems.filter(i => i.is_low_stock).length,
                  color: '#EA580C'
                },
                {
                  label: 'Out of Stock Items',
                  value: inventoryItems.filter(i => i.is_out_of_stock).length,
                  color: '#DC2626'
                },
                {
                  label: 'Advance Orders Queue',
                  value: advanceOrders.filter(a => a.status === 'PENDING').length,
                  color: 'var(--color-maroon)'
                }
              ].map((card, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: '#ffffff',
                    padding: '20px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                  }}
                >
                  <p style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {card.label}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
                    <span style={{ fontSize: '1.7rem', fontWeight: 800, color: card.color }}>
                      {card.value}
                    </span>
                    {card.tag && (
                      <span style={{ fontSize: '0.7rem', backgroundColor: '#FEF3C7', color: '#B45309', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        {card.tag}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Operational Queues: IMPS Verification & Advance Orders */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Payment Verification Queue */}
              <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="var(--color-emerald)" />
                  <span>IMPS / NEFT Verification Queue</span>
                </h3>

                {orders.filter(o => o.payment_status === 'VERIFICATION_REQUIRED').length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#94A3B8' }}>All bank transfers reconciled.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {orders.filter(o => o.payment_status === 'VERIFICATION_REQUIRED').map(ord => (
                      <div key={ord.id} style={{ padding: '12px', backgroundColor: '#FFFBEB', borderRadius: '6px', border: '1px solid #FDE68A' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                          <span>{ord.order_number} ({ord.customer_name})</span>
                          <span>{formatINR(ord.total_amount)}</span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: '#92400E', marginTop: '2px' }}>
                          UTR: <strong>{ord.payment_reference || 'N/A'}</strong>
                        </p>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <button
                            onClick={() => handleVerifyPayment(ord.id, true)}
                            disabled={!canVerifyPayments}
                            style={{ padding: '4px 10px', backgroundColor: 'var(--color-emerald)', color: '#fff', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            Approve & Mark Paid
                          </button>
                          <button
                            onClick={() => handleVerifyPayment(ord.id, false)}
                            disabled={!canVerifyPayments}
                            style={{ padding: '4px 10px', backgroundColor: '#EF4444', color: '#fff', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Advance Orders Queue */}
              <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} color="var(--color-maroon)" />
                  <span>Advance Order Reservations</span>
                </h3>

                {advanceOrders.filter(a => a.status === 'PENDING').length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: '#94A3B8' }}>No pending reservations.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {advanceOrders.filter(a => a.status === 'PENDING').map(adv => (
                      <div key={adv.id} style={{ padding: '12px', backgroundColor: 'rgba(15, 95, 86, 0.05)', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700 }}>
                          <span>{adv.product_name}</span>
                          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{formatDateTime(adv.created_at)}</span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-emerald)', fontWeight: 600, marginTop: '2px' }}>
                          Variant: {adv.variant_details}
                        </p>
                        <p style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>
                          Customer: {adv.customer_name} ({adv.customer_phone})
                        </p>
                        <button
                          onClick={() => handleAdvanceOrderStatus(adv.id, 'ALLOCATED')}
                          style={{ marginTop: '8px', padding: '4px 10px', backgroundColor: 'var(--color-gold)', color: '#000', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}
                        >
                          Confirm Loom Allocation
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. CATALOG TAB */}
        {activeTab === 'catalog' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', color: '#0F172A', fontWeight: 800 }}>Catalog Management</h1>
                <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                  Configure products, fabrics, care instructions, variants, and pricing rules.
                </p>
              </div>

              <button
                id="btn-new-saree-weave"
                onClick={openNewProductModal}
                className="btn-primary"
              >
                <Plus size={16} />
                <span>+ Add Product / Article</span>
              </button>
            </div>

            {/* Products Table */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.06em' }}>
                  <tr>
                    <th style={{ padding: '14px 16px' }}>Product / Article</th>
                    <th style={{ padding: '14px 16px' }}>Category</th>
                    <th style={{ padding: '14px 16px' }}>Fabric & Care</th>
                    <th style={{ padding: '14px 16px' }}>Variants & Stock</th>
                    <th style={{ padding: '14px 16px' }}>Retail Price</th>
                    {canViewCostPrice && <th style={{ padding: '14px 16px', color: '#B45309' }}>Cost Price (Protected)</th>}
                    <th style={{ padding: '14px 16px' }}>Status</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const totalQty = p.variants?.reduce((sum, v) => sum + v.quantity, 0) || 0;
                    const minPrice = Math.min(...(p.variants?.map(v => v.sale_price || v.selling_price) || [0]));
                    const costPrice = p.variants?.[0]?.cost_price;

                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img
                              src={p.media?.[0]?.file_path || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=100&q=80'}
                              alt={p.name}
                              style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                            />
                            <div>
                              <strong style={{ color: '#0F172A', display: 'block' }}>{p.name}</strong>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{p.slug}</span>
                                {p.homepage_placement === 'HERO' && (
                                  <span style={{ fontSize: '0.68rem', backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                    ⭐ HERO Slide
                                  </span>
                                )}
                                {p.is_featured ? (
                                  <span style={{ fontSize: '0.68rem', backgroundColor: '#E0F2FE', color: '#0369A1', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                                    Featured
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#475569' }}>
                          {p.category_name || 'Sarees'}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#475569', maxWidth: '200px' }}>
                          <div>{p.fabric}</div>
                          <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{p.care_instructions?.substring(0, 40)}...</span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontWeight: 600, color: totalQty === 0 ? '#DC2626' : '#0F172A' }}>
                            {totalQty} units
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>
                            ({p.variants?.length} variants)
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F172A' }}>
                          {formatINR(minPrice)}
                        </td>
                        {canViewCostPrice && (
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: '#B45309' }}>
                            {costPrice ? formatINR(costPrice) : '—'}
                          </td>
                        )}
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: p.status === 'PUBLISHED' ? '#DCFCE7' : '#F1F5F9',
                              color: p.status === 'PUBLISHED' ? '#166534' : '#64748B'
                            }}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => openEditProductModal(p)}
                            style={{ padding: '4px 8px', color: 'var(--color-emerald)', fontWeight: 600 }}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. MEDIA TAB */}
        {activeTab === 'media' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', color: '#0F172A', fontWeight: 800 }}>Media Manager</h1>
                <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                  Upload product photos, set primary images, reorder gallery, and configure responsive crops.
                </p>
              </div>
            </div>

            {/* Product Selector */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px', backgroundColor: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>Select Product to Manage Photos:</label>
              <select
                value={selectedProductForMedia?.id || ''}
                onChange={e => {
                  const p = products.find(prod => prod.id === e.target.value);
                  if (p) setSelectedProductForMedia(p);
                }}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Photos Grid & Upload Form */}
            {selectedProductForMedia && (
              <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                    Gallery for: {selectedProductForMedia.name}
                  </h3>

                  {/* Upload input */}
                  <label className="btn-primary" style={{ cursor: 'pointer', fontSize: '0.82rem', padding: '8px 14px' }}>
                    <Upload size={15} />
                    <span>Upload Photos</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={async e => {
                        if (!e.target.files || e.target.files.length === 0) return;
                        const fd = new FormData();
                        fd.append('product_id', selectedProductForMedia.id);
                        fd.append('alt_text', `${selectedProductForMedia.name} photo`);
                        for (let i = 0; i < e.target.files.length; i++) {
                          fd.append('photos', e.target.files[i]);
                        }
                        try {
                          await apiRequest('/media/upload', { method: 'POST', body: fd });
                          showNotification('Photos uploaded successfully!');
                          loadData();
                        } catch (err: any) {
                          showNotification(err.message, 'error');
                        }
                      }}
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                  {selectedProductForMedia.media?.map((m, idx) => (
                    <div
                      key={m.id}
                      style={{
                        borderRadius: '8px',
                        border: m.is_primary ? '2px solid var(--color-gold)' : '1px solid #E2E8F0',
                        overflow: 'hidden',
                        position: 'relative'
                      }}
                    >
                      <img
                        src={m.file_path}
                        alt={m.alt_text}
                        style={{ width: '100%', height: '220px', objectFit: 'cover' }}
                      />

                      <div style={{ padding: '10px', backgroundColor: '#FAF7F2', fontSize: '0.78rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 700, color: m.is_primary ? 'var(--color-emerald)' : '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {m.is_primary ? '★ Primary Image' : `Photo #${idx + 1}`}
                          </span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {!m.is_primary && (
                              <button
                                type="button"
                                id={`btn-make-primary-${m.id}`}
                                onClick={() => handleSetPrimaryMedia(m.id)}
                                style={{
                                  color: '#ffffff',
                                  backgroundColor: 'var(--color-gold-dark)',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 9px',
                                  fontWeight: 700,
                                  fontSize: '0.72rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                                }}
                                title="Set as primary store display photo"
                              >
                                Make Primary
                              </button>
                            )}
                            <button
                              type="button"
                              id={`btn-delete-media-${m.id}`}
                              onClick={() => handleDeleteMedia(m.id)}
                              style={{
                                color: '#DC2626',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '3px',
                                display: 'flex',
                                alignItems: 'center',
                                borderRadius: '4px'
                              }}
                              title="Delete photo from gallery"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        <p style={{ color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          Alt: {m.alt_text || 'No alt text'}
                        </p>
                        <p style={{ color: '#94A3B8', fontSize: '0.7rem' }}>
                          Crops: Desktop {m.crop_desktop || '4:5'} • Mobile {m.crop_mobile || '1:1'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', color: '#0F172A', fontWeight: 800 }}>Inventory Matrix</h1>
                <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                  SKU-level stock balance, low-stock alerts, purchase receipts, and audit adjustments.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    resetNewArticleForm();
                    if (inventoryItems.length > 0) {
                      setReceiveModalItem(inventoryItems[0]);
                      setReceiveQuantity('10');
                      setReceivePoRef('');
                      setInventoryModalMode('RESTOCK_EXISTING');
                    } else {
                      setInventoryModalMode('ADD_NEW_ARTICLE');
                    }
                    setIsInventoryModalOpen(true);
                  }}
                  className="btn-primary"
                  id="btn-add-inventory-stock"
                >
                  <Plus size={16} />
                  <span>Add Inventory / Stock</span>
                </button>
              </div>
            </div>

            {/* Inventory Table */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: '36px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.06em' }}>
                  <tr>
                    <th style={{ padding: '14px 16px' }}>SKU</th>
                    <th style={{ padding: '14px 16px' }}>Product & Color</th>
                    <th style={{ padding: '14px 16px' }}>Stock Quantity</th>
                    <th style={{ padding: '14px 16px' }}>Low Stock Alert Threshold</th>
                    <th style={{ padding: '14px 16px' }}>Status</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryItems.map(item => (
                    <tr key={item.variant_id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--color-emerald)' }}>
                        {item.sku}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <strong>{item.product_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {item.color} • {item.size}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '1rem', fontWeight: 800, color: item.quantity === 0 ? '#DC2626' : '#0F172A' }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748B' }}>
                        ≤ {item.low_stock_threshold} units
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {item.quantity === 0 ? (
                          <span className="badge-out-of-stock">Out of Stock</span>
                        ) : item.is_low_stock ? (
                          <span className="badge-low-stock">Low Stock Warning</span>
                        ) : (
                          <span style={{ color: 'var(--color-emerald)', fontWeight: 600 }}>Healthy</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            resetNewArticleForm();
                            setReceiveModalItem(item);
                            setReceiveQuantity('10');
                            setReceivePoRef('');
                            setInventoryModalMode('RESTOCK_EXISTING');
                            setIsInventoryModalOpen(true);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            backgroundColor: 'var(--color-emerald)',
                            color: '#fff',
                            borderRadius: '4px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            marginRight: '8px',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                          id={`btn-receive-stock-${item.sku}`}
                          title={`Add stock to SKU ${item.sku}`}
                        >
                          <Plus size={13} />
                          <span>Add Stock</span>
                        </button>
                        <button
                          onClick={() => setAdjustModalItem(item)}
                          style={{ padding: '6px 10px', backgroundColor: '#E2E8F0', color: '#334155', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                          title={`Adjust or audit count for SKU ${item.sku}`}
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Inventory Movement Trail */}
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#0F172A' }}>
                Inventory Movement Audit Log
              </h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead style={{ backgroundColor: '#F8FAFC', color: '#64748B' }}>
                    <tr>
                      <th style={{ padding: '10px 12px' }}>Timestamp</th>
                      <th style={{ padding: '10px 12px' }}>SKU</th>
                      <th style={{ padding: '10px 12px' }}>Type</th>
                      <th style={{ padding: '10px 12px' }}>Change</th>
                      <th style={{ padding: '10px 12px' }}>Balance</th>
                      <th style={{ padding: '10px 12px' }}>Reason / Ref</th>
                      <th style={{ padding: '10px 12px' }}>Authorized By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map(m => (
                      <tr key={m.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '10px 12px', color: '#64748B' }}>{formatDateTime(m.created_at)}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>{m.sku}</td>
                        <td style={{ padding: '10px 12px' }}>{m.change_type}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: m.quantity_changed > 0 ? '#16A34A' : '#DC2626' }}>
                          {m.quantity_changed > 0 ? `+${m.quantity_changed}` : m.quantity_changed}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>{m.quantity_after}</td>
                        <td style={{ padding: '10px 12px', color: '#475569' }}>{m.reference_note}</td>
                        <td style={{ padding: '10px 12px', color: '#64748B' }}>{m.actor_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. SALES TAB */}
        {activeTab === 'sales' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', color: '#0F172A', fontWeight: 800 }}>Sales & Campaigns</h1>
                <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                  Schedule festive sales, set discount percentages, configure From / To dates, and manage offer visibility.
                </p>
              </div>

              <button
                onClick={handleOpenNewCampaign}
                className="btn-primary"
              >
                <Plus size={16} />
                <span>New Campaign</span>
              </button>
            </div>

            {campaigns.length === 0 ? (
              <div style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '10px', textAlign: 'center', border: '1px solid #E2E8F0', color: '#64748B' }}>
                <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '8px' }}>No campaigns scheduled yet.</p>
                <p style={{ fontSize: '0.85rem', marginBottom: '16px' }}>Launch a festive campaign with From and To dates to highlight special offers on your storefront.</p>
                <button onClick={handleOpenNewCampaign} className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                  Create Festive Campaign
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                {campaigns.map(camp => {
                  const nowTime = Date.now();
                  const startTime = new Date(camp.start_at).getTime();
                  const endTime = new Date(camp.end_at).getTime();

                  let statusText = 'ACTIVE NOW';
                  let statusBg = '#DCFCE7';
                  let statusColor = '#166534';
                  let statusBorder = '#BBF7D0';

                  if (!camp.is_active) {
                    statusText = 'DISABLED / PAUSED';
                    statusBg = '#F1F5F9';
                    statusColor = '#475569';
                    statusBorder = '#CBD5E1';
                  } else if (nowTime < startTime) {
                    statusText = 'UPCOMING';
                    statusBg = '#EFF6FF';
                    statusColor = '#1D4ED8';
                    statusBorder = '#BFDBFE';
                  } else if (nowTime > endTime) {
                    statusText = 'ENDED / EXPIRED';
                    statusBg = '#FEF2F2';
                    statusColor = '#991B1B';
                    statusBorder = '#FECACA';
                  }

                  return (
                    <div
                      key={camp.id}
                      style={{
                        backgroundColor: '#ffffff',
                        padding: '20px',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span className="badge-festive">{camp.label}</span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              backgroundColor: statusBg,
                              color: statusColor,
                              border: `1px solid ${statusBorder}`,
                              fontWeight: 700,
                              letterSpacing: '0.03em'
                            }}
                          >
                            {statusText}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                          {camp.name}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '14px', lineHeight: 1.5 }}>
                          {camp.description || 'No description provided.'}
                        </p>

                        <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.8rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748B' }}>Discount:</span>
                            <strong style={{ color: 'var(--color-emerald)' }}>{camp.discount_percentage}% OFF</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#64748B' }}>Countdown Timer:</span>
                            <span style={{ fontWeight: 600 }}>{camp.show_countdown ? 'Enabled on Home' : 'Disabled'}</span>
                          </div>
                          <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: '6px', marginTop: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0F172A', fontWeight: 600, fontSize: '0.76rem', marginBottom: '3px' }}>
                              <Calendar size={13} color="var(--color-emerald)" />
                              <span>Scheduled Date Window:</span>
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#475569', paddingLeft: '19px' }}>
                              <div>From: <strong>{formatDateTime(camp.start_at)}</strong></div>
                              <div>To: <strong>{formatDateTime(camp.end_at)}</strong></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Campaign Action Toolbar */}
                      <div style={{ paddingTop: '12px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenEditCampaign(camp)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#ffffff',
                              color: '#0F172A',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                            title="Edit campaign dates, discount, and details"
                          >
                            <Edit2 size={13} color="var(--color-emerald)" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleToggleCampaignStatus(camp)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: camp.is_active ? '1px solid #FECACA' : '1px solid #BBF7D0',
                              backgroundColor: camp.is_active ? '#FFF5F5' : '#F0FDF4',
                              color: camp.is_active ? '#B91C1C' : '#15803D',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            title={camp.is_active ? 'Disable campaign (Hides offer from hero and home page)' : 'Enable campaign (Displays offer on storefront)'}
                          >
                            {camp.is_active ? <PauseCircle size={13} /> : <PlayCircle size={13} />}
                            <span>{camp.is_active ? 'Disable' : 'Enable'}</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleDeleteCampaign(camp)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: '#94A3B8',
                            cursor: 'pointer'
                          }}
                          title="Delete campaign"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 6. ORDERS TAB */}
        {activeTab === 'orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', color: '#0F172A', fontWeight: 800 }}>Orders & Fulfillment</h1>
                <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                  Update order milestones, verify IMPS references, and process returns.
                </p>
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.06em' }}>
                  <tr>
                    <th style={{ padding: '14px 16px' }}>Order #</th>
                    <th style={{ padding: '14px 16px' }}>Customer & Address</th>
                    <th style={{ padding: '14px 16px' }}>Distance</th>
                    <th style={{ padding: '14px 16px' }}>Total Amount</th>
                    <th style={{ padding: '14px 16px' }}>Payment Status</th>
                    <th style={{ padding: '14px 16px' }}>Fulfillment Status</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                        <span style={{ color: 'var(--color-emerald)' }}>{o.order_number}</span>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{formatDateTime(o.created_at)}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <strong>{o.customer_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{o.delivery_address}</div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748B' }}>
                        {o.distance_km} km
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 800 }}>
                        {formatINR(o.total_amount)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            backgroundColor:
                              o.payment_status === 'PAID' ? '#DCFCE7' :
                              o.payment_status === 'VERIFICATION_REQUIRED' ? '#FEF3C7' : '#FEE2E2',
                            color:
                              o.payment_status === 'PAID' ? '#166534' :
                              o.payment_status === 'VERIFICATION_REQUIRED' ? '#92400E' : '#991B1B'
                          }}
                        >
                          {o.payment_status}
                        </span>
                        {o.payment_reference && (
                          <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '2px' }}>
                            Ref: {o.payment_reference}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <select
                          value={o.status}
                          disabled={!canVerifyPayments}
                          onChange={async e => {
                            const newStatus = e.target.value as OrderStatus;
                            try {
                              await apiRequest(`/orders/${o.id}/status`, {
                                method: 'PUT',
                                body: JSON.stringify({ status: newStatus })
                              });
                              showNotification(`Order ${o.order_number} updated to ${newStatus}`);
                              loadData();
                            } catch (err: any) {
                              showNotification(err.message, 'error');
                            }
                          }}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'].map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {o.payment_status === 'VERIFICATION_REQUIRED' && canVerifyPayments && (
                          <button
                            onClick={() => handleVerifyPayment(o.id, true)}
                            style={{ padding: '4px 8px', backgroundColor: 'var(--color-emerald)', color: '#fff', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}
                          >
                            Verify IMPS
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. ADVANCE ORDERS TAB */}
        {activeTab === 'advance-orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', color: '#0F172A', fontWeight: 800 }}>Advance Orders Queue</h1>
                <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                  Client reservation requests for out-of-stock heirloom drapes on master looms.
                </p>
              </div>
            </div>

            <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', textTransform: 'uppercase', fontSize: '0.72rem' }}>
                  <tr>
                    <th style={{ padding: '14px 16px' }}>Date</th>
                    <th style={{ padding: '14px 16px' }}>Reserved Saree</th>
                    <th style={{ padding: '14px 16px' }}>Client Details</th>
                    <th style={{ padding: '14px 16px' }}>Weaving / Blouse Notes</th>
                    <th style={{ padding: '14px 16px' }}>Status</th>
                    <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {advanceOrders.map(adv => (
                    <tr key={adv.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 16px', color: '#64748B' }}>{formatDateTime(adv.created_at)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <strong>{adv.product_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-emerald)', fontWeight: 600 }}>{adv.variant_details}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <strong>{adv.customer_name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{adv.customer_phone}</div>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#475569', maxWidth: '240px' }}>
                        {adv.notes || '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: adv.status === 'ALLOCATED' ? '#DCFCE7' : '#FEF3C7', color: adv.status === 'ALLOCATED' ? '#166534' : '#92400E' }}>
                          {adv.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        {adv.status === 'PENDING' && (
                          <button
                            onClick={() => handleAdvanceOrderStatus(adv.id, 'ALLOCATED')}
                            className="btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          >
                            Allocate Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 8. SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', color: '#0F172A', fontWeight: 800 }}>Store Settings & Tickers</h1>
                <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
                  Brand name customization (no code changes), boutique address, delivery radius, and announcement ticker.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
              {/* Brand & Boutique Configuration */}
              <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', color: '#0F172A' }}>
                  Configurable Brand & Boutique Identity
                </h3>

                <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                      Brand Name (Changes Entire App Instantly) *
                    </label>
                    <input
                      type="text"
                      required
                      value={brandNameInput}
                      onChange={e => setBrandNameInput(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.92rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                      Brand Tagline
                    </label>
                    <input
                      type="text"
                      value={taglineInput}
                      onChange={e => setTaglineInput(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.92rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                      Boutique Physical Address
                    </label>
                    <textarea
                      rows={2}
                      value={shopAddressInput}
                      onChange={e => setShopAddressInput(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                        Delivery Radius Limit (km)
                      </label>
                      <input
                        type="number"
                        value={deliveryRadiusInput}
                        onChange={e => setDeliveryRadiusInput(parseFloat(e.target.value))}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.92rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px' }}>
                        COD Payment
                      </label>
                      <select
                        value={codEnabledInput ? '1' : '0'}
                        onChange={e => setCodEnabledInput(e.target.value === '1')}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.92rem' }}
                      >
                        <option value="1">Enabled</option>
                        <option value="0">Disabled by Super Admin</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                    <input
                      type="checkbox"
                      id="bundleToggle"
                      checked={offer2Plus1Input}
                      onChange={e => setOffer2Plus1Input(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--color-emerald)' }}
                    />
                    <label htmlFor="bundleToggle" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      Enable 2 + 1 Festive Bundle Promotion Engine (with Server Cost Protections)
                    </label>
                  </div>

                  <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>
                    Save Brand Settings
                  </button>
                </form>
              </div>

              {/* Ticker Management */}
              <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A' }}>
                    Homepage Ticker Messages
                  </h3>
                  <button onClick={() => setIsNewTickerModalOpen(true)} className="btn-outline" style={{ fontSize: '0.78rem', padding: '6px 10px' }}>
                    <Plus size={14} />
                    <span>Add Message</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {tickerList.map(t => (
                    <div key={t.id} style={{ padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.82rem' }}>
                      <p style={{ fontWeight: 600, color: '#0F172A' }}>{t.content}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', color: '#64748B', fontSize: '0.75rem' }}>
                        <span>Sort: {t.sort_order}</span>
                        <button
                          onClick={async () => {
                            await apiRequest(`/ticker/${t.id}`, { method: 'DELETE' });
                            showNotification('Ticker message deleted');
                            loadData();
                            refreshTicker();
                          }}
                          style={{ color: '#DC2626' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Inventory / Stock Modal (Dual Mode: Restock Existing or Add New Article) */}
      {isInventoryModalOpen && (
        <div className="modal-overlay" onClick={() => setIsInventoryModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '660px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--color-emerald)' }}>
                  Inventory Intake & Restock
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '4px 0 0 0' }}>
                  Restock existing catalogue articles or intake brand new saree SKUs directly into warehouse inventory.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsInventoryModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: '4px' }}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Dual Mode Switcher Tabs */}
            <div style={{ display: 'flex', gap: '8px', padding: '4px', backgroundColor: '#F1F5F9', borderRadius: '8px', marginBottom: '20px' }}>
              <button
                type="button"
                id="tab-inventory-restock-existing"
                onClick={() => setInventoryModalMode('RESTOCK_EXISTING')}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: inventoryModalMode === 'RESTOCK_EXISTING' ? '#ffffff' : 'transparent',
                  color: inventoryModalMode === 'RESTOCK_EXISTING' ? 'var(--color-emerald)' : '#64748B',
                  boxShadow: inventoryModalMode === 'RESTOCK_EXISTING' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <span>📦 Restock Existing Article</span>
                <span style={{ fontSize: '0.72rem', backgroundColor: inventoryModalMode === 'RESTOCK_EXISTING' ? 'rgba(15,95,86,0.12)' : '#E2E8F0', color: inventoryModalMode === 'RESTOCK_EXISTING' ? 'var(--color-emerald)' : '#64748B', padding: '2px 8px', borderRadius: '10px' }}>
                  {inventoryItems.length} SKUs
                </span>
              </button>

              <button
                type="button"
                id="tab-inventory-add-new-article"
                onClick={() => setInventoryModalMode('ADD_NEW_ARTICLE')}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: inventoryModalMode === 'ADD_NEW_ARTICLE' ? '#ffffff' : 'transparent',
                  color: inventoryModalMode === 'ADD_NEW_ARTICLE' ? 'var(--color-emerald)' : '#64748B',
                  boxShadow: inventoryModalMode === 'ADD_NEW_ARTICLE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                <span>✨ + Add New Article / SKU</span>
              </button>
            </div>

            {/* TAB 1: RESTOCK EXISTING ARTICLE */}
            {inventoryModalMode === 'RESTOCK_EXISTING' && (
              <div>
                {inventoryItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
                    <p style={{ color: '#475569', fontWeight: 600, marginBottom: '12px' }}>
                      No articles exist in the catalog yet.
                    </p>
                    <button
                      type="button"
                      onClick={() => setInventoryModalMode('ADD_NEW_ARTICLE')}
                      className="btn-primary"
                      style={{ fontSize: '0.85rem' }}
                    >
                      <Plus size={15} />
                      <span>Add Your First Saree Article Now</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#0F172A' }}>
                        Select Saree SKU to Restock *
                      </label>
                      <select
                        value={receiveModalItem ? receiveModalItem.variant_id : (inventoryItems[0]?.variant_id || '')}
                        onChange={e => {
                          const found = inventoryItems.find(i => i.variant_id === e.target.value);
                          if (found) setReceiveModalItem(found);
                        }}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', backgroundColor: '#fff' }}
                      >
                        {inventoryItems.map(item => (
                          <option key={item.variant_id} value={item.variant_id}>
                            {item.sku} — {item.product_name} ({item.color}) • Current: {item.quantity} units
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#0F172A' }}>
                        Quantity to Add (Units) * <span style={{ fontWeight: 400, color: '#64748B' }}>(1 to ∞, strictly non-negative)</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        id="input-receive-stock-qty"
                        value={receiveQuantity}
                        onKeyDown={e => {
                          if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setReceiveQuantity(val);
                        }}
                        placeholder="e.g. 10, 50, 250, 1000..."
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.95rem', fontWeight: 700 }}
                      />
                      {receiveModalItem && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap', gap: '4px' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-emerald)', fontWeight: 700 }}>
                            Current Stock: {receiveModalItem.quantity} units ➔ New Balance: {(receiveModalItem.quantity || 0) + (parseInt(receiveQuantity, 10) || 0)} units
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                            Uncapped addition (1 to ∞ units). Negative values strictly blocked.
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#0F172A' }}>
                        PO / Master Weaver Restock Delivery Reference (Optional)
                      </label>
                      <input
                        type="text"
                        value={receivePoRef}
                        onChange={e => setReceivePoRef(e.target.value)}
                        placeholder="e.g. Varanasi Loom Restock PO-8821 / Master Weaver Delivery"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '14px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                      <button type="button" onClick={() => setIsInventoryModalOpen(false)} className="btn-outline" style={{ flex: 1 }}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        id="btn-confirm-restock"
                        onClick={handleReceiveStock}
                        className="btn-primary"
                        style={{ flex: 1.6, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700 }}
                      >
                        <CheckCircle size={18} />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ADD NEW ARTICLE / SKU */}
            {inventoryModalMode === 'ADD_NEW_ARTICLE' && (
              <form onSubmit={handleAddNewArticleFromInventory} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px', color: '#0F172A' }}>
                      Article / Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      id="input-new-article-name"
                      value={newArticleForm.name}
                      onChange={e => setNewArticleForm({ ...newArticleForm, name: e.target.value })}
                      placeholder="e.g. Surat Embroidered Dress / Banarasi Silk Saree"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px', color: '#0F172A' }}>
                      SKU Code *
                    </label>
                    <input
                      type="text"
                      required
                      id="input-new-article-sku"
                      value={newArticleForm.sku}
                      onChange={e => setNewArticleForm({ ...newArticleForm, sku: e.target.value.toUpperCase() })}
                      placeholder="e.g. BK-KAT-108"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px', color: '#0F172A' }}>
                      Category *
                    </label>
                    <select
                      value={newArticleForm.category_id}
                      onChange={e => setNewArticleForm({ ...newArticleForm, category_id: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', backgroundColor: '#fff' }}
                    >
                      <option value="cat-sarees">Sarees</option>
                      <option value="cat-punjabi">Punjabi Dresses</option>
                      <option value="cat-children">Children</option>
                      <option value="cat-kurti">Kurti</option>
                      <option value="cat-lehenga">Lehenga</option>
                      <option value="cat-salwar">Salwar Suit</option>
                      <option value="cat-mens">Men's Ethnic</option>
                      <option value="cat-accessories">Accessories</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px', color: '#0F172A' }}>
                      Fabric Specifications *
                    </label>
                    <input
                      type="text"
                      required
                      value={newArticleForm.fabric}
                      onChange={e => setNewArticleForm({ ...newArticleForm, fabric: e.target.value })}
                      placeholder="e.g. Pure Mulberry Silk with 2G Gold Zari"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px', color: '#0F172A' }}>
                      Color Name & Swatch *
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={newArticleForm.color_code}
                        onChange={e => setNewArticleForm({ ...newArticleForm, color_code: e.target.value })}
                        style={{ width: '40px', height: '38px', borderRadius: '4px', border: '1px solid #CBD5E1', cursor: 'pointer', padding: '2px' }}
                      />
                      <input
                        type="text"
                        required
                        value={newArticleForm.color}
                        onChange={e => setNewArticleForm({ ...newArticleForm, color: e.target.value })}
                        placeholder="e.g. Royal Emerald Green"
                        style={{ flex: 1, padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px', color: '#0F172A' }}>
                      Size / Cut
                    </label>
                    <input
                      type="text"
                      value={newArticleForm.size}
                      onChange={e => setNewArticleForm({ ...newArticleForm, size: e.target.value })}
                      placeholder="Free Size (6.3m with blouse)"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px', color: '#0F172A' }}>
                      Cost Price (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={newArticleForm.cost_price}
                      onChange={e => setNewArticleForm({ ...newArticleForm, cost_price: e.target.value })}
                      placeholder="e.g. 6500"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px', color: '#0F172A' }}>
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={newArticleForm.selling_price}
                      onChange={e => setNewArticleForm({ ...newArticleForm, selling_price: e.target.value })}
                      placeholder="e.g. 11999"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700 }}
                    />
                  </div>
                </div>

                {/* Stock Quantity (1 to Infinity, strictly non-negative) & Low Stock Alert */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px', color: 'var(--color-emerald)' }}>
                      Initial Stock Quantity (Units) * (1 to ∞)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      id="input-new-article-stock-qty"
                      value={newArticleForm.quantity}
                      onKeyDown={e => {
                        if (['-', '+', 'e', 'E', '.'].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setNewArticleForm({ ...newArticleForm, quantity: val });
                      }}
                      placeholder="e.g. 10, 50, 500..."
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-emerald)' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginTop: '3px' }}>
                      No upper limit (1 to ∞). Negative stock is strictly blocked.
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px', color: '#0F172A' }}>
                      Low Stock Threshold (Units)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newArticleForm.low_stock_threshold}
                      onChange={e => setNewArticleForm({ ...newArticleForm, low_stock_threshold: e.target.value })}
                      placeholder="2"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginTop: '3px' }}>
                      Alert when stock falls to or below this.
                    </span>
                  </div>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: '#0F172A' }}>
                    📸 Article Photography <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#64748B' }}>(Upload file or paste link)</span>
                  </label>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <input
                      ref={fileInputArticleRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadPhotoFile(file, 'newArticle');
                      }}
                    />
                    <button
                      type="button"
                      disabled={isUploadingPhoto}
                      onClick={() => fileInputArticleRef.current?.click()}
                      className="btn-primary"
                      style={{
                        padding: '7px 12px',
                        fontSize: '0.78rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'var(--color-emerald)',
                        color: '#fff',
                        cursor: isUploadingPhoto ? 'wait' : 'pointer'
                      }}
                    >
                      <Upload size={14} />
                      <span>{isUploadingPhoto ? 'Uploading from device...' : '📁 Upload Photo from Computer'}</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>Presets:</span>
                    <button
                      type="button"
                      onClick={() => setNewArticleForm({ ...newArticleForm, photo_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80' })}
                      style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#fff', cursor: 'pointer' }}
                    >
                      👗 Dress
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewArticleForm({ ...newArticleForm, photo_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80' })}
                      style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#fff', cursor: 'pointer' }}
                    >
                      🥻 Saree
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewArticleForm({ ...newArticleForm, photo_url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80' })}
                      style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#fff', cursor: 'pointer' }}
                    >
                      ✨ Kurti
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewArticleForm({ ...newArticleForm, photo_url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1000&q=80' })}
                      style={{ fontSize: '0.7rem', padding: '2px 7px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#fff', cursor: 'pointer' }}
                    >
                      💃 Lehenga
                    </button>
                  </div>

                  <input
                    type="text"
                    value={newArticleForm.photo_url}
                    onChange={e => setNewArticleForm({ ...newArticleForm, photo_url: e.target.value })}
                    placeholder="Or enter image URL (https://...) - Optional"
                    style={{ width: '100%', padding: '7px 10px', borderRadius: '5px', border: '1px solid #CBD5E1', fontSize: '0.8rem', backgroundColor: '#fff' }}
                  />

                  {newArticleForm.photo_url && (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: '#fff', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img
                          src={newArticleForm.photo_url}
                          alt="Preview"
                          style={{ width: '38px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #CBD5E1' }}
                          onError={e => { (e.target as any).style.display = 'none'; }}
                        />
                        <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 600 }}>✓ Photo Selected</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNewArticleForm({ ...newArticleForm, photo_url: '' })}
                        style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                  <button type="button" onClick={() => setIsInventoryModalOpen(false)} className="btn-outline" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="btn-submit-new-article"
                    className="btn-primary"
                    style={{ flex: 1.8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700 }}
                  >
                    <CheckCircle size={18} />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustModalItem && (
        <div className="modal-overlay" onClick={() => setAdjustModalItem(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Manual Stock Adjustment</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '16px' }}>
              Adjusting SKU: <strong>{adjustModalItem.sku}</strong>. Current quantity: {adjustModalItem.quantity}.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Quantity Change (Positive or Negative)</label>
                <input
                  type="number"
                  value={adjustQtyChange}
                  onChange={e => setAdjustQtyChange(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Mandatory Audit Reason *</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="e.g. Zari tarnished on counter display"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button onClick={() => setAdjustModalItem(null)} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button onClick={handleAdjustStock} className="btn-primary" style={{ flex: 1 }}>Save Adjustment</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Modal */}
      {isAuditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAuditModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', padding: '28px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '16px' }}>System Mutation Audit Trail</h3>
            <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#F8FAFC', color: '#64748B' }}>
                  <tr>
                    <th style={{ padding: '8px 10px' }}>Timestamp</th>
                    <th style={{ padding: '8px 10px' }}>Actor</th>
                    <th style={{ padding: '8px 10px' }}>Role</th>
                    <th style={{ padding: '8px 10px' }}>Entity</th>
                    <th style={{ padding: '8px 10px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '8px 10px', color: '#64748B' }}>{formatDateTime(log.timestamp)}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 700 }}>{log.actor_name}</td>
                      <td style={{ padding: '8px 10px' }}>{log.actor_role}</td>
                      <td style={{ padding: '8px 10px', color: 'var(--color-emerald)', fontWeight: 600 }}>{log.entity}</td>
                      <td style={{ padding: '8px 10px' }}>{log.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => setIsAuditModalOpen(false)} className="btn-primary" style={{ marginTop: '20px', width: '100%' }}>
              Close Audit Trail
            </button>
          </div>
        </div>
      )}

      {/* Add Ticker Modal */}
      {isNewTickerModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewTickerModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Add Homepage Announcement</h3>
            <form
              onSubmit={async e => {
                e.preventDefault();
                const form = e.target as any;
                const content = form.content.value;
                try {
                  await apiRequest('/ticker', {
                    method: 'POST',
                    body: JSON.stringify({ content, sort_order: 1 })
                  });
                  showNotification('Ticker message added!');
                  setIsNewTickerModalOpen(false);
                  loadData();
                  refreshTicker();
                } catch (err: any) {
                  showNotification(err.message, 'error');
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>Message Content *</label>
                <input
                  name="content"
                  required
                  placeholder="e.g. 🌟 Limited Festive Offer: Flat 20% on Handloom Banarasi Weaves"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsNewTickerModalOpen(false)} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Add to Ticker</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Create / Edit Modal */}
      {isProductModalOpen && (
        <div className="modal-overlay" onClick={() => setIsProductModalOpen(false)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '820px', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-emerald)', fontFamily: 'Cinzel, serif' }}>
                  {editingProduct ? 'Edit Product Details' : 'Add New Product'}
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748B' }}>
                  Configure product specifications, pricing safeguards, fabric details, and photography visuals.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Product Basic Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                    Product / Article Name *
                  </label>
                  <input
                    type="text"
                    required
                    id="input-product-name"
                    value={productFormData.name}
                    onChange={e => setProductFormData({ ...productFormData, name: e.target.value })}
                    placeholder="e.g. Surat Embroidered Dress / Banarasi Silk Saree"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                    Category *
                  </label>
                  <select
                    id="select-product-category"
                    value={productFormData.category_id}
                    onChange={e => setProductFormData({ ...productFormData, category_id: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', backgroundColor: '#fff' }}
                  >
                    <option value="cat-sarees">Sarees</option>
                    <option value="cat-punjabi">Punjabi Dresses</option>
                    <option value="cat-children">Children</option>
                    <option value="cat-kurti">Kurti</option>
                    <option value="cat-lehenga">Lehenga</option>
                    <option value="cat-salwar">Salwar Suit</option>
                    <option value="cat-mens">Men's Ethnic</option>
                    <option value="cat-accessories">Accessories</option>
                  </select>
                </div>
              </div>

              {/* Fabric & Care */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                    Fabric Specifications *
                  </label>
                  <input
                    type="text"
                    required
                    id="input-product-fabric"
                    value={productFormData.fabric}
                    onChange={e => setProductFormData({ ...productFormData, fabric: e.target.value })}
                    placeholder="e.g. Pure Handloom Mulberry Silk with Kadwa Gold Zari"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                    Care Instructions *
                  </label>
                  <input
                    type="text"
                    required
                    id="input-product-care"
                    value={productFormData.care_instructions}
                    onChange={e => setProductFormData({ ...productFormData, care_instructions: e.target.value })}
                    placeholder="e.g. Dry clean only. Store wrapped in soft unbleached muslin..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                  Product Story & Drape Description
                </label>
                <textarea
                  rows={3}
                  id="input-product-description"
                  value={productFormData.description}
                  onChange={e => setProductFormData({ ...productFormData, description: e.target.value })}
                  placeholder="Describe the artisan craft, loom heritage, motifs, pallu, and blouse piece details..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', resize: 'vertical' }}
                />
              </div>

              {/* Variant Specs */}
              <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', marginBottom: '12px' }}>
                  Primary Variant & Inventory Details
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      SKU Code *
                    </label>
                    <input
                      type="text"
                      required
                      id="input-product-sku"
                      value={productFormData.sku}
                      onChange={e => setProductFormData({ ...productFormData, sku: e.target.value })}
                      placeholder="e.g. BK-KAT-105"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Color Name
                    </label>
                    <input
                      type="text"
                      value={productFormData.color}
                      onChange={e => setProductFormData({ ...productFormData, color: e.target.value })}
                      placeholder="e.g. Royal Maroon"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Color Swatch
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        value={productFormData.color_code}
                        onChange={e => setProductFormData({ ...productFormData, color_code: e.target.value })}
                        style={{ width: '38px', height: '34px', padding: '2px', borderRadius: '4px', border: '1px solid #CBD5E1', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.78rem', color: '#64748B' }}>{productFormData.color_code}</span>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Size / Drape Length
                    </label>
                    <input
                      type="text"
                      value={productFormData.size}
                      onChange={e => setProductFormData({ ...productFormData, size: e.target.value })}
                      placeholder="Free Size (6.3m)"
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                {/* Pricing with Safeguards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '10px', padding: '14px', backgroundColor: '#FEF3C7', borderRadius: '6px', border: '1px solid #FCD34D' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#92400E', marginBottom: '4px' }}>
                      Cost Price (₹) [Protected] *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      id="input-product-cost-price"
                      value={productFormData.cost_price}
                      onChange={e => setProductFormData({ ...productFormData, cost_price: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #D97706', fontSize: '0.85rem', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#065F46', marginBottom: '4px' }}>
                      Retail Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1"
                      id="input-product-selling-price"
                      value={productFormData.selling_price}
                      onChange={e => setProductFormData({ ...productFormData, selling_price: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #10B981', fontSize: '0.85rem', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#1E40AF', marginBottom: '4px' }}>
                      Festive Sale Price (₹) [Optional]
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="e.g. 12999"
                      id="input-product-sale-price"
                      value={productFormData.sale_price}
                      onChange={e => setProductFormData({ ...productFormData, sale_price: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #60A5FA', fontSize: '0.85rem', fontWeight: 700 }}
                    />
                  </div>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#B45309', marginBottom: '14px' }}>
                  🛡️ <strong>Automated Margin Safeguard:</strong> System strictly enforces that Selling Price and Festive Sale Price cannot fall below Cost Price.
                </p>

                {/* Stock Quantities (for new product) */}
                {!editingProduct && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Initial Stock Quantity (Units) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        id="input-product-quantity"
                        value={productFormData.quantity}
                        onChange={e => setProductFormData({ ...productFormData, quantity: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Low Stock Alert Threshold
                      </label>
                      <input
                        type="number"
                        min="1"
                        id="input-product-threshold"
                        value={productFormData.low_stock_threshold}
                        onChange={e => setProductFormData({ ...productFormData, low_stock_threshold: e.target.value })}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Photo and Placement */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1.3fr', gap: '14px' }}>
                <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
                    📸 Primary Product Photo <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#64748B' }}>(Upload file or paste link)</span>
                  </label>

                  {/* Direct File Upload Button */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                    <input
                      ref={fileInputProductRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadPhotoFile(file, 'product');
                      }}
                    />
                    <button
                      type="button"
                      disabled={isUploadingPhoto}
                      onClick={() => fileInputProductRef.current?.click()}
                      className="btn-primary"
                      style={{
                        padding: '8px 14px',
                        fontSize: '0.8rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'var(--color-emerald)',
                        color: '#fff',
                        cursor: isUploadingPhoto ? 'wait' : 'pointer'
                      }}
                    >
                      <Upload size={15} />
                      <span>{isUploadingPhoto ? 'Uploading from device...' : '📁 Upload Photo from Computer'}</span>
                    </button>
                  </div>

                  {/* Quick Preset Samples */}
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Quick Samples:</span>
                    <button
                      type="button"
                      onClick={() => setProductFormData({ ...productFormData, photo_url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80' })}
                      style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#fff', cursor: 'pointer' }}
                    >
                      👗 Dress
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductFormData({ ...productFormData, photo_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80' })}
                      style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#fff', cursor: 'pointer' }}
                    >
                      🥻 Saree
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductFormData({ ...productFormData, photo_url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80' })}
                      style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#fff', cursor: 'pointer' }}
                    >
                      ✨ Kurti
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductFormData({ ...productFormData, photo_url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1000&q=80' })}
                      style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '4px', border: '1px solid #CBD5E1', background: '#fff', cursor: 'pointer' }}
                    >
                      💃 Lehenga
                    </button>
                  </div>

                  {/* URL Text Input (Optional) */}
                  <input
                    type="text"
                    id="input-product-photo"
                    value={productFormData.photo_url}
                    onChange={e => setProductFormData({ ...productFormData, photo_url: e.target.value })}
                    placeholder="Or enter image URL (https://...) - Optional"
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8rem', backgroundColor: '#fff' }}
                  />

                  {/* Photo Preview */}
                  {productFormData.photo_url && (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#fff', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={productFormData.photo_url}
                          alt="Preview"
                          style={{ width: '45px', height: '55px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #CBD5E1' }}
                          onError={e => { (e.target as any).style.display = 'none'; }}
                        />
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', display: 'block' }}>✓ Photo Active</span>
                          <span style={{ fontSize: '0.7rem', color: '#64748B', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                            {productFormData.photo_url}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProductFormData({ ...productFormData, photo_url: '' })}
                        style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, padding: '4px 8px' }}
                      >
                        Clear
                      </button>
                    </div>
                  )}
                  <p style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '6px', marginBottom: 0 }}>
                    💡 Tip: If left blank, a default elegant photography will be used automatically. You can also manage additional angles anytime in the Media & Gallery tab.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                      Homepage Placement
                    </label>
                    <select
                      id="select-product-placement"
                      value={productFormData.homepage_placement}
                      onChange={e => setProductFormData({ ...productFormData, homepage_placement: e.target.value as any })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', backgroundColor: '#fff' }}
                    >
                      <option value="HERO">⭐ HERO (Top Banner Category Slide)</option>
                      <option value="FEATURED">FEATURED (Curated Edit)</option>
                      <option value="NEW_ARRIVAL">NEW_ARRIVAL (Latest Weaves)</option>
                      <option value="NONE">NONE (Standard Catalog)</option>
                    </select>
                    <p style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '4px', marginBottom: 0 }}>
                      ⭐ Products set to <strong>HERO</strong> automatically slide on the top banner for their category.
                    </p>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                      Publish Status
                    </label>
                    <select
                      id="select-product-status"
                      value={productFormData.status}
                      onChange={e => setProductFormData({ ...productFormData, status: e.target.value as any })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', backgroundColor: '#fff' }}
                    >
                      <option value="PUBLISHED">PUBLISHED (Visible to Customers)</option>
                      <option value="DRAFT">DRAFT (Internal Review)</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Festive / Curated Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#0F172A' }}>
                  <input
                    type="checkbox"
                    checked={productFormData.is_featured}
                    onChange={e => setProductFormData({ ...productFormData, is_featured: e.target.checked })}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span>Feature in Curated Boutique Collection</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="btn-outline"
                  style={{ padding: '10px 20px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  id="btn-save-product"
                  style={{ padding: '10px 24px', backgroundColor: 'var(--color-emerald)', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700 }}
                >
                  <CheckCircle size={18} />
                  <span>{editingProduct ? 'Save Changes' : 'Save & Publish Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Campaign Create & Edit Modal */}
      {isNewCampaignModalOpen && (
        <div className="modal-overlay" onClick={() => { setIsNewCampaignModalOpen(false); setEditingCampaign(null); }}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '580px', padding: '28px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-emerald)', fontFamily: 'Cinzel, serif' }}>
                  {editingCampaign ? 'Edit Festive Campaign' : 'Create Festive Campaign'}
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748B' }}>
                  {editingCampaign ? 'Update campaign schedule, celebratory discounts, and storefront visibility.' : 'Schedule promotional campaigns, date windows, and celebratory discounts.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setIsNewCampaignModalOpen(false); setEditingCampaign(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                  Campaign Name *
                </label>
                <input
                  type="text"
                  required
                  value={campaignFormData.name}
                  onChange={e => setCampaignFormData({ ...campaignFormData, name: e.target.value })}
                  placeholder="e.g. Navratri Silk Utsav"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                    Badge Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={campaignFormData.label}
                    onChange={e => setCampaignFormData({ ...campaignFormData, label: e.target.value })}
                    placeholder="e.g. Festive edit"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                    Discount (%) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    required
                    value={campaignFormData.discount_percentage}
                    onChange={e => setCampaignFormData({ ...campaignFormData, discount_percentage: e.target.value })}
                    placeholder="e.g. 15"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              {/* From Date & To Date Scheduling */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                    From Date (Campaign Start) *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={campaignFormData.start_at}
                    onChange={e => setCampaignFormData({ ...campaignFormData, start_at: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginTop: '2px' }}>Offer activates on this date</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                    To Date (Campaign End) *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={campaignFormData.end_at}
                    onChange={e => setCampaignFormData({ ...campaignFormData, end_at: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block', marginTop: '2px' }}>Hides from hero page when ended</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                  Description / Announcement Note
                </label>
                <textarea
                  rows={2}
                  value={campaignFormData.description}
                  onChange={e => setCampaignFormData({ ...campaignFormData, description: e.target.value })}
                  placeholder="e.g. Enjoy festive savings across all authentic handloom weaves."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem' }}
                />
              </div>

              {/* Status & Countdown Checkboxes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, color: '#0F172A' }}>
                  <input
                    type="checkbox"
                    checked={campaignFormData.is_active}
                    onChange={e => setCampaignFormData({ ...campaignFormData, is_active: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--color-emerald)' }}
                  />
                  <span>Enable Campaign (Show festive offer on storefront within date window)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, color: '#0F172A' }}>
                  <input
                    type="checkbox"
                    checked={campaignFormData.show_countdown}
                    onChange={e => setCampaignFormData({ ...campaignFormData, show_countdown: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--color-emerald)' }}
                  />
                  <span>Show live countdown timer on storefront</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => { setIsNewCampaignModalOpen(false); setEditingCampaign(null); }}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingCampaign ? 'Save Changes' : 'Launch Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
