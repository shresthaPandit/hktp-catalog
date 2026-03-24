'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface FilterSidebarProps {
  categories: string[]
  brands: string[]
  activeCategory: string | null
  activeBrand: string | null
  activeInStock: boolean
}

export function FilterSidebar({ categories, brands, activeCategory, activeBrand, activeInStock }: FilterSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateFilter = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', '1')
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.replace(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  const hasFilters = activeCategory || activeBrand || activeInStock

  return (
    <div className="space-y-0">

      {/* Availability */}
      <div className="pb-5 mb-5 border-b border-[#cbd0dd]/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-[#E31E24]" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E31E24]" style={{ fontFamily: 'Space Grotesk' }}>Availability</h3>
        </div>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={activeInStock}
              onChange={(e) => updateFilter('in_stock', e.target.checked ? 'true' : null)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 rounded-full transition-colors duration-200 peer-checked:bg-[#E31E24] bg-[#2a2a2a] border border-[#cbd0dd]/40 peer-checked:border-[#E31E24]" />
            <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 peer-checked:translate-x-5 shadow-sm" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wide transition-colors group-hover:text-[#E31E24]" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface-dim)' }}>
            In Stock Only
          </span>
        </label>
      </div>

      {/* Category */}
      <div className="pb-5 mb-5 border-b border-[#cbd0dd]/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-[#E31E24]" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E31E24]" style={{ fontFamily: 'Space Grotesk' }}>Category</h3>
        </div>
        <div className="space-y-0.5 max-h-72 overflow-y-auto pr-1">
          <button
            onClick={() => updateFilter('category', null)}
            className={`w-full text-left text-[11px] px-3 py-2.5 uppercase tracking-wide font-bold transition-all duration-150 ${
              !activeCategory
                ? 'bg-[#E31E24] text-white'
                : 'hover:bg-[#E31E24]/10 hover:text-[#E31E24] hover:pl-4'
            }`}
            style={{ fontFamily: 'Space Grotesk', color: !activeCategory ? 'white' : 'var(--on-surface-dim)' }}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => updateFilter('category', activeCategory === cat ? null : cat)}
              className={`w-full text-left text-[11px] px-3 py-2 transition-all duration-150 ${
                activeCategory === cat
                  ? 'bg-[#E31E24] text-white font-bold'
                  : 'hover:bg-[#E31E24]/10 hover:text-[#E31E24] hover:pl-4'
              }`}
              style={{ fontFamily: 'Space Grotesk', color: activeCategory === cat ? 'white' : 'var(--on-surface-dim)' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Brand */}
      <div className={hasFilters ? 'pb-5 mb-5 border-b border-[#cbd0dd]/20' : ''}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-[#E31E24]" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E31E24]" style={{ fontFamily: 'Space Grotesk' }}>Brand</h3>
        </div>
        <div className="space-y-0.5 max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => updateFilter('brand', null)}
            className={`w-full text-left text-[11px] px-3 py-2.5 uppercase tracking-wide font-bold transition-all duration-150 ${
              !activeBrand
                ? 'bg-[#E31E24] text-white'
                : 'hover:bg-[#E31E24]/10 hover:text-[#E31E24] hover:pl-4'
            }`}
            style={{ fontFamily: 'Space Grotesk', color: !activeBrand ? 'white' : 'var(--on-surface-dim)' }}
          >
            All Brands
          </button>
          {brands.map(brand => (
            <button
              key={brand}
              onClick={() => updateFilter('brand', activeBrand === brand ? null : brand)}
              className={`w-full text-left text-[11px] px-3 py-2 transition-all duration-150 ${
                activeBrand === brand
                  ? 'bg-[#E31E24] text-white font-bold'
                  : 'hover:bg-[#E31E24]/10 hover:text-[#E31E24] hover:pl-4'
              }`}
              style={{ fontFamily: 'Space Grotesk', color: activeBrand === brand ? 'white' : 'var(--on-surface-dim)' }}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Clear All */}
      {hasFilters && (
        <a
          href="/products"
          className="flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#E31E24] hover:text-white border border-[#E31E24] py-3 hover:bg-[#E31E24] transition-all duration-200"
          style={{ fontFamily: 'Space Grotesk' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Clear All Filters
        </a>
      )}
    </div>
  )
}
