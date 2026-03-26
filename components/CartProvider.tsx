'use client'
import { createContext, useContext, useState, useEffect } from 'react'

export interface GuestCartItem {
  productId: number
  sku: string
  name: string
  price: number | null
  primary_image_url: string | null
  in_stock: boolean
  quantity: number
}

const STORAGE_KEY = 'hk_guest_cart'

interface CartContextType {
  isOpen: boolean
  open: () => void
  close: () => void
  guestItems: GuestCartItem[]
  guestCount: number
  addGuestItem: (item: Omit<GuestCartItem, 'quantity'> & { quantity?: number }) => void
  removeGuestItem: (productId: number) => void
  updateGuestQuantity: (productId: number, quantity: number) => void
  clearGuestCart: () => void
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [guestItems, setGuestItems] = useState<GuestCartItem[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setGuestItems(JSON.parse(stored))
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(guestItems))
    } catch {}
  }, [guestItems])

  function addGuestItem({ quantity = 1, ...product }: Omit<GuestCartItem, 'quantity'> & { quantity?: number }) {
    setGuestItems(prev => {
      const existing = prev.find(i => i.productId === product.productId)
      if (existing) {
        return prev.map(i => i.productId === product.productId ? { ...i, quantity: i.quantity + quantity } : i)
      }
      return [...prev, { ...product, quantity }]
    })
  }

  function removeGuestItem(productId: number) {
    setGuestItems(prev => prev.filter(i => i.productId !== productId))
  }

  function updateGuestQuantity(productId: number, quantity: number) {
    if (quantity <= 0) { removeGuestItem(productId); return }
    setGuestItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity } : i))
  }

  function clearGuestCart() {
    setGuestItems([])
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  const guestCount = guestItems.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{
      isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false),
      guestItems, guestCount, addGuestItem, removeGuestItem, updateGuestQuantity, clearGuestCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
