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

  // Browse mode (no query): direct query — faster and avoids RPC
  if (!query) {
    let q = supabase
      .from('products')
      .select('id, external_id, sku, name, description, category, brand, price, primary_image_url, in_stock')
      .eq('status', 1)
      .eq('show_on_website', true)
      .order('name', { ascending: true })
      .range((page - 1) * limit, page * limit - 1)
    if (category) q = q.eq('category', category)
    if (brand) q = q.eq('brand', brand)
    if (inStockOnly) q = q.eq('in_stock', true)
    const { data, error } = await q
    if (error) { console.error('searchProducts browse error:', error); return [] }
    return (data ?? []).map(p => ({ ...p, relevance: 0 })) as ProductSearchResult[]
  }

  // Search mode (with query): use RPC for full-text + cross-ref search
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

export async function getAlternateProducts(externalIds: number[]): Promise<{
  id: number; external_id: string; sku: string; name: string;
  brand: string | null; primary_image_url: string | null; in_stock: boolean
}[]> {
  if (!externalIds?.length) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, external_id, sku, name, brand, primary_image_url, in_stock')
    .in('external_id', externalIds.map(String))
    .eq('status', 1)
    .eq('show_on_website', true)
  return (data ?? []) as { id: number; external_id: string; sku: string; name: string; brand: string | null; primary_image_url: string | null; in_stock: boolean }[]
}

export async function getSimilarProducts(productId: number, externalId: number, category: string | null): Promise<Product[]> {
  if (!category) return []
  const supabase = await createClient()
  // Fetch up to 200 in same category, then sort in JS by nearest external_id (numeric)
  // external_id is TEXT in DB so ORDER BY there is lexicographic — sort must happen in JS
  const { data } = await supabase
    .from('products')
    .select('id, external_id, sku, name, brand, primary_image_url, in_stock, category')
    .eq('category', category)
    .eq('status', 1)
    .eq('show_on_website', true)
    .neq('id', productId)
    .limit(200)
  if (!data) return []
  return data
    .sort((a, b) => {
      const aDiff = Math.abs((Number(a.external_id) || 0) - externalId)
      const bDiff = Math.abs((Number(b.external_id) || 0) - externalId)
      return aDiff - bDiff
    })
    .slice(0, 8) as Product[]
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
  const unique = [...new Set(data.map(r => r.category as string | null).filter((c): c is string => !!c))]
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
  const unique = [...new Set(data.map(r => r.brand as string | null).filter((b): b is string => !!b))]
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

export async function getProductsBySectionAndBrand(sectionId: number, dbBrands: string[] | null): Promise<{
  id: number; sku: string; name: string; primary_image_url: string | null; in_stock: boolean
}[]> {
  const supabase = await createClient()
  let q = supabase
    .from('products')
    .select('id, sku, name, primary_image_url, in_stock')
    .eq('assembly_category_id', sectionId)
    .order('name')
    .limit(50)
  if (dbBrands && dbBrands.length > 0) q = q.in('brand', dbBrands)
  const { data } = await q
  return (data ?? []) as { id: number; sku: string; name: string; primary_image_url: string | null; in_stock: boolean }[]
}

export async function getCategoriesWithMeta(): Promise<{ category: string; count: number; image: string | null }[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('category, primary_image_url')
    .eq('status', 1)
    .eq('show_on_website', true)
    .not('category', 'is', null)
  if (!data) return []
  const map = new Map<string, { count: number; image: string | null }>()
  for (const row of data) {
    const cat = row.category as string
    const existing = map.get(cat)
    if (!existing) {
      map.set(cat, { count: 1, image: (row.primary_image_url as string | null) ?? null })
    } else {
      existing.count++
      if (!existing.image && row.primary_image_url) existing.image = row.primary_image_url as string
    }
  }
  return Array.from(map.entries())
    .map(([category, meta]) => ({ category, ...meta }))
    .sort((a, b) => a.category.localeCompare(b.category))
}

export async function getBrandsWithMeta(): Promise<{ brand: string; count: number; image: string | null }[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('brand, primary_image_url')
    .eq('status', 1)
    .eq('show_on_website', true)
    .not('brand', 'is', null)
  if (!data) return []
  const map = new Map<string, { count: number; image: string | null }>()
  for (const row of data) {
    const brand = row.brand as string
    const existing = map.get(brand)
    if (!existing) {
      map.set(brand, { count: 1, image: (row.primary_image_url as string | null) ?? null })
    } else {
      existing.count++
      if (!existing.image && row.primary_image_url) existing.image = row.primary_image_url as string
    }
  }
  return Array.from(map.entries())
    .map(([brand, meta]) => ({ brand, ...meta }))
    .sort((a, b) => a.brand.localeCompare(b.brand))
}
