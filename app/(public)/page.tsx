import Link from 'next/link'
import { searchProducts, getTrailerSections } from '@/app/actions/products'
import { TrailerExplorer } from '@/components/TrailerExplorer'

const CATEGORIES = [
  { name: 'Trailer Body',   slug: 'TRAILER BODY PARTS', desc: 'Fenders, panels, doors and structural components' },
  { name: 'Trailer Lights', slug: 'TRAILER LIGHTS',     desc: 'LED, brake, turn and marker lights' },
  { name: 'Tools',          slug: 'TOOLS',              desc: 'Specialty tools for trailer repair and service' },
  { name: 'Hardware',       slug: 'HARDWARE',           desc: 'Fasteners, hinges, latches and mounting hardware' },
]

const TRUST = [
  { title: 'Quality Guaranteed', sub: 'Every part meets industry standards' },
  { title: 'B2B Wholesale',      sub: 'Competitive pricing for businesses' },
  { title: 'Fast Response',      sub: 'Quote back within 24 hours' },
  { title: '3,400+ Parts',       sub: 'Comprehensive trailer parts catalog' },
]

export default async function HomePage() {
  const [featured, trailerSections] = await Promise.all([
    searchProducts({ query: '', limit: 50, page: 1 }).catch(() => []),
    getTrailerSections().catch(() => []),
  ])

  return (
    <div style={{ backgroundColor: '#f0f2f5' }}>

      {/* ════════════════════════════════════════════════════════
          HERO — flush to navbar, no dead space
      ════════════════════════════════════════════════════════ */}
      <section className="-mt-[72px]" style={{ paddingTop: 72 }}>

        {/* ── Red power stripe ─────────────────────────────────── */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #E31E24 0%, #c01219 60%, #E31E24 100%)' }} />

        {/* ── Brand identity bar — white, flush ────────────────── */}
        <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e6ea' }}>
          <div className="max-w-[1440px] mx-auto px-10 py-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            {/* Left: HK + divider + tagline */}
            <div className="flex items-center gap-5">
              <div style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(2.8rem,4.5vw,4rem)', fontWeight: 900, letterSpacing: '-0.055em', color: '#111827', lineHeight: 1 }}>
                HK
              </div>
              <div style={{ width: 1.5, height: 52, backgroundColor: '#e4e6ea', flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#E31E24', marginBottom: 4 }}>
                  Trailer Parts
                </div>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.45, maxWidth: 260 }}>
                  Canada's B2B wholesale source<br />for trailer & mechanical parts.
                </div>
              </div>
            </div>

            {/* Right: stats + CTA */}
            <div className="flex flex-wrap items-center gap-5 lg:gap-7">
              {/* Stat dividers */}
              <div className="flex items-center gap-5 lg:gap-6" style={{ borderLeft: '1px solid #e4e6ea', paddingLeft: 20 }}>
                {[['3,400+', 'Parts in Stock'], ['B2B', 'Wholesale Only'], ['24h', 'Quote Response']].map(([val, label], i) => (
                  <div key={label} className="flex items-center gap-5 lg:gap-6">
                    <div>
                      <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.45rem', fontWeight: 900, color: '#111827', lineHeight: 1 }}>{val}</div>
                      <div style={{ fontFamily: 'Space Grotesk', fontSize: '0.52rem', textTransform: 'uppercase', letterSpacing: '0.18em', color: '#9ca3af', marginTop: 3 }}>{label}</div>
                    </div>
                    {i < 2 && <div style={{ width: 1, height: 32, backgroundColor: '#e4e6ea', flexShrink: 0 }} />}
                  </div>
                ))}
              </div>
              <Link
                href="/products"
                className="btn-primary inline-flex items-center gap-2"
                style={{ fontSize: '0.68rem', padding: '11px 24px', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}
              >
                Browse Catalog
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>

          </div>
        </div>

        {/* ── Explorer section — grey field ─────────────────────── */}
        <div style={{ backgroundColor: '#f0f2f5', padding: '28px 40px 44px' }}>
          <div className="max-w-[1440px] mx-auto">

            {/* Section label */}
            <div className="flex items-center gap-3 mb-6">
              <div style={{ width: 3, height: 16, backgroundColor: '#E31E24', borderRadius: 2, flexShrink: 0 }} />
              <span style={{ fontFamily: 'Space Grotesk', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.22em', color: '#374151' }}>
                Explore by Trailer
              </span>
              <span style={{ fontFamily: 'Space Grotesk', fontSize: '0.58rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.28em', color: '#9ca3af' }}>
                · Click a section · Drag to rotate
              </span>
            </div>

            {/* Explorer component */}
            <TrailerExplorer sections={trailerSections} darkMode={false} sceneHeight={430} />

          </div>
        </div>

      </section>

      {/* ════════════════════════════════════════════════════════
          FEATURED PRODUCTS
      ════════════════════════════════════════════════════════ */}
      <section className="py-16 px-6 lg:px-12" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-[1440px] mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="section-label mb-2">Featured Products</p>
              <h2 className="text-3xl font-black uppercase tracking-tight" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>Popular Parts</h2>
            </div>
            <Link href="/products" className="btn-outline hidden md:inline-block px-5 py-2 text-xs rounded-sm">View All</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#E31E24 transparent' }}>
            {featured.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`} className="hk-card group flex flex-col rounded-sm overflow-hidden flex-shrink-0" style={{ width: 200 }}>
                <div className="relative flex items-center justify-center p-4" style={{ backgroundColor: '#f9fafb', height: 160 }}>
                  {product.primary_image_url ? (
                    <img src={product.primary_image_url} alt={product.name} className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1"><rect x="3" y="3" width="18" height="18"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  )}
                  <div className="absolute top-2 right-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest" style={{ backgroundColor: product.in_stock ? '#E31E24' : '#6b7280', color: '#ffffff', fontFamily: 'Space Grotesk' }}>
                    {product.in_stock ? 'In Stock' : 'Out'}
                  </div>
                </div>
                <div className="p-3 flex flex-col gap-1 flex-1">
                  {product.category && <p className="text-[9px] font-bold uppercase tracking-widest truncate" style={{ color: '#E31E24', fontFamily: 'Space Grotesk' }}>{product.category}</p>}
                  <p className="text-xs font-semibold leading-snug line-clamp-2 flex-1" style={{ color: 'var(--on-surface)' }}>{product.name}</p>
                  <p className="text-[10px] font-mono mt-1" style={{ color: 'var(--on-surface-dim)' }}>{product.sku}</p>
                </div>
              </Link>
            ))}
            <Link href="/products" className="flex-shrink-0 flex flex-col items-center justify-center gap-3 rounded-sm border-2 border-dashed border-[#E31E24]/30 hover:border-[#E31E24] transition-colors" style={{ width: 160, minHeight: 240 }}>
              <span className="text-3xl" style={{ color: '#E31E24' }}>→</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-center" style={{ color: '#E31E24', fontFamily: 'Space Grotesk' }}>View Full<br />Catalog</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CATEGORIES + TRUST
      ════════════════════════════════════════════════════════ */}
      <section className="px-6 lg:px-12 pb-16" style={{ backgroundColor: '#f0f2f5' }}>
        <div className="max-w-[1440px] mx-auto">
          <p className="section-label mb-2 pt-16">Browse by Category</p>
          <h2 className="text-3xl font-black uppercase tracking-tight mb-10" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>Shop by Section</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <Link key={cat.slug} href={`/products?category=${encodeURIComponent(cat.slug)}`} className="hk-card group block p-6 rounded-sm">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: '#fff1f2' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E31E24" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                </div>
                <h3 className="font-bold uppercase text-sm tracking-wide mb-2" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>{cat.name}</h3>
                <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--on-surface-dim)' }}>{cat.desc}</p>
                <div className="text-xs font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: '#E31E24', fontFamily: 'Space Grotesk' }}>Shop Now <span>&#8594;</span></div>
              </Link>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-14 pt-10" style={{ borderTop: '1px solid var(--border)' }}>
            {TRUST.map((item) => (
              <div key={item.title} className="text-center px-2">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#fff1f2' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E31E24" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <h5 className="font-bold text-sm mb-1" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>{item.title}</h5>
                <p className="text-xs" style={{ color: 'var(--on-surface-dim)' }}>{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CTA BANNER
      ════════════════════════════════════════════════════════ */}
      <section className="py-16 px-6 lg:px-12" style={{ backgroundColor: '#E31E24' }}>
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight mb-2" style={{ fontFamily: 'Space Grotesk' }}>Ready to place an inquiry?</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>{"Sign in, add parts to your cart, and submit — we'll reach out with a quote."}</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link href="/products" className="inline-block px-8 py-3 text-xs font-bold uppercase tracking-widest text-white border-2 border-white hover:bg-white hover:text-[#E31E24] transition-colors" style={{ fontFamily: 'Space Grotesk' }}>Browse Catalog</Link>
            <Link href="/signup" className="inline-block px-8 py-3 text-xs font-bold uppercase tracking-widest bg-white hover:opacity-90 transition-opacity" style={{ fontFamily: 'Space Grotesk', color: '#E31E24' }}>Sign Up</Link>
          </div>
        </div>
      </section>

    </div>
  )
}
