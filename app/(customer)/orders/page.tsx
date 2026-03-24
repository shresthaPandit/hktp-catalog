import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth'
import { getCustomerOrders } from '@/app/actions/orders'
import type { OrderStatus } from '@/lib/types'

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:    'bg-orange-50 text-orange-700 border border-orange-200',
  contacted:  'bg-blue-50 text-blue-700 border border-blue-200',
  processing: 'bg-purple-50 text-purple-700 border border-purple-200',
  completed:  'bg-green-50 text-green-700 border border-green-200',
  cancelled:  'bg-red-50 text-red-700 border border-red-200',
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending:    'Pending Review',
  contacted:  "We've Reached Out",
  processing: 'Processing',
  completed:  'Completed',
  cancelled:  'Cancelled',
}

export default async function CustomerOrdersPage() {
  const result = await getCurrentUser()
  if (!result) redirect('/login')

  const orders = await getCustomerOrders()

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
            <span className="text-[#E31E24]">My Orders</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>
            MY <span className="text-[#E31E24]">ORDERS</span>
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {orders.length === 0 ? (
          <div className="text-center py-20 border border-[#cbd0dd]/20" style={{ backgroundColor: 'var(--surface-card)' }}>
            <p className="text-sm uppercase tracking-widest font-bold mb-4" style={{ color: 'var(--on-surface-dim)', fontFamily: 'Space Grotesk' }}>
              No orders yet
            </p>
            <Link href="/products" className="inline-block metallic-gradient px-8 py-3 text-xs font-bold uppercase tracking-widest text-white hover:brightness-110 transition-all" style={{ fontFamily: 'Space Grotesk' }}>
              Browse Catalog &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <div key={order.id} className="border border-[#cbd0dd]/20 p-4 flex items-center justify-between hover:border-[#E31E24]/30 transition-colors" style={{ backgroundColor: 'var(--surface-card)' }}>
                <div>
                  <p className="font-mono text-sm font-bold text-[#E31E24]">{order.order_number}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-dim)', fontFamily: 'Space Grotesk' }}>
                    {new Date(order.created_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
                    {' \u00B7 '}{order.total_items} item{order.total_items !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[order.status as OrderStatus] ?? 'bg-[var(--surface-raised)] text-[var(--on-surface-dim)]'}`} style={{ fontFamily: 'Space Grotesk' }}>
                    {STATUS_LABEL[order.status as OrderStatus] ?? order.status}
                  </span>
                  <Link href={`/orders/${order.order_number}`} className="text-xs font-bold uppercase tracking-widest text-[#E31E24] hover:text-[#FFB4A8] transition-colors" style={{ fontFamily: 'Space Grotesk' }}>
                    View &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
