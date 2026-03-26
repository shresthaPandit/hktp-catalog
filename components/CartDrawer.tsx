'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/components/CartProvider'
import { getCart, removeFromCart, updateCartQuantity, CartWithProductRow } from '@/app/actions/cart'
import { CartItem } from '@/components/CartItem'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatPrice } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export function CartDrawer() {
  const { isOpen, close, guestItems, removeGuestItem, updateGuestQuantity } = useCart()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [items, setItems] = useState<CartWithProductRow[]>([])
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState<number | null>(null)

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setIsAuthenticated(!!data.user))
  }, [isOpen])

  async function fetchCart() {
    setLoading(true)
    try {
      const data = await getCart()
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchCart()
    }
  }, [isOpen, isAuthenticated])

  async function handleRemove(cartItemId: number) {
    setPending(cartItemId)
    try {
      await removeFromCart(cartItemId)
      await fetchCart()
      router.refresh()
    } finally {
      setPending(null)
    }
  }

  async function handleQuantityChange(cartItemId: number, qty: number) {
    setPending(cartItemId)
    try {
      await updateCartQuantity(cartItemId, qty)
      await fetchCart()
      router.refresh()
    } finally {
      setPending(null)
    }
  }

  // Guest mode: use localStorage items; Auth mode: use DB items
  const isGuest = !isAuthenticated
  const displayItems = isGuest ? guestItems : items
  const totalItems = displayItems.reduce((sum, i) => sum + i.quantity, 0)
  const referenceTotal = isGuest
    ? guestItems.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0)
    : items.reduce((sum, i) => sum + (i.subtotal ?? 0), 0)

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Cart</h2>
          <button
            onClick={close}
            className="p-1 text-gray-500 hover:text-gray-900 transition-colors rounded"
            aria-label="Close cart"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton variant="image" className="w-14 h-14 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton variant="text" className="w-3/4" />
                    <Skeleton variant="text" className="w-1/2" />
                    <Skeleton variant="text" className="w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
              <div className="text-5xl">🛒</div>
              <p className="text-gray-600 font-medium">Your cart is empty</p>
              <p className="text-sm text-gray-400">Add products to get started</p>
              <Link href="/products" onClick={close} className="text-sm font-medium text-[#E31E24] hover:opacity-80 transition-colors underline">
                Browse Products
              </Link>
            </div>
          ) : isGuest ? (
            <div>
              {guestItems.map((item) => (
                <div key={item.productId} className="flex gap-3 p-4 border-b border-gray-100">
                  <div className="w-14 h-14 flex-shrink-0 bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
                    {item.primary_image_url
                      ? <img src={item.primary_image_url} alt="" className="w-full h-full object-contain p-1" />
                      : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1"><rect x="3" y="3" width="18" height="18"/></svg>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-mono text-[#E31E24]">{item.sku}</p>
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => updateGuestQuantity(item.productId, item.quantity - 1)} className="text-gray-400 hover:text-gray-700 w-5 h-5 flex items-center justify-center border border-gray-200 text-xs">−</button>
                      <span className="text-xs font-medium w-5 text-center">{item.quantity}</span>
                      <button onClick={() => updateGuestQuantity(item.productId, item.quantity + 1)} className="text-gray-400 hover:text-gray-700 w-5 h-5 flex items-center justify-center border border-gray-200 text-xs">+</button>
                      <button onClick={() => removeGuestItem(item.productId)} className="ml-auto text-xs text-gray-400 hover:text-red-500 transition-colors">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <CartItem key={item.cart_item_id} item={item} onRemove={handleRemove} onQuantityChange={handleQuantityChange} isPending={pending === item.cart_item_id} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && displayItems.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{formatPrice(referenceTotal)}</div>
                <div className="text-xs text-gray-400">Reference price — final price set after inquiry</div>
              </div>
            </div>
            {isGuest ? (
              <>
                <p className="text-xs text-center text-gray-400">Sign in to place your inquiry</p>
                <Link
                  href="/login?redirect=/checkout"
                  onClick={close}
                  className="block w-full text-center py-3 font-medium text-white hover:opacity-90 transition-colors" style={{ backgroundColor: "#E31E24" }}
                >
                  Sign In to Checkout
                </Link>
              </>
            ) : (
            <Link
              href="/checkout"
              onClick={close}
              className="block w-full text-center py-3 font-medium text-white hover:opacity-90 transition-colors" style={{ backgroundColor: "#E31E24" }}
            >
              Proceed to Checkout
            </Link>
            )}
          </div>
        )}
      </div>
    </>
  )
}
