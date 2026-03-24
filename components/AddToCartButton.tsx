'use client'
import { useState, useTransition } from 'react'
import { addToCart } from '@/app/actions/cart'
import { AuthModal } from '@/components/AuthModal'
import { useCart } from '@/components/CartProvider'
import { Button } from '@/components/ui/Button'

interface AddToCartButtonProps {
  productId: number
  isAuthenticated: boolean
  quantity?: number
}

export function AddToCartButton({ productId, isAuthenticated, quantity = 1 }: AddToCartButtonProps) {
  const { open } = useCart()
  const [showAuth, setShowAuth] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleClick() {
    if (!isAuthenticated) {
      setShowAuth(true)
      return
    }
    startTransition(async () => {
      await addToCart(productId, quantity)
      open()
    })
  }

  async function onAuthSuccess() {
    setShowAuth(false)
    startTransition(async () => {
      await addToCart(productId, quantity)
      open()
    })
  }

  return (
    <>
      <Button size="lg" className="flex-1" onClick={handleClick} loading={isPending}>
        Add to Cart
      </Button>
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={onAuthSuccess}
      />
    </>
  )
}
