'use client'
import { useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { getProductsBySectionAndBrand } from '@/app/actions/products'

const TrailerScene = dynamic(() => import('./TrailerScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-[#E31E24] border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] uppercase tracking-widest text-[var(--on-surface-dim)]" style={{ fontFamily: 'Space Grotesk' }}>
          Loading 3D Model...
        </p>
      </div>
    </div>
  ),
})

interface Section { id: number; title: string }
interface SectionProduct {
  id: number; sku: string; name: string
  primary_image_url: string | null; in_stock: boolean
}

const DISPLAY_NAMES: Record<string, string> = {
  'Rear Frame':                     'Rear End',
  'Axle End':                       'Wheel End',
  'Base Assembly and Landing Gear': 'Base Assembly',
  'Roof Assembly':                  'Roof',
}
function displayName(title: string) { return DISPLAY_NAMES[title] ?? title }

const FEATURED_BRANDS = [
  'Vanguard', 'Hyundai', 'Manac', 'Stoughton',
  'Wabash', 'Dimond', 'Strick', 'Morgan/Sullivan', 'ITD',
]

const BRAND_COLORS: Record<string, string> = {
  'Vanguard':        '#1F4E78',
  'Hyundai':         '#002C5F',
  'Manac':           '#1a3a5c',
  'Stoughton':       '#2d5016',
  'Wabash':          '#8B1A1A',
  'Dimond':          '#4a3000',
  'Strick':          '#1a1a3e',
  'Morgan/Sullivan': '#2e1f5e',
  'ITD':             '#3d1f00',
}

const BRAND_DB_NAMES: Record<string, string[]> = {
  'Vanguard':        ['VANGUARD'],
  'Hyundai':         ['HYUNDAI'],
  'Manac':           ['MANAC'],
  'Stoughton':       ['STOUGHTON'],
  'Wabash':          ['WABASH'],
  'Dimond':          ['DI-MOND'],
  'Strick':          [],
  'Morgan/Sullivan': ['MORGAN', 'MULTIVAN'],
  'ITD':             ['ITD'],
  'Others':          [],
}

const BRAND_LOGOS: Record<string, string> = {
  'Vanguard':        '/brands/vanguard.svg',
  'Hyundai':         '/brands/hyundai.png',
  'Manac':           '/brands/manac.svg',
  'Stoughton':       '/brands/stoughton.png',
  'Wabash':          '/brands/wabash.png',
  'Dimond':          '/brands/dimond.png',
  'Strick':          '/brands/strick.png',
  'Morgan/Sullivan': '/brands/morgan.png',
  'ITD':             '/brands/itd.svg',
}

