import React from 'react';
import { ProcessoContrato } from '../types';
import {
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  ChevronRight,
  DollarSign,
  AlertTriangle,
  PlayCircle
} from 'lucide-react';
import { formatarDataHora } from '../services/firestoreService';

interface ProcessoCardProps {
  processo: ProcessoContrato;
  onClick: () => void;
}

export const ProcessoCard: React.FC<ProcessoCardProps> = ({ processo, onClick }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'concluido':
        return {
          label: 'Concluído',
          border: 'border-emerald-200 dark:border-emerald-800/80',
          badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300',
          progressColor: 'bg-emerald-500'
        };
      case 'atrasado':
        return {
          label: 'Atrasado',
          border: 'border-rose-200 dark:border-rose-800/80',
          badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300',
          progressColor: 'bg-rose-500'
        };
      case 'nao_iniciado':
        return {
          label: 'Não Iniciado',
          border: 'border-slate-200 dark:border-slate-800',
          badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300',
          progressColor: 'bg-slate-400'
        };
      case 'em_andamento':
      default:
        return {
          label: 'Em Andamento',
          border: 'border-blue-200 dark:border-blue-800/80',
          badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300',
          progressColor: 'bg-blue-600'
        };
    }
  };

  const statusCfg = getStatusConfig(processo.statusGeral);
  const siglaLotacao = processo.lotacaoDestino.split('—')[0].trim();
  const progresso = processo.progressoPercentual || 0;

  return (
    <div
      id={`processo-card-${processo.id}`}
      onClick={onClick}
      className={`group bg-white dark:bg-slate-900 rounded-2xl border ${statusCfg.border} p-5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-500 relative overflow-hidden`}
    >
      {/* Top badges bar */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Lotação */}
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {siglaLotacao}
            </span>

            {/* Número processo */}
            <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {processo.numeroProcesso || 'S/N'}
            </span>
          </div>

          {/* Status Geral */}
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusCfg.badge}`}>
            {statusCfg.label}
          </span>
        </div>

        {/* Tipo de Ação */}
        <p className="text-[11px] font-semibold text-blue-800 dark:text-blue-400 line-clamp-1">
          {processo.tipoAcao}
        </p>

        {/* Objeto do Contrato */}
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {processo.descricaoObjeto}
        </h3>

        {/* Empresa Contratada ou Valor */}
        {(processo.empresaContratada || processo.valorEstimado) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
            {processo.empresaContratada && (
              <span className="truncate max-w-[200px]" title={processo.empresaContratada}>
                Fornecedor: <strong className="text-slate-700 dark:text-slate-300">{processo.empresaContratada}</strong>
              </span>
            )}
            {processo.valorEstimado ? (
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(processo.valorEstimado)}
              </span>
            ) : null}
          </div>
        )}
      </div>

      {/* Bottom section: Progress bar and action */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-500 dark:text-slate-400">
            Etapas: <strong className="text-slate-800 dark:text-slate-200">{processo.etapasConcluidas || 0}</strong> de {processo.etapasTotal || 0}
          </span>
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
            {progresso}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${statusCfg.progressColor} rounded-full transition-all duration-500`}
            style={{ width: `${progresso}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1">
          <span>Criado em: {new Date(processo.criadoEm).toLocaleDateString('pt-BR')}</span>
          <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
            Ver Fluxo e Gantt <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
