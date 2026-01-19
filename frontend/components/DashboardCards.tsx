'use client'

import { formatCurrency } from '@/lib/utils'

interface Metrics {
  totalFTDs: number
  totalCPAs: number
  totalCPAValue: number
  totalRevShare: number
  cpaValue: number
  revSharePercentage: number
}

interface DashboardCardsProps {
  metrics: Metrics
  className?: string
}

export default function DashboardCards({ metrics, className = '' }: DashboardCardsProps) {
  const cards = [
    {
      title: 'Total de FTDs',
      value: metrics.totalFTDs,
      gradient: 'gradient-info',
      borderColor: 'border-blue-500/30',
    },
    {
      title: 'Total de CPAs',
      value: metrics.totalCPAs,
      gradient: 'gradient-success',
      borderColor: 'border-green-500/30',
    },
    {
      title: 'Valor Total em CPA',
      value: formatCurrency(metrics.totalCPAValue),
      gradient: 'gradient-warning',
      borderColor: 'border-yellow-500/30',
    },
    {
      title: 'Valor em Revenue Share',
      value: formatCurrency(metrics.totalRevShare),
      gradient: 'gradient-purple',
      borderColor: 'border-purple-500/30',
    },
  ]

  return (
    <div className={className}>
      <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-wide">Resumo de Performance</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`glass overflow-hidden rounded-xl hover:shadow-glow transition-all duration-300 border ${card.borderColor} hover:border-opacity-60 group relative`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <div className={`h-full w-full ${card.gradient} rounded-full blur-3xl`}></div>
            </div>
            <div className="p-6 relative z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-white mb-1">
                    {card.value}
                  </p>
                </div>
              </div>
              <div className={`mt-5 h-0.5 ${card.gradient} rounded-full opacity-40 group-hover:opacity-100 transition-opacity`}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