export function TrailerExplorer({ sections }: { sections: Section[] }) {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<Section | null>(null)
  const [products, setProducts]           = useState<SectionProduct[]>([])
  const [loading, setLoading]             = useState(false)
  const fetchIdRef = useRef(0)

  const fetchProducts = async (section: Section, brand: string | null) => {
    const fetchId = ++fetchIdRef.current
    setLoading(true)
    setProducts([])
    const dbBrands = brand ? (BRAND_DB_NAMES[brand] ?? []) : []
    const data = await getProductsBySectionAndBrand(section.id, dbBrands.length > 0 ? dbBrands : null)
    // Discard stale response if a newer fetch has started
    if (fetchId !== fetchIdRef.current) return
    setProducts(data)
    setLoading(false)
  }

  const handleBrandSelect = (brand: string) => {
    const next = selectedBrand === brand ? null : brand
    setSelectedBrand(next)
    if (activeSection) {
      fetchProducts(activeSection, next)
    }
  }

  const handleSectionSelect = (section: Section) => {
    setActiveSection(section)
    fetchProducts(section, selectedBrand)
  }

  // Use first DB brand name for URL (e.g. "Vanguard" → "VANGUARD")
  const dbBrandForUrl = selectedBrand && selectedBrand !== 'Others'
    ? (BRAND_DB_NAMES[selectedBrand]?.[0] ?? null)
    : null
  const productsUrl = dbBrandForUrl
    ? `/products?brand=${encodeURIComponent(dbBrandForUrl)}`
    : '/products'

  return (
    <div className="flex flex-col gap-0">

      {/* ── Brand Filter Row ─────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--on-surface-dim)] mb-3"
          style={{ fontFamily: 'Space Grotesk' }}>
          Filter by Trailer Brand — <span className="text-[#E31E24]">{selectedBrand ?? 'All Brands'}</span>
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-2">
          {FEATURED_BRANDS.map(brand => {
            const isActive = selectedBrand === brand
            return (
              <button
                key={brand}
                onClick={() => handleBrandSelect(brand)}
                style={{
                  fontFamily: 'Space Grotesk',
                  backgroundColor: isActive ? BRAND_COLORS[brand] ?? '#1a1a2e' : 'var(--surface-raised)',
                  outline: isActive ? '2px solid #E31E24' : 'none',
                  outlineOffset: '2px',
                }}
                className="group flex flex-col items-center justify-center gap-1.5 p-2.5 border border-[#cbd0dd]/20 hover:border-[#E31E24]/60 transition-all duration-200 hover:scale-[1.04]"
              >
                <div className="w-full h-8 flex items-center justify-center px-1.5 rounded bg-white">
                  <img
                    src={BRAND_LOGOS[brand]}
                    alt={brand}
                    className="max-h-6 max-w-full object-contain"
                  />
                </div>
                <span className={`text-[8px] font-bold uppercase tracking-wide text-center leading-tight truncate w-full ${isActive ? 'text-white' : 'text-[var(--on-surface-dim)]'}`}>
                  {brand}
                </span>
              </button>
            )
          })}

          {/* Others */}
          <button
            onClick={() => handleBrandSelect('Others')}
            style={{
              fontFamily: 'Space Grotesk',
              backgroundColor: selectedBrand === 'Others' ? '#222' : 'var(--surface-raised)',
              outline: selectedBrand === 'Others' ? '2px solid #E31E24' : 'none',
              outlineOffset: '2px',
            }}
            className="group flex flex-col items-center justify-center gap-1.5 p-2.5 border border-dashed border-[#cbd0dd]/20 hover:border-[#E31E24]/60 transition-all duration-200 hover:scale-[1.04]"
          >
            <div className="w-full h-8 flex items-center justify-center">
              <span className="text-[var(--on-surface-dim)] text-base leading-none">···</span>
            </div>
            <span className={`text-[8px] font-bold uppercase tracking-wide ${selectedBrand === 'Others' ? 'text-white' : 'text-[var(--on-surface-dim)]'}`}>Others</span>
          </button>
        </div>
      </div>

      {/* ── Full-width Trailer Scene ─────────────────────────────────── */}
      <div
        className="w-full border border-[#cbd0dd]/20 relative"
        style={{ height: 460, backgroundColor: 'var(--surface-raised)' }}
      >
        <TrailerScene
          sections={sections}
          activeSection={activeSection}
          onSectionSelect={handleSectionSelect}
        />

        {/* Corner hint */}
        <div className="absolute top-3 left-3 pointer-events-none">
          <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--on-surface-dim)]"
            style={{ fontFamily: 'Space Grotesk' }}>3D Parts Map</p>
          <p className="text-[7px] text-[var(--on-surface-dim)]/50 mt-0.5" style={{ fontFamily: 'Space Grotesk' }}>
            Drag to rotate · Click a section
          </p>
        </div>

        {/* Active section badge */}
        {activeSection && (
          <div className="absolute top-3 right-3 pointer-events-none">
            <div className="border-l-2 border-[#E31E24] pl-2">
              <p className="text-[7px] text-[var(--on-surface-dim)] uppercase tracking-widest" style={{ fontFamily: 'Space Grotesk' }}>Selected</p>
              <p className="text-[10px] font-black uppercase text-[#E31E24]" style={{ fontFamily: 'Space Grotesk' }}>
                {displayName(activeSection.title)}
              </p>
            </div>
          </div>
        )}

        {/* Brand badge */}
        {selectedBrand && (
          <div className="absolute bottom-3 left-3 pointer-events-none">
            <span className="text-[9px] font-black uppercase tracking-widest text-white border border-[#E31E24]/60 bg-[#E31E24]/20 px-2 py-1"
              style={{ fontFamily: 'Space Grotesk' }}>
              {selectedBrand}
            </span>
          </div>
        )}
      </div>

      {/* ── Section Tabs ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center mt-4">
        <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--on-surface-dim)] mr-1"
          style={{ fontFamily: 'Space Grotesk' }}>Section:</span>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => handleSectionSelect(s)}
            style={{ fontFamily: 'Space Grotesk' }}
            className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide border transition-all duration-200 ${
              activeSection?.id === s.id
                ? 'border-[#E31E24] bg-[#E31E24]/10 text-[#E31E24]'
                : 'border-[#cbd0dd]/30 text-[var(--on-surface-dim)] hover:border-[#E31E24] hover:text-[#E31E24]'
            }`}
          >
            {displayName(s.title)}
          </button>
        ))}
        <Link
          href={productsUrl}
          style={{ fontFamily: 'Space Grotesk' }}
          className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide border border-dashed border-[#cbd0dd]/30 text-[var(--on-surface-dim)] hover:border-[#E31E24] hover:text-[#E31E24] transition-all duration-200"
        >
          All Categories →
        </Link>
      </div>

      {/* ── Products Below Trailer ───────────────────────────────────── */}
      {activeSection && (
        <div className="mt-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#cbd0dd]/20">
            <div>
              <p className="text-[8px] text-[var(--on-surface-dim)] uppercase tracking-[0.2em] font-bold mb-0.5"
                style={{ fontFamily: 'Space Grotesk' }}>
                {selectedBrand ?? 'All Brands'} · {displayName(activeSection.title)}
              </p>
              <h3 className="text-base font-black uppercase text-[#E31E24]" style={{ fontFamily: 'Space Grotesk' }}>
                {displayName(activeSection.title)} Parts
              </h3>
            </div>
            {!loading && (
              <div className="text-right">
                <p className="text-2xl font-black text-[var(--on-surface)]" style={{ fontFamily: 'Space Grotesk' }}>
                  {products.length > 12 ? `12 / ${products.length}` : products.length}
                </p>
                <p className="text-[8px] text-[var(--on-surface-dim)] uppercase tracking-widest" style={{ fontFamily: 'Space Grotesk' }}>
                  {products.length > 12 ? 'Showing / Total' : 'Parts Found'}
                </p>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#E31E24] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-[var(--on-surface-dim)]"
                style={{ fontFamily: 'Space Grotesk' }}>
                No parts found for this selection
              </p>
              <Link
                href={productsUrl}
                className="text-[10px] font-bold uppercase tracking-widest text-[#E31E24] border border-[#E31E24]/40 px-5 py-2 hover:bg-[#E31E24]/10 transition-colors"
                style={{ fontFamily: 'Space Grotesk' }}
              >
                Browse Full Catalog →
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {products.slice(0, 12).map(p => (
                  <Link
                    key={p.id}
                    href={`/products/${p.id}`}
                    className="group flex flex-col border border-[#cbd0dd]/20 hover:border-[#E31E24]/60 transition-all duration-200 hover:shadow-md"
                    style={{ backgroundColor: 'var(--surface-card)' }}
                  >
                    {/* Image */}
                    <div className="w-full aspect-square flex items-center justify-center border-b border-[#cbd0dd]/10 overflow-hidden"
                      style={{ backgroundColor: 'var(--surface-raised)' }}>
                      {p.primary_image_url ? (
                        <img src={p.primary_image_url} alt="" className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-200" />
                      ) : (
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd0dd" strokeWidth="1" opacity="0.4">
                          <rect x="3" y="3" width="18" height="18"/>
                        </svg>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-2.5 flex flex-col gap-1 flex-1">
                      <p className="font-mono text-[8px] text-[#E31E24] leading-none">{p.sku}</p>
                      <p className="text-[10px] font-bold uppercase leading-tight group-hover:text-[#E31E24] transition-colors line-clamp-2"
                        style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>
                        {p.name}
                      </p>
                      <div className="mt-auto pt-1 flex items-center justify-between">
                        <span className={`text-[7px] font-bold uppercase tracking-wide px-1.5 py-0.5 border ${
                          p.in_stock
                            ? 'text-green-400 border-green-800/40 bg-green-950/40'
                            : 'text-orange-400 border-orange-800/40 bg-orange-950/40'
                        }`}>
                          {p.in_stock ? 'In Stock' : 'Out'}
                        </span>
                        <span className="text-[#E31E24] text-xs group-hover:translate-x-0.5 transition-transform">→</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Footer link */}
              <div className="mt-5 pt-4 border-t border-[#cbd0dd]/20 flex items-center justify-between">
                <Link
                  href={productsUrl}
                  className="text-[9px] font-bold uppercase tracking-widest text-[var(--on-surface-dim)] hover:text-[#E31E24] transition-colors"
                  style={{ fontFamily: 'Space Grotesk' }}
                >
                  Browse Full {selectedBrand ?? 'Parts'} Catalog →
                </Link>
                {products.length > 12 && (
                  <Link
                    href={`${productsUrl}${productsUrl.includes('?') ? '&' : '?'}q=${encodeURIComponent(displayName(activeSection!.title))}`}
                    className="text-[10px] font-black uppercase tracking-widest text-white bg-[#E31E24] px-4 py-2 hover:bg-[#c01a1f] transition-colors"
                    style={{ fontFamily: 'Space Grotesk' }}
                  >
                    View All {products.length} Parts →
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
