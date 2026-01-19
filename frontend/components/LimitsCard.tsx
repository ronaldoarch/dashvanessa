'use client'

import { formatCurrency } from '@/lib/utils'

interface LimitsCardProps {
  cpaValue: number
  revSharePercentage: number
  totalRevShare?: number
  dealName?: string | null
}

export default function LimitsCard({ cpaValue, revSharePercentage, totalRevShare, dealName }: LimitsCardProps) {
  return (
    <div className="gradient-primary rounded-xl p-6 shadow-xl border border-primary-500/30">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white font-bold text-lg">Seu Limite de Repasse</h3>
        {dealName && (
          <span className="text-xs text-white/80 bg-white/10 px-3 py-1 rounded-full">
            Deal: {dealName}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-6 mb-5">
        <div>
          <div className="text-4xl font-bold text-white mb-2">
            {formatCurrency(cpaValue)}
          </div>
          <div className="text-sm text-white/90 font-medium">CPA Máximo</div>
        </div>
        <div>
          <div className="text-4xl font-bold text-white mb-2">
            {totalRevShare !== undefined ? formatCurrency(totalRevShare) : `${revSharePercentage}%`}
          </div>
          <div className="text-sm text-white/90 font-medium">
            {totalRevShare !== undefined ? 'RevShare Total' : `RevShare Máximo (${revSharePercentage}%)`}
          </div>
        </div>
      </div>
      
      <div className="text-xs text-white/80 border-t border-white/20 pt-4 leading-relaxed">
        {totalRevShare !== undefined 
          ? `Valor total de Revenue Share gerado: ${formatCurrency(totalRevShare)} (${revSharePercentage}% do lucro)`
          : dealName
            ? `Valores configurados no deal "${dealName}". Você pode repassar até esses valores para seus indicados.`
            : `Você pode repassar até esses valores para seus indicados.`
        }
      </div>
    </div>
  )
}
