import React, { useState } from 'react';
import { LotacaoDestino, TipoAcao, Usuario } from '../types';
import { LOTACOES_DISPONIVEIS, TIPOS_ACAO_DISPONIVEIS, TEMPLATES_FLUXOS } from '../data/flowTemplates';
import { criarNovoProcesso } from '../services/firestoreService';
import { X, FilePlus2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface NovoProcessoModalProps {
  usuarioAtual: Usuario;
  isOpen: boolean;
  onClose: () => void;
  onProcessoCriado: (novoProcessoId: string) => void;
}

export const NovoProcessoModal: React.FC<NovoProcessoModalProps> = ({
  usuarioAtual,
  isOpen,
  onClose,
  onProcessoCriado
}) => {
  const [lotacaoDestino, setLotacaoDestino] = useState<LotacaoDestino>(
    'GAD — Gerência Administrativa e de Suporte'
  );
  const [tipoAcao, setTipoAcao] = useState<TipoAcao>(
    'LICITAÇÃO / NOVO CONTRATO com Mão de Obra'
  );
  const [descricaoObjeto, setDescricaoObjeto] = useState('');
  const [numeroProcesso, setNumeroProcesso] = useState('');
  const [empresaContratada, setEmpresaContratada] = useState('');
  const [valorEstimado, setValorEstimado] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const etapasPreview = TEMPLATES_FLUXOS[tipoAcao] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricaoObjeto.trim()) {
      setError('Por favor, informe a descrição do objeto do contrato.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const novoId = await criarNovoProcesso({
        lotacaoDestino,
        tipoAcao,
        descricaoObjeto: descricaoObjeto.trim(),
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="novo-processo-modal"
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-in"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-xl">
              <FilePlus2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Abertura de Novo Processo de Contrato
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Preencha os dados para iniciar e gerar o fluxo automático de etapas
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Lotação Destino */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              1. Lotação Destino <span className="text-rose-500">*</span>
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

          {/* 2. Tipo de Ação */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              2. Tipo de Ação (Define o Fluxo de Etapas) <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2">
              {TIPOS_ACAO_DISPONIVEIS.map((tipo) => {
                const isSelected = tipoAcao === tipo;
                const count = TEMPLATES_FLUXOS[tipo].length;

                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setTipoAcao(tipo)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-500 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        {tipo}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Fluxo padronizado com {count} etapas consecutivas
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-mono font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px]">
                        {count} etapas
                      </span>
                      {isSelected && <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Descrição do Objeto */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
              3. Descrição do Objeto do Contrato / Processo <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={descricaoObjeto}
              onChange={(e) => setDescricaoObjeto(e.target.value)}
              placeholder="Descreva detalhadamente o objeto da contratação, reajuste ou termo aditivo..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Campos Complementares */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
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
                placeholder="Ex: Alfa Prestadora de Serviços"
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
            <div className="max-h-28 overflow-y-auto space-y-1 text-[11px] text-slate-600 dark:text-slate-400 pr-1">
              {etapasPreview.map((et, i) => (
                <div key={i} className="flex items-center gap-1.5 truncate">
                  <span className="w-4 font-mono font-bold text-slate-400">{i + 1}.</span>
                  <span className="truncate">{et.nome}</span>
                  {et.condicional && (
                    <span className="text-[9px] text-amber-700 bg-amber-100 px-1 rounded">condicional</span>
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
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all hover:shadow-lg disabled:opacity-50"
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
