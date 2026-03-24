'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/components/CartProvider'
import { getCart, removeFromCart, updateCartQuantity, CartWithProductRow } from '@/app/actions/cart'
import { CartItem } from '@/components/CartItem'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatPrice } from '@/lib/utils'

export function CartDrawer() {
  const { isOpen, close } = useCart()
  const router = useRouter()
  const [items, setItems] = useState<CartWithProductRow[]>([])
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState<number | null>(null)

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
    if (isOpen) {
      fetchCart()
    }
  }, [isOpen])

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

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const referenceTotal = items.reduce((sum, i) => sum + (i.subtotal ?? 0), 0)

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
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
              <div className="text-5xl">🛒</div>
              <p className="text-gray-600 font-medium">Your cart is empty</p>
              <p className="text-sm text-gray-400">Add products to get started</p>
              <Link
                href="/products"
                onClick={close}
                className="text-sm font-medium text-[#E31E24] hover:opacity-80 transition-colors underline"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <CartItem
                  key={item.cart_item_id}
                  item={item}
                  onRemove={handleRemove}
                  onQuantityChange={handleQuantityChange}
                  isPending={pending === item.cart_item_id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && items.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{formatPrice(referenceTotal)}</div>
                <div className="text-xs text-gray-400">Reference price — final price set after inquiry</div>
              </div>
            </div>
            <Link
              href="/checkout"
              onClick={close}
              className="block w-full text-center py-3 font-medium text-white hover:opacity-90 transition-colors" style={{ backgroundColor: "#E31E24" }}
            >
              Proceed to Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
