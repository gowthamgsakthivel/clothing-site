'use client'

import { usePathname } from 'next/navigation'

export default function ClientLayoutWrapper({ children }) {
  const pathname = usePathname()
  const isOwnerRoute = pathname?.startsWith('/owner')

  return (
    <div className={isOwnerRoute ? 'min-h-screen bg-[#F8FAFC]' : 'page-with-navbar'}>
      {children}
    </div>
  )
}
