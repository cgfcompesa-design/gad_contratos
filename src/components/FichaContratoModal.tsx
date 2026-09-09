import React, { useState } from 'react';
import { ContratoVigente, ProcessoContrato, Usuario } from '../types';
import {
  calcularStatusPrazo,
  formatarStatusPrazoLabel,
  calcularSituacaoAtual
} from '../data/sampleContratos';
import {
  atualizarSituacaoManualContrato,
  formatarDataHora
} from '../services/firestoreService';
import {
  X,
  Building2,
  Calendar,
  DollarSign,
  Briefcase,
  User,
  Clock,
  FilePlus2,
  Edit3,
  Check,
  ExternalLink,
  Tag,
  AlertCircle,
  Activity,
  Layers,
  Pencil,
  Trash2
} from 'lucide-react';

interface FichaContratoModalProps {
  contrato: ContratoVigente;
  processos: ProcessoContrato[];
  usuarioAtual: Usuario;
  onClose: () => void;
  onAbrirProcessoNesteContrato: (contrato: ContratoVigente) => void;
  onVerProcessoDetalhes: (processo: ProcessoContrato) => void;
  onEditarContrato?: (contrato: ContratoVigente) => void;
  onExcluirContrato?: (contrato: ContratoVigente) => void;
}

export const FichaContratoModal: React.FC<FichaContratoModalProps> = ({
  contrato,
  processos,
  usuarioAtual,
  onClose,
  onAbrirProcessoNesteContrato,
  onVerProcessoDetalhes,
  onEditarContrato,
  onExcluirContrato
}) => {
  const isMasterOuApoio = usuarioAtual.perfil === 'MASTER' || usuarioAtual.perfil === 'APOIO CONTRATOS';

  const statusPrazoInfo = formatarStatusPrazoLabel(calcularStatusPrazo(contrato.dataFinalExecucao));
  const situacaoAtualInfo = calcularSituacaoAtual(contrato, processos);

  const [editandoManual, setEditandoManual] = useState(false);
  const [novoManualTexto, setNovoManualTexto] = useState(contrato.situacaoManual || '');
  const [salvandoManual, setSalvandoManual] = useState(false);

  // Filter linked processes
  const processosVinculados = processos.filter((p) => {
    if (p.contratoVigenteId && p.contratoVigenteId === contrato.id) return true;
    if (p.numeroProcesso && contrato.numeroContrato && p.numeroProcesso.includes(contrato.numeroContrato)) return true;
    if (p.empresaContratada && contrato.empresa && p.empresaContratada.toLowerCase().includes(contrato.empresa.toLowerCase())) return true;
    return false;
  });

  const handleSalvarManual = async () => {
    try {
      setSalvandoManual(true);
      await atualizarSituacaoManualContrato(contrato.id, novoManualTexto, usuarioAtual);
      contrato.situacaoManual = novoManualTexto;
      setEditandoManual(false);
    } catch (err) {
      console.error('Erro ao salvar situação manual:', err);
    } finally {
      setSalvandoManual(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const formatarDataSimples = (dataIso?: string) => {
    if (!dataIso) return '—';
    try {
      const p = dataIso.split('T')[0].split('-');
      if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
      return dataIso;
    } catch {
      return dataIso;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono">
                  #{contrato.numero}
                </span>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Contrato: {contrato.numeroContrato}
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Projeto: <span className="font-semibold text-slate-700 dark:text-slate-300">{contrato.projeto || '—'}</span> • Gestor: <span className="font-semibold text-slate-700 dark:text-slate-300">{contrato.gestor || '—'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEditarContrato && (
              <button
                onClick={() => onEditarContrato(contrato)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 hover:text-amber-700 dark:hover:text-amber-400 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Corrigir ou editar os dados cadastrais deste contrato"
              >
                <Pencil className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Corrigir Contrato</span>
              </button>
            )}

            {onExcluirContrato && (
              <button
                onClick={() => onExcluirContrato(contrato)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 hover:text-rose-700 dark:hover:text-rose-400 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Excluir este contrato da base vigente"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Excluir</span>
              </button>
            )}

            <button
              id="btn-fechar-ficha-contrato"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          
          {/* Dynamic Status & Situação Atual Banners */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Status de Prazo Card */}
            <div className="md:col-span-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/60 flex flex-col justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Status de Prazo de Execução
              </span>
              <div className="mt-2">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-black ${statusPrazoInfo.badgeClass}`}>
                  <span className={`w-2 h-2 rounded-full ${statusPrazoInfo.dotClass}`} />
                  <span>{statusPrazoInfo.label}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Término de Execução: <strong>{formatarDataSimples(contrato.dataFinalExecucao)}</strong>
              </p>
            </div>

            {/* Situação Atual Card (Section 7 dynamic rule) */}
            <div className="md:col-span-8 p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/30 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                    Situação Atual (Em Tempo Real)
                  </span>
                </div>
                {isMasterOuApoio && situacaoAtualInfo.tipo !== 'processo_ativo' && (
                  <button
                    onClick={() => setEditandoManual(!editandoManual)}
                    className="text-xs text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{editandoManual ? 'Cancelar' : 'Editar Observação'}</span>
                  </button>
                )}
              </div>

              <div className="mt-2">
                {editandoManual ? (
                  <div className="space-y-2 mt-1">
                    <input
                      type="text"
                      value={novoManualTexto}
                      onChange={(e) => setNovoManualTexto(e.target.value)}
                      placeholder="Ex: AGUARDANDO LINHAS 2027"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleSalvarManual}
                        disabled={salvandoManual}
                        className="px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-md flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>{salvandoManual ? 'Salvando...' : 'Salvar'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {situacaoAtualInfo.texto}
                    </span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-2">
                {situacaoAtualInfo.tipo === 'processo_ativo'
                  ? 'Calculada dinamicamente com base na próxima etapa pendente do processo ativo.'
                  : situacaoAtualInfo.tipo === 'processo_concluido'
                  ? 'Processo mais recente já concluído formalmente.'
                  : situacaoAtualInfo.tipo === 'manual'
                  ? 'Observação manual registrada pela equipe GAD.'
                  : 'Nenhum processo de aditivo ou reajuste em aberto no momento.'}
              </p>
            </div>

          </div>

          {/* Dados Cadastrais Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Dados Cadastrais do Contrato</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-medium">Empresa Contratada:</span>
                <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                  {contrato.empresa || '—'}
                </p>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 font-medium">Valor Anual do Contrato:</span>
                <p className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm mt-0.5">
                  {formatarMoeda(contrato.valorAnual)}
                </p>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 font-medium">Gestor do Contrato:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {contrato.gestor || '—'}
                </p>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 font-medium">Data Ordem de Serviço (OS):</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {formatarDataSimples(contrato.dataOrdemServico)}
                </p>
                <span className="text-[10px] text-slate-400">Referência para Reajuste Retroativo</span>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 font-medium">Período de Execução:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {formatarDataSimples(contrato.dataInicialExecucao)} até {formatarDataSimples(contrato.dataFinalExecucao)}
                </p>
                <span className="text-[10px] text-slate-400">Final de Execução é ref. para Aditivo</span>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 font-medium">Período de Vigência:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                  {formatarDataSimples(contrato.dataInicialVigencia)} até {formatarDataSimples(contrato.dataFinalVigencia)}
                </p>
              </div>
            </div>

            {/* Objeto */}
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Objeto do Contrato:</span>
              <p className="text-slate-900 dark:text-slate-100 font-medium mt-1 leading-relaxed">
                {contrato.objeto || '—'}
              </p>
            </div>
          </div>

          {/* Processos Abertos para este Contrato */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" />
                <span>Processos Vinculados ({processosVinculados.length})</span>
              </h3>

              <button
                id="btn-abrir-processo-neste-contrato"
                onClick={() => {
                  onAbrirProcessoNesteContrato(contrato);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                <span>Abrir novo processo neste contrato</span>
              </button>
            </div>

            {processosVinculados.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Nenhum processo formal de <strong>Reajuste Retroativo</strong> ou <strong>Termo Aditivo</strong> foi aberto ainda para este contrato.
                </p>
                <p className="text-[11px] text-slate-400">
                  Clique no botão acima para iniciar um fluxo de etapas com acompanhamento em linha do tempo (Gantt).
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {processosVinculados.map((proc) => {
                  const isConcluido = proc.statusGeral === 'concluido';
                  return (
                    <div
                      key={proc.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                            #{proc.numeroProcesso}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase ${
                            proc.tipoAcao.includes('REAJUSTE')
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          }`}>
                            {proc.tipoAcao}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isConcluido
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          }`}>
                            {isConcluido ? 'Concluído' : `${proc.progressoPercentual || 0}%`}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                          {proc.descricaoObjeto}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span>Criado em: {formatarDataSimples(proc.criadoEm)}</span>
                          {proc.proximaEtapaPendenteNome && (
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">
                              Próxima etapa: {proc.proximaEtapaPendenteNome}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onVerProcessoDetalhes(proc);
                          onClose();
                        }}
                        className="self-end sm:self-center px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <span>Ver Processo & Gantt</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Cadastrado em {formatarDataHora(contrato.criadoEm || '')}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold text-slate-800 dark:text-slate-100 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
