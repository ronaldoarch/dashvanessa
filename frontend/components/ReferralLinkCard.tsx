'use client'

import { useState } from 'react'

interface ReferralLinkCardProps {
  affiliateId?: string
}

export default function ReferralLinkCard({ affiliateId }: ReferralLinkCardProps) {
  const [copied, setCopied] = useState(false)
  
  const referralLink = affiliateId 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/cadastro?ref=${affiliateId}`
    : 'Carregando...'
  
  const referralCode = affiliateId || ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  return (
    <div className="glass rounded-xl p-6 border border-gray-800 shadow-xl">
      <h3 className="text-white font-bold text-lg mb-2">Seu Link de Indicação</h3>
      <p className="text-sm text-gray-400 mb-5 leading-relaxed">
        Compartilhe para convidar novos membros para sua equipe (serão seus Nível 3)
      </p>
      
      <div className="space-y-3">
        <input
          type="text"
          value={referralLink}
          readOnly
          className="w-full bg-gray-800/50 border border-gray-700 text-gray-100 px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50"
        />
        <button
          onClick={handleCopy}
          className="w-full gradient-primary px-6 py-3 rounded-lg text-white font-medium hover:shadow-glow transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
            />
          </svg>
          {copied ? 'Copiado!' : 'Copiar Link'}
        </button>
      </div>
    </div>
  )
}
