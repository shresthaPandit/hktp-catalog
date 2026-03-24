'use client'
import { useState, useTransition } from 'react'
import type { OrderStatus } from '@/lib/types'

const ALL_STATUSES: OrderStatus[] = ['pending', 'contacted', 'processing', 'completed', 'cancelled']

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:    'border-orange-300 text-orange-700 hover:bg-orange-50',
  contacted:  'border-blue-300 text-blue-700 hover:bg-blue-50',
  processing: 'border-purple-300 text-purple-700 hover:bg-purple-50',
  completed:  'border-green-300 text-green-700 hover:bg-green-50',
  cancelled:  'border-red-300 text-red-700 hover:bg-red-50',
}

interface OrderActionsProps {
  orderId: number
  currentStatus: OrderStatus
  currentAdminNotes: string
  updateOrderStatus: (id: number, status: OrderStatus) => Promise<void>
  updateAdminNotes: (id: number, notes: string) => Promise<void>
}

export default function OrderActions({
  orderId, currentStatus, currentAdminNotes,
  updateOrderStatus, updateAdminNotes
}: OrderActionsProps) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus)
  const [notes, setNotes] = useState(currentAdminNotes)
  const [statusPending, startStatusTransition] = useTransition()
  const [notesPending, startNotesTransition] = useTransition()
  const [statusMsg, setStatusMsg] = useState('')
  const [notesMsg, setNotesMsg] = useState('')

  async function handleStatusChange(newStatus: OrderStatus) {
    setStatus(newStatus)
    startStatusTransition(async () => {
      await updateOrderStatus(orderId, newStatus)
      setStatusMsg('Status updated')
      setTimeout(() => setStatusMsg(''), 2000)
    })
  }

  async function handleNotesSubmit(e: React.FormEvent) {
    e.preventDefault()
    startNotesTransition(async () => {
      await updateAdminNotes(orderId, notes)
      setNotesMsg('Saved')
      setTimeout(() => setNotesMsg(''), 2000)
    })
  }

  return (
    <div className="border border-[#cbd0dd]/20 space-y-0" style={{ backgroundColor: 'var(--surface-card)' }}>
      {/* Status */}
      <div className="px-5 py-4 border-b border-[#cbd0dd]/20">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E31E24] mb-4" style={{ fontFamily: 'Space Grotesk' }}>Update Status</h2>
        <div className="flex flex-wrap gap-2">
          {ALL_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={statusPending || s === status}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide border transition-all disabled:cursor-not-allowed ${
                s === status
                  ? 'metallic-gradient text-white border-transparent'
                  : `${STATUS_COLORS[s]} bg-transparent`
              }`}
              style={{ fontFamily: 'Space Grotesk' }}
            >
              {s}
            </button>
          ))}
        </div>
        {statusMsg && <p className="text-[10px] text-green-400 mt-2 uppercase tracking-wide" style={{ fontFamily: 'Space Grotesk' }}>{statusMsg}</p>}
      </div>

      {/* Notes */}
      <div className="px-5 py-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E31E24] mb-1" style={{ fontFamily: 'Space Grotesk' }}>Internal Notes</h2>
        <p className="text-[10px] text-[var(--on-surface-dim)] mb-3 uppercase tracking-wide" style={{ fontFamily: 'Space Grotesk' }}>Not visible to customers</p>
        <form onSubmit={handleNotesSubmit} className="space-y-2">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={4}
            className="w-full bg-[var(--surface-raised)] border border-[#cbd0dd] px-3 py-2 text-sm text-[var(--on-surface)] focus:outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24] placeholder:text-[var(--on-surface-dim)] resize-none"
            placeholder="Add internal notes..."
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={notesPending}
              className="metallic-gradient px-4 py-2 text-xs font-black uppercase tracking-widest text-white hover:brightness-110 transition-all disabled:opacity-50"
              style={{ fontFamily: 'Space Grotesk' }}
            >
              {notesPending ? 'Saving...' : 'Save Notes'}
            </button>
            {notesMsg && <p className="text-[10px] text-green-400 uppercase tracking-wide" style={{ fontFamily: 'Space Grotesk' }}>{notesMsg}</p>}
          </div>
        </form>
      </div>
    </div>
  )
}
