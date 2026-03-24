export type UserRole = 'customer' | 'admin'
export type OrderStatus = 'pending' | 'contacted' | 'processing' | 'completed' | 'cancelled'
export type SyncType = 'full' | 'incremental'
export type SyncStatus = 'running' | 'success' | 'failed'

export interface Product {
  id: number
  external_id: string
  sku: string
  name: string
  description: string | null
  category: string | null
  subcategory: string | null
  brand: string | null
  price: number | null
  image_urls: string[]
  primary_image_url: string | null
  specifications: Record<string, unknown>
  related_parts: number[]
  alternate_skus: string[]
  in_stock: boolean
  search_vector?: unknown // tsvector — opaque to TS
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

export interface ProductSearchResult extends Pick<Product,
  'id' | 'external_id' | 'sku' | 'name' | 'description' |
  'category' | 'brand' | 'price' | 'primary_image_url' | 'in_stock'
> {
  relevance: number
}

export interface Profile {
  id: string
  role: UserRole
  company_name: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  created_at: string
  updated_at: string
}

export interface CartItem {
  id: number
  user_id: string
  product_id: number
  quantity: number
  created_at: string
}

export interface CartItemWithProduct extends CartItem {
  product: Pick<Product, 'sku' | 'name' | 'price' | 'primary_image_url' | 'in_stock'>
}

export interface Order {
  id: number
  order_number: string
  user_id: string
  status: OrderStatus
  items: OrderItem[]
  customer_info: CustomerInfo
  total_items: number
  customer_notes: string | null
  admin_notes: string | null
  whatsapp_sent_at: string | null
  whatsapp_message_id: string | null
  whatsapp_error: string | null
  contacted_at: string | null
  contacted_by: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  product_id: number
  sku: string
  name: string
  quantity: number
  price_at_order: number | null
}

export interface CustomerInfo {
  company_name: string
  phone: string
  address: string
  city: string
  state: string
  zip_code: string
  notes?: string
}
