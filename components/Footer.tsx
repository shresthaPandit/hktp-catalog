import Link from 'next/link'

export function Footer() {
  return (
    <footer className="pt-16 pb-10 mt-auto" style={{ backgroundColor: '#31374a', borderTop: '3px solid #E31E24' }}>
      <div className="max-w-[1920px] mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          <div className="md:col-span-1">
            <div className="text-3xl font-black tracking-tighter uppercase mb-6" style={{ fontFamily: 'Space Grotesk', color: '#E31E24' }}>HK</div>
            <p className="text-sm leading-relaxed mb-2" style={{ color: 'rgba(255,255,255,0.65)' }}>HK Industrial Precision.</p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>Wholesale mechanical parts — B2B inquiries only.</p>
          </div>
          <div>
            <h6 className="font-bold uppercase tracking-[0.2em] mb-6 text-xs text-white" style={{ fontFamily: 'Space Grotesk' }}>Parts</h6>
            <ul className="space-y-3 text-sm uppercase tracking-widest" style={{ fontFamily: 'Space Grotesk' }}>
              <li><Link href="/products" className="transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.65)' }}>All Parts</Link></li>
              <li><Link href="/products?category=TRAILER+BODY+PARTS" className="transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.65)' }}>Body Parts</Link></li>
              <li><Link href="/products?category=TRAILER+LIGHTS" className="transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.65)' }}>Lights</Link></li>
              <li><Link href="/products?category=TOOLS" className="transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.65)' }}>Tools</Link></li>
            </ul>
          </div>
          <div>
            <h6 className="font-bold uppercase tracking-[0.2em] mb-6 text-xs text-white" style={{ fontFamily: 'Space Grotesk' }}>Account</h6>
            <ul className="space-y-3 text-sm uppercase tracking-widest" style={{ fontFamily: 'Space Grotesk' }}>
              <li><Link href="/login" className="transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.65)' }}>Sign In</Link></li>
              <li><Link href="/orders" className="transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.65)' }}>My Orders</Link></li>
              <li><Link href="/profile" className="transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.65)' }}>Profile</Link></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-10" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-[11px] tracking-widest uppercase" style={{ fontFamily: 'Space Grotesk', color: 'rgba(255,255,255,0.5)' }}>
            © {new Date().getFullYear()} HK Industrial Precision. All rights reserved.
          </p>
          <p className="text-[11px] tracking-widest uppercase" style={{ fontFamily: 'Space Grotesk', color: 'rgba(255,255,255,0.5)' }}>
            B2B Wholesale — Inquiry-Based Pricing
          </p>
        </div>
      </div>
    </footer>
  )
}
