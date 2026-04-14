'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { CartBadge } from '@/components/CartBadge'
import { signOut } from '@/app/actions/auth'

type Profile = { role: string } | null

export function HeaderControls({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const [scrolled, setScrolled] = useState(!isHome)
  const [shopOpen, setShopOpen] = useState(false)
  const shopRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isHome) { setScrolled(true); return }
    const check = () => setScrolled(window.scrollY > 60)
    check()
    window.addEventListener('scroll', check, { passive: true })
    return () => window.removeEventListener('scroll', check)
  }, [isHome])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (shopRef.current && !shopRef.current.contains(e.target as Node)) {
        setShopOpen(false)
      }
    }
    if (shopOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [shopOpen])

  const onShop = pathname.startsWith('/products') || pathname.startsWith('/categories') || pathname.startsWith('/brands')
  const linkColor   = '#374151'
  const subtleColor = '#6b7280'
  const dividerColor = '#e5e7eb'
  const linkStyle   = { color: linkColor, fontFamily: 'Space Grotesk' }

  const shopDropdownItems = [
    { label: 'Categories', href: '/categories' },
    { label: 'Brands',     href: '/brands' },
    { label: 'Products',   href: '/products' },
  ]

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
        <Link href="/" className="nav-link px-4 py-2 rounded transition-colors" style={linkStyle}>Home</Link>

        {/* Shop dropdown */}
        <div className="relative" ref={shopRef}>
          <button
            onClick={() => setShopOpen(o => !o)}
            className="nav-link px-4 py-2 rounded transition-colors flex items-center gap-1"
            style={{ ...linkStyle, color: onShop ? '#E31E24' : linkColor }}
          >
            Shop
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              className={`transition-transform duration-200 ${shopOpen ? 'rotate-180' : ''}`}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {shopOpen && (
            <div
              className="absolute top-full left-0 mt-1 w-44 shadow-xl rounded overflow-hidden"
              style={{ backgroundColor: 'var(--surface-card)', border: '1px solid var(--border-dim)', zIndex: 200 }}
            >
              {shopDropdownItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShopOpen(false)}
                  className="block px-4 py-3 text-xs font-bold uppercase tracking-widest transition-colors hover:text-[#E31E24]"
                  style={{ fontFamily: 'Space Grotesk', color: pathname === item.href ? '#E31E24' : linkColor, borderBottom: '1px solid var(--border-dim)' }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {profile?.role !== 'admin' && <Link href="/orders" className="nav-link px-4 py-2 rounded transition-colors" style={linkStyle}>My Orders</Link>}
        <Link href="/profile"  className="nav-link px-4 py-2 rounded transition-colors" style={linkStyle}>Profile</Link>
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <CartBadge color={linkColor} />
        {profile ? (
          <div className="flex items-center gap-3">
            {profile.role === 'admin' ? (
              <Link href="/admin/orders" className="hidden md:block text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded" style={{ color: '#E31E24', fontFamily: 'Space Grotesk', border: '1px solid #E31E24' }}>
                Admin
              </Link>
            ) : (
              <Link href="/orders" className="hidden md:block text-xs font-semibold uppercase tracking-widest nav-link" style={linkStyle}>
                Orders
              </Link>
            )}
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
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-outline px-4 py-2 text-xs" style={{ fontFamily: 'Space Grotesk' }}>
              Sign In
            </Link>
            <Link href="/signup" className="btn-primary px-5 py-2 text-xs" style={{ fontFamily: 'Space Grotesk' }}>
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
