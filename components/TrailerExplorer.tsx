'use client'
import { useState } from 'react'
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

// ── Featured brands (shown as cards) ─────────────────────────────
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

// Maps display brand name → actual DB brand values (uppercase, exact match)
const BRAND_DB_NAMES: Record<string, string[]> = {
  'Vanguard':        ['VANGUARD'],
  'Hyundai':         ['HYUNDAI'],
  'Manac':           ['MANAC'],
  'Stoughton':       ['STOUGHTON'],
  'Wabash':          ['WABASH'],
  'Dimond':          ['DI-MOND'],
  'Strick':          [],              // not in DB yet
  'Morgan/Sullivan': ['MORGAN', 'MULTIVAN'],
  'ITD':             ['ITD'],
  'Others':          [],              // no filter = all brands
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

type Step = 'brand' | 'category'

export function TrailerExplorer({ sections }: { sections: Section[] }) {
  const [step, setStep]                   = useState<Step>('brand')
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<Section | null>(null)
  const [products, setProducts]           = useState<SectionProduct[]>([])
  const [loading, setLoading]             = useState(false)

  const handleBrandSelect = (brand: string) => {
    setSelectedBrand(brand)
    setActiveSection(null)
    setProducts([])
    setStep('category')
  }

  const handleSectionSelect = async (section: Section) => {
    setActiveSection(section)
    setLoading(true)
    setProducts([])
    const dbBrands = selectedBrand ? (BRAND_DB_NAMES[selectedBrand] ?? []) : []
    const data = await getProductsBySectionAndBrand(section.id, dbBrands.length > 0 ? dbBrands : null)
    setProducts(data)
    setLoading(false)
  }

  const handleBack = () => {
    setStep('brand')
    setSelectedBrand(null)
    setActiveSection(null)
    setProducts([])
  }

  // Build /products URL with brand filter
  const productsUrl = selectedBrand && selectedBrand !== 'Others'
    ? `/products?brand=${encodeURIComponent(selectedBrand)}`
    : '/products'

  // ── STEP 1: Brand Selection ─────────────────────────────────────
  if (step === 'brand') {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--on-surface-dim)] mb-1"
            style={{ fontFamily: 'Space Grotesk' }}>
            Step 1 of 2
          </p>
          <h3 className="text-lg font-black uppercase tracking-wide" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>
            Select Your <span className="text-[#E31E24]">Trailer Brand</span>
          </h3>
          <p className="text-[10px] text-[var(--on-surface-dim)] mt-1" style={{ fontFamily: 'Space Grotesk' }}>
            Choose a brand to browse parts by trailer section
          </p>
        </div>

        {/* Brand grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {FEATURED_BRANDS.map(brand => (
            <button
              key={brand}
              onClick={() => handleBrandSelect(brand)}
              style={{ fontFamily: 'Space Grotesk', backgroundColor: BRAND_COLORS[brand] ?? '#1a1a2e' }}
              className="group relative flex flex-col items-center justify-center gap-2 p-4 border border-white/10 hover:border-[#E31E24] transition-all duration-200 hover:scale-[1.03] hover:shadow-lg hover:shadow-[#E31E24]/10"
            >
                  {/* Logo image on white pill */}
              <div className="w-full h-12 flex items-center justify-center px-3 py-1.5 rounded bg-white">
                <img
                  src={BRAND_LOGOS[brand]}
                  alt={brand}
                  className="max-h-9 max-w-full object-contain"
                />
              </div>
              <span className="text-white/70 text-[9px] font-bold uppercase tracking-wide text-center leading-tight">
                {brand}
              </span>
              {/* hover arrow */}
              <span className="absolute top-2 right-2 text-[#E31E24] opacity-0 group-hover:opacity-100 transition-opacity text-xs">→</span>
            </button>
          ))}

          {/* Others card */}
          <button
            onClick={() => handleBrandSelect('Others')}
            style={{ fontFamily: 'Space Grotesk' }}
            className="group relative flex flex-col items-center justify-center gap-2 p-4 border border-dashed border-white/20 hover:border-[#E31E24] transition-all duration-200 hover:scale-[1.03]"
          >
            <div className="w-10 h-10 flex items-center justify-center border border-white/20 group-hover:border-[#E31E24]/60 transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <span className="text-[var(--on-surface-dim)] text-lg leading-none">···</span>
            </div>
            <span className="text-[var(--on-surface-dim)] text-[10px] font-bold uppercase tracking-wide group-hover:text-white transition-colors">
              Others
            </span>
          </button>
        </div>
      </div>
    )
  }

  // ── STEP 2: Category Selection + Products ───────────────────────
  return (
    <div className="flex flex-col gap-4">

      {/* Breadcrumb / back */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          style={{ fontFamily: 'Space Grotesk' }}
          className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[var(--on-surface-dim)] hover:text-[#E31E24] transition-colors"
        >
          ← Change Brand
        </button>
        <span className="text-[var(--on-surface-dim)]/30 text-xs">|</span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--on-surface-dim)]"
            style={{ fontFamily: 'Space Grotesk' }}>Brand:</span>
          <span className="text-[10px] font-black uppercase text-[#E31E24] border border-[#E31E24]/30 px-2 py-0.5"
            style={{ fontFamily: 'Space Grotesk' }}>
            {selectedBrand}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 items-start">

        {/* ── Left: 3D viewer + category tabs ── */}
        <div className="flex flex-col gap-3">
          <div
            className="w-full border border-[#cbd0dd]/20"
            style={{ height: 400, backgroundColor: 'var(--surface-raised)', position: 'relative' }}
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

            {/* Active section overlay */}
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
          </div>

          {/* Section tabs + Other Categories */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--on-surface-dim)] mr-1"
              style={{ fontFamily: 'Space Grotesk' }}>Category:</span>
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

            {/* Other Categories → redirects to /products */}
            <Link
              href={productsUrl}
              style={{ fontFamily: 'Space Grotesk' }}
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide border border-dashed border-[#cbd0dd]/30 text-[var(--on-surface-dim)] hover:border-[#E31E24] hover:text-[#E31E24] transition-all duration-200 flex items-center gap-1"
            >
              Other Categories →
            </Link>
          </div>
        </div>

        {/* ── Right: Product Panel ── */}
        <div
          className="border border-[#cbd0dd]/20 flex flex-col"
          style={{ backgroundColor: 'var(--surface-card)', minHeight: 400 }}
        >
          {!activeSection ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-4">
              <svg width="48" height="30" viewBox="0 0 52 32" fill="none" stroke="#cbd0dd" strokeWidth="1" opacity="0.4">
                <rect x="1" y="4" width="34" height="18" rx="1"/>
                <rect x="34" y="8" width="13" height="10" rx="1"/>
                <circle cx="10" cy="26" r="4"/>
                <circle cx="21" cy="26" r="4"/>
                <circle cx="39" cy="26" r="4"/>
                <line x1="1" y1="11" x2="35" y2="11"/>
              </svg>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--on-surface-dim)] mb-1"
                  style={{ fontFamily: 'Space Grotesk' }}>
                  Select a trailer section
                </p>
                <p className="text-[9px] text-[var(--on-surface-dim)]/50" style={{ fontFamily: 'Space Grotesk' }}>
                  Click the 3D model or choose<br />a category tab
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Panel header */}
              <div className="px-4 py-3 border-b border-[#cbd0dd]/20 flex items-start justify-between flex-shrink-0">
                <div>
                  <p className="text-[8px] text-[var(--on-surface-dim)] uppercase tracking-[0.2em] font-bold mb-0.5"
                    style={{ fontFamily: 'Space Grotesk' }}>
                    {selectedBrand} · {displayName(activeSection.title)}
                  </p>
                  <h3 className="text-sm font-black uppercase text-[#E31E24]" style={{ fontFamily: 'Space Grotesk' }}>
                    {displayName(activeSection.title)} Parts
                  </h3>
                </div>
                {!loading && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-black text-[var(--on-surface)]" style={{ fontFamily: 'Space Grotesk' }}>{products.length}</p>
                    <p className="text-[8px] text-[var(--on-surface-dim)] uppercase tracking-widest" style={{ fontFamily: 'Space Grotesk' }}>Parts</p>
                  </div>
                )}
              </div>

              {/* Products */}
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-7 h-7 border-2 border-[#E31E24] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : products.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--on-surface-dim)]"
                    style={{ fontFamily: 'Space Grotesk' }}>
                    No parts found for this section
                  </p>
                  <Link
                    href={productsUrl}
                    className="text-[10px] font-bold uppercase tracking-widest text-[#E31E24] border border-[#E31E24]/40 px-4 py-2 hover:bg-[#E31E24]/10 transition-colors"
                    style={{ fontFamily: 'Space Grotesk' }}
                  >
                    Browse Full Catalog →
                  </Link>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto divide-y divide-[#cbd0dd]/10" style={{ maxHeight: 320 }}>
                  {products.map(p => (
                    <Link
                      key={p.id}
                      href={`/products/${p.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#E31E24]/5 transition-colors group"
                    >
                      <div className="w-9 h-9 flex-shrink-0 border border-[#cbd0dd]/20 bg-[#111] flex items-center justify-center overflow-hidden">
                        {p.primary_image_url ? (
                          <img src={p.primary_image_url} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#cbd0dd" strokeWidth="1">
                            <rect x="3" y="3" width="18" height="18"/>
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-[9px] text-[#E31E24] leading-none mb-0.5">{p.sku}</p>
                        <p className="text-[11px] font-bold uppercase truncate leading-tight group-hover:text-[#E31E24] transition-colors"
                          style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>
                          {p.name}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-[7px] font-bold uppercase tracking-wide px-1.5 py-0.5 border ${
                          p.in_stock
                            ? 'text-green-400 border-green-800/40 bg-green-950/40'
                            : 'text-orange-400 border-orange-800/40 bg-orange-950/40'
                        }`}>
                          {p.in_stock ? 'Stock' : 'Out'}
                        </span>
                        <span className="text-[#E31E24] text-xs group-hover:translate-x-0.5 transition-transform">→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Footer */}
              {!loading && products.length > 0 && (
                <div className="px-4 py-3 border-t border-[#cbd0dd]/20 flex-shrink-0">
                  <Link
                    href={productsUrl}
                    className="text-[9px] font-bold uppercase tracking-widest text-[var(--on-surface-dim)] hover:text-[#E31E24] transition-colors"
                    style={{ fontFamily: 'Space Grotesk' }}
                  >
                    Browse Full {selectedBrand} Catalog →
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
