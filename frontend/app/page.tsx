'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
  }, [user, loading, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent shadow-glow"></div>
    </div>
  )
}
