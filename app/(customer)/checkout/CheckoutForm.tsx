'use client'
import { useFormStatus } from 'react-dom'
import { Input } from '@/components/ui/Input'
import type { Profile } from '@/lib/types'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-4 metallic-gradient text-white font-black uppercase tracking-widest text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ fontFamily: 'Space Grotesk' }}
    >
      {pending ? 'Placing Order...' : 'Place Inquiry Order'}
    </button>
  )
}

interface CheckoutFormProps {
  profile: Profile | null
  createOrder: (fd: FormData) => Promise<void>
}

export default function CheckoutForm({ profile, createOrder }: CheckoutFormProps) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E31E24] mb-4" style={{ fontFamily: 'Space Grotesk' }}>
        Your Information
      </p>
      <form action={createOrder} className="space-y-3">
        <Input
          label="Company Name"
          name="company_name"
          required
          defaultValue={profile?.company_name ?? ''}
          placeholder="Acme Trailers Inc."
        />
        <Input
          label="Phone Number"
          name="phone"
          type="tel"
          required
          defaultValue={profile?.phone ?? ''}
          placeholder="+1 555 123 4567"
        />
        <Input
          label="Street Address"
          name="address"
          required
          defaultValue={profile?.address ?? ''}
          placeholder="123 Main St"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="City"
            name="city"
            required
            defaultValue={profile?.city ?? ''}
            placeholder="Toronto"
          />
          <Input
            label="Province"
            name="state"
            required
            defaultValue={profile?.state ?? ''}
            placeholder="ON"
          />
        </div>
        <Input
          label="Postal Code"
          name="zip_code"
          required
          defaultValue={profile?.zip_code ?? ''}
          placeholder="M5V 3A8"
        />
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-[var(--on-surface-dim)] mb-1.5" style={{ fontFamily: 'Space Grotesk' }}>
            Notes (optional)
          </label>
          <textarea
            name="notes"
            rows={3}
            className="w-full bg-[var(--surface-raised)] border border-[#cbd0dd] px-4 py-3 text-sm text-[var(--on-surface)] focus:outline-none focus:border-[#E31E24] focus:ring-1 focus:ring-[#E31E24] placeholder:text-[var(--on-surface-dim)] resize-none"
            placeholder="Any special requirements or questions..."
          />
        </div>
        <SubmitButton />
      </form>
    </div>
  )
}
