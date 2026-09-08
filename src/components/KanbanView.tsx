import React from 'react';
import { ProcessoContrato } from '../types';
import { ProcessoCard } from './ProcessoCard';
import { PlayCircle, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface KanbanViewProps {
  processos: ProcessoContrato[];
  onSelectProcesso: (processo: ProcessoContrato) => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({ processos, onSelectProcesso }) => {
  const colunas = [
    {
      id: 'nao_iniciado',
      titulo: 'Não Iniciados',
      subtitulo: 'Processos abertos aguardando início',
      icon: Clock,
      corBadge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      headerBorder: 'border-slate-300 dark:border-slate-700',
      filtro: (p: ProcessoContrato) => p.statusGeral === 'nao_iniciado' || (p.progressoPercentual === 0 && p.statusGeral !== 'concluido')
    },
    {
      id: 'em_andamento',
      titulo: 'Em Andamento',
      subtitulo: 'Executando etapas do fluxo',
      icon: PlayCircle,
      corBadge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      headerBorder: 'border-blue-400 dark:border-blue-600',
      filtro: (p: ProcessoContrato) => p.statusGeral === 'em_andamento' && (p.progressoPercentual || 0) > 0 && (p.progressoPercentual || 0) < 100
    },
    {
      id: 'atrasado',
      titulo: 'Atrasados / Pendências',
      subtitulo: 'Exigem atenção imediata',
      icon: AlertTriangle,
      corBadge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
      headerBorder: 'border-rose-400 dark:border-rose-600',
      filtro: (p: ProcessoContrato) => p.statusGeral === 'atrasado' || p.statusGeral === 'em_aprovacao'
    },
    {
      id: 'concluido',
      titulo: 'Concluídos',
      subtitulo: 'Todas as etapas finalizadas',
      icon: CheckCircle2,
      corBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      headerBorder: 'border-emerald-400 dark:border-emerald-600',
      filtro: (p: ProcessoContrato) => p.statusGeral === 'concluido' || (p.progressoPercentual || 0) === 100
    }
  ];

  return (
    <div id="kanban-board-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
      {colunas.map((col) => {
        const itens = processos.filter(col.filtro);
        const Icon = col.icon;

        return (
          <div
            key={col.id}
            className="bg-slate-100/70 dark:bg-slate-800/40 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 flex flex-col min-h-[500px]"
          >
            {/* Column Header */}
            <div className={`p-3 rounded-xl bg-white dark:bg-slate-900 border ${col.headerBorder} shadow-2xs mb-3 space-y-1`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-100">
                  <Icon className="w-4 h-4 text-blue-600" />
                  <span>{col.titulo}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${col.corBadge}`}>
                  {itens.length}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                {col.subtitulo}
              </p>
            </div>

            {/* Column Cards */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
              {itens.length === 0 ? (
                <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
                  Nenhum processo nesta fase
                </div>
              ) : (
                itens.map((p) => (
                  <ProcessoCard
                    key={p.id}
                    processo={p}
                    onClick={() => onSelectProcesso(p)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
