import { Suspense } from 'react'
import { searchProducts, getCategories, getBrands, getTotalProductCount } from '@/app/actions/products'
import { ProductGrid } from '@/components/ProductGrid'
import { SearchBar } from '@/components/SearchBar'
import { FilterSidebar } from '@/components/FilterSidebar'
import { MobileFilterDrawer } from '@/components/MobileFilterDrawer'

interface PageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    brand?: string
    in_stock?: string
    page?: string
  }>
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page ?? '1', 10)
  const query = params.q ?? ''
  const category = params.category ?? null
  const brand = params.brand ?? null
  const inStockOnly = params.in_stock === 'true'

  const [products, categories, brands, totalCount] = await Promise.all([
    searchProducts({ query, category, brand, inStockOnly, page, limit: 24 }),
    getCategories(),
    getBrands(),
    getTotalProductCount({ query, category, brand, inStockOnly }),
  ])

  const totalPages = Math.ceil(totalCount / 24)
  const hasActiveFilters = !!(query || category || brand || inStockOnly)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface)' }}>
      {/* Page hero header */}
      <div className="relative overflow-hidden" style={{ backgroundColor: 'var(--surface-card)', borderBottom: '3px solid #E31E24' }}>
        {/* Left red accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: '#E31E24' }} />

        <div className="relative px-4 sm:px-6 lg:px-8 pt-8 pb-6 max-w-[1920px] mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-4 text-[10px] uppercase tracking-[0.2em] font-bold" style={{ fontFamily: 'Space Grotesk' }}>
            <span style={{ color: 'var(--on-surface-dim)' }}>HK</span>
            <span style={{ color: 'var(--on-surface-dim)' }}>/</span>
            <span style={{ color: '#E31E24' }}>Parts Catalog</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>
                PARTS <span style={{ color: '#E31E24' }}>CATALOG</span>
              </h1>
              <p className="text-xs uppercase tracking-widest mt-2 font-bold" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface-dim)' }}>
                Wholesale Mechanical &amp; Trailer Parts
              </p>
            </div>
            <div className="flex items-center gap-3 text-right">
              <div className="border-l-2 pl-3" style={{ borderColor: '#E31E24' }}>
                <p className="text-2xl font-black" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>{totalCount.toLocaleString()}</p>
                <p className="text-[10px] uppercase tracking-widest font-bold" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface-dim)' }}>Parts Active</p>
              </div>
            </div>
          </div>

          <Suspense fallback={null}>
            <SearchBar placeholder="Search by SKU, part name, or keyword..." defaultValue={query} />
          </Suspense>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-60 flex-shrink-0">
            <div className="sticky top-24 border-l-2 p-5" style={{ backgroundColor: 'var(--surface-card)', borderColor: '#E31E24', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              {/* Sidebar header */}
              <div className="flex items-center gap-2 mb-6 pb-4" style={{ borderBottom: '1px solid var(--border-dim)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#E31E24" strokeWidth="2.5"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                <span className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: '#E31E24', fontFamily: 'Space Grotesk' }}>Filters</span>
              </div>
              <Suspense fallback={null}>
                <FilterSidebar
                  categories={categories}
                  brands={brands}
                  activeCategory={category}
                  activeBrand={brand}
                  activeInStock={inStockOnly}
                />
              </Suspense>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Top bar: count + mobile filter */}
            <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: '1px solid var(--border-dim)' }}>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface-dim)' }}>
                <span className="text-base" style={{ color: '#E31E24' }}>{totalCount.toLocaleString()}</span>{' '}
                part{totalCount !== 1 ? 's' : ''} found
                {query && <> for &ldquo;<span style={{ color: '#E31E24' }}>{query}</span>&rdquo;</>}
                {category && <> in <span style={{ color: '#E31E24' }}>{category}</span></>}
              </p>
              <Suspense fallback={null}>
                <MobileFilterDrawer
                  categories={categories}
                  brands={brands}
                  activeCategory={category}
                  activeBrand={brand}
                  activeInStock={inStockOnly}
                  totalCount={totalCount}
                />
              </Suspense>
            </div>

            {products.length === 0 ? (
              <ZeroResultsState query={query} hasFilters={hasActiveFilters} />
            ) : (
              <>
                <ProductGrid products={products} />
                {totalPages > 1 && (
                  <PaginationNav currentPage={page} totalPages={totalPages} searchParams={params} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ZeroResultsState({ query, hasFilters }: { query: string; hasFilters: boolean }) {
  return (
    <div className="text-center py-20 border" style={{ borderColor: 'var(--border-dim)', backgroundColor: 'var(--surface-card)' }}>
      <div className="mb-4" style={{ color: 'var(--on-surface-dim)' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>
      <p className="text-lg mb-2 font-bold uppercase tracking-wide" style={{fontFamily: 'Space Grotesk', color: 'var(--on-surface)'}}>
        {query ? `No results for "${query}"` : 'No products match filters'}
      </p>
      <p className="text-sm mb-6" style={{ color: 'var(--on-surface-dim)' }}>Try a different SKU, part name, or clear filters</p>
      {hasFilters && (
        <a
          href="/products"
          className="inline-block px-8 py-3 text-xs font-bold uppercase tracking-widest text-white hover:opacity-90 transition-all"
          style={{fontFamily: 'Space Grotesk', backgroundColor: '#E31E24'}}
        >
          Clear all filters
        </a>
      )}
    </div>
  )
}

function PaginationNav({
  currentPage,
  totalPages,
  searchParams,
}: {
  currentPage: number
  totalPages: number
  searchParams: Record<string, string | undefined>
}) {
  function buildUrl(page: number) {
    const urlParams = new URLSearchParams()
    if (searchParams.q) urlParams.set('q', searchParams.q)
    if (searchParams.category) urlParams.set('category', searchParams.category)
    if (searchParams.brand) urlParams.set('brand', searchParams.brand)
    if (searchParams.in_stock) urlParams.set('in_stock', searchParams.in_stock)
    urlParams.set('page', page.toString())
    return `/products?${urlParams.toString()}`
  }

  const delta = 3
  const start = Math.max(1, currentPage - delta)
  const end = Math.min(totalPages, currentPage + delta)
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  const baseBtn = { border: '1px solid var(--border-dim)', color: 'var(--on-surface-dim)', fontFamily: 'Space Grotesk' }

  return (
    <nav className="flex justify-center gap-1 mt-10" aria-label="Pagination">
      {currentPage > 1 && (
        <a href={buildUrl(currentPage - 1)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all hover:opacity-80" style={baseBtn}>
          Prev
        </a>
      )}
      {start > 1 && (
        <>
          <a href={buildUrl(1)} className="px-4 py-2 text-xs transition-all hover:opacity-80" style={baseBtn}>1</a>
          {start > 2 && <span className="px-2 py-2 text-xs" style={{ color: 'var(--on-surface-dim)' }}>…</span>}
        </>
      )}
      {pages.map(p => (
        <a
          key={p}
          href={buildUrl(p)}
          className="px-4 py-2 text-xs border transition-all"
          style={p === currentPage
            ? { backgroundColor: '#E31E24', color: '#ffffff', borderColor: '#E31E24', fontWeight: 'bold' }
            : baseBtn
          }
        >
          {p}
        </a>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-2 py-2 text-xs" style={{ color: 'var(--on-surface-dim)' }}>…</span>}
          <a href={buildUrl(totalPages)} className="px-4 py-2 text-xs transition-all hover:opacity-80" style={baseBtn}>{totalPages}</a>
        </>
      )}
      {currentPage < totalPages && (
        <a href={buildUrl(currentPage + 1)} className="px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all hover:opacity-80" style={baseBtn}>
          Next
        </a>
      )}
    </nav>
  )
}
