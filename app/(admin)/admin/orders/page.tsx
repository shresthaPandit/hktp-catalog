import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth'
import { getAdminOrders } from '@/app/actions/orders'
import type { OrderStatus } from '@/lib/types'

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:    'bg-orange-50 text-orange-700 border border-orange-200',
  contacted:  'bg-blue-50 text-blue-700 border border-blue-200',
  processing: 'bg-purple-50 text-purple-700 border border-purple-200',
  completed:  'bg-green-50 text-green-700 border border-green-200',
  cancelled:  'bg-red-50 text-red-700 border border-red-200',
}

const ALL_STATUSES: OrderStatus[] = ['pending', 'contacted', 'processing', 'completed', 'cancelled']

interface PageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const result = await getCurrentUser()
  if (!result || result.profile?.role !== 'admin') redirect('/')

  const { status } = await searchParams
  const orders = await getAdminOrders(status)

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface)' }}>
      {/* Page header */}
      <div className="relative overflow-hidden" style={{ backgroundColor: 'var(--surface-alt)' }}>
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E31E24]" />
        <div className="absolute left-1 top-0 bottom-0 w-24 bg-gradient-to-r from-[#E31E24]/10 to-transparent" />
        <div className="relative px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-3 text-[10px] uppercase tracking-[0.2em] font-bold" style={{ fontFamily: 'Space Grotesk' }}>
            <span className="text-[var(--on-surface-dim)]">HK</span>
            <span className="text-[var(--on-surface-dim)]">/</span>
            <span className="text-[var(--on-surface-dim)]">Admin</span>
            <span className="text-[var(--on-surface-dim)]">/</span>
            <span className="text-[#E31E24]">Orders</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>
            ALL <span className="text-[#E31E24]">ORDERS</span>
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Link
            href="/admin/orders"
            className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${!status ? 'metallic-gradient text-white' : 'border border-[#cbd0dd]/40 hover:border-[#E31E24] hover:text-[#E31E24]'}`}
            style={{ fontFamily: 'Space Grotesk', color: !status ? undefined : 'var(--on-surface-dim)' }}
          >
            All
          </Link>
          {ALL_STATUSES.map(s => (
            <Link
              key={s}
              href={`/admin/orders?status=${s}`}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${status === s ? 'metallic-gradient text-white' : 'border border-[#cbd0dd]/40 hover:border-[#E31E24] hover:text-[#E31E24]'}`}
              style={{ fontFamily: 'Space Grotesk', color: status === s ? undefined : 'var(--on-surface-dim)' }}
            >
              {s}
            </Link>
          ))}
        </div>

        {/* Orders table */}
        {orders.length === 0 ? (
          <div className="text-center py-16 border border-[#cbd0dd]/20 text-xs uppercase tracking-widest" style={{ backgroundColor: 'var(--surface-card)', color: 'var(--on-surface-dim)', fontFamily: 'Space Grotesk' }}>
            No orders found
          </div>
        ) : (
          <div className="border border-[#cbd0dd]/20 overflow-hidden" style={{ backgroundColor: 'var(--surface-card)' }}>
            <table className="w-full text-sm">
              <thead className="border-b border-[#cbd0dd]/20" style={{ backgroundColor: 'var(--surface-raised)' }}>
                <tr>
                  {['Order #', 'Company', 'Phone', 'Items', 'Status', 'Date', 'WhatsApp', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-[0.15em] text-[#E31E24]" style={{ fontFamily: 'Space Grotesk' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#cbd0dd]/10">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--surface-raised)]/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[#E31E24]">{order.order_number}</td>
                    <td className="px-4 py-3 text-xs font-bold uppercase" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>
                      {(order.customer_info as { company_name?: string })?.company_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--on-surface-dim)' }}>
                      {(order.customer_info as { phone?: string })?.phone ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold" style={{ color: 'var(--on-surface-dim)', fontFamily: 'Space Grotesk' }}>{order.total_items}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[order.status as OrderStatus]}`} style={{ fontFamily: 'Space Grotesk' }}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-[var(--on-surface-dim)]" style={{ fontFamily: 'Space Grotesk' }}>
                      {new Date(order.created_at).toLocaleDateString('en-CA')}
                    </td>
                    <td className="px-4 py-3 text-[10px] font-bold uppercase" style={{ fontFamily: 'Space Grotesk' }}>
                      {order.whatsapp_sent_at
                        ? <span className="text-green-400">Sent</span>
                        : <span className="text-orange-400">Pending</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="text-[10px] font-black uppercase tracking-widest text-[#E31E24] hover:text-[#FFB4A8] transition-colors" style={{ fontFamily: 'Space Grotesk' }}>
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
