'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { OrderStatus } from '@/lib/types'

// ─── Customer: create order ──────────────────────────────────────────────────

export async function createOrder(fd: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Extract customer info from FormData
  const customerInfo = {
    company_name: fd.get('company_name') as string,
    phone: fd.get('phone') as string,
    address: fd.get('address') as string,
    city: fd.get('city') as string,
    state: fd.get('state') as string,
    zip_code: fd.get('zip_code') as string,
  }
  const notes = (fd.get('notes') as string) || null

  // Fetch cart items
  const { data: cartItems } = await supabase.rpc('get_cart_with_details', { cart_user_id: user.id })
  if (!cartItems || cartItems.length === 0) throw new Error('Cart is empty')

  // Build JSONB items snapshot
  const items = cartItems.map((ci: {
    product_id: number
    sku: string
    name: string
    quantity: number
    price: number | null
  }) => ({
    product_id: ci.product_id,
    sku: ci.sku,
    name: ci.name,
    quantity: ci.quantity,
    price_at_order: ci.price ?? null,
  }))

  const totalItems = items.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0)

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      status: 'pending',
      items,
      customer_info: customerInfo,
      total_items: totalItems,
      customer_notes: notes,
    })
    .select('id, order_number')
    .single()

  if (error) throw new Error(error.message)

  // Clear cart
  await supabase.from('cart_items').delete().eq('user_id', user.id)

  revalidatePath('/cart')
  revalidatePath('/orders')

  redirect(`/orders/${order.order_number}`)
}

// ─── Customer: get own orders ─────────────────────────────────────────────────

export interface CustomerOrderRow {
  id: number
  order_number: string
  status: string
  total_items: number
  created_at: string
  customer_info: { company_name: string; phone: string }
}

export async function getCustomerOrders(): Promise<CustomerOrderRow[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, status, total_items, created_at, customer_info, whatsapp_sent_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as CustomerOrderRow[]
}

// ─── Customer: get single order detail by order_number ───────────────────────

export async function getCustomerOrderDetail(orderNumber: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // CRITICAL: explicit column list — admin_notes NOT included
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_number, user_id, status, items, customer_info, total_items, customer_notes, created_at, updated_at')
    .eq('order_number', orderNumber)
    .eq('user_id', user.id)  // RLS + explicit user check — customer can only see own orders
    .single()

  if (error) return null
  return data
}

// ─── Admin: get all orders ────────────────────────────────────────────────────

export async function getAdminOrders(statusFilter?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Admin RLS allows reading all orders
  let query = supabase
    .from('orders')
    .select('id, order_number, user_id, status, total_items, created_at, customer_info, whatsapp_sent_at')
    .order('created_at', { ascending: false })

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

// ─── Admin: get single order detail (includes admin_notes) ───────────────────

export async function getAdminOrderDetail(orderId: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('orders')
    .select('*') // Admin context — select all including admin_notes
    .eq('id', orderId)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ─── Admin: update order status ───────────────────────────────────────────────

export async function updateOrderStatus(orderId: number, status: OrderStatus): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') throw new Error('Unauthorized')

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (status === 'contacted') {
    updates.contacted_at = new Date().toISOString()
    updates.contacted_by = user.id
  }

  const { error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)
}

// ─── Admin: update internal notes ────────────────────────────────────────────

export async function updateAdminNotes(orderId: number, adminNotes: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') throw new Error('Unauthorized')

  const { error } = await supabase
    .from('orders')
    .update({ admin_notes: adminNotes || null, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)
}
