import React from 'react';
import { FilterOptions } from '../types';
import { Search, X, Filter, Download, FileSpreadsheet, Mail, MessageSquare, FileSignature, Calendar } from 'lucide-react';

interface AdvancedFiltersProps {
  filters: FilterOptions;
  categories: string[];
  onChange: (filters: FilterOptions) => void;
  onExportCsv: () => void;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  categories,
  onChange,
  onExportCsv,
}) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs mb-6 space-y-3.5">
      {/* Top Search Bar & Export */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={e => onChange({ ...filters, searchQuery: e.target.value })}
            placeholder="Buscar por radicado, remitente, palabra clave..."
            className="w-full text-xs pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-400"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onChange({ ...filters, searchQuery: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Channel quick buttons & Export */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => onChange({ ...filters, channel: 'all' })}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filters.channel === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => onChange({ ...filters, channel: 'email' })}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                filters.channel === 'email'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-indigo-600" />
              Email
            </button>
            <button
              onClick={() => onChange({ ...filters, channel: 'whatsapp' })}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                filters.channel === 'whatsapp'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              WhatsApp
            </button>
          </div>

          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors shrink-0"
            title="Exportar base de datos a CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Exportar Base</span>
          </button>
        </div>
      </div>

      {/* Filter Chips & Dropdown Row */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
        <span className="text-slate-400 font-medium flex items-center gap-1 text-[11px]">
          <Filter className="w-3 h-3" />
          Filtros Rápidos:
        </span>

        {/* Toggle with Deadlines */}
        <button
          onClick={() => onChange({ ...filters, onlyWithDeadlines: !filters.onlyWithDeadlines })}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
            filters.onlyWithDeadlines
              ? 'bg-blue-50 border-blue-400 text-blue-800 font-semibold shadow-2xs'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-3 h-3 text-blue-600" />
          Con Citaciones / Plazos
        </button>

        {/* Toggle requires signature */}
        <button
          onClick={() => onChange({ ...filters, onlyRequiresSignature: !filters.onlyRequiresSignature })}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
            filters.onlyRequiresSignature
              ? 'bg-amber-50 border-amber-400 text-amber-800 font-semibold shadow-2xs'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <FileSignature className="w-3 h-3 text-amber-600" />
          Requiere Firma Electrónica
        </button>

        {/* Category selector */}
        <select
          value={filters.category}
          onChange={e => onChange({ ...filters, category: e.target.value })}
          className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="all">Todas las Categorías</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Urgency selector */}
        <select
          value={filters.urgency}
          onChange={e => onChange({ ...filters, urgency: e.target.value as any })}
          className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="all">Cualquier Urgencia</option>
          <option value="crítica">Urgencia Crítica</option>
          <option value="alta">Urgencia Alta</option>
          <option value="media">Urgencia Media</option>
          <option value="baja">Urgencia Baja</option>
        </select>

        {(filters.searchQuery || filters.channel !== 'all' || filters.category !== 'all' || filters.urgency !== 'all' || filters.onlyWithDeadlines || filters.onlyRequiresSignature) && (
          <button
            onClick={() =>
              onChange({
                searchQuery: '',
                channel: 'all',
                category: 'all',
                urgency: 'all',
                status: 'all',
                onlyWithDeadlines: false,
                onlyRequiresSignature: false,
                sortBy: 'date-desc',
              })
            }
            className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold ml-auto transition-colors"
          >
            Limpiar Filtros
          </button>
        )}
      </div>
    </div>
  );
};
