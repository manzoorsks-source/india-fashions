export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'ADMIN' 
  | 'HEAD_CASHIER' 
  | 'POS_CASHIER' 
  | 'INVENTORY_EXECUTIVE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export type CategorySlug = 
  | 'sarees'
  | 'punjabi-dresses'
  | 'children'
  | 'kurti'
  | 'lehenga'
  | 'salwar-suit'
  | 'mens-ethnic'
  | 'accessories';

export interface Category {
  id: string;
  name: string;
  slug: CategorySlug;
  description: string;
  is_active: boolean;
  display_order: number;
}

export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ProductMedia {
  id: string;
  product_id: string;
  file_path: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
  crop_desktop?: string; // e.g. "4:5"
  crop_mobile?: string;  // e.g. "1:1"
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  size: string;
  color: string;
  color_code?: string;
  cost_price?: number; // Hidden from customer API & unauthorized roles
  selling_price: number;
  sale_price?: number | null;
  quantity: number;
  low_stock_threshold: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  category_name?: string;
  category_slug?: CategorySlug;
  description: string;
  fabric: string;
  care_instructions: string;
  status: ProductStatus;
  is_featured: boolean;
  homepage_placement: 'NONE' | 'HERO' | 'FEATURED' | 'NEW_ARRIVAL';
  campaign_label?: string; // e.g. "Festive edit", "Limited weave", "New arrival"
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string;
  created_at: string;
  updated_at: string;
  variants: ProductVariant[];
  media: ProductMedia[];
}

export type OrderStatus = 
  | 'PLACED' 
  | 'CONFIRMED' 
  | 'PACKED' 
  | 'SHIPPED' 
  | 'DELIVERED' 
  | 'CANCELLED' 
  | 'RETURNED';

export type PaymentMethod = 'UPI' | 'CARD' | 'IMPS_NEFT' | 'COD';

export type PaymentStatus = 
  | 'PENDING' 
  | 'PAID' 
  | 'VERIFICATION_REQUIRED' 
  | 'FAILED' 
  | 'REFUNDED';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  product_name: string;
  sku: string;
  size: string;
  color: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  delivery_address: string;
  pincode: string;
  distance_km: number;
  subtotal: number;
  discount_amount: number;
  delivery_charge: number;
  tax_amount: number;
  total_amount: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_reference?: string; // UTR for IMPS/NEFT, or transaction ID
  customer_notes?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

export interface AdvanceOrder {
  id: string;
  product_id: string;
  product_name: string;
  variant_id: string;
  variant_details: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  notes?: string;
  status: 'PENDING' | 'ALLOCATED' | 'DELIVERY_SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notification_sent: boolean;
  allocated_at?: string;
  created_at: string;
}

export interface InventoryMovement {
  id: string;
  variant_id: string;
  sku: string;
  product_name: string;
  change_type: 'PURCHASE_RECEIPT' | 'ORDER_DEDUCTION' | 'RETURN_RESTOCK' | 'MANUAL_ADJUSTMENT' | 'DAMAGE_WRITE_OFF';
  quantity_changed: number; // e.g. +10 or -1
  quantity_after: number;
  reference_note?: string;
  actor_name: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  entity: string;
  entity_id: string;
  action: string;
  previous_value?: string;
  new_value?: string;
  timestamp: string;
}

export interface TickerMessage {
  id: string;
  content: string;
  link_url?: string;
  publish_at: string;
  expire_at: string;
  is_active: boolean;
  sort_order: number;
}

export interface SaleCampaign {
  id: string;
  name: string;
  label: string; // "Festive edit", "Limited weave", "New arrival", "Drape the moment"
  description: string;
  discount_percentage?: number;
  start_at: string;
  end_at: string;
  is_active: boolean;
  show_countdown: boolean;
  apply_to: 'ALL' | 'CATEGORY' | 'PRODUCTS';
  target_id?: string; // category_id or comma-separated product_ids
}

export interface StoreSettings {
  brand_name: string;
  tagline: string;
  shop_address: string;
  shop_latitude: number;
  shop_longitude: number;
  delivery_radius_km: number; // default 12
  delivery_base_charge: number; // e.g. 50
  free_delivery_threshold: number; // e.g. 2999
  cod_enabled: boolean;
  upi_enabled: boolean;
  card_enabled: boolean;
  imps_neft_enabled: boolean;
  bank_account_name: string;
  bank_account_number: string;
  bank_ifsc: string;
  bank_branch: string;
  upi_id: string;
  contact_phone: string;
  contact_email: string;
  offer_2_plus_1_enabled: boolean;
}

export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}
