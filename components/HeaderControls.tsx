'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { CartBadge } from '@/components/CartBadge'
import { signOut } from '@/app/actions/auth'

type Profile = { role: string } | null

export function HeaderControls({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [scrolled, setScrolled] = useState(!isHome)

  useEffect(() => {
    if (!isHome) { setScrolled(true); return }
    const check = () => setScrolled(window.scrollY > 60)
    check()
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [isHome])

  const onProducts = pathname === '/products' || pathname.startsWith('/products?')
  const linkColor  = scrolled ? '#374151' : 'rgba(255,255,255,0.92)'
  const subtleColor = scrolled ? '#6b7280' : 'rgba(255,255,255,0.6)'
  const dividerColor = scrolled ? '#e5e7eb' : 'rgba(255,255,255,0.25)'
  const linkStyle  = { color: linkColor, fontFamily: 'Space Grotesk' }

  return (
    <>
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 flex-shrink-0">
        <span className="text-2xl font-black tracking-tighter" style={{ fontFamily: 'Space Grotesk', color: '#E31E24' }}>HK</span>
        <div className="ml-1 border-l pl-2 hidden sm:block" style={{ borderColor: dividerColor }}>
          <span className="text-[10px] font-bold uppercase tracking-widest block leading-none" style={{ color: linkColor, fontFamily: 'Space Grotesk' }}>Trailer</span>
          <span className="text-[10px] font-bold uppercase tracking-widest block leading-none" style={{ color: subtleColor, fontFamily: 'Space Grotesk' }}>Parts</span>
        </div>
      </Link>

      {/* Nav */}
      <nav className="hidden md:flex items-center gap-1 text-xs font-bold uppercase tracking-widest">
        <Link href="/"         className="nav-link px-4 py-2 rounded transition-colors" style={linkStyle}>Home</Link>
        <Link href="/products" className="nav-link px-4 py-2 rounded transition-colors" style={linkStyle}>Products</Link>
        <Link href="/orders"   className="nav-link px-4 py-2 rounded transition-colors" style={linkStyle}>My Orders</Link>
        <Link href="/profile"  className="nav-link px-4 py-2 rounded transition-colors" style={linkStyle}>Profile</Link>
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <CartBadge color={linkColor} />
        {profile ? (
          <div className="flex items-center gap-3">
            {profile.role === 'admin' && (
              <Link href="/admin/dashboard" className="hidden md:block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded" style={{ color: '#E31E24', fontFamily: 'Space Grotesk', border: '1px solid #E31E24' }}>
                Admin
              </Link>
            )}
            <Link href="/orders" className="hidden md:block text-xs font-semibold uppercase tracking-widest nav-link" style={linkStyle}>
              Orders
            </Link>
            <Link href="/profile" className="nav-link p-2 transition-colors" style={{ color: linkColor }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </Link>
            <form action={signOut}>
              <button type="submit" className="text-xs font-bold uppercase tracking-widest nav-link" style={linkStyle}>
                Sign Out
              </button>
            </form>
          </div>
        ) : (
          <Link href="/login" className="btn-primary px-5 py-2 text-xs" style={{ fontFamily: 'Space Grotesk' }}>
            Sign In
          </Link>
        )}
      </div>
    </>
  )
}
