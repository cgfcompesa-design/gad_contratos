import React, { useState } from 'react';
import { LogAcao } from '../types';
import {
  History,
  CheckCircle2,
  RotateCcw,
  FilePlus,
  Edit3,
  UserCheck,
  Search,
  Clock,
  ShieldCheck,
  Download
} from 'lucide-react';
import { formatarDataHora } from '../services/firestoreService';

interface HistoricoLogsProps {
  logs: LogAcao[];
  tituloContexto?: string;
}

export const HistoricoLogs: React.FC<HistoricoLogsProps> = ({ logs, tituloContexto }) => {
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  const getTipoAcaoStyle = (tipo?: string) => {
    switch (tipo) {
      case 'conclusao':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300',
          label: 'Conclusão'
        };
      case 'reversao':
        return {
          icon: RotateCcw,
          color: 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border-amber-300',
          label: 'Reversão'
        };
      case 'criacao':
        return {
          icon: FilePlus,
          color: 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 border-blue-300',
          label: 'Abertura'
        };
      case 'perfil':
        return {
          icon: UserCheck,
          color: 'text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 border-purple-300',
          label: 'Permissão'
        };
      case 'edicao':
      default:
        return {
          icon: Edit3,
          color: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-300',
          label: 'Edição'
        };
    }
  };

  const logsFiltrados = logs.filter((l) => {
    const matchBusca =
      l.acao.toLowerCase().includes(busca.toLowerCase()) ||
      l.usuario.toLowerCase().includes(busca.toLowerCase()) ||
      l.email.toLowerCase().includes(busca.toLowerCase()) ||
      (l.referencia && l.referencia.toLowerCase().includes(busca.toLowerCase())) ||
      (l.detalhes && l.detalhes.toLowerCase().includes(busca.toLowerCase()));

    const matchTipo = filtroTipo === 'todos' || l.tipoAcao === filtroTipo;

    return matchBusca && matchTipo;
  });

  const exportarCSV = () => {
    const headers = ['Data e Hora', 'Usuário', 'E-mail', 'Ação', 'Referência', 'Detalhes'];
    const rows = logsFiltrados.map((l) => [
      formatarDataHora(l.dataHora),
      `"${l.usuario.replace(/"/g, '""')}"`,
      `"${l.email.replace(/"/g, '""')}"`,
      `"${l.acao.replace(/"/g, '""')}"`,
      `"${(l.referencia || '').replace(/"/g, '""')}"`,
      `"${(l.detalhes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `auditoria_gad_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="historico-logs-container" className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              Registro Imutável de Auditoria
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-mono">
                {logs.length} registros
              </span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Histórico seguro de todas as ações, autorizações e mudanças de status
            </p>
          </div>
        </div>

        <button
          onClick={exportarCSV}
          disabled={logsFiltrados.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors shadow-sm disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          Exportar Relatório CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar nos registros de auditoria..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-500 font-medium mr-1">Ação:</span>
          {['todos', 'conclusao', 'reversao', 'criacao', 'perfil'].map((tp) => (
            <button
              key={tp}
              onClick={() => setFiltroTipo(tp)}
              className={`px-2 py-1 rounded-md capitalize transition-colors ${
                filtroTipo === tp
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tp === 'conclusao'
                ? 'Conclusões'
                : tp === 'reversao'
                ? 'Reversões'
                : tp === 'criacao'
                ? 'Criação'
                : tp === 'perfil'
                ? 'Perfis'
                : 'Todas'}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Timeline */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80">
        {logsFiltrados.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            Nenhum registro de auditoria encontrado com os filtros selecionados.
          </div>
        ) : (
          logsFiltrados.map((log) => {
            const config = getTipoAcaoStyle(log.tipoAcao);
            const Icon = config.icon;

            return (
              <div
                key={log.id}
                id={`log-entry-${log.id}`}
                className="p-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex items-start gap-3"
              >
                <div className={`p-2 rounded-lg border shrink-0 mt-0.5 ${config.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {log.acao}
                    </p>
                    <span className="flex items-center gap-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatarDataHora(log.dataHora)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>
                      Usuário: <strong className="text-slate-700 dark:text-slate-300">{log.usuario}</strong> ({log.email})
                    </span>
                    {log.referencia && (
                      <span className="text-blue-700 dark:text-blue-400 font-medium">
                        Ref: {log.referencia}
                      </span>
                    )}
                  </div>

                  {log.detalhes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded border border-slate-200/60 dark:border-slate-700/60 font-mono text-[11px]">
                      {log.detalhes}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
