'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';

interface Affiliate {
  id: string;
  name: string;
  email: string;
  superbetAffiliateLink?: string;
  superbetAffiliateId?: string;
  deal?: {
    id: string;
    name: string;
    cpaValue: string;
    revSharePercentage: string;
  };
}

interface Deal {
  id: string;
  name: string;
  cpaValue: string;
  revSharePercentage: string;
  description?: string;
  active: boolean;
}

export default function AssociateDealPage() {
  const router = useRouter();
  const params = useParams();
  const affiliateId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDeal, setNewDeal] = useState({
    name: '',
    cpaValue: '',
    revSharePercentage: '',
    description: '',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/dashboard');
      return;
    }

    if (user?.role === 'ADMIN' && affiliateId) {
      loadData();
    }
  }, [user, authLoading, affiliateId]);

  const loadData = async () => {
    try {
      const [affiliateRes, dealsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/affiliates/${affiliateId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/deals`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }),
      ]);

      setAffiliate(affiliateRes.data);
      setDeals(dealsRes.data);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.response?.data?.error || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/deals`,
        {
          name: newDeal.name,
          cpaValue: parseFloat(newDeal.cpaValue),
          revSharePercentage: parseFloat(newDeal.revSharePercentage),
          description: newDeal.description || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      const createdDeal = response.data;
      setDeals([...deals, createdDeal]);
      setShowCreateModal(false);
      setNewDeal({ name: '', cpaValue: '', revSharePercentage: '', description: '' });

      // Associar automaticamente ao afiliado
      await handleAssociateDeal(createdDeal.id);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar deal');
    } finally {
      setCreating(false);
    }
  };

  const handleAssociateDeal = async (dealId: string) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/deals/${dealId}/affiliate/${affiliateId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      await loadData();
      
      // Mostrar informações de login e link de referral
      const referralLink = response.data.referralLink || `${typeof window !== 'undefined' ? window.location.origin : ''}/cadastro?ref=${affiliateId}`;
      const email = response.data.user?.email || affiliate?.email || '';
      
      const message = `✅ Deal associado com sucesso!\n\n📧 Email: ${email}\n🔗 Link de Referral: ${referralLink}\n\nEssas informações já estão disponíveis na página de convites.`;
      alert(message);
      
      // Copiar link automaticamente
      try {
        await navigator.clipboard.writeText(referralLink);
      } catch (e) {
        // Ignorar erro de clipboard
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao associar deal');
    }
  };

  const handleDisassociateDeal = async () => {
    if (!confirm('Tem certeza que deseja remover o deal deste afiliado?')) {
      return;
    }

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/deals/affiliate/${affiliateId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      await loadData();
      alert('Deal removido com sucesso!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao remover deal');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white">Afiliado não encontrado</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white mb-4"
          >
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciar Deal - {affiliate.name}</h1>
          <p className="text-gray-400">{affiliate.email}</p>
        </div>

        {affiliate.superbetAffiliateLink && (
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg p-4 mb-6">
            <h3 className="text-white font-semibold mb-2">Link Superbet</h3>
            <a
              href={affiliate.superbetAffiliateLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 break-all"
            >
              {affiliate.superbetAffiliateLink}
            </a>
          </div>
        )}

        {affiliate.deal ? (
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Deal Atual</h3>
                <p className="text-gray-400">{affiliate.deal.name}</p>
              </div>
              <button
                onClick={handleDisassociateDeal}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Remover Deal
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">CPA</p>
                <p className="text-white text-lg font-semibold">
                  R$ {parseFloat(affiliate.deal.cpaValue).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">RevShare</p>
                <p className="text-white text-lg font-semibold">
                  {parseFloat(affiliate.deal.revSharePercentage).toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4 mb-6">
            <p className="text-yellow-200">
              Este afiliado ainda não possui um deal associado. Crie ou selecione um deal abaixo.
            </p>
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Deals Disponíveis</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-2 px-4 rounded-lg transition-all"
          >
            Criar Novo Deal
          </button>
        </div>

        <div className="space-y-4">
          {deals.map((deal) => (
            <div
              key={deal.id}
              className={`bg-gray-800/50 backdrop-blur-lg rounded-lg p-6 border ${
                affiliate.deal?.id === deal.id
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-700 hover:border-purple-500/50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{deal.name}</h3>
                  {deal.description && (
                    <p className="text-gray-400 text-sm mb-4">{deal.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">CPA</p>
                      <p className="text-white text-lg font-semibold">
                        R$ {parseFloat(deal.cpaValue).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">RevShare</p>
                      <p className="text-white text-lg font-semibold">
                        {parseFloat(deal.revSharePercentage).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  {affiliate.deal?.id === deal.id ? (
                    <span className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm font-semibold">
                      Atual
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAssociateDeal(deal.id)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all"
                    >
                      Associar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-white mb-4">Criar Novo Deal</h2>
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              <form onSubmit={handleCreateDeal} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Nome</label>
                  <input
                    type="text"
                    value={newDeal.name}
                    onChange={(e) => setNewDeal({ ...newDeal, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">CPA (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newDeal.cpaValue}
                    onChange={(e) => setNewDeal({ ...newDeal, cpaValue: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    RevShare (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    max="100"
                    value={newDeal.revSharePercentage}
                    onChange={(e) =>
                      setNewDeal({ ...newDeal, revSharePercentage: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={newDeal.description}
                    onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50"
                  >
                    {creating ? 'Criando...' : 'Criar e Associar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setError('');
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
      </div>
    </div>
  );
}
