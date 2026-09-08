import React, { useState, useEffect } from 'react';
import { LotacaoDestino, TipoAcao, Usuario, ContratoVigente } from '../types';
import { LOTACOES_DISPONIVEIS, TEMPLATES_FLUXOS } from '../data/flowTemplates';
import { criarNovoProcesso } from '../services/firestoreService';
import {
  X,
  FilePlus2,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Building2,
  Briefcase,
  Layers,
  Calendar,
  DollarSign
} from 'lucide-react';

interface NovoProcessoModalProps {
  usuarioAtual: Usuario;
  isOpen: boolean;
  onClose: () => void;
  onProcessoCriado: (novoProcessoId: string) => void;
  contratosDisponiveis?: ContratoVigente[];
  contratoPreSelecionado?: ContratoVigente | null;
}

export const NovoProcessoModal: React.FC<NovoProcessoModalProps> = ({
  usuarioAtual,
  isOpen,
  onClose,
  onProcessoCriado,
  contratosDisponiveis = [],
  contratoPreSelecionado = null
}) => {
  // Mode: 'novo_contrato' (Licitação) vs 'sobre_existente' (Reajuste / Aditivo)
  const [modoEntrada, setModoEntrada] = useState<'novo_contrato' | 'sobre_existente'>(
    contratoPreSelecionado ? 'sobre_existente' : 'novo_contrato'
  );

  const [contratoSelecionadoId, setContratoSelecionadoId] = useState<string>(
    contratoPreSelecionado?.id || ''
  );

  const contratoAtivo = contratosDisponiveis.find((c) => c.id === contratoSelecionadoId) || contratoPreSelecionado;

  const [lotacaoDestino, setLotacaoDestino] = useState<LotacaoDestino>(
    'GAD — Gerência Administrativa e de Suporte'
  );

  const [tipoAcao, setTipoAcao] = useState<TipoAcao>('LICITAÇÃO / NOVO CONTRATO');
  const [dataReferencia, setDataReferencia] = useState('');
  const [descricaoObjeto, setDescricaoObjeto] = useState('');
  const [numeroProcesso, setNumeroProcesso] = useState('');
  const [empresaContratada, setEmpresaContratada] = useState('');
  const [valorEstimado, setValorEstimado] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync mode and selections when modal opens or contract changes
  useEffect(() => {
    if (contratoPreSelecionado) {
      setModoEntrada('sobre_existente');
      setContratoSelecionadoId(contratoPreSelecionado.id);
      preencherComContrato(contratoPreSelecionado, 'ADITIVO (RENOVAÇÃO/SUPRESSÃO/ACRÉSCIMO) EM CONTRATO');
    } else {
      if (modoEntrada === 'novo_contrato') {
        setTipoAcao('LICITAÇÃO / NOVO CONTRATO');
        setContratoSelecionadoId('');
        setDataReferencia('');
      }
    }
  }, [contratoPreSelecionado, isOpen]);

  const preencherComContrato = (contrato: ContratoVigente, acao: TipoAcao) => {
    setEmpresaContratada(contrato.empresa || '');
    setValorEstimado(contrato.valorAnual ? String(contrato.valorAnual) : '');
    setDescricaoObjeto(contrato.objeto || '');

    // Set appropriate reference date based on action type
    if (acao.includes('REAJUSTE')) {
      setDataReferencia(contrato.dataOrdemServico || '');
      setNumeroProcesso(`REAJ-${contrato.numeroContrato.replace(/[^a-zA-Z0-9]/g, '')}`);
    } else {
      setDataReferencia(contrato.dataFinalExecucao || '');
      setNumeroProcesso(`ADIT-${contrato.numeroContrato.replace(/[^a-zA-Z0-9]/g, '')}`);
    }

    // Set lotacao destination
    if (contrato.projeto?.includes('CGF') || contrato.objeto?.toLowerCase().includes('veículo') || contrato.objeto?.toLowerCase().includes('frota')) {
      setLotacaoDestino('CGF — Coordenação de Gestão de Frotas');
    } else if (contrato.projeto?.includes('CSG') || contrato.objeto?.toLowerCase().includes('manutenção') || contrato.objeto?.toLowerCase().includes('predial')) {
      setLotacaoDestino('CSG — Coordenação de Serviços Gerais');
    } else {
      setLotacaoDestino('GAD — Gerência Administrativa e de Suporte');
    }

    setTipoAcao(acao);
  };

  const handleMudarModo = (novoModo: 'novo_contrato' | 'sobre_existente') => {
    setModoEntrada(novoModo);
    if (novoModo === 'novo_contrato') {
      setTipoAcao('LICITAÇÃO / NOVO CONTRATO');
      setContratoSelecionadoId('');
      setDataReferencia('');
      setDescricaoObjeto('');
      setEmpresaContratada('');
      setValorEstimado('');
      setNumeroProcesso('');
    } else {
      const primeiro = contratosDisponiveis[0];
      if (primeiro) {
        setContratoSelecionadoId(primeiro.id);
        preencherComContrato(primeiro, 'ADITIVO (RENOVAÇÃO/SUPRESSÃO/ACRÉSCIMO) EM CONTRATO');
      } else {
        setTipoAcao('ADITIVO (RENOVAÇÃO/SUPRESSÃO/ACRÉSCIMO) EM CONTRATO');
      }
    }
  };

  const handleSelecionarContrato = (id: string) => {
    setContratoSelecionadoId(id);
    const encontrado = contratosDisponiveis.find((c) => c.id === id);
    if (encontrado) {
      preencherComContrato(encontrado, tipoAcao);
    }
  };

  const handleMudarTipoAcaoSobreExistente = (novaAcao: TipoAcao) => {
    setTipoAcao(novaAcao);
    if (contratoAtivo) {
      if (novaAcao.includes('REAJUSTE')) {
        setDataReferencia(contratoAtivo.dataOrdemServico || '');
        setNumeroProcesso(`REAJ-${contratoAtivo.numeroContrato.replace(/[^a-zA-Z0-9]/g, '')}`);
      } else {
        setDataReferencia(contratoAtivo.dataFinalExecucao || '');
        setNumeroProcesso(`ADIT-${contratoAtivo.numeroContrato.replace(/[^a-zA-Z0-9]/g, '')}`);
      }
    }
  };

  if (!isOpen) return null;

  const etapasPreview = TEMPLATES_FLUXOS[tipoAcao] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricaoObjeto.trim()) {
      setError('Por favor, informe a descrição do objeto do processo.');
      return;
    }

    if (modoEntrada === 'sobre_existente' && !contratoSelecionadoId) {
      setError('Por favor, selecione um contrato vigente existente.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const novoId = await criarNovoProcesso({
        lotacaoDestino,
        tipoAcao,
        descricaoObjeto: descricaoObjeto.trim(),
        contratoVigenteId: modoEntrada === 'sobre_existente' ? contratoSelecionadoId : null,
        dataReferencia: modoEntrada === 'sobre_existente' ? dataReferencia : null,
        numeroProcesso: numeroProcesso.trim(),
        empresaContratada: empresaContratada.trim(),
        valorEstimado: valorEstimado ? parseFloat(valorEstimado) : 0,
        usuarioAtual
      });

      onProcessoCriado(novoId);
      onClose();
    } catch (err: any) {
      console.error('Erro ao criar processo:', err);
      setError(err?.message || 'Falha ao criar o processo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="novo-processo-modal"
        className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-in my-6"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-xl">
              <FilePlus2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Abertura de Novo Processo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure os parâmetros para inicialização do fluxo de etapas da GAD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs (Section 5 from prompt) */}
        {!contratoPreSelecionado && (
          <div className="p-4 bg-slate-100/70 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleMudarModo('novo_contrato')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                modoEntrada === 'novo_contrato'
                  ? 'border-blue-600 bg-white dark:bg-slate-800 shadow-xs ring-1 ring-blue-500 font-bold text-slate-900 dark:text-white'
                  : 'border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-white'
              }`}
            >
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold">Novo Contrato (Licitação)</span>
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  Fluxo completo de 19 etapas consecutivas
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleMudarModo('sobre_existente')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                modoEntrada === 'sobre_existente'
                  ? 'border-blue-600 bg-white dark:bg-slate-800 shadow-xs ring-1 ring-blue-500 font-bold text-slate-900 dark:text-white'
                  : 'border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-white'
              }`}
            >
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="block font-bold">Ação sobre Contrato Existente</span>
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  Termo Aditivo ou Reajuste Retroativo
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* If Mode is 'sobre_existente', display Contract Picker & Information */}
          {modoEntrada === 'sobre_existente' && (
            <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-3">
              <div>
                <label className="block font-bold text-blue-900 dark:text-blue-200 mb-1">
                  Selecione o Contrato Vigente da Base GAD <span className="text-rose-500">*</span>
                </label>
                <select
                  value={contratoSelecionadoId}
                  onChange={(e) => handleSelecionarContrato(e.target.value)}
                  className="w-full p-2 rounded-lg border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-850 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Escolha um contrato existente --</option>
                  {contratosDisponiveis.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.numero} — {c.numeroContrato} | {c.empresa} (Término: {c.dataFinalExecucao || 'N/D'})
                    </option>
                  ))}
                </select>
              </div>

              {contratoAtivo && (
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-blue-100 dark:border-blue-900/60 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-900 dark:text-white">
                      Contrato: {contratoAtivo.numeroContrato} ({contratoAtivo.projeto || 'Sem projeto'})
                    </span>
                    <span className="text-blue-700 dark:text-blue-400">
                      Gestor: {contratoAtivo.gestor}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] line-clamp-1">
                    {contratoAtivo.objeto}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tipo de Ação */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Tipo de Ação <span className="text-rose-500">*</span>
            </label>

            {modoEntrada === 'novo_contrato' ? (
              <div className="p-3.5 rounded-xl border border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-500 ring-1 ring-blue-500 flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white block">
                    LICITAÇÃO / NOVO CONTRATO
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Fluxo padrão com exatamente 19 etapas consecutivas da GAD
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded font-mono font-semibold bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100 text-[11px]">
                    19 etapas
                  </span>
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleMudarTipoAcaoSobreExistente('ADITIVO (RENOVAÇÃO/SUPRESSÃO/ACRÉSCIMO) EM CONTRATO')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    tipoAcao.includes('ADITIVO')
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-500 ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      TERMO ADITIVO
                    </span>
                    {tipoAcao.includes('ADITIVO') && <CheckCircle className="w-4 h-4 text-blue-600" />}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                    Renovação / Supressão / Acréscimo (13 etapas)
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1 block">
                    Ref: Data Final de Execução
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMudarTipoAcaoSobreExistente('REAJUSTE RETROATIVO EM CONTRATO')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    tipoAcao.includes('REAJUSTE')
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-500 ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      REAJUSTE RETROATIVO
                    </span>
                    {tipoAcao.includes('REAJUSTE') && <CheckCircle className="w-4 h-4 text-blue-600" />}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                    Reajuste por índices oficiais (9 etapas)
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1 block">
                    Ref: Data da Ordem de Serviço (OS)
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Data de Referência (Section 5 requirement) */}
          {modoEntrada === 'sobre_existente' && (
            <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-750">
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                {tipoAcao.includes('REAJUSTE')
                  ? 'Data de Referência (Ordem de Serviço do Contrato)'
                  : 'Data de Referência (Final de Execução do Contrato)'}
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={dataReferencia}
                  onChange={(e) => setDataReferencia(e.target.value)}
                  className="w-full sm:w-60 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-[11px] text-slate-400">
                  (Pré-preenchida a partir da base GAD, editável se necessário)
                </span>
              </div>
            </div>
          )}

          {/* Lotação Destino */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Lotação Destino <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {LOTACOES_DISPONIVEIS.map((lot) => {
                const isSelected = lotacaoDestino === lot;
                const sigla = lot.split('—')[0].trim();
                const nomeCompleto = lot.split('—')[1]?.trim() || '';

                return (
                  <button
                    key={lot}
                    type="button"
                    onClick={() => setLotacaoDestino(lot)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-500 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{sigla}</span>
                      {isSelected && <CheckCircle className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {nomeCompleto}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Descrição do Objeto */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Descrição do Objeto <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={descricaoObjeto}
              onChange={(e) => setDescricaoObjeto(e.target.value)}
              placeholder="Descreva detalhadamente o objeto da licitação ou do termo aditivo..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Campos Complementares */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nº Processo / SEI (Opcional)
              </label>
              <input
                type="text"
                value={numeroProcesso}
                onChange={(e) => setNumeroProcesso(e.target.value)}
                placeholder="Ex: PROC-2026-0951"
                className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Empresa Contratada (Opcional)
              </label>
              <input
                type="text"
                value={empresaContratada}
                onChange={(e) => setEmpresaContratada(e.target.value)}
                placeholder="Ex: Empresa Vencedora / Contratada"
                className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor Estimado R$ (Opcional)
              </label>
              <input
                type="number"
                step="0.01"
                value={valorEstimado}
                onChange={(e) => setValorEstimado(e.target.value)}
                placeholder="Ex: 250000.00"
                className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Flow Preview Accordion */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Etapas que serão geradas automaticamente ({etapasPreview.length}):
            </span>
            <div className="max-h-24 overflow-y-auto space-y-1 text-[11px] text-slate-600 dark:text-slate-400 pr-1">
              {etapasPreview.map((et, i) => (
                <div key={i} className="flex items-center gap-1.5 truncate">
                  <span className="w-4 font-mono font-bold text-slate-400">{i + 1}.</span>
                  <span className="truncate">{et.nome}</span>
                  {et.condicional && (
                    <span className="text-[9px] text-amber-700 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-1 rounded">
                      condicional
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Criando Processo...</span>
              ) : (
                <>
                  <span>Criar Processo com Fluxo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
