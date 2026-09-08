import React, { useState } from 'react';
import { EtapaProcesso, StatusEtapa, Usuario } from '../types';
import {
  CheckCircle2,
  Clock,
  PlayCircle,
  Ban,
  RotateCcw,
  MessageSquare,
  Paperclip,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  User,
  Save,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  atualizarStatusEtapa,
  salvarObservacaoEtapa,
  adicionarAnexoEtapa,
  adicionarEtapaCustomizada,
  removerEtapa,
  formatarDataHora
} from '../services/firestoreService';

interface EtapasChecklistProps {
  processoId: string;
  etapas: EtapaProcesso[];
  usuarioAtual: Usuario;
  canEditEtapas: boolean; // MASTER or APOIO CONTRATOS
}

export const EtapasChecklist: React.FC<EtapasChecklistProps> = ({
  processoId,
  etapas,
  usuarioAtual,
  canEditEtapas
}) => {
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [editingObsId, setEditingObsId] = useState<string | null>(null);
  const [obsText, setObsText] = useState<string>('');
  const [addingAnexoId, setAddingAnexoId] = useState<string | null>(null);
  const [anexoNome, setAnexoNome] = useState<string>('');
  const [anexoUrl, setAnexoUrl] = useState<string>('');
  const [isNovaEtapaOpen, setIsNovaEtapaOpen] = useState(false);
  const [novaEtapaNome, setNovaEtapaNome] = useState('');
  const [loadingAcao, setLoadingAcao] = useState<string | null>(null);

  // Status toggle handler
  const handleStatusChange = async (etapa: EtapaProcesso, novoStatus: StatusEtapa) => {
    try {
      setLoadingAcao(etapa.id);
      await atualizarStatusEtapa({
        processoId,
        etapaId: etapa.id,
        novoStatus,
        usuarioAtual,
        etapaNome: etapa.nome,
        todasEtapas: etapas
      });
    } catch (err) {
      console.error('Erro ao atualizar etapa:', err);
      alert('Não foi possível atualizar o status da etapa. Verifique a conexão.');
    } finally {
      setLoadingAcao(null);
    }
  };

  const handleSaveObservation = async (etapa: EtapaProcesso) => {
    try {
      await salvarObservacaoEtapa({
        processoId,
        etapaId: etapa.id,
        etapaNome: etapa.nome,
        observacao: obsText,
        usuarioAtual
      });
      setEditingObsId(null);
    } catch (err) {
      console.error('Erro ao salvar observação:', err);
    }
  };

  const handleAddAnexo = async (etapa: EtapaProcesso) => {
    if (!anexoNome.trim() || !anexoUrl.trim()) return;
    try {
      await adicionarAnexoEtapa({
        processoId,
        etapaId: etapa.id,
        etapaNome: etapa.nome,
        novoAnexo: {
          nome: anexoNome.trim(),
          url: anexoUrl.trim(),
          dataEnvio: new Date().toISOString()
        },
        anexosAtuais: etapa.anexos || [],
        usuarioAtual
      });
      setAddingAnexoId(null);
      setAnexoNome('');
      setAnexoUrl('');
    } catch (err) {
      console.error('Erro ao anexar arquivo:', err);
    }
  };

  const handleCreateNovaEtapa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaEtapaNome.trim()) return;
    try {
      const maxOrdem = etapas.length > 0 ? Math.max(...etapas.map((e) => e.ordem)) : 0;
      await adicionarEtapaCustomizada({
        processoId,
        nome: novaEtapaNome.trim(),
        usuarioAtual,
        posicaoOrdem: maxOrdem + 1
      });
      setNovaEtapaNome('');
      setIsNovaEtapaOpen(false);
    } catch (err) {
      console.error('Erro ao adicionar etapa:', err);
    }
  };

  const handleDeleteEtapa = async (etapa: EtapaProcesso) => {
    if (!window.confirm(`Tem certeza que deseja remover a etapa "${etapa.nome}" deste processo?`)) {
      return;
    }
    try {
      await removerEtapa({
        processoId,
        etapaId: etapa.id,
        etapaNome: etapa.nome,
        usuarioAtual
      });
    } catch (err) {
      console.error('Erro ao remover etapa:', err);
    }
  };

  const etapasFiltradas = etapas.filter((e) => {
    if (filtroStatus === 'todos') return true;
    if (filtroStatus === 'concluida') return e.status === 'concluida';
    if (filtroStatus === 'pendente') return e.status === 'pendente' || e.status === 'em_andamento';
    if (filtroStatus === 'nao_aplicavel') return e.status === 'nao_aplicavel';
    return true;
  });

  const concluidasCount = etapas.filter((e) => e.status === 'concluida').length;
  const naoAplicaveisCount = etapas.filter((e) => e.status === 'nao_aplicavel').length;

  return (
    <div id="etapas-checklist-container" className="space-y-4">
      {/* Control Bar: Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Filtrar:</span>
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setFiltroStatus('todos')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filtroStatus === 'todos'
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Todas ({etapas.length})
            </button>
            <button
              onClick={() => setFiltroStatus('pendente')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filtroStatus === 'pendente'
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Pendentes ({etapas.length - concluidasCount - naoAplicaveisCount})
            </button>
            <button
              onClick={() => setFiltroStatus('concluida')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filtroStatus === 'concluida'
                  ? 'bg-emerald-600 text-white font-medium shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Concluídas ({concluidasCount})
            </button>
            <button
              onClick={() => setFiltroStatus('nao_aplicavel')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filtroStatus === 'nao_aplicavel'
                  ? 'bg-slate-600 text-white font-medium shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              N/A ({naoAplicaveisCount})
            </button>
          </div>
        </div>

        {canEditEtapas && (
          <button
            onClick={() => setIsNovaEtapaOpen(!isNovaEtapaOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold border border-blue-200 dark:border-blue-800 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Etapa ao Processo
          </button>
        )}
      </div>

      {/* Form: Add custom stage */}
      {isNovaEtapaOpen && (
        <form
          onSubmit={handleCreateNovaEtapa}
          className="p-4 bg-blue-50/50 dark:bg-slate-800/80 rounded-xl border border-blue-200 dark:border-slate-700 flex flex-wrap gap-3 items-end animate-fade-in"
        >
          <div className="flex-1 min-w-[280px]">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome da Nova Etapa Personalizada
            </label>
            <input
              type="text"
              value={novaEtapaNome}
              onChange={(e) => setNovaEtapaNome(e.target.value)}
              placeholder="Ex: Obter declaração de disponibilidade orçamentária (SOF)"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
            >
              Salvar Etapa
            </button>
            <button
              type="button"
              onClick={() => setIsNovaEtapaOpen(false)}
              className="px-3 py-2 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Stage Items List */}
      <div className="space-y-3">
        {etapasFiltradas.map((etapa) => {
          const isConcluida = etapa.status === 'concluida';
          const isEmAndamento = etapa.status === 'em_andamento';
          const isNA = etapa.status === 'nao_aplicavel';
          const isPendente = etapa.status === 'pendente';
          const isEditingObs = editingObsId === etapa.id;
          const isAddingAnexo = addingAnexoId === etapa.id;

          return (
            <div
              key={etapa.id}
              id={`etapa-card-${etapa.id}`}
              className={`p-4 rounded-xl border transition-all duration-200 ${
                isConcluida
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                  : isEmAndamento
                  ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 ring-1 ring-blue-400/30'
                  : isNA
                  ? 'bg-slate-100/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-75'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Left info: order, status icon, title, details */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Status Toggle Button */}
                  <button
                    onClick={() => {
                      if (isConcluida) {
                        handleStatusChange(etapa, 'pendente');
                      } else {
                        handleStatusChange(etapa, 'concluida');
                      }
                    }}
                    disabled={loadingAcao === etapa.id}
                    title={isConcluida ? 'Clique para desfazer conclusão' : 'Clique para marcar como concluída'}
                    className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center transition-all shrink-0 ${
                      isConcluida
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : isEmAndamento
                        ? 'bg-blue-600 text-white animate-pulse'
                        : isNA
                        ? 'bg-slate-400 text-white'
                        : 'border-2 border-slate-300 dark:border-slate-600 hover:border-blue-500'
                    }`}
                  >
                    {isConcluida ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isEmAndamento ? (
                      <PlayCircle className="w-4 h-4" />
                    ) : isNA ? (
                      <Ban className="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">{etapa.ordem}</span>
                    )}
                  </button>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                        #{etapa.ordem}
                      </span>
                      <h4
                        className={`text-sm font-semibold text-slate-800 dark:text-slate-100 ${
                          isConcluida ? 'line-through text-slate-500 dark:text-slate-400' : ''
                        }`}
                      >
                        {etapa.nome}
                      </h4>

                      {etapa.condicional && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {etapa.descricaoCondicional || 'Condicional'}
                        </span>
                      )}

                      {/* Status badge */}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider ${
                          isConcluida
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : isEmAndamento
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : isNA
                            ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {isConcluida
                          ? 'Concluída'
                          : isEmAndamento
                          ? 'Em Andamento'
                          : isNA
                          ? 'Não Aplicável'
                          : 'Pendente'}
                      </span>
                    </div>

                    {/* Meta info: Who, when, elapsed days */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      {etapa.diasCorridos !== undefined && etapa.diasCorridos > 0 && (
                        <span className="flex items-center gap-1 font-mono font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                          <Calendar className="w-3 h-3" />
                          Duração: {etapa.diasCorridos} {etapa.diasCorridos === 1 ? 'dia' : 'dias corridos'}
                        </span>
                      )}

                      {etapa.responsavelConclusao && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>Por: <strong>{etapa.responsavelConclusao}</strong></span>
                        </span>
                      )}

                      {etapa.dataConclusao && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Em: {formatarDataHora(etapa.dataConclusao)}</span>
                        </span>
                      )}

                      {etapa.dataInicio && !etapa.dataConclusao && (
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <PlayCircle className="w-3 h-3" />
                          <span>Iniciada em: {formatarDataHora(etapa.dataInicio)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-start md:self-center">
                  {!isConcluida && !isNA && (
                    <button
                      onClick={() => handleStatusChange(etapa, 'concluida')}
                      disabled={loadingAcao === etapa.id}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Concluir
                    </button>
                  )}

                  {isConcluida && (
                    <button
                      onClick={() => handleStatusChange(etapa, 'pendente')}
                      disabled={loadingAcao === etapa.id}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 hover:bg-amber-100 transition-colors flex items-center gap-1"
                      title="Desfazer conclusão e voltar para pendente"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Desfazer
                    </button>
                  )}

                  {!isConcluida && isPendente && (
                    <button
                      onClick={() => handleStatusChange(etapa, 'em_andamento')}
                      disabled={loadingAcao === etapa.id}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1"
                      title="Marcar como em andamento"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      Iniciar
                    </button>
                  )}

                  {/* Não aplicável toggle */}
                  {!isConcluida && (
                    <button
                      onClick={() => {
                        handleStatusChange(etapa, isNA ? 'pendente' : 'nao_aplicavel');
                      }}
                      disabled={loadingAcao === etapa.id}
                      className={`px-2 py-1 text-xs rounded-lg border transition-colors flex items-center gap-1 ${
                        isNA
                          ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 font-medium'
                          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                      title={isNA ? 'Reativar etapa' : 'Marcar etapa como não aplicável'}
                    >
                      <Ban className="w-3 h-3" />
                      {isNA ? 'Reativar' : 'N/A'}
                    </button>
                  )}

                  {/* Observação button */}
                  <button
                    onClick={() => {
                      if (isEditingObs) {
                        setEditingObsId(null);
                      } else {
                        setEditingObsId(etapa.id);
                        setObsText(etapa.observacao || '');
                      }
                    }}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      etapa.observacao
                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300'
                        : 'text-slate-400 hover:text-slate-700 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                    title="Adicionar / Ver observação"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>

                  {/* Anexo button */}
                  <button
                    onClick={() => {
                      if (isAddingAnexo) {
                        setAddingAnexoId(null);
                      } else {
                        setAddingAnexoId(etapa.id);
                      }
                    }}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      etapa.anexos && etapa.anexos.length > 0
                        ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300'
                        : 'text-slate-400 hover:text-slate-700 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                    title="Anexar documento / Link"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete stage if permitted */}
                  {canEditEtapas && (
                    <button
                      onClick={() => handleDeleteEtapa(etapa)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 transition-colors"
                      title="Excluir etapa deste processo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Observation Display or Editor */}
              {etapa.observacao && !isEditingObs && (
                <div className="mt-2.5 p-2.5 rounded-lg bg-blue-50/60 dark:bg-slate-800/70 border border-blue-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <span className="font-semibold text-blue-900 dark:text-blue-300">Observação: </span>
                    <span>{etapa.observacao}</span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingObsId(etapa.id);
                      setObsText(etapa.observacao || '');
                    }}
                    className="text-[11px] text-blue-600 hover:underline shrink-0"
                  >
                    Editar
                  </button>
                </div>
              )}

              {isEditingObs && (
                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 animate-fade-in">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Comentário / Observação da Etapa:
                  </label>
                  <textarea
                    rows={2}
                    value={obsText}
                    onChange={(e) => setObsText(e.target.value)}
                    placeholder="Adicione informações relevantes sobre o cumprimento desta etapa..."
                    className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingObsId(null)}
                      className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleSaveObservation(etapa)}
                      className="px-3 py-1 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-sm flex items-center gap-1"
                    >
                      <Save className="w-3 h-3" />
                      Salvar Observação
                    </button>
                  </div>
                </div>
              )}

              {/* Attachments list & add form */}
              {etapa.anexos && etapa.anexos.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {etapa.anexos.map((anexo, aIdx) => (
                    <a
                      key={aIdx}
                      href={anexo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      <Paperclip className="w-3 h-3 text-purple-600" />
                      <span className="font-medium truncate max-w-[200px]">{anexo.nome}</span>
                      <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                    </a>
                  ))}
                </div>
              )}

              {isAddingAnexo && (
                <div className="mt-3 p-3 rounded-xl bg-purple-50/50 dark:bg-slate-800 border border-purple-200 dark:border-slate-700 space-y-2 animate-fade-in">
                  <h5 className="text-xs font-bold text-purple-900 dark:text-purple-300">
                    Anexar Documento ou Link do Processo SEI / Drive:
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={anexoNome}
                      onChange={(e) => setAnexoNome(e.target.value)}
                      placeholder="Nome do documento (ex: Termo de Referência Aprovado.pdf)"
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={anexoUrl}
                      onChange={(e) => setAnexoUrl(e.target.value)}
                      placeholder="Link do arquivo ou documento SEI (https://...)"
                      className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setAddingAnexoId(null)}
                      className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleAddAnexo(etapa)}
                      className="px-3 py-1 text-xs font-semibold rounded-md bg-purple-600 text-white hover:bg-purple-700 shadow-sm flex items-center gap-1"
                    >
                      <Paperclip className="w-3 h-3" />
                      Vincular Anexo
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
