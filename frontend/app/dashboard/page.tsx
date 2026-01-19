'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import DashboardCards from '@/components/DashboardCards'
import AffiliatesTable from '@/components/AffiliatesTable'
import Filters from '@/components/Filters'
import LimitsCard from '@/components/LimitsCard'
import ReferralLinkCard from '@/components/ReferralLinkCard'

interface Metrics {
  totalFTDs: number
  totalCPAs: number
  totalCPAValue: number
  totalRevShare: number
  cpaValue: number
  revSharePercentage: number
  dealName?: string | null
}

interface AffiliateMetric {
  id: string
  name: string
  externalId: string | null
  ftds: number
  cpas: number
  cpaValue: number
  revShareValue: number
  cpaValuePerUnit: number
  revSharePercentage: number
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [affiliates, setAffiliates] = useState<AffiliateMetric[]>([])
  const [loading, setLoading] = useState(true)
  
  // Função helper para formatar data
  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const [filters, setFilters] = useState({
    startDate: formatDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    endDate: formatDate(new Date()),
    affiliateId: '',
    status: '',
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, filters])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [metricsRes, affiliatesRes] = await Promise.all([
        api.get('/dashboard/metrics', {
          params: {
            startDate: filters.startDate,
            endDate: filters.endDate,
          },
        }),
        api.get('/dashboard/affiliates', {
          params: {
            startDate: filters.startDate,
            endDate: filters.endDate,
          },
        }),
      ])

      setMetrics(metricsRes.data)
      setAffiliates(affiliatesRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent shadow-glow"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="glass border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                Painel de Afiliados
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {user?.role === 'ADMIN' && (
                <button
                  onClick={() => router.push('/admin')}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
                >
                  Admin
                </button>
              )}
              <span className="text-sm text-gray-300 font-medium">{user?.name}</span>
              <button
                onClick={() => {
                  localStorage.removeItem('token')
                  localStorage.removeItem('user')
                  router.push('/login')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {user?.role === 'ADMIN' ? 'Painel de Afiliados' : 'Minha Equipe'}
            </h1>
            <p className="text-gray-400">
              {user?.role === 'ADMIN' 
                ? 'Gerencie todos os afiliados cadastrados no sistema'
                : 'Gerencie seus indicados e acompanhe suas métricas'
              }
            </p>
          </div>

          {/* Seção de Limites e Link de Indicação */}
          <div className={`grid grid-cols-1 ${user?.role === 'AFFILIATE' ? 'lg:grid-cols-2' : ''} gap-6 mb-8`}>
            {metrics && (
              <LimitsCard 
                cpaValue={metrics.cpaValue}
                revSharePercentage={metrics.revSharePercentage}
                totalRevShare={metrics.totalRevShare}
                dealName={metrics.dealName}
              />
            )}
            {user?.role === 'AFFILIATE' && (
              <ReferralLinkCard affiliateId={user?.affiliateId} />
            )}
          </div>

          {/* Filtros */}
          <div className="mb-6">
            <Filters filters={filters} onFiltersChange={setFilters} />
          </div>

          {/* Cards de Métricas */}
          {metrics && (
            <DashboardCards
              metrics={metrics}
              className="mb-8"
            />
          )}

          {/* Tabela de Afiliados */}
          <AffiliatesTable
            affiliates={affiliates}
            loading={loading}
          />
        </div>
      </main>
    </div>
  )
}
