'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';

interface Invite {
  id: string;
  code: string;
  email: string;
  name: string;
  status: string;
  registrationLink: string;
  expiresAt: string;
  createdAt: string;
  affiliate?: {
    id: string;
    superbetAffiliateLink?: string;
    superbetAffiliateId?: string;
    deal?: {
      id: string;
      name: string;
      cpaValue: string;
      revSharePercentage: string;
    };
    user?: {
      id: string;
      email: string;
      name: string;
    };
  };
}

export default function InvitesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInvite, setNewInvite] = useState({
    email: '',
    name: '',
    expiresInDays: 7,
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/dashboard');
      return;
    }

    if (user?.role === 'ADMIN') {
      loadInvites();
    }
  }, [user, authLoading]);

  const loadInvites = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/invites`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setInvites(response.data);
    } catch (err: any) {
      console.error('Error loading invites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/invites`,
        newInvite,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      setInvites([response.data, ...invites]);
      setShowCreateModal(false);
      setNewInvite({ email: '', name: '', expiresInDays: 7 });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao criar convite');
    } finally {
      setCreating(false);
    }
  };

  const handleCheckStatus = async (inviteId: string) => {
    // Verificar se o convite tem requestId antes de tentar verificar
    const invite = invites.find(inv => inv.id === inviteId);
    if (!invite) {
      alert('Convite não encontrado');
      return;
    }

    // Se o convite ainda não foi registrado (não tem requestId), informar
    if (invite.status === 'PENDING' && !invite.affiliate) {
      alert('ℹ️ Este convite ainda não foi usado pelo afiliado.\n\nO afiliado precisa acessar o link de cadastro primeiro para que o sistema envie os dados para a Superbet.');
      return;
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
      );
      
      if (response.data.status === 'approved' && response.data.affiliateLink) {
        alert(`✅ Afiliado aprovado!\n\nLink Superbet: ${response.data.affiliateLink}\n\nAgora você pode criar um deal para este afiliado.`);
      } else if (response.data.status === 'pending') {
        alert(`⏳ Status: Pendente\n\nAinda aguardando aprovação da Superbet.\n\nVocê pode verificar novamente mais tarde ou configurar o webhook para receber notificações automáticas.`);
      } else {
        alert(`Status: ${response.data.status}\n\nAinda aguardando aprovação da Superbet.`);
      }
      
      loadInvites();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Erro ao verificar status';
      
      if (errorMsg.includes('requestId não encontrado')) {
        alert(`ℹ️ Este convite ainda não foi registrado na Superbet.\n\nO afiliado precisa:\n1. Acessar o link de cadastro\n2. Preencher o formulário\n3. Enviar os dados para a Superbet\n\nDepois disso, você poderá verificar o status.`);
      } else {
        alert(`❌ ${errorMsg}\n\nVerifique se:\n- A API da Superbet está acessível\n- As credenciais estão corretas\n- O convite foi registrado pelo afiliado`);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Link copiado!');
  };

  const filteredInvites = filterStatus === 'all' 
    ? invites 
    : invites.filter(inv => inv.status === filterStatus);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Gerenciar Convites</h1>
          <button
            onClick={() => setShowCreateModal(true)}
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

        <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
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
                        <div className="flex flex-col gap-1">
                          <span className="text-gray-500">Aguardando aprovação</span>
                          <span className="text-xs text-gray-600">
                            Clique em 🔄 para verificar
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {invite.affiliate?.deal ? (
                        <span className="text-green-400">{invite.affiliate.deal.name}</span>
                      ) : invite.affiliate ? (
                        <button
                          onClick={() =>
                            router.push(`/admin/affiliates/${invite.affiliate!.id}/deal`)
                          }
                          className="text-purple-400 hover:text-purple-300"
                        >
                          Criar Deal
                        </button>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(invite.registrationLink)}
                          className="text-blue-400 hover:text-blue-300"
                          title="Copiar link de cadastro"
                        >
                          📋
                        </button>
                        {invite.status === 'PENDING' && (
                          <button
                            onClick={() => handleCheckStatus(invite.id)}
                            className="text-yellow-400 hover:text-yellow-300"
                            title="Verificar status"
                          >
                            🔄
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

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-white mb-4">Criar Novo Convite</h2>
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
                  {error}
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
                    disabled={creating}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-2 px-4 rounded-lg transition-all disabled:opacity-50"
                  >
                    {creating ? 'Criando...' : 'Criar'}
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
