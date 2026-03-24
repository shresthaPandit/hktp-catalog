import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ToastContainer } from '@/components/ui/Toast'
import { CartProvider } from '@/components/CartProvider'
import { CartDrawer } from '@/components/CartDrawer'

export const metadata: Metadata = {
  title: 'HK Trailer Parts — Wholesale Mechanical Parts',
  description: 'Browse and search 15,000+ wholesale mechanical parts.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col pt-[72px]" style={{ backgroundColor: 'var(--surface)', color: 'var(--on-surface)' }}>
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <ToastContainer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  )
}
