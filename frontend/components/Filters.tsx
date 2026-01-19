'use client'

interface FiltersProps {
  filters: {
    startDate: string
    endDate: string
    affiliateId: string
    status: string
  }
  onFiltersChange: (filters: {
    startDate: string
    endDate: string
    affiliateId: string
    status: string
  }) => void
}

export default function Filters({ filters, onFiltersChange }: FiltersProps) {
  const handleChange = (field: string, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    })
  }

  return (
    <div className="glass shadow-xl rounded-xl p-6 border border-gray-800">
      <h3 className="text-lg font-bold text-white mb-5 uppercase tracking-wide">
        Filtros
      </h3>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-2">
            Data Inicial
          </label>
          <input
            type="date"
            id="startDate"
            value={filters.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
            className="mt-1 block w-full rounded-lg bg-gray-800/50 border border-gray-700 text-gray-100 px-4 py-2 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50 sm:text-sm backdrop-blur-sm transition-all"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-2">
            Data Final
          </label>
          <input
            type="date"
            id="endDate"
            value={filters.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
            className="mt-1 block w-full rounded-lg bg-gray-800/50 border border-gray-700 text-gray-100 px-4 py-2 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50 sm:text-sm backdrop-blur-sm transition-all"
          />
        </div>
        <div>
          <label htmlFor="affiliateId" className="block text-sm font-medium text-gray-300 mb-2">
            Afiliado
          </label>
          <input
            type="text"
            id="affiliateId"
            value={filters.affiliateId}
            onChange={(e) => handleChange('affiliateId', e.target.value)}
            placeholder="ID do afiliado"
            className="mt-1 block w-full rounded-lg bg-gray-800/50 border border-gray-700 text-gray-100 placeholder-gray-500 px-4 py-2 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50 sm:text-sm backdrop-blur-sm transition-all"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2">
            Status
          </label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="mt-1 block w-full rounded-lg bg-gray-800/50 border border-gray-700 text-gray-100 px-4 py-2 shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/50 sm:text-sm backdrop-blur-sm transition-all"
          >
            <option value="" className="bg-gray-800">Todos</option>
            <option value="PENDING" className="bg-gray-800">Pendente</option>
            <option value="APPROVED" className="bg-gray-800">Aprovado</option>
            <option value="REJECTED" className="bg-gray-800">Rejeitado</option>
          </select>
        </div>
      </div>
    </div>
  )
}
