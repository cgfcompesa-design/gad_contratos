import React, { useState } from 'react';
import { EtapaProcesso, StatusEtapa } from '../types';
import { CheckCircle2, Clock, PlayCircle, Ban, AlertTriangle, Calendar } from 'lucide-react';
import { formatarDataHora } from '../services/firestoreService';

interface GanttChartProps {
  etapas: EtapaProcesso[];
  dataCriacaoProcesso: string;
}

export const GanttChart: React.FC<GanttChartProps> = ({ etapas, dataCriacaoProcesso }) => {
  const [hoveredEtapa, setHoveredEtapa] = useState<EtapaProcesso | null>(null);

  // Determine timeline boundary dates
  const criacaoTime = new Date(dataCriacaoProcesso || Date.now()).getTime();
  let minTime = criacaoTime;
  let maxTime = Date.now() + 24 * 60 * 60 * 1000;

  etapas.forEach((etapa) => {
    if (etapa.dataInicio) {
      const t = new Date(etapa.dataInicio).getTime();
      if (t < minTime) minTime = t;
    }
    if (etapa.dataConclusao) {
      const t = new Date(etapa.dataConclusao).getTime();
      if (t > maxTime) maxTime = t;
    }
  });

  // Total timespan in days
  const totalDays = Math.max(15, Math.ceil((maxTime - minTime) / (1000 * 60 * 60 * 24)) + 5);

  const getStatusColor = (status: StatusEtapa) => {
    switch (status) {
      case 'concluida':
        return {
          bar: 'bg-emerald-600 hover:bg-emerald-700',
          text: 'text-emerald-700 dark:text-emerald-300',
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
          icon: CheckCircle2,
          label: 'Concluída'
        };
      case 'em_andamento':
        return {
          bar: 'bg-blue-600 hover:bg-blue-700 animate-pulse',
          text: 'text-blue-700 dark:text-blue-300',
          bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
          icon: PlayCircle,
          label: 'Em Andamento'
        };
      case 'atrasada':
        return {
          bar: 'bg-rose-600 hover:bg-rose-700',
          text: 'text-rose-700 dark:text-rose-300',
          bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
          icon: AlertTriangle,
          label: 'Atrasada'
        };
      case 'nao_aplicavel':
        return {
          bar: 'bg-slate-400 opacity-60',
          text: 'text-slate-500',
          bg: 'bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700',
          icon: Ban,
          label: 'Não Aplicável'
        };
      case 'pendente':
      default:
        return {
          bar: 'bg-slate-300 dark:bg-slate-600',
          text: 'text-slate-600 dark:text-slate-400',
          bg: 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800',
          icon: Clock,
          label: 'Pendente'
        };
    }
  };

  // Calculate relative left offset and width in %
  const calculateBarMetrics = (etapa: EtapaProcesso, index: number) => {
    if (etapa.status === 'nao_aplicavel') {
      return { leftPct: 0, widthPct: 100, isNA: true };
    }

    let startTime = etapa.dataInicio ? new Date(etapa.dataInicio).getTime() : null;
    let endTime = etapa.dataConclusao ? new Date(etapa.dataConclusao).getTime() : null;

    // Estimate realistic sequence position if stage hasn't started yet
    if (!startTime) {
      // Find previous stage finish or project start
      let lastConcludedTime = minTime;
      for (let i = index - 1; i >= 0; i--) {
        if (etapas[i].dataConclusao) {
          lastConcludedTime = new Date(etapas[i].dataConclusao!).getTime();
          break;
        }
      }
      startTime = lastConcludedTime + index * (24 * 60 * 60 * 1000 * 2);
    }

    if (!endTime) {
      if (etapa.status === 'em_andamento') {
        endTime = Date.now();
      } else {
        // Pending projection (estimated 3 days duration)
        endTime = startTime + 3 * (24 * 60 * 60 * 1000);
      }
    }

    const durationDays = Math.max(1, Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24)));
    const leftOffsetDays = Math.max(0, (startTime - minTime) / (1000 * 60 * 60 * 24));

    const leftPct = Math.min(92, Math.max(0, (leftOffsetDays / totalDays) * 100));
    const widthPct = Math.min(100 - leftPct, Math.max(3.5, (durationDays / totalDays) * 100));

    return {
      leftPct,
      widthPct,
      durationDays: etapa.diasCorridos || durationDays,
      isNA: false
    };
  };

  return (
    <div id="gantt-chart-container" className="space-y-4">
      {/* Legend & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Linha do Tempo do Fluxo (Diagrama de Gantt)
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Duração real em dias corridos calculada entre o início e a conclusão de cada etapa
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            Concluída
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block animate-ping" />
            Em Andamento
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
            Pendente
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" />
            Não Aplicável
          </span>
        </div>
      </div>

      {/* Gantt Viewport */}
      <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
        <div className="min-w-[950px] p-4">
          {/* Header row with time scale guides */}
          <div className="grid grid-cols-12 gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <div className="col-span-4 pl-2">Etapa do Processo</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-1 text-center">Dias</div>
            <div className="col-span-6 relative flex justify-between pr-2">
              <span>Início ({new Date(minTime).toLocaleDateString('pt-BR')})</span>
              <span>Hoje ({new Date().toLocaleDateString('pt-BR')})</span>
              <span>Projeção</span>
            </div>
          </div>

          {/* Etapas Rows */}
          <div className="space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800/60">
            {etapas.map((etapa, idx) => {
              const statusCfg = getStatusColor(etapa.status);
              const metrics = calculateBarMetrics(etapa, idx);
              const StatusIcon = statusCfg.icon;

              return (
                <div
                  key={etapa.id}
                  id={`gantt-row-${etapa.id}`}
                  className="grid grid-cols-12 gap-2 py-2 items-center hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors rounded-lg px-1 group"
                  onMouseEnter={() => setHoveredEtapa(etapa)}
                  onMouseLeave={() => setHoveredEtapa(null)}
                >
                  {/* Etapa Name & Index */}
                  <div className="col-span-4 flex items-center gap-2 pl-1 pr-2 truncate">
                    <span className="text-xs font-mono font-bold w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                      {etapa.ordem}
                    </span>
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate" title={etapa.nome}>
                      {etapa.nome}
                    </span>
                    {etapa.condicional && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                        condicional
                      </span>
                    )}
                  </div>

                  {/* Status Pill */}
                  <div className="col-span-1 flex justify-center">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text}`}>
                      <StatusIcon className="w-3 h-3" />
                      <span className="hidden xl:inline">{statusCfg.label}</span>
                    </span>
                  </div>

                  {/* Dias Corridos */}
                  <div className="col-span-1 text-center font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {etapa.status === 'nao_aplicavel' ? (
                      <span className="text-slate-400">—</span>
                    ) : (
                      <span>{metrics.durationDays || 0}d</span>
                    )}
                  </div>

                  {/* Visual Bar Column */}
                  <div className="col-span-6 relative h-7 bg-slate-100/70 dark:bg-slate-800/40 rounded-lg p-0.5 flex items-center overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                    {/* Background gridlines */}
                    <div className="absolute inset-0 grid grid-cols-6 divide-x divide-slate-200/40 dark:divide-slate-700/30 pointer-events-none">
                      <div />
                      <div />
                      <div />
                      <div />
                      <div />
                      <div />
                    </div>

                    {metrics.isNA ? (
                      <div className="w-full h-4 rounded bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                        Não Aplicável
                      </div>
                    ) : (
                      <div
                        className={`h-5 rounded-md ${statusCfg.bar} relative transition-all duration-300 flex items-center px-2 cursor-pointer shadow-sm group-hover:ring-2 group-hover:ring-blue-400/40`}
                        style={{
                          marginLeft: `${metrics.leftPct}%`,
                          width: `${metrics.widthPct}%`,
                          minWidth: '28px'
                        }}
                        title={`${etapa.nome}: ${metrics.durationDays} dias corridos (${statusCfg.label})`}
                      >
                        <span className="text-[10px] font-bold text-white truncate drop-shadow-sm whitespace-nowrap">
                          {metrics.durationDays}d
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail Tooltip Card if hovering */}
      {hoveredEtapa && (
        <div className="p-3.5 bg-blue-50/70 dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-900 dark:text-blue-300">
              Etapa {hoveredEtapa.ordem}: {hoveredEtapa.nome}
            </span>
            {hoveredEtapa.diasCorridos !== undefined && hoveredEtapa.diasCorridos > 0 && (
              <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-blue-200 font-mono font-semibold">
                {hoveredEtapa.diasCorridos} dias corridos
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400">
            {hoveredEtapa.dataInicio && (
              <span>Início: <strong>{formatarDataHora(hoveredEtapa.dataInicio)}</strong></span>
            )}
            {hoveredEtapa.dataConclusao && (
              <span>Conclusão: <strong>{formatarDataHora(hoveredEtapa.dataConclusao)}</strong></span>
            )}
            {hoveredEtapa.responsavelConclusao && (
              <span>Responsável: <strong>{hoveredEtapa.responsavelConclusao}</strong></span>
            )}
            {hoveredEtapa.observacao && (
              <span className="italic max-w-xs truncate">"{hoveredEtapa.observacao}"</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
