import { redirect } from 'next/navigation'
import { getCurrentUser, updateProfile, signOut } from '@/app/actions/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default async function ProfilePage() {
  const result = await getCurrentUser()
  if (!result) redirect('/login')

  const { user, profile } = result

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface)' }}>
      {/* Page header */}
      <div className="relative overflow-hidden" style={{ backgroundColor: 'var(--surface-alt)' }}>
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E31E24]" />
        <div className="absolute left-1 top-0 bottom-0 w-24 bg-gradient-to-r from-[#E31E24]/10 to-transparent" />
        <div className="relative px-4 sm:px-6 lg:px-8 py-8 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-3 text-[10px] uppercase tracking-[0.2em] font-bold" style={{ fontFamily: 'Space Grotesk' }}>
            <span className="text-[var(--on-surface-dim)]">HK</span>
            <span className="text-[var(--on-surface-dim)]">/</span>
            <span className="text-[#E31E24]">My Profile</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight" style={{ fontFamily: 'Space Grotesk', color: 'var(--on-surface)' }}>
            MY <span className="text-[#E31E24]">PROFILE</span>
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        {/* Account Details */}
        <div className="border border-[#cbd0dd]/20" style={{ backgroundColor: 'var(--surface-card)' }}>
          <div className="px-5 py-4 border-b border-[#cbd0dd]/20">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E31E24]" style={{ fontFamily: 'Space Grotesk' }}>
              Account Details
            </h2>
          </div>
          <div className="px-5 py-4">
            <p className="text-[10px] uppercase tracking-widest text-[var(--on-surface-dim)] mb-1" style={{ fontFamily: 'Space Grotesk' }}>Phone Number</p>
            <p className="font-mono text-sm" style={{ color: 'var(--on-surface)' }}>{user.phone ?? 'Not set'}</p>
          </div>
        </div>

        {/* Business Information */}
        <div className="border border-[#cbd0dd]/20" style={{ backgroundColor: 'var(--surface-card)' }}>
          <div className="px-5 py-4 border-b border-[#cbd0dd]/20">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#E31E24]" style={{ fontFamily: 'Space Grotesk' }}>
              Business Information
            </h2>
          </div>
          <div className="px-5 py-6">
            <form action={updateProfile} className="space-y-4">
              <Input
                label="Company Name"
                name="company_name"
                defaultValue={profile?.company_name ?? ''}
                placeholder="Your company name"
                required
              />
              <Input
                label="Phone"
                name="phone"
                type="tel"
                defaultValue={profile?.phone ?? user.phone ?? ''}
                placeholder="+1 555 123 4567"
              />
              <Input
                label="Street Address"
                name="address"
                defaultValue={profile?.address ?? ''}
                placeholder="123 Main St"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  name="city"
                  defaultValue={profile?.city ?? ''}
                  placeholder="Toronto"
                />
                <Input
                  label="Province"
                  name="state"
                  defaultValue={profile?.state ?? ''}
                  placeholder="ON"
                />
              </div>
              <Input
                label="Postal Code"
                name="zip_code"
                defaultValue={profile?.zip_code ?? ''}
                placeholder="M5V 3A8"
              />
              <div className="pt-2">
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>

        {/* Sign Out */}
        <div className="border border-[#cbd0dd]/20 p-5" style={{ backgroundColor: 'var(--surface-card)' }}>
          <form action={signOut}>
            <Button type="submit" variant="outline">
              Sign Out
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
