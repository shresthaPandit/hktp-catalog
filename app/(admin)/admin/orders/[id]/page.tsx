import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth'
import { getAdminOrderDetail, updateOrderStatus, updateAdminNotes } from '@/app/actions/orders'
import { formatPrice } from '@/lib/utils'
import OrderActions from './OrderActions'
import type { OrderStatus, OrderItem } from '@/lib/types'

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

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const result = await getCurrentUser()
  if (!result || result.profile?.role !== 'admin') redirect('/')

  const { id } = await params
  const orderId = parseInt(id, 10)
  if (isNaN(orderId)) notFound()

  const order = await getAdminOrderDetail(orderId)
  if (!order) notFound()

  const items: OrderItem[] = order.items ?? []
  const customerInfo = order.customer_info as {
    company_name?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    zip_code?: string
  }

  const refTotal = items.reduce((sum, i) => sum + (i.price_at_order ?? 0) * i.quantity, 0)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface)' }}>
      {/* Page header */}
      <div className="relative overflow-hidden" style={{ backgroundColor: 'var(--surface-alt)' }}>
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E31E24]" />
        <div className="absolute left-1 top-0 bottom-0 w-24 bg-gradient-to-r from-[#E31E24]/10 to-transparent" />
        <div className="relative px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-3 text-[10px] uppercase tracking-[0.2em] font-bold" style={{ fontFamily: 'Space Grotesk' }}>
            <span className="text-[var(--on-surface-dim)]">HK</span>
            <span className="text-[var(--on-surface-dim)]">/</span>
            <a href="/admin/orders" className="text-[var(--on-surface-dim)] hover:text-[#E31E24] transition-colors">Orders</a>
            <span className="text-[var(--on-surface-dim)]">/</span>
            <span className="text-[#E31E24]">{order.order_number}</span>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="font-mono text-2xl font-black text-[#E31E24]">{order.order_number}</h1>
            <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[order.status as OrderStatus]}`} style={{ fontFamily: 'Space Grotesk' }}>
              {order.status}
            </span>
          </div>
          <p className="text-[10px] text-[var(--on-surface-dim)] mt-1 uppercase tracking-wide" style={{ fontFamily: 'Space Grotesk' }}>
            Placed {new Date(order.created_at).toLocaleString('en-CA')}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Info */}
          <div className="border border-[#cbd0dd]/20" style={{ backgroundColor: 'var(--surface-card)' }}>
            <div className="px-5 py-4 border-b border-[#cbd0dd]/20">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E31E24]" style={{ fontFamily: 'Space Grotesk' }}>Customer Information</h2>
            </div>
            <div className="px-5 py-4 space-y-2">
              {[
                { label: 'Company', value: customerInfo?.company_name },
                { label: 'Phone',   value: customerInfo?.phone },
                { label: 'Address', value: [customerInfo?.address, customerInfo?.city, customerInfo?.state, customerInfo?.zip_code].filter(Boolean).join(', ') },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3 text-xs">
                  <span className="text-[var(--on-surface-dim)] uppercase tracking-wide font-bold w-16 flex-shrink-0" style={{ fontFamily: 'Space Grotesk' }}>{label}:</span>
                  <span style={{ color: 'var(--on-surface)' }}>{value ?? '—'}</span>
                </div>
              ))}
              {order.customer_notes && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400 mb-1" style={{ fontFamily: 'Space Grotesk' }}>Customer Notes</p>
                  <p className="text-xs" style={{ color: 'var(--on-surface-dim)' }}>{order.customer_notes}</p>
                </div>
              )}
              <div className="mt-2 pt-3 border-t border-[#cbd0dd]/10 text-[10px]" style={{ fontFamily: 'Space Grotesk' }}>
                <span className="text-[var(--on-surface-dim)] uppercase tracking-wide">WhatsApp: </span>
                {order.whatsapp_sent_at
                  ? <span className="text-green-400">Sent at {new Date(order.whatsapp_sent_at).toLocaleString('en-CA')}</span>
                  : <span className="text-orange-400">Not sent yet</span>}
                {order.whatsapp_error && (
                  <span className="text-red-400 ml-1">Error: {order.whatsapp_error}</span>
                )}
              </div>
            </div>
          </div>

          {/* Order Actions (Client Component) */}
          <OrderActions
            orderId={order.id}
            currentStatus={order.status as OrderStatus}
            currentAdminNotes={order.admin_notes ?? ''}
            updateOrderStatus={updateOrderStatus}
            updateAdminNotes={updateAdminNotes}
          />
        </div>

        {/* Items */}
        <div className="border border-[#cbd0dd]/20" style={{ backgroundColor: 'var(--surface-card)' }}>
          <div className="px-5 py-4 border-b border-[#cbd0dd]/20">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E31E24]" style={{ fontFamily: 'Space Grotesk' }}>
              Order Items ({order.total_items} total)
            </h2>
          </div>
          <div className="divide-y divide-[#cbd0dd]/10">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-xs font-bold uppercase leading-tight" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>{item.name}</p>
                  <p className="font-mono text-[10px] text-[var(--on-surface-dim)] mt-0.5">{item.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[var(--on-surface-dim)]" style={{ fontFamily: 'Space Grotesk' }}>Qty: {item.quantity}</p>
                  <p className="text-sm font-black text-[#E31E24]" style={{ fontFamily: 'Space Grotesk' }}>
                    {item.price_at_order != null ? formatPrice(item.price_at_order * item.quantity) : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-[#cbd0dd]/20 flex justify-between">
            <span className="text-[10px] uppercase tracking-widest text-[var(--on-surface-dim)]" style={{ fontFamily: 'Space Grotesk' }}>Reference total:</span>
            <span className="font-black text-[#E31E24]" style={{ fontFamily: 'Space Grotesk' }}>{formatPrice(refTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
