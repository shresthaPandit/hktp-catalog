import Link from 'next/link'
import { searchProducts, getTrailerSections } from '@/app/actions/products'
import { TrailerExplorer } from '@/components/TrailerExplorer'
import { HeroTestimonials } from '@/components/HeroTestimonials'

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
    searchProducts({ query: '', limit: 8, page: 1 }).catch(() => []),
    getTrailerSections().catch(() => []),
  ])

  return (
    <div style={{ backgroundColor: 'var(--surface)' }}>

      {/* HERO */}
      <section className="-mt-[72px] relative overflow-hidden flex items-center" style={{ backgroundColor: '#1a1f2e', minHeight: '100vh' }}>
        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: '#E31E24' }} />
        <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center" style={{ paddingTop: '140px', paddingBottom: '120px' }}>

          {/* Left — headline + CTA */}
          <div>
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 text-xs font-bold uppercase tracking-widest border rounded-sm" style={{ borderColor: 'rgba(227,30,36,0.5)', color: '#E31E24', fontFamily: 'Space Grotesk' }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: '#E31E24' }} />
              Wholesale Parts Supplier
            </div>
            <h1 className="font-black uppercase text-white mb-5" style={{ fontFamily: 'Space Grotesk', fontSize: 'clamp(3rem, 5vw, 5rem)', letterSpacing: '-0.02em', lineHeight: '0.9' }}>
              HK Trailer<br />
              <span style={{ color: '#E31E24' }}>Parts</span>
            </h1>
            <p className="text-base leading-relaxed mb-8 max-w-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {"Canada's trusted wholesale source for trailer and mechanical parts. Browse 3,400+ products and submit an inquiry — we'll contact you with pricing."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/products" className="btn-primary inline-block px-8 py-3 text-sm">Browse Parts Catalog</Link>
              <Link href="/login" className="inline-block px-8 py-3 font-bold uppercase tracking-widest border transition-all text-white hover:bg-white hover:text-gray-900" style={{ fontFamily: 'Space Grotesk', borderColor: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>Sign In to Order</Link>
            </div>
            <div className="flex gap-10 mt-12 pt-10" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
              {[['3,400+', 'Parts in Stock'], ['B2B', 'Wholesale Only'], ['24h', 'Quote Turnaround']].map(([val, label]) => (
                <div key={label}>
                  <div className="text-2xl font-black text-white" style={{ fontFamily: 'Space Grotesk' }}>{val}</div>
                  <div className="text-xs uppercase tracking-widest mt-1" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Space Grotesk' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — testimonials */}
          <div className="hidden lg:block">
            <HeroTestimonials />
          </div>

        </div>
      </section>

      {/* TRAILER EXPLORER */}
      <section className="py-16 px-6 lg:px-12" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-[1440px] mx-auto">
          <p className="section-label mb-2">Interactive Parts Finder</p>
          <h2 className="text-3xl font-black uppercase tracking-tight mb-10" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>Explore by Trailer Section</h2>
          <TrailerExplorer sections={trailerSections} />
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="py-16 px-6 lg:px-12" style={{ backgroundColor: 'var(--surface)' }}>
        <div className="max-w-[1440px] mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="section-label mb-2">Featured Products</p>
              <h2 className="text-3xl font-black uppercase tracking-tight" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>Popular Parts</h2>
            </div>
            <Link href="/products" className="btn-outline hidden md:inline-block px-5 py-2 text-xs rounded-sm">View All</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.slice(0, 8).map((product) => (
              <Link key={product.id} href={`/products/${product.id}`} className="hk-card group flex flex-col rounded-sm overflow-hidden">
                <div className="relative h-44 flex items-center justify-center p-4" style={{ backgroundColor: '#f9fafb' }}>
                  {product.primary_image_url ? (
                    <img src={product.primary_image_url} alt={product.name} className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1"><rect x="3" y="3" width="18" height="18"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  )}
                  <div className="absolute top-2 right-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest" style={{ backgroundColor: product.in_stock ? '#E31E24' : '#6b7280', color: '#ffffff', fontFamily: 'Space Grotesk' }}>
                    {product.in_stock ? 'In Stock' : 'Out of Stock'}
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-1 flex-1">
                  {product.category && <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#E31E24', fontFamily: 'Space Grotesk' }}>{product.category}</p>}
                  <p className="text-sm font-semibold leading-snug line-clamp-2 flex-1" style={{ color: 'var(--on-surface)' }}>{product.name}</p>
                  <p className="text-xs font-mono mt-1" style={{ color: 'var(--on-surface-dim)' }}>{product.sku}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center md:hidden">
            <Link href="/products" className="btn-primary inline-block px-10 py-3 text-sm">View Full Catalog</Link>
          </div>
        </div>
      </section>

      {/* CATEGORIES + TRUST SIGNALS */}
      <section className="px-6 lg:px-12 pb-16" style={{ backgroundColor: '#ffffff' }}>
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

      {/* CTA BANNER */}
      <section className="py-16 px-6 lg:px-12" style={{ backgroundColor: '#E31E24' }}>
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight mb-2" style={{ fontFamily: 'Space Grotesk' }}>Ready to place an inquiry?</h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>{"Sign in, add parts to your cart, and submit — we'll reach out with a quote."}</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link href="/products" className="inline-block px-8 py-3 text-xs font-bold uppercase tracking-widest text-white border-2 border-white hover:bg-white hover:text-[#E31E24] transition-colors" style={{ fontFamily: 'Space Grotesk' }}>Browse Catalog</Link>
            <Link href="/login" className="inline-block px-8 py-3 text-xs font-bold uppercase tracking-widest bg-white hover:opacity-90 transition-opacity" style={{ fontFamily: 'Space Grotesk', color: '#E31E24' }}>Sign In</Link>
          </div>
        </div>
      </section>

    </div>
  )
}
