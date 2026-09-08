import React, { useState, useEffect } from 'react';
import { ProcessoContrato, EtapaProcesso, LogAcao, Usuario } from '../types';
import {
  X,
  ListTodo,
  BarChart3,
  History,
  Info,
  Calendar,
  Building2,
  DollarSign,
  Tag,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit,
  Trash2,
  Save
} from 'lucide-react';
import {
  subscribeEtapas,
  subscribeLogs,
  editarProcesso,
  excluirProcesso,
  formatarDataHora
} from '../services/firestoreService';
import { EtapasChecklist } from './EtapasChecklist';
import { GanttChart } from './GanttChart';
import { HistoricoLogs } from './HistoricoLogs';

interface ProcessoDetalhesProps {
  processo: ProcessoContrato;
  usuarioAtual: Usuario;
  onClose: () => void;
  onExcluido?: () => void;
}

export const ProcessoDetalhes: React.FC<ProcessoDetalhesProps> = ({
  processo,
  usuarioAtual,
  onClose,
  onExcluido
}) => {
  const [activeTab, setActiveTab] = useState<'etapas' | 'gantt' | 'historico' | 'info'>('etapas');
  const [etapas, setEtapas] = useState<EtapaProcesso[]>([]);
  const [logs, setLogs] = useState<LogAcao[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit fields mode
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editNumero, setEditNumero] = useState(processo.numeroProcesso || '');
  const [editObjeto, setEditObjeto] = useState(processo.descricaoObjeto);
  const [editEmpresa, setEditEmpresa] = useState(processo.empresaContratada || '');
  const [editValor, setEditValor] = useState(processo.valorEstimado ? String(processo.valorEstimado) : '');
  const [savingInfo, setSavingInfo] = useState(false);

  // Permissions
  const isMaster = usuarioAtual.perfil === 'MASTER' || usuarioAtual.email.toLowerCase() === 'cgf.compesa@gmail.com';
  const isApoio = usuarioAtual.perfil === 'APOIO CONTRATOS';
  const canEditEtapas = isMaster || isApoio;
  const canDeleteProcesso = isMaster || isApoio;

  useEffect(() => {
    setLoading(true);
    const unsubEtapas = subscribeEtapas(processo.id, (lista) => {
      setEtapas(lista);
      setLoading(false);
    });

    const unsubLogs = subscribeLogs(processo.id, (logsLista) => {
      setLogs(logsLista);
    });

    return () => {
      unsubEtapas();
      unsubLogs();
    };
  }, [processo.id]);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingInfo(true);
      await editarProcesso({
        processoId: processo.id,
        dados: {
          numeroProcesso: editNumero.trim(),
          descricaoObjeto: editObjeto.trim(),
          empresaContratada: editEmpresa.trim(),
          valorEstimado: editValor ? parseFloat(editValor) : 0
        },
        usuarioAtual
      });
      setIsEditingInfo(false);
    } catch (err) {
      console.error('Erro ao editar processo:', err);
    } finally {
      setSavingInfo(false);
    }
  };

  const handleDeleteProcesso = async () => {
    if (!window.confirm(`ATENÇÃO: Confirma a exclusão definitiva do processo #${processo.numeroProcesso}?`)) {
      return;
    }
    try {
      await excluirProcesso(processo.id, processo.numeroProcesso || processo.id, usuarioAtual);
      if (onExcluido) onExcluido();
      onClose();
    } catch (err) {
      console.error('Erro ao excluir processo:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluido':
        return {
          label: 'Concluído',
          class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
        };
      case 'atrasado':
        return {
          label: 'Atrasado',
          class: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300'
        };
      case 'em_aprovacao':
        return {
          label: 'Em Aprovação',
          class: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
        };
      case 'em_andamento':
      default:
        return {
          label: 'Em Andamento',
          class: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300'
        };
    }
  };

  const statusBadge = getStatusBadge(processo.statusGeral);
  const progresso = processo.progressoPercentual || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="processo-detalhes-modal"
        className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-scale-in"
      >
        {/* Modal Header */}
        <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {processo.numeroProcesso || 'Processo sem número'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${statusBadge.class}`}>
                  {statusBadge.label}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                  {processo.lotacaoDestino.split('—')[0].trim()}
                </span>
              </div>

              <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug truncate" title={processo.descricaoObjeto}>
                {processo.descricaoObjeto}
              </h2>

              <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>Tipo: <strong>{processo.tipoAcao}</strong></span>
                {processo.empresaContratada && (
                  <span>Contratada: <strong>{processo.empresaContratada}</strong></span>
                )}
                <span>Aberto em: <strong>{formatarDataHora(processo.criadoEm)}</strong> por {processo.criadoPor}</span>
              </p>
            </div>

            {/* Close button & actions */}
            <div className="flex items-center gap-2 shrink-0">
              {canDeleteProcesso && (
                <button
                  onClick={handleDeleteProcesso}
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 transition-colors"
                  title="Excluir processo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Progresso Geral do Contrato:
              </span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                {progresso}% ({processo.etapasConcluidas || 0} de {etapas.length || processo.etapasTotal || 0} etapas)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-blue-600 to-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex items-center gap-2 mt-5 border-b border-slate-200 dark:border-slate-700 -mb-4 pb-0 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => setActiveTab('etapas')}
              className={`flex items-center gap-1.5 py-2.5 px-3.5 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'etapas'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              Checklist de Etapas ({etapas.length})
            </button>

            <button
              onClick={() => setActiveTab('gantt')}
              className={`flex items-center gap-1.5 py-2.5 px-3.5 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'gantt'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Linha do Tempo (Gráfico de Gantt)
            </button>

            <button
              onClick={() => setActiveTab('historico')}
              className={`flex items-center gap-1.5 py-2.5 px-3.5 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'historico'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              Histórico / Auditoria ({logs.length})
            </button>

            <button
              onClick={() => setActiveTab('info')}
              className={`flex items-center gap-1.5 py-2.5 px-3.5 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'info'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Info className="w-4 h-4" />
              Dados do Processo
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">
              Carregando fluxo de etapas e dados do processo...
            </div>
          ) : (
            <>
              {activeTab === 'etapas' && (
                <EtapasChecklist
                  processoId={processo.id}
                  etapas={etapas}
                  usuarioAtual={usuarioAtual}
                  canEditEtapas={canEditEtapas}
                />
              )}

              {activeTab === 'gantt' && (
                <GanttChart etapas={etapas} dataCriacaoProcesso={processo.criadoEm} />
              )}

              {activeTab === 'historico' && (
                <HistoricoLogs logs={logs} tituloContexto={processo.numeroProcesso} />
              )}

              {activeTab === 'info' && (
                <div className="space-y-4 max-w-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Informações Gerais do Processo de Contrato
                    </h3>
                    {!isEditingInfo && (
                      <button
                        onClick={() => setIsEditingInfo(true)}
                        className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Editar Informações
                      </button>
                    )}
                  </div>

                  {isEditingInfo ? (
                    <form onSubmit={handleSaveInfo} className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Número do Processo / SEI
                        </label>
                        <input
                          type="text"
                          value={editNumero}
                          onChange={(e) => setEditNumero(e.target.value)}
                          className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Descrição do Objeto
                        </label>
                        <textarea
                          rows={3}
                          value={editObjeto}
                          onChange={(e) => setEditObjeto(e.target.value)}
                          className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Empresa Contratada / Fornecedor
                          </label>
                          <input
                            type="text"
                            value={editEmpresa}
                            onChange={(e) => setEditEmpresa(e.target.value)}
                            className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Valor Estimado ou Contratado (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={editValor}
                            onChange={(e) => setEditValor(e.target.value)}
                            className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingInfo(false)}
                          className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 dark:text-slate-400 rounded-lg"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={savingInfo}
                          className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Salvar Alterações
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium">Lotação Destino:</span>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {processo.lotacaoDestino}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium">Tipo de Ação:</span>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {processo.tipoAcao}
                        </p>
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <span className="text-slate-400 font-medium">Descrição do Objeto:</span>
                        <p className="text-sm text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed">
                          {processo.descricaoObjeto}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium">Empresa Contratada:</span>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {processo.empresaContratada || 'Não informada / Em licitação'}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium">Valor Estimado / Contratado:</span>
                        <p className="text-sm font-semibold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                          {processo.valorEstimado
                            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(processo.valorEstimado)
                            : 'A definir'}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium">Criado por:</span>
                        <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                          {processo.criadoPor} ({processo.emailCriador})
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium">Data de Criação:</span>
                        <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                          {formatarDataHora(processo.criadoEm)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
