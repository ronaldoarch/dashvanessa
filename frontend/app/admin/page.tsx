'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

interface Affiliate {
  id: string
  name: string
  externalId: string | null
  userId: string
  dealId: string | null
  createdAt: string
  user: {
    id: string
    email: string
    name: string
  }
  deal: {
    id: string
    name: string
    cpaValue: string
    revSharePercentage: string
  } | null
}

interface Deal {
  id: string
  name: string
  cpaValue: string
  revSharePercentage: string
  active: boolean
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [showDealModal, setShowDealModal] = useState(false)
  const [showEditValuesModal, setShowEditValuesModal] = useState(false)
  const [editCpaValue, setEditCpaValue] = useState('')
  const [editRevSharePercentage, setEditRevSharePercentage] = useState('')

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [affiliatesRes, dealsRes] = await Promise.all([
        api.get('/affiliates'),
        api.get('/deals'),
      ])
      setAffiliates(affiliatesRes.data)
      setDeals(dealsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssociateDeal = async (affiliateId: string, dealId: string) => {
    try {
      await api.post(`/deals/${dealId}/affiliate/${affiliateId}`)
      await fetchData()
      setShowDealModal(false)
      setSelectedAffiliate(null)
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao associar deal')
    }
  }

  const handleEditValues = async () => {
    if (!selectedAffiliate || !editCpaValue || !editRevSharePercentage) {
      alert('Preencha todos os campos')
      return
    }

    try {
      const cpaValue = parseFloat(editCpaValue)
      const revSharePercentage = parseFloat(editRevSharePercentage)

      if (isNaN(cpaValue) || isNaN(revSharePercentage)) {
        alert('Valores inválidos')
        return
      }

      // Se já tem deal, atualizar
      if (selectedAffiliate.dealId) {
        await api.put(`/deals/${selectedAffiliate.dealId}`, {
          cpaValue,
          revSharePercentage,
        })
      } else {
        // Criar novo deal personalizado
        const dealResponse = await api.post('/deals', {
          name: `Deal ${selectedAffiliate.name}`,
          cpaValue,
          revSharePercentage,
          description: `Deal personalizado para ${selectedAffiliate.name}`,
        })
        
        // Associar ao afiliado
        await api.post(`/deals/${dealResponse.data.id}/affiliate/${selectedAffiliate.id}`)
      }

      await fetchData()
      setShowEditValuesModal(false)
      setSelectedAffiliate(null)
      setEditCpaValue('')
      setEditRevSharePercentage('')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao atualizar valores')
    }
  }

  const handleRemoveDeal = async (affiliateId: string) => {
    if (!confirm('Deseja remover o deal deste afiliado?')) return
    
    try {
      const affiliate = affiliates.find(a => a.id === affiliateId)
      if (affiliate?.dealId) {
        await api.delete(`/deals/${affiliate.dealId}/affiliate/${affiliateId}`)
        await fetchData()
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao remover deal')
    }
  }

  const handleResetPassword = async () => {
    if (!selectedAffiliate || !newPassword) return
    
    try {
      // Criar endpoint para resetar senha ou usar o existente
      await api.put(`/auth/reset-password/${selectedAffiliate.userId}`, {
        password: newPassword,
      })
      alert('Senha atualizada com sucesso!')
      setShowPasswordModal(false)
      setNewPassword('')
      setSelectedAffiliate(null)
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao atualizar senha')
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
                Painel Administrativo
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/admin/invites')}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg transition-all"
              >
                Convites
              </button>
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
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Gerenciar Afiliados</h2>
            <p className="text-gray-400">Visualize credenciais e configure deals para cada afiliado</p>
          </div>

          <div className="glass rounded-xl overflow-hidden border border-gray-800 shadow-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Nome / Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      ID Externo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Deal Atual
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      CPA / RevShare
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {affiliates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">
                        Nenhum afiliado cadastrado
                      </td>
                    </tr>
                  ) : (
                    affiliates.map((affiliate) => (
                      <tr key={affiliate.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-white">
                            {affiliate.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {affiliate.user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs text-gray-400 font-mono">
                            {affiliate.externalId || affiliate.id}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {affiliate.deal ? (
                            <span className="text-sm text-primary-400 font-medium">
                              {affiliate.deal.name}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">Sem deal</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {affiliate.deal ? (
                            <div className="text-sm">
                              <div className="text-yellow-400 font-semibold">
                                CPA: {formatCurrency(Number(affiliate.deal.cpaValue))}
                              </div>
                              <div className="text-purple-400 text-xs">
                                RevShare: {affiliate.deal.revSharePercentage}%
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">
                              <div>CPA: R$ 300,00</div>
                              <div className="text-xs">RevShare: 25%</div>
                              <div className="text-xs text-gray-600 mt-1">(padrão)</div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedAffiliate(affiliate)
                                  setEditCpaValue(affiliate.deal?.cpaValue || '300')
                                  setEditRevSharePercentage(affiliate.deal?.revSharePercentage || '25')
                                  setShowEditValuesModal(true)
                                }}
                                className="text-yellow-400 hover:text-yellow-300 font-medium"
                              >
                                Editar Valores
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedAffiliate(affiliate)
                                  setShowPasswordModal(true)
                                }}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                Ver Login
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedAffiliate(affiliate)
                                  setShowDealModal(true)
                                }}
                                className="text-primary-400 hover:text-primary-300 text-xs"
                              >
                                {affiliate.deal ? 'Trocar Deal' : 'Associar Deal'}
                              </button>
                              {affiliate.deal && (
                                <button
                                  onClick={() => handleRemoveDeal(affiliate.id)}
                                  className="text-red-400 hover:text-red-300 text-xs"
                                >
                                  Remover Deal
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de Credenciais */}
      {showPasswordModal && selectedAffiliate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-xl p-6 max-w-md w-full border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4">Credenciais de Acesso</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 font-mono text-sm">
                  {selectedAffiliate.user.email}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Nova Senha (opcional)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Deixe em branco para manter a atual"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setNewPassword('')
                  setSelectedAffiliate(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Fechar
              </button>
              {newPassword && (
                <button
                  onClick={handleResetPassword}
                  className="flex-1 px-4 py-2 gradient-primary text-white rounded-lg hover:shadow-glow transition-all"
                >
                  Atualizar Senha
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar Valores */}
      {showEditValuesModal && selectedAffiliate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-xl p-6 max-w-md w-full border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4">
              Definir Valores - {selectedAffiliate.name}
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Valor do CPA (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editCpaValue}
                  onChange={(e) => setEditCpaValue(e.target.value)}
                  placeholder="300.00"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Porcentagem de RevShare (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={editRevSharePercentage}
                  onChange={(e) => setEditRevSharePercentage(e.target.value)}
                  placeholder="25"
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50"
                />
              </div>
              {selectedAffiliate.deal && (
                <div className="text-xs text-gray-400 bg-gray-800/50 p-3 rounded-lg">
                  <strong>Valores atuais:</strong> CPA: {formatCurrency(Number(selectedAffiliate.deal.cpaValue))} | RevShare: {selectedAffiliate.deal.revSharePercentage}%
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEditValuesModal(false)
                  setSelectedAffiliate(null)
                  setEditCpaValue('')
                  setEditRevSharePercentage('')
                }}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditValues}
                className="flex-1 px-4 py-2 gradient-primary text-white rounded-lg hover:shadow-glow transition-all"
              >
                Salvar Valores
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Associar Deal */}
      {showDealModal && selectedAffiliate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass rounded-xl p-6 max-w-md w-full border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4">
              Associar Deal - {selectedAffiliate.name}
            </h3>
            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {deals.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhum deal disponível. Crie um deal primeiro.</p>
              ) : (
                deals.map((deal) => (
                  <div
                    key={deal.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedAffiliate.dealId === deal.id
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-gray-700 bg-gray-800/50 hover:border-primary-500/50'
                    }`}
                    onClick={() => handleAssociateDeal(selectedAffiliate.id, deal.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-white">{deal.name}</div>
                        <div className="text-sm text-gray-400 mt-1">
                          CPA: {formatCurrency(Number(deal.cpaValue))} | RevShare: {deal.revSharePercentage}%
                        </div>
                      </div>
                      {selectedAffiliate.dealId === deal.id && (
                        <span className="text-primary-400 text-xs">Atual</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => {
                setShowDealModal(false)
                setSelectedAffiliate(null)
              }}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
