'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { getProductsBySection } from '@/app/actions/products'

// Load Three.js scene client-side only (no SSR)
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

export function TrailerExplorer({ sections }: { sections: Section[] }) {
  const [activeSection, setActiveSection] = useState<Section | null>(null)
  const [products, setProducts] = useState<SectionProduct[]>([])
  const [loading, setLoading] = useState(false)

  const handleSectionSelect = async (section: Section) => {
    setActiveSection(section)
    setLoading(true)
    setProducts([])
    const data = await getProductsBySection(section.id)
    setProducts(data)
    setLoading(false)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">

      {/* ── Left: 3D Viewer ── */}
      <div className="flex flex-col gap-4">
        {/* Canvas container */}
        <div
          className="w-full border border-[#cbd0dd]/20"
          style={{ height: 420, backgroundColor: 'var(--surface-raised)', position: 'relative' }}
        >
          <TrailerScene
            sections={sections}
            activeSection={activeSection}
            onSectionSelect={handleSectionSelect}
          />

          {/* Corner label */}
          <div className="absolute top-4 left-4 pointer-events-none">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--on-surface-dim)]"
              style={{ fontFamily: 'Space Grotesk' }}>
              3D Parts Map
            </p>
            <p className="text-[8px] text-[var(--on-surface-dim)]/60 mt-0.5" style={{ fontFamily: 'Space Grotesk' }}>
              Drag to rotate · Click a section
            </p>
          </div>

          {/* Active section label overlay */}
          {activeSection && (
            <div className="absolute top-4 right-4 pointer-events-none">
              <div className="border-l-2 border-[#E31E24] pl-3">
                <p className="text-[8px] text-[var(--on-surface-dim)] uppercase tracking-widest" style={{ fontFamily: 'Space Grotesk' }}>Selected</p>
                <p className="text-xs font-black uppercase text-[#E31E24]" style={{ fontFamily: 'Space Grotesk' }}>
                  {activeSection.title}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Section tabs */}
        <div className="flex flex-wrap gap-2">
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
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: Product Panel ── */}
      <div
        className="border border-[#cbd0dd]/20 flex flex-col"
        style={{ backgroundColor: 'var(--surface-card)', minHeight: 420 }}
      >
        {!activeSection ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-5">
            <svg width="52" height="52" viewBox="0 0 52 32" fill="none" stroke="#cbd0dd" strokeWidth="1" opacity="0.5">
              <rect x="1" y="4" width="34" height="18" rx="1"/>
              <rect x="34" y="8" width="13" height="10" rx="1"/>
              <circle cx="10" cy="26" r="4"/>
              <circle cx="21" cy="26" r="4"/>
              <circle cx="39" cy="26" r="4"/>
              <line x1="1" y1="11" x2="35" y2="11"/>
              <line x1="6" y1="22" x2="6" y2="26" strokeWidth="0.5"/>
              <line x1="9" y1="22" x2="9" y2="26" strokeWidth="0.5"/>
            </svg>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--on-surface-dim)] mb-1"
                style={{ fontFamily: 'Space Grotesk' }}>
                Select a trailer section
              </p>
              <p className="text-[9px] text-[var(--on-surface-dim)]/50" style={{ fontFamily: 'Space Grotesk' }}>
                Click directly on the 3D model<br />or choose a tab above
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#cbd0dd]/20 flex items-start justify-between flex-shrink-0">
              <div>
                <p className="text-[9px] text-[var(--on-surface-dim)] uppercase tracking-[0.2em] font-bold mb-0.5"
                  style={{ fontFamily: 'Space Grotesk' }}>
                  Trailer Section
                </p>
                <h3 className="text-sm font-black uppercase tracking-wide text-[#E31E24]"
                  style={{ fontFamily: 'Space Grotesk' }}>
                  {activeSection.title}
                </h3>
              </div>
              {!loading && (
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-black text-[var(--on-surface)]" style={{ fontFamily: 'Space Grotesk' }}>
                    {products.length}
                  </p>
                  <p className="text-[9px] text-[var(--on-surface-dim)] uppercase tracking-widest"
                    style={{ fontFamily: 'Space Grotesk' }}>
                    Parts Found
                  </p>
                </div>
              )}
            </div>

            {/* Products list */}
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#E31E24] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <p className="text-[10px] uppercase tracking-widest text-[var(--on-surface-dim)]"
                  style={{ fontFamily: 'Space Grotesk' }}>
                  No parts catalogued for this section yet
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto divide-y divide-[#cbd0dd]/10" style={{ maxHeight: 340 }}>
                {products.map(p => (
                  <Link
                    key={p.id}
                    href={`/products/${p.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#E31E24]/5 transition-colors group"
                  >
                    <div className="w-10 h-10 flex-shrink-0 border border-[#cbd0dd]/20 bg-[#111] flex items-center justify-center overflow-hidden">
                      {p.primary_image_url ? (
                        <img src={p.primary_image_url} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd0dd" strokeWidth="1">
                          <rect x="3" y="3" width="18" height="18"/>
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[10px] text-[#E31E24] leading-none mb-0.5">{p.sku}</p>
                      <p className="text-xs font-bold uppercase truncate leading-tight group-hover:text-[#E31E24] transition-colors"
                        style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>
                        {p.name}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 border ${
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
              <div className="px-5 py-3 border-t border-[#cbd0dd]/20 flex-shrink-0">
                <Link
                  href="/products"
                  className="text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface-dim)] hover:text-[#E31E24] transition-colors"
                  style={{ fontFamily: 'Space Grotesk' }}
                >
                  Browse Full Catalog →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
