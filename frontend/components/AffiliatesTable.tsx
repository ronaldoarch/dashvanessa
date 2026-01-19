'use client'

import { formatCurrency } from '@/lib/utils'

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

interface AffiliatesTableProps {
  affiliates: AffiliateMetric[]
  loading: boolean
}

export default function AffiliatesTable({ affiliates, loading }: AffiliatesTableProps) {
  if (loading) {
    return (
      <div className="glass rounded-xl p-6 border border-gray-800">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-xl overflow-hidden border border-gray-800 shadow-xl">
      <div className="px-6 py-5 border-b border-gray-800">
        <h3 className="text-xl leading-6 font-bold text-white uppercase tracking-wide mb-1">
          Meus Indicados
        </h3>
        <p className="text-sm text-gray-400">
          {affiliates.length === 0 
            ? 'Nenhum afiliado indicado ainda. Compartilhe seu link de indicação para começar!'
            : 'Visão detalhada de performance de cada afiliado indicado por você'
          }
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Nome / ID
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                FTDs
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                CPAs
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Valor CPA
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Valor Rev Share
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {affiliates.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-400">
                  Nenhum afiliado encontrado
                </td>
              </tr>
            ) : (
              affiliates.map((affiliate) => {
                const total = affiliate.cpaValue + affiliate.revShareValue
                return (
                  <tr key={affiliate.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-white">
                        {affiliate.name}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        {affiliate.externalId || affiliate.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-lg">
                        {affiliate.ftds}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-lg">
                        {affiliate.cpas}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-yellow-400">
                        {formatCurrency(affiliate.cpaValue)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        R$ {affiliate.cpaValuePerUnit.toFixed(2)} por CPA
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-purple-400">
                        {formatCurrency(affiliate.revShareValue)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {affiliate.revSharePercentage}% de participação
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-base font-bold text-primary-400 bg-primary-500/10 border border-primary-500/20 px-3 py-2 rounded-lg inline-block">
                        {formatCurrency(total)}
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
  )
}
