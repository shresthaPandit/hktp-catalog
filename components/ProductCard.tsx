'use client'
import Link from 'next/link'
import type { ProductSearchResult } from '@/lib/types'

export function ProductCard({ product }: { product: ProductSearchResult }) {
  return (
    <Link href={`/products/${product.id}`}
      className="group card-3d flex flex-col"
      style={{ backgroundColor: 'var(--surface-card)' }}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden" style={{ backgroundColor: 'var(--surface-raised)' }}>
        {product.primary_image_url ? (
          <img src={product.primary_image_url} alt={product.name}
            className="w-full h-full object-contain transition-all duration-500 p-3 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--border-dim)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
        )}
        <div
          className={`absolute top-0 right-0 px-2 py-1 text-[9px] font-bold uppercase tracking-widest ${product.in_stock ? 'metallic-gradient text-white' : 'bg-gray-200 text-gray-600'}`}
          style={{ fontFamily: 'Space Grotesk' }}
        >
          {product.in_stock ? 'In Stock' : 'Out of Stock'}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#E31E24] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {product.category && (
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#E31E24]" style={{ fontFamily: 'Space Grotesk' }}>{product.category}</p>
        )}
        <p className="font-mono text-[10px]" style={{ color: 'var(--on-surface-dim)' }}>{product.sku}</p>
        <p className="text-sm font-bold uppercase leading-tight line-clamp-2 flex-1" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>
          {product.name}
        </p>
      </div>
    </Link>
  )
}
