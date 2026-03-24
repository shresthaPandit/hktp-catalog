import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth'
import { getAdminOrders } from '@/app/actions/orders'

export default async function DashboardPage() {
  const result = await getCurrentUser()
  if (!result || result.profile?.role !== 'admin') redirect('/')

  const allOrders = await getAdminOrders()
  const recentOrders = allOrders.slice(0, 5)

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
            <span className="text-[#E31E24]">Admin Dashboard</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>
            ADMIN <span className="text-[#E31E24]">DASHBOARD</span>
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { href: '/admin/orders', label: 'View All Orders', sub: 'Manage inquiries' },
            { href: '/admin/orders?status=pending', label: 'Pending Orders', sub: 'Needs review' },
            { href: '/products', label: 'Product Catalog', sub: 'Browse parts' },
          ].map(({ href, label, sub }) => (
            <Link key={href} href={href} className="group border border-[#cbd0dd]/20 p-5 hover:border-[#E31E24] transition-all" style={{ backgroundColor: 'var(--surface-card)' }}>
              <p className="text-xs font-black uppercase tracking-wide group-hover:text-[#E31E24] transition-colors" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>{label}</p>
              <p className="text-[10px] text-[var(--on-surface-dim)] mt-1 uppercase tracking-wide" style={{ fontFamily: 'Space Grotesk' }}>{sub}</p>
              <span className="text-[#E31E24] text-sm mt-2 block">→</span>
            </Link>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="border border-[#cbd0dd]/20" style={{ backgroundColor: 'var(--surface-card)' }}>
          <div className="px-5 py-4 border-b border-[#cbd0dd]/20 flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E31E24]" style={{ fontFamily: 'Space Grotesk' }}>Recent Orders</h2>
            <Link href="/admin/orders" className="text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface-dim)] hover:text-[#E31E24] transition-colors" style={{ fontFamily: 'Space Grotesk' }}>
              View All →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="px-5 py-8 text-[10px] text-[var(--on-surface-dim)] uppercase tracking-widest text-center" style={{ fontFamily: 'Space Grotesk' }}>No orders yet</p>
          ) : (
            <div className="divide-y divide-[#cbd0dd]/10">
              {recentOrders.map(order => (
                <div key={order.id} className="flex items-center justify-between px-5 py-3 hover:bg-[var(--surface-raised)]/50 transition-colors">
                  <div>
                    <p className="font-mono text-xs text-[#E31E24]">{order.order_number}</p>
                    <p className="text-[10px] text-[var(--on-surface-dim)] mt-0.5" style={{ fontFamily: 'Space Grotesk' }}>
                      {(order.customer_info as { company_name?: string })?.company_name ?? '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-[var(--on-surface-dim)] uppercase" style={{ fontFamily: 'Space Grotesk' }}>{order.status}</span>
                    <Link href={`/admin/orders/${order.id}`} className="text-[10px] font-black uppercase tracking-widest text-[#E31E24] hover:text-[#FFB4A8] transition-colors" style={{ fontFamily: 'Space Grotesk' }}>
                      View →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
