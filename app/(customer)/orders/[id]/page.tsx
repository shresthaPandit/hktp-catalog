import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth'
import { getCustomerOrderDetail } from '@/app/actions/orders'
import { formatPrice } from '@/lib/utils'
import type { OrderStatus } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:    'bg-orange-50 text-orange-700 border border-orange-200',
  contacted:  'bg-blue-50 text-blue-700 border border-blue-200',
  processing: 'bg-purple-50 text-purple-700 border border-purple-200',
  completed:  'bg-green-50 text-green-700 border border-green-200',
  cancelled:  'bg-red-50 text-red-700 border border-red-200',
}

const STATUS_DESC: Record<OrderStatus, string> = {
  pending:    'Your inquiry has been received. Our team will review it shortly.',
  contacted:  'Our team has reached out to you via the phone number provided.',
  processing: "Your inquiry is being processed. We'll confirm pricing and availability.",
  completed:  'This inquiry has been completed. Thank you for your business!',
  cancelled:  'This inquiry has been cancelled.',
}

export default async function OrderDetailPage({ params }: PageProps) {
  const result = await getCurrentUser()
  if (!result) redirect('/login')

  const { id } = await params
  const order = await getCustomerOrderDetail(id)
  if (!order) notFound()

  const refTotal = (order.items ?? []).reduce(
    (sum: number, i: { price_at_order?: number | null; quantity: number }) =>
      sum + (i.price_at_order ?? 0) * i.quantity,
    0
  )
  const isNewOrder = order.status === 'pending'

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface)' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        {/* Confirmation banner */}
        <div className={`border p-5 ${isNewOrder ? 'bg-green-50 border-green-200' : 'border-[#cbd0dd]/20'}`} style={!isNewOrder ? { backgroundColor: 'var(--surface-card)' } : {}}>
          {isNewOrder && (
            <div className="flex items-center gap-2 mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <p className="text-green-400 font-bold text-sm uppercase tracking-wide" style={{ fontFamily: 'Space Grotesk' }}>Order Submitted</p>
            </div>
          )}
          <p className="font-mono text-2xl font-bold text-[#E31E24]">{order.order_number}</p>
          <p className="text-xs mt-1 uppercase tracking-wide" style={{ color: 'var(--on-surface-dim)', fontFamily: 'Space Grotesk' }}>
            {new Date(order.created_at).toLocaleString('en-CA', { dateStyle: 'long', timeStyle: 'short' })}
          </p>
        </div>

        {/* Status */}
        <div className="border border-[#cbd0dd]/20 p-5" style={{ backgroundColor: 'var(--surface-card)' }}>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="font-black uppercase tracking-wide text-sm" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>Status</h2>
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[order.status as OrderStatus] ?? 'bg-[var(--surface-raised)] text-[var(--on-surface-dim)]'}`} style={{ fontFamily: 'Space Grotesk' }}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--on-surface-dim)' }}>{STATUS_DESC[order.status as OrderStatus]}</p>
        </div>

        {/* Items */}
        <div className="border border-[#cbd0dd]/20" style={{ backgroundColor: 'var(--surface-card)' }}>
          <div className="px-5 py-4 border-b border-[#cbd0dd]/20">
            <h2 className="font-black uppercase tracking-wide text-sm" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>
              Items ({order.total_items})
            </h2>
          </div>
          <div className="divide-y divide-[#cbd0dd]/10">
            {(order.items ?? []).map((item: { name: string; sku: string; quantity: number; price_at_order?: number | null }, idx: number) => (
              <div key={idx} className="flex justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-bold uppercase text-xs leading-tight" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>{item.name}</p>
                  <p className="font-mono text-[10px] mt-0.5 text-[var(--on-surface-dim)]">{item.sku} &middot; Qty: {item.quantity}</p>
                </div>
                <p className="font-bold text-[#E31E24]" style={{ fontFamily: 'Space Grotesk' }}>
                  {item.price_at_order != null ? formatPrice(item.price_at_order * item.quantity) : '\u2014'}
                </p>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-[#cbd0dd]/20 flex justify-between">
            <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--on-surface-dim)', fontFamily: 'Space Grotesk' }}>Reference total:</span>
            <span className="font-black text-[#E31E24]" style={{ fontFamily: 'Space Grotesk' }}>{formatPrice(refTotal)}</span>
          </div>
          <p className="px-5 pb-3 text-[10px] text-[var(--on-surface-dim)]" style={{ fontFamily: 'Space Grotesk' }}>
            Final price confirmed by our team after reviewing your inquiry
          </p>
        </div>

        {/* Customer Notes */}
        {order.customer_notes && (
          <div className="border border-orange-200 bg-orange-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400 mb-2" style={{ fontFamily: 'Space Grotesk' }}>Your Notes</p>
            <p className="text-sm" style={{ color: 'var(--on-surface-dim)' }}>{order.customer_notes}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          <Link
            href="/orders"
            className="flex-1 text-center py-3 border border-[#cbd0dd] text-xs font-bold uppercase tracking-widest hover:bg-[var(--surface-raised)] transition-colors"
            style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface-dim)' }}
          >
            All Orders
          </Link>
          <Link
            href="/products"
            className="flex-1 text-center py-3 metallic-gradient text-xs font-bold uppercase tracking-widest text-white hover:brightness-110 transition-all"
            style={{ fontFamily: 'Space Grotesk' }}
          >
            Continue Browsing
          </Link>
        </div>
      </div>
    </div>
  )
}
