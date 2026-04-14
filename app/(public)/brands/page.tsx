import Link from 'next/link'
import { getBrandsWithMeta } from '@/app/actions/products'

export default async function BrandsPage() {
  const brands = await getBrandsWithMeta()

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface)' }}>
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ backgroundColor: 'var(--surface-card)', borderBottom: '3px solid #E31E24' }}>
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E31E24]" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#E31E24] mb-2" style={{ fontFamily: 'Space Grotesk' }}>
            Browse
          </p>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>
            Brands
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--on-surface-dim)' }}>
            {brands.length} brands · Logos shown represent the manufacturers of products we carry.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {brands.map(({ brand, count, image }) => (
            <Link
              key={brand}
              href={`/products?brand=${encodeURIComponent(brand)}`}
              className="group card-3d flex flex-col overflow-hidden"
              style={{ backgroundColor: 'var(--surface-card)' }}
            >
              {/* Image / Logo area */}
              <div className="relative h-44 overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'var(--surface-raised)' }}>
                {image ? (
                  <img
                    src={image}
                    alt={brand}
                    className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2" style={{ color: 'var(--border-dim)' }}>
                    <span className="text-2xl font-black uppercase tracking-tighter" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface-dim)' }}>
                      {brand.slice(0, 2)}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E31E24] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="text-xs font-black uppercase tracking-tight leading-snug" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>
                  {brand}
                </p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--on-surface-dim)' }}>
                  {count.toLocaleString()} {count === 1 ? 'Product' : 'Products'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
