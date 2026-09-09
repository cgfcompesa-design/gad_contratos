import React, { useState, useRef } from 'react';
import {
  COLUNAS_PLANILHA_BASE,
  ContratoImportadoItem,
  baixarPlanilhaModeloXLSX,
  baixarPlanilhaModeloCSV,
  processarArquivoPlanilha
} from '../utils/planilhaContratos';
import { ContratoVigente, Usuario } from '../types';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  FileCheck,
  Layers,
  ArrowRight
} from 'lucide-react';

interface ImportarPlanilhaModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuarioAtual: Usuario;
  onImportarSucesso: (contratos: ContratoImportadoItem[], substituirBase: boolean) => Promise<void>;
}

export const ImportarPlanilhaModal: React.FC<ImportarPlanilhaModalProps> = ({
  isOpen,
  onClose,
  usuarioAtual,
  onImportarSucesso
}) => {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [carregandoArquivo, setCarregandoArquivo] = useState(false);
  const [erroLeitura, setErroLeitura] = useState<string | null>(null);
  const [itensImportados, setItensImportados] = useState<ContratoImportadoItem[]>([]);
  const [substituirBase, setSubstituirBase] = useState(false);
  const [salvandoLote, setSalvandoLote] = useState(false);
  const [arrastando, setArrastando] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleArquivoSelecionado = async (file: File) => {
    setErroLeitura(null);
    setCarregandoArquivo(true);
    setArquivo(file);

    try {
      const resultado = await processarArquivoPlanilha(file);
      if (resultado.itens.length === 0) {
        setErroLeitura('Nenhum contrato válido foi encontrado nas linhas da planilha.');
        setItensImportados([]);
      } else {
        setItensImportados(resultado.itens);
      }
    } catch (err: any) {
      console.error('Erro ao ler planilha:', err);
      setErroLeitura(err?.message || 'Erro ao processar o arquivo. Verifique se o formato é válido.');
      setItensImportados([]);
    } finally {
      setCarregandoArquivo(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setArrastando(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleArquivoSelecionado(file);
    }
  };

  const handleResetarArquivo = () => {
    setArquivo(null);
    setItensImportados([]);
    setErroLeitura(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmarImportacao = async () => {
    if (itensImportados.length === 0) return;
    setSalvandoLote(true);
    try {
      await onImportarSucesso(itensImportados, substituirBase);
      handleResetarArquivo();
      onClose();
    } catch (err: any) {
      setErroLeitura(err?.message || 'Falha ao salvar contratos importados.');
    } finally {
      setSalvandoLote(false);
    }
  };

  return (
    <div
      id="modal-importar-planilha-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
    >
      <div
        id="modal-importar-planilha-card"
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Importar Planilha de Contratos Vigentes
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Carregue seus contratos via XLSX ou CSV com dados não coincidentes deixados em branco
              </p>
            </div>
          </div>
          <button
            id="btn-fechar-modal-importacao"
            onClick={onClose}
            disabled={salvandoLote}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200 text-xs">
          {/* Instruções e Download da Planilha Base */}
          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-blue-900 dark:text-blue-200">
                  Planilha Base Obrigatória
                </span>
                <span className="text-[10px] uppercase tracking-wider bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-extrabold px-2 py-0.5 rounded-full">
                  11 Colunas
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-baixar-modelo-xlsx"
                  onClick={baixarPlanilhaModeloXLSX}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Modelo (.xlsx)</span>
                </button>
                <button
                  type="button"
                  id="btn-baixar-modelo-csv"
                  onClick={baixarPlanilhaModeloCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Modelo (.csv)</span>
                </button>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              A planilha deve seguir a sequência exata abaixo. <strong>Campos sem correspondência ou vazios na planilha ficarão em branco</strong> automaticamente no sistema:
            </p>

            {/* Tags da ordem exata solicitada */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {COLUNAS_PLANILHA_BASE.map((col, idx) => (
                <span
                  key={col}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-300 font-semibold"
                >
                  <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[9px] flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <span>{col}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Área de Upload / Dropzone */}
          {!arquivo ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setArrastando(true);
              }}
              onDragLeave={() => setArrastando(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                arrastando
                  ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40'
                  : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-800/30'
              }`}
            >
              <input
                ref={fileInputRef}
                id="input-arquivo-planilha"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleArquivoSelecionado(e.target.files[0]);
                  }
                }}
              />
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Arraste e solte o arquivo da planilha aqui
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Ou clique para navegar no seu computador (formatos aceitos: <strong>.xlsx, .xls, .csv</strong>)
              </p>
            </div>
          ) : (
            /* Arquivo Selecionado e Resultados */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-950 dark:text-emerald-200 text-xs">
                      {arquivo.name}
                    </h4>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                      {(arquivo.size / 1024).toFixed(1)} KB &bull; {itensImportados.length} contratos reconhecidos
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-trocar-arquivo"
                  onClick={handleResetarArquivo}
                  disabled={salvandoLote}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-[11px] font-bold cursor-pointer transition"
                >
                  Trocar Arquivo
                </button>
              </div>

              {/* Modo de importação: Incrementar ou Substituir */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Modo de Gravação dos Contratos
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                      !substituirBase
                        ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 font-bold text-blue-950 dark:text-blue-200'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modoImportacao"
                      checked={!substituirBase}
                      onChange={() => setSubstituirBase(false)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="font-bold">Acrescentar / Atualizar Base</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                        Adiciona novos contratos e atualiza os que já existem pelo Nº de Contrato.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition ${
                      substituirBase
                        ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 font-bold text-amber-950 dark:text-amber-200'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="modoImportacao"
                      checked={substituirBase}
                      onChange={() => setSubstituirBase(true)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="font-bold">Substituir Base Inteira</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                        Limpa a lista anterior de contratos e adota exclusivamente os contratos desta planilha.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Prévia da Tabela (primeiros 5 registros) */}
              {itensImportados.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Pré-visualização dos Primeiros Itens ({Math.min(itensImportados.length, 5)} de {itensImportados.length})
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Datas e valores normalizados
                    </span>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-x-auto max-h-48">
                    <table className="w-full text-left text-[11px] whitespace-nowrap">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                        <tr>
                          <th className="py-2 px-2.5">#</th>
                          <th className="py-2 px-2.5">Nº Contrato</th>
                          <th className="py-2 px-2.5">Gestor</th>
                          <th className="py-2 px-2.5">Empresa</th>
                          <th className="py-2 px-2.5">Projeto</th>
                          <th className="py-2 px-2.5 text-right">Valor Anual</th>
                          <th className="py-2 px-2.5">Fim Execução</th>
                          <th className="py-2 px-2.5">Fim Vigência</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {itensImportados.slice(0, 5).map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="py-1.5 px-2.5 text-slate-400 font-mono">{idx + 1}</td>
                            <td className="py-1.5 px-2.5 font-bold text-blue-700 dark:text-blue-400">
                              {item.numeroContrato || <span className="text-slate-300 italic">(em branco)</span>}
                            </td>
                            <td className="py-1.5 px-2.5 text-slate-700 dark:text-slate-300">
                              {item.gestor || <span className="text-slate-300 italic">(em branco)</span>}
                            </td>
                            <td className="py-1.5 px-2.5 text-slate-700 dark:text-slate-300 max-w-[150px] truncate">
                              {item.empresa || <span className="text-slate-300 italic">(em branco)</span>}
                            </td>
                            <td className="py-1.5 px-2.5 font-mono text-slate-500">
                              {item.projeto || <span className="text-slate-300 italic">(em branco)</span>}
                            </td>
                            <td className="py-1.5 px-2.5 text-right font-semibold text-slate-800 dark:text-slate-200">
                              {item.valorAnual > 0
                                ? item.valorAnual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                : <span className="text-slate-300 italic">(em branco)</span>}
                            </td>
                            <td className="py-1.5 px-2.5 text-slate-600 dark:text-slate-400">
                              {item.dataFinalExecucao || <span className="text-slate-300 italic">(em branco)</span>}
                            </td>
                            <td className="py-1.5 px-2.5 text-slate-600 dark:text-slate-400">
                              {item.dataFinalVigencia || <span className="text-slate-300 italic">(em branco)</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mensagem de Erro se houver */}
          {erroLeitura && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              <div>
                <p className="font-bold">Atenção ao importar planilha:</p>
                <p>{erroLeitura}</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <button
            type="button"
            id="btn-cancelar-importacao"
            onClick={onClose}
            disabled={salvandoLote}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition cursor-pointer text-xs"
          >
            Cancelar
          </button>

          <button
            type="button"
            id="btn-confirmar-importacao-lote"
            disabled={itensImportados.length === 0 || salvandoLote || carregandoArquivo}
            onClick={handleConfirmarImportacao}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold shadow-xs hover:shadow transition cursor-pointer text-xs"
          >
            {salvandoLote ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Gravando {itensImportados.length} Contratos...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Importação ({itensImportados.length} Contratos)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
