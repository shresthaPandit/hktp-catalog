import { createClient } from '@/lib/supabase/server'

export interface OrderNotificationPayload {
  order_number: string
  company_name: string
  phone: string
  items: Array<{
    name: string
    quantity: number
    price_at_order: number | null
    subtotal: number | null
  }>
  subtotal: number
  customer_notes: string | null
  placed_at: string
}

export async function sendOrderNotification(
  orderId: number,
  orderNumber: string,
  payload: OrderNotificationPayload
): Promise<void> {
  try {
    const webhookUrl = process.env.N8N_WEBHOOK_ORDER_NOTIFICATION
    if (!webhookUrl) return

    async function attemptFetch(): Promise<{ ok: boolean; error?: string }> {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      try {
        const res = await fetch(webhookUrl!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, orderNumber, ...payload }),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        if (res.ok) {
          return { ok: true }
        }
        let text = res.statusText
        try {
          text = (await res.text()) || res.statusText
        } catch {
          // ignore body read errors
        }
        return { ok: false, error: `HTTP ${res.status}: ${text}` }
      } catch (err: unknown) {
        clearTimeout(timeoutId)
        if (err instanceof Error && err.name === 'AbortError') {
          return { ok: false, error: 'Timeout after 5s' }
        }
        const message = err instanceof Error ? err.message : String(err)
        return { ok: false, error: `HTTP 0: ${message}` }
      }
    }

    let result = await attemptFetch()

    if (!result.ok) {
      await new Promise<void>(resolve => setTimeout(resolve, 2000))
      result = await attemptFetch()
    }

    const supabase = await createClient()

    if (result.ok) {
      await supabase
        .from('orders')
        .update({
          whatsapp_sent_at: new Date().toISOString(),
          whatsapp_error: null,
        })
        .eq('id', orderId)
    } else {
      await supabase
        .from('orders')
        .update({ whatsapp_error: result.error })
        .eq('id', orderId)
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    try {
      const supabase = await createClient()
      await supabase
        .from('orders')
        .update({ whatsapp_error: message })
        .eq('id', orderId)
    } catch {
      // best-effort — do not propagate
    }
  }
}
