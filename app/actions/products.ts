'use server'
import { createClient } from '@/lib/supabase/server'
import type { Product, ProductSearchResult } from '@/lib/types'

export async function searchProducts(params: {
  query?: string
  category?: string | null
  brand?: string | null
  inStockOnly?: boolean
  page?: number
  limit?: number
}): Promise<ProductSearchResult[]> {
  const supabase = await createClient()
  const { query = '', category = null, brand = null, inStockOnly = false, page = 1, limit = 24 } = params

  const { data, error } = await supabase.rpc('search_products', {
    search_query: query,
    category_filter: category,
    brand_filter: brand,
    in_stock_only: inStockOnly,
    limit_count: limit,
    offset_count: (page - 1) * limit,
  })

  if (error) {
    console.error('searchProducts error:', error)
    return []
  }
  return (data ?? []) as ProductSearchResult[]
}

export async function getProduct(id: number): Promise<Product | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('status', 1)
    .eq('show_on_website', true)
    .single()
  if (error) return null
  return data as Product
}

export async function getRelatedProducts(ids: number[]): Promise<Product[]> {
  if (!ids || ids.length === 0) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, external_id, sku, name, brand, price, primary_image_url, in_stock, description, category, subcategory, specifications, related_parts, image_urls, last_sync_at, created_at, updated_at')
    .in('id', ids.slice(0, 12))
    .eq('status', 1)
    .eq('show_on_website', true)
  return (data ?? []) as Product[]
}

export async function getCategories(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('category')
    .eq('status', 1)
    .eq('show_on_website', true)
    .not('category', 'is', null)
    .order('category')
  if (!data) return []
  const unique = [...new Set(data.map(r => r.category as string).filter(Boolean))]
  return unique
}

export async function getBrands(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('brand')
    .eq('status', 1)
    .eq('show_on_website', true)
    .not('brand', 'is', null)
    .order('brand')
  if (!data) return []
  const unique = [...new Set(data.map(r => r.brand as string).filter(Boolean))]
  return unique
}

export async function getTotalProductCount(params: {
  query?: string
  category?: string | null
  brand?: string | null
  inStockOnly?: boolean
}): Promise<number> {
  const { query = '', category = null, brand = null, inStockOnly = false } = params
  const supabase = await createClient()

  // If there's a search query, use the RPC count approach
  if (query) {
    const { data } = await supabase.rpc('search_products', {
      search_query: query,
      category_filter: category,
      brand_filter: brand,
      in_stock_only: inStockOnly,
      limit_count: 5000,
      offset_count: 0,
    })
    return (data ?? []).length
  }

  // For browse (no query), use direct count — much more efficient
  let q = supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('status', 1)
    .eq('show_on_website', true)
  if (category) q = q.eq('category', category)
  if (brand) q = q.eq('brand', brand)
  if (inStockOnly) q = q.eq('in_stock', true)
  const { count } = await q
  return count ?? 0
}

export async function getTrailerSections(): Promise<{ id: number; title: string }[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('trailer_sections')
    .select('id, title')
    .order('id')
  return (data ?? []) as { id: number; title: string }[]
}

export async function getProductsBySection(sectionId: number): Promise<{
  id: number; sku: string; name: string; primary_image_url: string | null; in_stock: boolean
}[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, sku, name, primary_image_url, in_stock')
    .eq('assembly_category_id', sectionId)
    .order('name')
    .limit(50)
  return (data ?? []) as { id: number; sku: string; name: string; primary_image_url: string | null; in_stock: boolean }[]
}
