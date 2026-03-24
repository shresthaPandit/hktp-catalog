import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth'
import { getCart } from '@/app/actions/cart'
import { createOrder } from '@/app/actions/orders'
import { formatPrice } from '@/lib/utils'
import CheckoutForm from './CheckoutForm'

export default async function CheckoutPage() {
  const result = await getCurrentUser()
  if (!result) redirect('/login')

  const { profile } = result
  const cartItems = await getCart()
  if (cartItems.length === 0) redirect('/products')

  const total = cartItems.reduce((sum, i) => sum + (i.subtotal ?? 0), 0)
  const totalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface)' }}>
      {/* Page header */}
      <div className="relative overflow-hidden" style={{ backgroundColor: 'var(--surface-alt)' }}>
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E31E24]" />
        <div className="absolute left-1 top-0 bottom-0 w-24 bg-gradient-to-r from-[#E31E24]/10 to-transparent" />
        <div className="relative px-4 sm:px-6 lg:px-8 py-8 max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-3 text-[10px] uppercase tracking-[0.2em] font-bold" style={{ fontFamily: 'Space Grotesk' }}>
            <span className="text-[var(--on-surface-dim)]">HK</span>
            <span className="text-[var(--on-surface-dim)]">/</span>
            <span className="text-[#E31E24]">Checkout</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>
            PLACE <span className="text-[#E31E24]">INQUIRY</span>
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E31E24] mb-4" style={{ fontFamily: 'Space Grotesk' }}>
              Order Summary
            </p>
            <div className="border border-[#cbd0dd]/20 divide-y divide-[#cbd0dd]/10" style={{ backgroundColor: 'var(--surface-card)' }}>
              {cartItems.map(item => (
                <div key={item.cart_item_id} className="flex items-center gap-3 p-3">
                  <div className="w-12 h-12 border border-[#cbd0dd]/20 flex-shrink-0 overflow-hidden" style={{ backgroundColor: 'var(--surface-raised)' }}>
                    <img
                      src={item.primary_image_url ?? '/placeholder.png'}
                      className="w-full h-full object-contain p-1"
                      alt={item.name}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase leading-tight truncate" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>{item.name}</p>
                    <p className="font-mono text-[10px] text-[var(--on-surface-dim)]">{item.sku}</p>
                    <p className="text-[10px] text-[var(--on-surface-dim)]" style={{ fontFamily: 'Space Grotesk' }}>Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-[#E31E24]" style={{ fontFamily: 'Space Grotesk' }}>
                    {item.subtotal != null ? formatPrice(item.subtotal) : '—'}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-2 p-3 border border-[#cbd0dd]/20" style={{ backgroundColor: 'var(--surface-raised)' }}>
              <div className="flex justify-between text-xs" style={{ fontFamily: 'Space Grotesk' }}>
                <span className="uppercase tracking-wide text-[var(--on-surface-dim)]">Total items:</span>
                <span className="font-bold" style={{ color: 'var(--on-surface)' }}>{totalItems}</span>
              </div>
              <div className="flex justify-between text-xs mt-1" style={{ fontFamily: 'Space Grotesk' }}>
                <span className="uppercase tracking-wide text-[var(--on-surface-dim)]">Reference price:</span>
                <span className="font-black text-[#E31E24]">{formatPrice(total)}</span>
              </div>
              <p className="text-[10px] text-[var(--on-surface-dim)] mt-1" style={{ fontFamily: 'Space Grotesk' }}>
                Final price confirmed by our team
              </p>
            </div>
          </div>

          {/* Checkout Form */}
          <CheckoutForm profile={profile} createOrder={createOrder} />
        </div>
      </div>
    </div>
  )
}
