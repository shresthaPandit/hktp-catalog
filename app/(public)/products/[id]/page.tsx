import { notFound } from 'next/navigation'
import { getProduct, getSimilarProducts } from '@/app/actions/products'
import { getCurrentUser } from '@/app/actions/auth'
import { ProductImageGallery } from '@/components/ProductImageGallery'
import { Badge } from '@/components/ui/Badge'
import { ProductCard } from '@/components/ProductCard'
import { AddToCartSection } from '@/components/AddToCartSection'
import type { ProductSearchResult } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params
  const productId = parseInt(id, 10)

  if (isNaN(productId)) notFound()

  const [product, authResult] = await Promise.all([
    getProduct(productId),
    getCurrentUser(),
  ])
  if (!product) notFound()

  const relatedProducts = await getSimilarProducts(productId, Number(product.external_id) || 0, product.category ?? null)

  const relatedAsSearchResults: ProductSearchResult[] = relatedProducts.map(p => ({
    id: p.id,
    external_id: p.external_id,
    sku: p.sku,
    name: p.name,
    description: p.description ?? null,
    category: p.category,
    brand: p.brand,
    price: p.price,
    primary_image_url: p.primary_image_url,
    in_stock: p.in_stock,
    relevance: 0,
  }))


  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold mb-8" style={{ fontFamily: 'Space Grotesk' }}>
          <a href="/products" className="text-[var(--on-surface-dim)] hover:text-[#E31E24] transition-colors">HK</a>
          <span className="text-[var(--on-surface-dim)]">/</span>
          <a href="/products" className="text-[var(--on-surface-dim)] hover:text-[#E31E24] transition-colors">Catalog</a>
          {product.category && (
            <>
              <span className="text-[var(--on-surface-dim)]">/</span>
              <a href={`/products?category=${encodeURIComponent(product.category)}`} className="text-[var(--on-surface-dim)] hover:text-[#E31E24] transition-colors">
                {product.category}
              </a>
            </>
          )}
          <span className="text-[var(--on-surface-dim)]">/</span>
          <span className="text-[#E31E24] truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Main product section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <ProductImageGallery
            images={product.image_urls ?? []}
            primaryImage={product.primary_image_url}
            productName={product.name}
          />

          {/* Product Info */}
          <div className="space-y-5">
            <div>
              {product.category && (
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#E31E24] mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                  {product.category}
                </p>
              )}
              <p className="font-mono text-sm text-[var(--on-surface-dim)] mb-2">{product.sku}</p>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>
                {product.name}
              </h1>
              {product.brand && (
                <p className="text-sm mt-2" style={{ color: 'var(--on-surface-dim)' }}>by {product.brand}</p>
              )}
            </div>

            <Badge variant={product.in_stock ? 'success' : 'danger'}>
              {product.in_stock ? 'In Stock' : 'Out of Stock'}
            </Badge>

            {product.description && (
              <p className="text-sm leading-relaxed border-l-2 border-[#cbd0dd]/40 pl-4" style={{ color: 'var(--on-surface-dim)' }}>
                {product.description}
              </p>
            )}

            {/* Add to Cart CTA */}
            <AddToCartSection
              productId={product.id} isAuthenticated={!!authResult}
              sku={product.sku} name={product.name}
              price={product.price} primary_image_url={product.primary_image_url}
              in_stock={product.in_stock}
            />

            {/* Alternate SKUs */}
            {product.alternate_skus && product.alternate_skus.length > 0 && (
              <div className="pt-4 border-t border-[#cbd0dd]/20">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E31E24] mb-3" style={{ fontFamily: 'Space Grotesk' }}>
                  Alternate Part Numbers
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.alternate_skus.map((sku, idx) => (
                    <a
                      key={idx}
                      href={`/products?q=${encodeURIComponent(sku.split(' ')[0])}`}
                      className="font-mono text-xs border border-[#cbd0dd]/40 px-3 py-1.5 hover:border-[#E31E24] hover:text-[#E31E24] transition-colors"
                      style={{ backgroundColor: 'var(--surface-raised)', color: 'var(--on-surface-dim)' }}
                    >
                      {sku}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>


        {/* Related Parts */}
        {relatedAsSearchResults.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-1 w-12 bg-[#E31E24]" />
              <h2 className="text-xl font-black uppercase tracking-tight" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>
                Related Parts
              </h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {relatedAsSearchResults.map(related => (
                <div key={related.id} className="flex-shrink-0 w-52">
                  <ProductCard product={related} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
