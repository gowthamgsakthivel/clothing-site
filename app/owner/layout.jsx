import React from 'react'
import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import OwnerLayout from '@/components/OwnerLayout'

const Layout = async ({ children }) => {
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  const user = await currentUser()
  const rawRole = user?.publicMetadata?.role
  const role = rawRole === 'customer' ? 'user' : (rawRole || 'user')

  if (role !== 'admin') {
    redirect('/')
  }

  return <OwnerLayout>{children}</OwnerLayout>
}

export default Layout
