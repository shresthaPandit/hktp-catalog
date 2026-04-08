'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Invoice {
  name: string
  url: string
  created_at: string
}

export default function InvoiceUpload({ orderId }: { orderId: number }) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  const folder = `order-${orderId}`

  async function loadInvoices() {
    const { data } = await supabase.storage.from('invoices').list(folder, { sortBy: { column: 'created_at', order: 'desc' } })
    if (!data) return
    const withUrls: Invoice[] = await Promise.all(
      data.map(async (f) => {
        const { data: signed } = await supabase.storage
          .from('invoices')
          .createSignedUrl(`${folder}/${f.name}`, 3600)
        return { name: f.name, url: signed?.signedUrl ?? '', created_at: f.created_at ?? '' }
      })
    )
    setInvoices(withUrls)
  }

  useEffect(() => { loadInvoices() }, [orderId])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')

    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`
    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(`${folder}/${filename}`, file)

    if (uploadError) {
      setError(uploadError.message)
    } else {
      setMsg('Invoice uploaded')
      setTimeout(() => setMsg(''), 3000)
      await loadInvoices()
    }
    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleDelete(name: string) {
    const { error } = await supabase.storage.from('invoices').remove([`${folder}/${name}`])
    if (error) { setError(error.message); return }
    setInvoices(prev => prev.filter(i => i.name !== name))
  }

  return (
    <div className="border border-[#cbd0dd]/20" style={{ backgroundColor: 'var(--surface-card)' }}>
      <div className="px-5 py-4 border-b border-[#cbd0dd]/20 flex items-center justify-between">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E31E24]" style={{ fontFamily: 'Space Grotesk' }}>
          Invoices
        </h2>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="metallic-gradient px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white hover:brightness-110 transition-all disabled:opacity-50"
          style={{ fontFamily: 'Space Grotesk' }}
        >
          {uploading ? 'Uploading...' : '+ Upload'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      <div className="px-5 py-4">
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        {msg && <p className="text-[10px] text-green-400 uppercase tracking-wide mb-3" style={{ fontFamily: 'Space Grotesk' }}>{msg}</p>}

        {invoices.length === 0 ? (
          <p className="text-[10px] text-[var(--on-surface-dim)] uppercase tracking-wide" style={{ fontFamily: 'Space Grotesk' }}>
            No invoices uploaded yet
          </p>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <div key={inv.name} className="flex items-center justify-between py-2 border-b border-[#cbd0dd]/10 last:border-0">
                <a
                  href={inv.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-[#E31E24] hover:underline truncate max-w-[200px]"
                >
                  {inv.name.replace(/^\d+-/, '')}
                </a>
                <button
                  onClick={() => handleDelete(inv.name)}
                  className="text-[10px] font-bold uppercase tracking-widest text-[var(--on-surface-dim)] hover:text-red-500 transition-colors ml-4 flex-shrink-0"
                  style={{ fontFamily: 'Space Grotesk' }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
