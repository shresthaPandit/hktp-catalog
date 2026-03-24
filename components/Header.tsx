import Link from 'next/link'
import { getCurrentUser } from '@/app/actions/auth'
import { HeaderBg } from '@/components/HeaderBg'
import { HeaderControls } from '@/components/HeaderControls'

export async function Header() {
  const result = await getCurrentUser()

  return (
    <header className="fixed top-0 z-50 w-full">
      <HeaderBg />
      <div className="relative z-10 flex justify-between items-center w-full px-6 lg:px-8 h-[72px] max-w-[1440px] mx-auto">
        <HeaderControls profile={result?.profile ?? null} />
      </div>
    </header>
  )
}
