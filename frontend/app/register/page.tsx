'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get('invite');

  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    phone: '',
    company: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!inviteCode) {
      setError('Código de convite não fornecido');
      setLoading(false);
      return;
    }

    // Buscar informações do convite
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/invites/${inviteCode}`)
      .then((response) => {
        setInvite(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Erro ao carregar convite');
        setLoading(false);
      });
  }, [inviteCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/invites/${inviteCode}/register`,
        {
          password: formData.password,
          phone: formData.phone || undefined,
          company: formData.company || undefined,
        }
      );

      if (response.data.affiliate) {
        // Aprovado imediatamente
        setSuccess('Cadastro realizado com sucesso! Redirecionando para login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        // Pendente de aprovação
        setSuccess(
          'Cadastro enviado para aprovação. Você receberá um email quando for aprovado.'
        );
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao realizar cadastro');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-4">Convite Inválido</h1>
          <p className="text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg p-8 max-w-md w-full shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2">Cadastro de Afiliado</h1>
        <p className="text-gray-400 mb-6">
          Você foi convidado por: <span className="text-white font-semibold">{invite.name}</span>
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={invite.email}
              disabled
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-300 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Nome</label>
            <input
              type="text"
              value={invite.name}
              disabled
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-300 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Senha <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Confirmar Senha <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Telefone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Empresa</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Enviando...' : 'Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
