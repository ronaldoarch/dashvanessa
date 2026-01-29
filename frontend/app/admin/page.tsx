'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import axios from 'axios'
import { formatCurrency } from '@/lib/utils'

interface Affiliate {
  id: string
  name: string
  externalId: string | null
  userId: string
  dealId: string | null
  superbetAffiliateLink?: string
  superbetAffiliateId?: string
  instagramLink?: string
  facebookLink?: string
  telegramLink?: string
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

interface Invite {
  id: string
  code: string
  email: string
  name: string
  status: string
  registrationLink: string
  expiresAt: string
  createdAt: string
  affiliate?: {
    id: string
    superbetAffiliateLink?: string
    superbetAffiliateId?: string
    deal?: {
      id: string
      name: string
      cpaValue: string
      revSharePercentage: string
    }
    user?: {
      id: string
      email: string
      name: string
    }
  }
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'affiliates' | 'invites'>('affiliates')
  const [affiliates, setAffiliates] = useState<Affiliate[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [showDealModal, setShowDealModal] = useState(false)
  const [showEditValuesModal, setShowEditValuesModal] = useState(false)
  const [editCpaValue, setEditCpaValue] = useState('')
  const [editRevSharePercentage, setEditRevSharePercentage] = useState('')
  
  // Estados para convites
  const [showCreateInviteModal, setShowCreateInviteModal] = useState(false)
  const [newInvite, setNewInvite] = useState({
    email: '',
    name: '',
    expiresInDays: 7,
  })
  const [creatingInvite, setCreatingInvite] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  // Estados para link da Superbet do admin
  const [adminSuperbetLink, setAdminSuperbetLink] = useState('')
  const [showSuperbetLinkModal, setShowSuperbetLinkModal] = useState(false)
  const [editingSuperbetLink, setEditingSuperbetLink] = useState('')
  const [savingSuperbetLink, setSavingSuperbetLink] = useState(false)
  
  // Estados para links sociais
  const [showSocialLinksModal, setShowSocialLinksModal] = useState(false)
  const [socialLinks, setSocialLinks] = useState({
    instagramLink: '',
    facebookLink: '',
    telegramLink: '',
    superbetLink: '',
  })
  const [savingSocialLinks, setSavingSocialLinks] = useState(false)

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

  // Recarregar dados quando a página receber foco
  useEffect(() => {
    const handleFocus = () => {
      if (user?.role === 'ADMIN') {
        fetchData()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [affiliatesRes, dealsRes, invitesRes, configRes] = await Promise.all([
        api.get('/affiliates'),
        api.get('/deals'),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/invites`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }),
        api.get('/config'),
      ])
      setAffiliates(affiliatesRes.data)
      setDeals(dealsRes.data)
      setInvites(invitesRes.data)
      setAdminSuperbetLink(configRes.data.adminSuperbetLink || '')
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSuperbetLink = async () => {
    if (!editingSuperbetLink.trim()) {
      alert('Por favor, informe o link da Superbet')
      return
    }

    setSavingSuperbetLink(true)
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/config/admin-superbet-link`,
        { link: editingSuperbetLink.trim() },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )
      setAdminSuperbetLink(response.data.link)
      setShowSuperbetLinkModal(false)
      setEditingSuperbetLink('')
      alert('Link da Superbet salvo com sucesso!')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar link da Superbet')
    } finally {
      setSavingSuperbetLink(false)
    }
  }

  const handleAssociateDeal = async (affiliateId: string, dealId: string) => {
    try {
      const response = await api.post(`/deals/${dealId}/affiliate/${affiliateId}`)
      await fetchData()
      
      const credentials = response.data.credentials
      const referralLink = adminSuperbetLink || response.data.referralLink || `${typeof window !== 'undefined' ? window.location.origin : ''}/cadastro?ref=${affiliateId}`
      
      if (credentials) {
        const message = `✅ Deal associado com sucesso!\n\n📧 Email: ${credentials.email}\n🔑 Senha: ${credentials.password}\n🔗 Link de Referral: ${referralLink}\n🌐 URL do Dashboard: ${credentials.dashboardUrl}\n\n⚠️ IMPORTANTE: Anote a senha, ela não será exibida novamente!`
        alert(message)
        
        // Copiar credenciais para área de transferência
        const credentialsText = `Email: ${credentials.email}\nSenha: ${credentials.password}\nDashboard: ${credentials.dashboardUrl}\nLink de Referral: ${referralLink}`
        try {
          await navigator.clipboard.writeText(credentialsText)
          alert('Credenciais copiadas para área de transferência!')
        } catch (e) {
          // Ignorar erro de clipboard
        }
      }
      
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

      if (selectedAffiliate.dealId) {
        await api.put(`/deals/${selectedAffiliate.dealId}`, {
          cpaValue,
          revSharePercentage,
        })
      } else {
        const dealResponse = await api.post('/deals', {
          name: `Deal ${selectedAffiliate.name}`,
          cpaValue,
          revSharePercentage,
          description: `Deal personalizado para ${selectedAffiliate.name}`,
        })
        
        const associateResponse = await api.post(`/deals/${dealResponse.data.id}/affiliate/${selectedAffiliate.id}`)
        
        const credentials = associateResponse.data.credentials
        const referralLink = adminSuperbetLink || associateResponse.data.referralLink || `${typeof window !== 'undefined' ? window.location.origin : ''}/cadastro?ref=${selectedAffiliate.id}`
        
        if (credentials) {
          const message = `✅ Deal criado e associado com sucesso!\n\n📧 Email: ${credentials.email}\n🔑 Senha: ${credentials.password}\n🔗 Link de Referral: ${referralLink}\n🌐 URL do Dashboard: ${credentials.dashboardUrl}\n\n⚠️ IMPORTANTE: Anote a senha, ela não será exibida novamente!`
          alert(message)
          
          // Copiar credenciais para área de transferência
          const credentialsText = `Email: ${credentials.email}\nSenha: ${credentials.password}\nDashboard: ${credentials.dashboardUrl}\nLink de Referral: ${referralLink}`
          try {
            await navigator.clipboard.writeText(credentialsText)
            alert('Credenciais copiadas para área de transferência!')
          } catch (e) {
            // Ignorar erro de clipboard
          }
        }
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

  const handleSaveSocialLinks = async () => {
    if (!selectedAffiliate) return
    
    setSavingSocialLinks(true)
    try {
      // Atualizar links sociais e link da Superbet (se fornecido)
      const updateData: any = { ...socialLinks }
      if (socialLinks.superbetLink) {
        await api.put(`/affiliates/${selectedAffiliate.id}/superbet-link`, {
          superbetAffiliateLink: socialLinks.superbetLink,
        })
      }
      
      await api.put(`/affiliates/${selectedAffiliate.id}/social-links`, {
        instagramLink: socialLinks.instagramLink,
        facebookLink: socialLinks.facebookLink,
        telegramLink: socialLinks.telegramLink,
      })
      
      alert('Links atualizados com sucesso!')
      await fetchData()
      setShowSocialLinksModal(false)
      setSocialLinks({ instagramLink: '', facebookLink: '', telegramLink: '', superbetLink: '' })
      setSelectedAffiliate(null)
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao atualizar links')
    } finally {
      setSavingSocialLinks(false)
    }
  }

  const openSocialLinksModal = (affiliate: Affiliate) => {
    setSelectedAffiliate(affiliate)
    setSocialLinks({
      instagramLink: affiliate.instagramLink || '',
      facebookLink: affiliate.facebookLink || '',
      telegramLink: affiliate.telegramLink || '',
      superbetLink: affiliate.superbetAffiliateLink || '',
    })
    setShowSocialLinksModal(true)
  }

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError('')
    
    if (!adminSuperbetLink) {
      setInviteError('Por favor, cadastre o link da Superbet antes de criar convites.')
      return
    }
    
    setCreatingInvite(true)

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/invites`,
        newInvite,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )

      setInvites([response.data, ...invites])
      setShowCreateInviteModal(false)
      setNewInvite({ email: '', name: '', expiresInDays: 7 })
    } catch (err: any) {
      setInviteError(err.response?.data?.error || 'Erro ao criar convite')
    } finally {
      setCreatingInvite(false)
    }
  }

  const handleCheckStatus = async (inviteId: string) => {
    const invite = invites.find(inv => inv.id === inviteId)
    if (!invite) {
      alert('Convite não encontrado')
      return
    }

    if (invite.status === 'PENDING' && !invite.affiliate) {
      alert('ℹ️ Este convite ainda não foi usado pelo afiliado.\n\nO afiliado precisa acessar o link de cadastro primeiro.')
      return
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/invites/${inviteId}/check-status`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )
      
      if (response.data.status === 'approved' && response.data.affiliateLink) {
        alert(`✅ Afiliado aprovado!\n\nLink Superbet: ${response.data.affiliateLink}\n\nAgora você pode criar um deal para este afiliado.`)
      } else if (response.data.status === 'pending') {
        alert('⏳ Status: Pendente\n\nAinda aguardando aprovação da Superbet.')
      }
      
      fetchData()
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Erro ao verificar status'
      alert(`❌ ${errorMsg}`)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copiado!')
  }

  const filteredInvites = filterStatus === 'all' 
    ? invites 
    : invites.filter(inv => inv.status === filterStatus)

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
          {/* Banner de Link da Superbet */}
          <div className="mb-6 glass rounded-xl p-4 border border-gray-800">
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Link da Superbet</h3>
                {adminSuperbetLink ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={adminSuperbetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 truncate max-w-md text-sm"
                    >
                      {adminSuperbetLink}
                    </a>
                    <button
                      onClick={() => copyToClipboard(adminSuperbetLink)}
                      className="text-gray-400 hover:text-white"
                      title="Copiar link"
                    >
                      📋
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">Nenhum link configurado</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Este link será usado para cadastro de novos afiliados e como link de referral
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingSuperbetLink(adminSuperbetLink)
                  setShowSuperbetLinkModal(true)
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition-all"
              >
                {adminSuperbetLink ? 'Editar Link' : 'Cadastrar Link'}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-4 border-b border-gray-800">
            <button
              onClick={() => setActiveTab('affiliates')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'affiliates'
                  ? 'text-primary-400 border-b-2 border-primary-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Afiliados
            </button>
            <button
              onClick={() => setActiveTab('invites')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'invites'
                  ? 'text-primary-400 border-b-2 border-primary-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Convites
            </button>
          </div>

          {/* Tab Content: Afiliados */}
          {activeTab === 'affiliates' && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Gerenciar Afiliados</h2>
                <p className="text-gray-400">Visualize credenciais, links de referral e configure deals para cada afiliado</p>
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
                          Link de Referral
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                          Link Superbet
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {affiliates.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-400">
                            Nenhum afiliado cadastrado
                          </td>
                        </tr>
                      ) : (
                        affiliates.map((affiliate) => {
                          const referralLink = adminSuperbetLink || `${typeof window !== 'undefined' ? window.location.origin : ''}/cadastro?ref=${affiliate.id}`
                          return (
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
                              <td className="px-6 py-4 text-sm">
                                {affiliate.deal ? (
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={referralLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-purple-400 hover:text-purple-300 truncate max-w-xs text-xs"
                                    >
                                      {referralLink}
                                    </a>
                                    <button
                                      onClick={() => copyToClipboard(referralLink)}
                                      className="text-gray-400 hover:text-white"
                                      title="Copiar link"
                                    >
                                      📋
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-500">Defina um deal primeiro</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                {affiliate.superbetAffiliateLink ? (
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={affiliate.superbetAffiliateLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-green-400 hover:text-green-300 truncate max-w-xs text-xs"
                                      title="Link espelhado da API Superbet"
                                    >
                                      {affiliate.superbetAffiliateLink}
                                    </a>
                                    <button
                                      onClick={() => copyToClipboard(affiliate.superbetAffiliateLink!)}
                                      className="text-gray-400 hover:text-white"
                                      title="Copiar link Superbet"
                                    >
                                      📋
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-500">Pendente</span>
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
                                      className="text-yellow-400 hover:text-yellow-300 font-medium text-xs"
                                    >
                                      Editar Valores
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedAffiliate(affiliate)
                                        setShowPasswordModal(true)
                                      }}
                                      className="text-blue-400 hover:text-blue-300 text-xs"
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
                                  <div className="flex gap-2 mt-1">
                                    <button
                                      onClick={() => openSocialLinksModal(affiliate)}
                                      className="text-green-400 hover:text-green-300 text-xs"
                                    >
                                      Links Sociais
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Tab Content: Convites */}
          {activeTab === 'invites' && (
            <>
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Gerenciar Convites</h2>
                  <p className="text-gray-400">Crie convites e obtenha links de cadastro da Superbet para enviar aos afiliados</p>
                </div>
                <button
                  onClick={() => setShowCreateInviteModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                >
                  Criar Novo Convite
                </button>
              </div>

              <div className="mb-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-2 text-white"
                >
                  <option value="all">Todos</option>
                  <option value="PENDING">Pendentes</option>
                  <option value="APPROVED">Aprovados</option>
                  <option value="REJECTED">Rejeitados</option>
                  <option value="EXPIRED">Expirados</option>
                </select>
              </div>

              <div className="glass rounded-xl overflow-hidden border border-gray-800 shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Link Superbet
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Deal
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Login & Link
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredInvites.map((invite) => (
                        <tr key={invite.id} className="hover:bg-gray-700/30">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {invite.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                            {invite.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                invite.status === 'APPROVED'
                                  ? 'bg-green-500/20 text-green-400'
                                  : invite.status === 'PENDING'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : invite.status === 'REJECTED'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-gray-500/20 text-gray-400'
                              }`}
                            >
                              {invite.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {invite.affiliate?.superbetAffiliateLink ? (
                              <div className="flex items-center gap-2">
                                <a
                                  href={invite.affiliate.superbetAffiliateLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-purple-400 hover:text-purple-300 truncate max-w-xs"
                                >
                                  {invite.affiliate.superbetAffiliateLink}
                                </a>
                                <button
                                  onClick={() => copyToClipboard(invite.affiliate!.superbetAffiliateLink!)}
                                  className="text-gray-400 hover:text-white"
                                  title="Copiar link Superbet"
                                >
                                  📋
                                </button>
                              </div>
                            ) : invite.status === 'PENDING' ? (
                              <span className="text-gray-500">Aguardando aprovação</span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {invite.affiliate?.deal ? (
                              <span className="text-green-400">{invite.affiliate.deal.name}</span>
                            ) : invite.affiliate ? (
                              <button
                                onClick={async () => {
                                  const affiliate = affiliates.find(a => a.id === invite.affiliate!.id)
                                  if (affiliate) {
                                    setSelectedAffiliate(affiliate)
                                    setShowDealModal(true)
                                  }
                                }}
                                className="text-purple-400 hover:text-purple-300"
                              >
                                Criar Deal
                              </button>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-300">
                            {invite.affiliate?.deal && invite.affiliate?.id ? (
                              <div className="space-y-2">
                                <div>
                                  <span className="text-xs text-gray-500">Email:</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-white text-xs">{invite.affiliate.user?.email || invite.email}</span>
                                    <button
                                      onClick={() => copyToClipboard(invite.affiliate!.user?.email || invite.email)}
                                      className="text-gray-400 hover:text-white"
                                      title="Copiar email"
                                    >
                                      📋
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Dashboard:</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <a
                                      href={`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-400 hover:text-blue-300 truncate max-w-xs text-xs"
                                    >
                                      {`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard`}
                                    </a>
                                    <button
                                      onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard`)}
                                      className="text-gray-400 hover:text-white"
                                      title="Copiar URL do dashboard"
                                    >
                                      📋
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Link Referral:</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <a
                                      href={adminSuperbetLink || `${typeof window !== 'undefined' ? window.location.origin : ''}/cadastro?ref=${invite.affiliate.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-purple-400 hover:text-purple-300 truncate max-w-xs text-xs"
                                    >
                                      {adminSuperbetLink || `${typeof window !== 'undefined' ? window.location.origin : ''}/cadastro?ref=${invite.affiliate.id}`}
                                    </a>
                                    <button
                                      onClick={() => copyToClipboard(adminSuperbetLink || `${typeof window !== 'undefined' ? window.location.origin : ''}/cadastro?ref=${invite.affiliate!.id}`)}
                                      className="text-gray-400 hover:text-white"
                                      title="Copiar link de referral"
                                    >
                                      📋
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-xs">Defina um deal primeiro</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Link Superbet:</span>
                                <button
                                  onClick={() => copyToClipboard(invite.registrationLink)}
                                  className="text-blue-400 hover:text-blue-300"
                                  title="Copiar link de cadastro da Superbet"
                                >
                                  📋
                                </button>
                              </div>
                              {invite.status === 'PENDING' && (
                                <button
                                  onClick={() => handleCheckStatus(invite.id)}
                                  className="text-yellow-400 hover:text-yellow-300 text-xs"
                                  title="Verificar status"
                                >
                                  🔄 Verificar Status
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal de Link da Superbet */}
      {showSuperbetLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Link da Superbet</h2>
            <p className="text-sm text-gray-400 mb-4">
              Cadastre o link da Superbet que será usado para cadastro de novos afiliados e como link de referral.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Link da Superbet</label>
                <input
                  type="url"
                  value={editingSuperbetLink}
                  onChange={(e) => setEditingSuperbetLink(e.target.value)}
                  placeholder="https://superbet.com/affiliate/..."
                  required
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveSuperbetLink}
                  disabled={savingSuperbetLink}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50"
                >
                  {savingSuperbetLink ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={() => {
                    setShowSuperbetLinkModal(false)
                    setEditingSuperbetLink('')
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Links Sociais */}
      {showSocialLinksModal && selectedAffiliate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">Links Sociais - {selectedAffiliate.name}</h2>
            <p className="text-sm text-gray-400 mb-4">
              Gerencie os links sociais do afiliado. O link da Superbet será exibido automaticamente quando disponível.
            </p>
            
            {/* Link da Superbet (editável pelo admin) */}
            <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Link Superbet {selectedAffiliate.superbetAffiliateLink && '(espelhado da API - pode modificar)'}
              </label>
              <input
                type="url"
                value={socialLinks.superbetLink}
                onChange={(e) => setSocialLinks({ ...socialLinks, superbetLink: e.target.value })}
                placeholder="https://superbet.com/affiliate/..."
                className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
              />
              {socialLinks.superbetLink && (
                <div className="flex items-center gap-2 mt-2">
                  <a
                    href={socialLinks.superbetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 text-sm break-all flex-1"
                  >
                    {socialLinks.superbetLink}
                  </a>
                  <button
                    onClick={() => copyToClipboard(socialLinks.superbetLink)}
                    className="text-gray-400 hover:text-white"
                    title="Copiar link"
                  >
                    📋
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Instagram</label>
                <input
                  type="url"
                  value={socialLinks.instagramLink}
                  onChange={(e) => setSocialLinks({ ...socialLinks, instagramLink: e.target.value })}
                  placeholder="https://instagram.com/..."
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Facebook</label>
                <input
                  type="url"
                  value={socialLinks.facebookLink}
                  onChange={(e) => setSocialLinks({ ...socialLinks, facebookLink: e.target.value })}
                  placeholder="https://facebook.com/..."
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Telegram</label>
                <input
                  type="url"
                  value={socialLinks.telegramLink}
                  onChange={(e) => setSocialLinks({ ...socialLinks, telegramLink: e.target.value })}
                  placeholder="https://t.me/..."
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveSocialLinks}
                  disabled={savingSocialLinks}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50"
                >
                  {savingSocialLinks ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={() => {
                    setShowSocialLinksModal(false)
                    setSocialLinks({ instagramLink: '', facebookLink: '', telegramLink: '', superbetLink: '' })
                    setSelectedAffiliate(null)
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criar Convite */}
      {showCreateInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-2">Criar Novo Convite</h2>
            <p className="text-sm text-gray-400 mb-4">
              O link da Superbet cadastrado será enviado ao afiliado para cadastro
            </p>
            {!adminSuperbetLink && (
              <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-200 px-4 py-3 rounded mb-4">
                ⚠️ Cadastre o link da Superbet antes de criar convites
              </div>
            )}
            {inviteError && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
                {inviteError}
              </div>
            )}
            <form onSubmit={handleCreateInvite} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={newInvite.email}
                  onChange={(e) => setNewInvite({ ...newInvite, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">Nome</label>
                <input
                  type="text"
                  value={newInvite.name}
                  onChange={(e) => setNewInvite({ ...newInvite, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Expira em (dias)
                </label>
                <input
                  type="number"
                  value={newInvite.expiresInDays}
                  onChange={(e) =>
                    setNewInvite({ ...newInvite, expiresInDays: parseInt(e.target.value) })
                  }
                  min="1"
                  max="30"
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creatingInvite}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50"
                >
                  {creatingInvite ? 'Criando...' : 'Criar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateInviteModal(false)
                    setInviteError('')
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
