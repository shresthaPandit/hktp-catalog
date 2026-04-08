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
] as const

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

export function TrailerExplorer({ sections, darkMode = false, sceneHeight = 340 }: { sections: Section[]; darkMode?: boolean; sceneHeight?: number }) {
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
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <span style={{ fontFamily: 'Space Grotesk', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: darkMode ? 'rgba(255,255,255,0.4)' : '#9ca3af' }}>
            Filter by brand
          </span>
          <div style={{ flex: 1, height: 1, backgroundColor: darkMode ? 'rgba(255,255,255,0.06)' : '#e8eaed' }} />
          <span style={{ fontFamily: 'Space Grotesk', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#E31E24' }}>
            {selectedBrand ?? 'All Brands'}
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2.5">
          {FEATURED_BRANDS.map(brand => {
            const isActive = selectedBrand === brand
            return (
              <button
                key={brand}
                onClick={() => handleBrandSelect(brand)}
                style={{
                  fontFamily: 'Space Grotesk',
                  backgroundColor: isActive ? (BRAND_COLORS[brand] ?? '#1a1a2e') : (darkMode ? 'rgba(255,255,255,0.06)' : '#ffffff'),
                  border: isActive ? '2px solid #E31E24' : `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e4e6ea'}`,
                  boxShadow: isActive ? '0 0 0 3px rgba(227,30,36,0.12)' : '0 1px 4px rgba(0,0,0,0.06)',
                  borderRadius: 8,
                  transition: 'all 0.18s ease',
                }}
                className="group flex flex-col items-center justify-center gap-1.5 p-3 hover:scale-[1.04] hover:shadow-md"
              >
                <div className="w-full h-10 flex items-center justify-center px-1.5" style={{ background: '#fff', borderRadius: 5 }}>
                  <img src={BRAND_LOGOS[brand]} alt={brand} className="max-h-7 max-w-full object-contain" />
                </div>
                <span style={{
                  fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em',
                  color: isActive ? '#ffffff' : (darkMode ? 'rgba(255,255,255,0.45)' : '#6b7280'),
                  display: 'block', textAlign: 'center', width: '100%',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {brand}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Full-width Trailer Scene ─────────────────────────────────── */}
      <div
        className="w-full relative overflow-hidden"
        style={{
          height: sceneHeight,
          backgroundColor: darkMode ? '#111317' : '#1a1d23',
          borderRadius: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.12)',
          border: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #2a2d35',
        }}
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
        <span style={{ fontFamily: 'Space Grotesk', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: darkMode ? 'rgba(255,255,255,0.35)' : '#9ca3af', marginRight: 4 }}>
          Section:
        </span>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => handleSectionSelect(s)}
            style={{
              fontFamily: 'Space Grotesk', fontSize: '0.62rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.12em',
              padding: '6px 14px',
              border: activeSection?.id === s.id ? '1.5px solid #E31E24' : `1px solid ${darkMode ? 'rgba(255,255,255,0.12)' : '#e4e6ea'}`,
              backgroundColor: activeSection?.id === s.id ? 'rgba(227,30,36,0.08)' : 'transparent',
              color: activeSection?.id === s.id ? '#E31E24' : (darkMode ? 'rgba(255,255,255,0.4)' : '#6b7280'),
              borderRadius: 5,
              transition: 'all 0.15s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { if (activeSection?.id !== s.id) { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E31E24'; (e.currentTarget as HTMLButtonElement).style.color = '#E31E24' }}}
            onMouseLeave={e => { if (activeSection?.id !== s.id) { (e.currentTarget as HTMLButtonElement).style.borderColor = darkMode ? 'rgba(255,255,255,0.12)' : '#e4e6ea'; (e.currentTarget as HTMLButtonElement).style.color = darkMode ? 'rgba(255,255,255,0.4)' : '#6b7280' }}}
          >
            {displayName(s.title)}
          </button>
        ))}
        <Link
          href={productsUrl}
          style={{
            fontFamily: 'Space Grotesk', fontSize: '0.62rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.12em',
            padding: '6px 14px',
            border: `1px dashed ${darkMode ? 'rgba(255,255,255,0.12)' : '#e4e6ea'}`,
            color: darkMode ? 'rgba(255,255,255,0.3)' : '#9ca3af',
            borderRadius: 5,
          }}
          className="hover:border-[#E31E24] hover:text-[#E31E24] transition-all duration-150"
        >
          All Categories →
        </Link>
      </div>

      {/* ── Default state — simple muted prompt ──────────────────────── */}
      {!activeSection && (
        <p style={{ marginTop: 14, fontFamily: 'Space Grotesk', fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: darkMode ? 'rgba(255,255,255,0.18)' : '#b0b8c4' }}>
          Click any section on the trailer — or use the tabs above — to browse parts
        </p>
      )}

      {/* ── Products Below Trailer ───────────────────────────────────── */}
      {activeSection && (
        <div className="mt-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(203,208,221,0.2)'}` }}>
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] font-bold mb-0.5"
                style={{ fontFamily: 'Space Grotesk', color: darkMode ? 'rgba(255,255,255,0.4)' : 'var(--on-surface-dim)' }}>
                {selectedBrand ?? 'All Brands'} · {displayName(activeSection.title)}
              </p>
              <h3 className="text-base font-black uppercase text-[#E31E24]" style={{ fontFamily: 'Space Grotesk' }}>
                {displayName(activeSection.title)} Parts
              </h3>
            </div>
            {!loading && (
              <div className="text-right">
                <p className="text-2xl font-black" style={{ fontFamily: 'Space Grotesk', color: darkMode ? '#ffffff' : 'var(--on-surface)' }}>
                  {products.length > 12 ? `12 / ${products.length}` : products.length}
                </p>
                <p className="text-[8px] uppercase tracking-widest" style={{ fontFamily: 'Space Grotesk', color: darkMode ? 'rgba(255,255,255,0.4)' : 'var(--on-surface-dim)' }}>
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
                    className="group flex flex-col border hover:border-[#E31E24]/60 transition-all duration-200 hover:shadow-md"
                    style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'var(--surface-card)', borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(203,208,221,0.2)' }}
                  >
                    {/* Image */}
                    <div className="w-full aspect-square flex items-center justify-center overflow-hidden"
                      style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.04)' : 'var(--surface-raised)', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(203,208,221,0.1)'}` }}>
                      {p.primary_image_url ? (
                        <img src={p.primary_image_url} alt="" className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-200" />
                      ) : (
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={darkMode ? 'rgba(255,255,255,0.15)' : '#cbd0dd'} strokeWidth="1" opacity="0.4">
                          <rect x="3" y="3" width="18" height="18"/>
                        </svg>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-2.5 flex flex-col gap-1 flex-1">
                      <p className="font-mono text-[8px] text-[#E31E24] leading-none">{p.sku}</p>
                      <p className="text-[10px] font-bold uppercase leading-tight group-hover:text-[#E31E24] transition-colors line-clamp-2"
                        style={{ fontFamily: 'Space Grotesk', color: darkMode ? 'rgba(255,255,255,0.85)' : 'var(--on-surface)' }}>
                        {p.name}
                      </p>
                      <div className="mt-auto pt-1 flex items-center justify-between">
                        <span className={`text-[7px] font-bold uppercase tracking-wide px-1.5 py-0.5 border ${
                          p.in_stock
                            ? darkMode ? 'text-green-400 border-green-800/40 bg-green-950/40' : 'text-green-700 border-green-200 bg-green-50'
                            : darkMode ? 'text-orange-400 border-orange-800/40 bg-orange-950/40' : 'text-orange-600 border-orange-200 bg-orange-50'
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
              <div className="mt-5 pt-4 flex items-center justify-between" style={{ borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(203,208,221,0.2)'}` }}>
                <Link
                  href={productsUrl}
                  className="text-[9px] font-bold uppercase tracking-widest hover:text-[#E31E24] transition-colors"
                  style={{ fontFamily: 'Space Grotesk', color: darkMode ? 'rgba(255,255,255,0.4)' : 'var(--on-surface-dim)' }}
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
