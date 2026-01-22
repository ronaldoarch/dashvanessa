'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';
import LimitsCard from '@/components/LimitsCard';
import ReferralLinkCard from '@/components/ReferralLinkCard';

interface Deal {
  id: string;
  name: string;
  cpaValue: string;
  revSharePercentage: string;
  description?: string;
}

interface Affiliate {
  id: string;
  name: string;
  superbetAffiliateLink?: string;
  superbetAffiliateId?: string;
  deal?: Deal;
}

export default function MyDealPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'AFFILIATE' || !user.affiliateId)) {
      router.push('/dashboard');
      return;
    }

    if (user?.affiliateId) {
      loadData();
    }
  }, [user, authLoading]);

  const loadData = async () => {
    try {
      const [affiliateRes, metricsRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/affiliates/${user?.affiliateId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/metrics`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }),
      ]);

      setAffiliate(affiliateRes.data);
      setMetrics(metricsRes.data);
    } catch (err: any) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <nav className="bg-gray-900/50 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">Meu Deal</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-400 hover:text-white"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {!affiliate?.deal ? (
            <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-6">
              <h2 className="text-xl font-bold text-yellow-200 mb-2">
                Deal não configurado
              </h2>
              <p className="text-yellow-200/80">
                Seu deal ainda não foi configurado pelo administrador. Entre em contato para mais
                informações.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">{affiliate.deal.name}</h1>
                {affiliate.deal.description && (
                  <p className="text-gray-400">{affiliate.deal.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {metrics && (
                  <LimitsCard
                    cpaValue={metrics.cpaValue}
                    revSharePercentage={metrics.revSharePercentage}
                    totalRevShare={metrics.totalRevShare}
                    dealName={affiliate.deal.name}
                  />
                )}
                <ReferralLinkCard affiliateId={affiliate.id} />
              </div>

              <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-white mb-4">Detalhes do Deal</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">CPA por FTD</p>
                    <p className="text-2xl font-bold text-white">
                      R$ {parseFloat(affiliate.deal.cpaValue).toFixed(2)}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Valor pago por cada First Time Deposit
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Revenue Share</p>
                    <p className="text-2xl font-bold text-white">
                      {parseFloat(affiliate.deal.revSharePercentage).toFixed(2)}%
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Percentual sobre a receita gerada
                    </p>
                  </div>
                </div>
              </div>

              {affiliate.superbetAffiliateLink && (
                <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Link de Afiliado Superbet</h2>
                  <div className="flex items-center gap-4">
                    <a
                      href={affiliate.superbetAffiliateLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 break-all flex-1"
                    >
                      {affiliate.superbetAffiliateLink}
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(affiliate.superbetAffiliateLink!);
                        alert('Link copiado!');
                      }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              )}

              {metrics && (
                <div className="bg-gray-800/50 backdrop-blur-lg rounded-lg p-6 mt-6">
                  <h2 className="text-xl font-bold text-white mb-4">Suas Métricas</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">FTDs</p>
                      <p className="text-2xl font-bold text-white">{metrics.totalFTDs || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">CPAs</p>
                      <p className="text-2xl font-bold text-white">{metrics.totalCPAs || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Total CPA</p>
                      <p className="text-2xl font-bold text-white">
                        R$ {(metrics.totalCPAValue || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Total RevShare</p>
                      <p className="text-2xl font-bold text-white">
                        R$ {(metrics.totalRevShare || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
