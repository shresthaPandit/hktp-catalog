'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export interface CartWithProductRow {
  cart_item_id: number
  product_id: number
  sku: string
  name: string
  price: number | null
  primary_image_url: string | null
  in_stock: boolean
  quantity: number
  subtotal: number | null
}

export async function addToCart(productId: number, quantity: number = 1): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle()

  const newQty = existing ? existing.quantity + quantity : quantity

  const { error } = await supabase
    .from('cart_items')
    .upsert(
      { user_id: user.id, product_id: productId, quantity: newQty },
      { onConflict: 'user_id,product_id', ignoreDuplicates: false }
    )

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function removeFromCart(cartItemId: number): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function updateCartQuantity(cartItemId: number, quantity: number): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (quantity <= 0) {
    await removeFromCart(cartItemId)
    return
  }

  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/', 'layout')
}

export async function getCart(): Promise<CartWithProductRow[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase.rpc('get_cart_with_details', { cart_user_id: user.id })
  return data ?? []
}
