import React, { useState, useEffect, useMemo } from 'react';
import { ContratoVigente, Usuario, GestorResponsavel, EmpresaContratada } from '../types';
import { atualizarContratoVigente, criarGestor, criarEmpresaContratada } from '../services/firestoreService';
import { X, Check, Building2, User, Plus, Calendar, DollarSign, FileText, AlertCircle } from 'lucide-react';

interface EditarContratoModalProps {
  isOpen: boolean;
  contrato: ContratoVigente | null;
  usuarioAtual: Usuario;
  gestores?: GestorResponsavel[];
  empresas?: EmpresaContratada[];
  onClose: () => void;
  onSalvo?: (contrato: ContratoVigente) => void;
  onNavegarParaGestores?: () => void;
  onNavegarParaEmpresas?: () => void;
}

export const EditarContratoModal: React.FC<EditarContratoModalProps> = ({
  isOpen,
  contrato,
  usuarioAtual,
  gestores = [],
  empresas = [],
  onClose,
  onSalvo,
  onNavegarParaGestores,
  onNavegarParaEmpresas
}) => {
  if (!isOpen || !contrato) return null;

  const [form, setForm] = useState({
    numeroContrato: '',
    projeto: '',
    empresa: '',
    gestor: '',
    objeto: '',
    valorAnual: '',
    dataOrdemServico: '',
    dataInicialExecucao: '',
    dataFinalExecucao: '',
    dataInicialVigencia: '',
    dataFinalVigencia: '',
    situacaoManual: ''
  });

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Modais rápidos para cadastrar Gestor ou Empresa on-the-fly
  const [modalRapidoGestor, setModalRapidoGestor] = useState(false);
  const [nomeRapidoGestor, setNomeRapidoGestor] = useState('');
  const [lotacaoRapidoGestor, setLotacaoRapidoGestor] = useState('GAD — Gerência Administrativa e de Suporte');
  const [salvandoRapidoGestor, setSalvandoRapidoGestor] = useState(false);

  const [modalRapidoEmpresa, setModalRapidoEmpresa] = useState(false);
  const [razaoRapidoEmpresa, setRazaoRapidoEmpresa] = useState('');
  const [cnpjRapidoEmpresa, setCnpjRapidoEmpresa] = useState('');
  const [salvandoRapidoEmpresa, setSalvandoRapidoEmpresa] = useState(false);

  useEffect(() => {
    if (contrato) {
      setForm({
        numeroContrato: contrato.numeroContrato || '',
        projeto: contrato.projeto || '',
        empresa: contrato.empresa || '',
        gestor: contrato.gestor || '',
        objeto: contrato.objeto || '',
        valorAnual: contrato.valorAnual ? String(contrato.valorAnual) : '',
        dataOrdemServico: contrato.dataOrdemServico || '',
        dataInicialExecucao: contrato.dataInicialExecucao || '',
        dataFinalExecucao: contrato.dataFinalExecucao || '',
        dataInicialVigencia: contrato.dataInicialVigencia || '',
        dataFinalVigencia: contrato.dataFinalVigencia || '',
        situacaoManual: contrato.situacaoManual || ''
      });
      setErro(null);
    }
  }, [contrato]);

  // Lista unificada de opções de gestor estritamente da base oficial de Gestores Responsáveis
  const listaGestoresOpcoes = useMemo(() => {
    const mapa = new Map<string, { nome: string; lotacao?: string }>();
    
    // Adiciona todos os gestores cadastrados na base oficial
    gestores
      .filter((g) => g.ativo !== false && g.nome)
      .forEach((g) => {
        mapa.set(g.nome, { nome: g.nome, lotacao: g.lotacao });
      });

    // Se o contrato atual já possui um gestor atribuído que não estava na base, mantém para permitir visualização
    if (contrato?.gestor && !mapa.has(contrato.gestor) && !contrato.gestor.includes('Carlos Alberto')) {
      mapa.set(contrato.gestor, { nome: contrato.gestor });
    }

    return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [gestores, contrato]);

  // Lista unificada de empresas contratadas da base oficial
  const listaEmpresasOpcoes = useMemo(() => {
    const mapa = new Map<string, { razaoSocial: string; cnpj?: string }>();
    empresas
      .filter((e) => e.ativo !== false && e.razaoSocial)
      .forEach((e) => {
        mapa.set(e.razaoSocial, { razaoSocial: e.razaoSocial, cnpj: e.cnpj });
      });

    if (contrato?.empresa && !mapa.has(contrato.empresa)) {
      mapa.set(contrato.empresa, { razaoSocial: contrato.empresa });
    }

    return Array.from(mapa.values()).sort((a, b) => a.razaoSocial.localeCompare(b.razaoSocial));
  }, [empresas, contrato]);

  const mascaraCNPJ = (valor: string) => {
    return valor
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const handleSalvarRapidoGestor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeRapidoGestor.trim()) return;
    try {
      setSalvandoRapidoGestor(true);
      await criarGestor(
        {
          nome: nomeRapidoGestor.trim(),
          lotacao: lotacaoRapidoGestor.trim(),
          ativo: true
        },
        usuarioAtual
      );
      setForm((prev) => ({ ...prev, gestor: nomeRapidoGestor.trim() }));
      setNomeRapidoGestor('');
      setModalRapidoGestor(false);
    } catch (err) {
      console.error('Erro ao cadastrar gestor rápido:', err);
    } finally {
      setSalvandoRapidoGestor(false);
    }
  };

  const handleSalvarRapidaEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!razaoRapidoEmpresa.trim() || !cnpjRapidoEmpresa.trim()) return;
    try {
      setSalvandoRapidoEmpresa(true);
      await criarEmpresaContratada(
        {
          razaoSocial: razaoRapidoEmpresa.trim(),
          cnpj: cnpjRapidoEmpresa.trim(),
          ativo: true
        },
        usuarioAtual
      );
      setForm((prev) => ({ ...prev, empresa: razaoRapidoEmpresa.trim() }));
      setRazaoRapidoEmpresa('');
      setCnpjRapidoEmpresa('');
      setModalRapidoEmpresa(false);
    } catch (err) {
      console.error('Erro ao cadastrar empresa rápida:', err);
    } finally {
      setSalvandoRapidoEmpresa(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.numeroContrato.trim()) {
      setErro('Informe o Número do Contrato.');
      return;
    }
    if (!form.empresa.trim()) {
      setErro('Informe a Empresa Contratada.');
      return;
    }

    try {
      setSalvando(true);
      setErro(null);

      const dadosAtualizados: Partial<ContratoVigente> = {
        numeroContrato: form.numeroContrato.trim(),
        projeto: form.projeto.trim(),
        empresa: form.empresa.trim(),
        gestor: form.gestor.trim(),
        objeto: form.objeto.trim(),
        valorAnual: parseFloat(form.valorAnual) || 0,
        dataOrdemServico: form.dataOrdemServico || undefined,
        dataInicialExecucao: form.dataInicialExecucao || undefined,
        dataFinalExecucao: form.dataFinalExecucao || undefined,
        dataInicialVigencia: form.dataInicialVigencia || undefined,
        dataFinalVigencia: form.dataFinalVigencia || undefined,
        situacaoManual: form.situacaoManual.trim() || undefined
      };

      await atualizarContratoVigente(contrato.id, dadosAtualizados, usuarioAtual);

      if (onSalvo) {
        onSalvo({
          ...contrato,
          ...dadosAtualizados
        } as ContratoVigente);
      }

      onClose();
    } catch (err: any) {
      console.error('Erro ao atualizar contrato:', err);
      setErro(err?.message || 'Falha ao salvar as alterações do contrato.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              #{contrato.numero}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Corrigir / Editar Contrato Vigente
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Altere qualquer dado cadastral do contrato na Base Vigente GAD
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {erro && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[78vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Nº do Contrato */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nº do Contrato *
              </label>
              <input
                required
                type="text"
                value={form.numeroContrato}
                onChange={(e) => setForm({ ...form, numeroContrato: e.target.value })}
                placeholder="Ex: CT.PS.23.2.203"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Projeto */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Projeto
              </label>
              <input
                type="text"
                value={form.projeto}
                onChange={(e) => setForm({ ...form, projeto: e.target.value })}
                placeholder="Ex: GO014DGC17"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Empresa Contratada */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Empresa Contratada *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalRapidoEmpresa(true)}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Nova Empresa</span>
                  </button>
                  {onNavegarParaEmpresas && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavegarParaEmpresas();
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                    >
                      Gerenciar
                    </button>
                  )}
                </div>
              </div>
              <select
                required
                value={form.empresa}
                onChange={(e) => {
                  if (e.target.value === '__nova__') {
                    setModalRapidoEmpresa(true);
                  } else {
                    setForm({ ...form, empresa: e.target.value });
                  }
                }}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione a Empresa Contratada...</option>
                {listaEmpresasOpcoes.map((e) => (
                  <option key={e.razaoSocial} value={e.razaoSocial}>
                    {e.razaoSocial} {e.cnpj ? `— CNPJ: ${e.cnpj}` : ''}
                  </option>
                ))}
                <option value="__nova__" className="text-blue-600 font-bold">
                  + Cadastrar Nova Empresa na Base...
                </option>
              </select>
            </div>

            {/* Gestor Responsável */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700 dark:text-slate-300">
                  Gestor Responsável
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalRapidoGestor(true)}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Novo Gestor</span>
                  </button>
                  {onNavegarParaGestores && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavegarParaGestores();
                      }}
                      className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                    >
                      Gerenciar
                    </button>
                  )}
                </div>
              </div>
              <select
                value={form.gestor}
                onChange={(e) => {
                  if (e.target.value === '__novo__') {
                    setModalRapidoGestor(true);
                  } else {
                    setForm({ ...form, gestor: e.target.value });
                  }
                }}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione o Gestor Responsável...</option>
                {listaGestoresOpcoes.map((g) => (
                  <option key={g.nome} value={g.nome}>
                    {g.nome} {g.lotacao ? `(${g.lotacao.split('—')[0].trim()})` : ''}
                  </option>
                ))}
                <option value="__novo__" className="text-blue-600 font-bold">
                  + Cadastrar Novo Gestor na Base...
                </option>
              </select>
            </div>

            {/* Objeto Contratual */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Objeto Contratual
              </label>
              <textarea
                rows={2}
                value={form.objeto}
                onChange={(e) => setForm({ ...form, objeto: e.target.value })}
                placeholder="Descrição resumida do escopo dos serviços contratados..."
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              />
            </div>

            {/* Valor Anual */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Valor Anual (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.valorAnual}
                onChange={(e) => setForm({ ...form, valorAnual: e.target.value })}
                placeholder="Ex: 4850000"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Data Ordem de Serviço */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Data Ordem de Serviço (O.S.)
              </label>
              <input
                type="date"
                value={form.dataOrdemServico}
                onChange={(e) => setForm({ ...form, dataOrdemServico: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Data Inicial de Execução */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Data Inicial Execução
              </label>
              <input
                type="date"
                value={form.dataInicialExecucao}
                onChange={(e) => setForm({ ...form, dataInicialExecucao: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Data Final de Execução */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Data Final Execução (Término)
              </label>
              <input
                type="date"
                value={form.dataFinalExecucao}
                onChange={(e) => setForm({ ...form, dataFinalExecucao: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Data Inicial de Vigência */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Data Inicial Vigência
              </label>
              <input
                type="date"
                value={form.dataInicialVigencia}
                onChange={(e) => setForm({ ...form, dataInicialVigencia: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Data Final de Vigência */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Data Final Vigência
              </label>
              <input
                type="date"
                value={form.dataFinalVigencia}
                onChange={(e) => setForm({ ...form, dataFinalVigencia: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Situação Manual (quando sem processo em andamento) */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Situação Manual / Observação Operacional (Opcional)
              </label>
              <input
                type="text"
                value={form.situacaoManual}
                onChange={(e) => setForm({ ...form, situacaoManual: e.target.value })}
                placeholder="Ex: AGUARDANDO LINHAS 2027 / PROCESSO SEPARADO NA CGF"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Exibida quando não houver processos de aditivo ou reajuste ativos vinculados.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{salvando ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>

      </div>

      {/* Sub-modal rápido de Gestor */}
      {modalRapidoGestor && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Cadastrar Novo Gestor na Base
              </h4>
              <button
                type="button"
                onClick={() => setModalRapidoGestor(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSalvarRapidoGestor} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  required
                  type="text"
                  value={nomeRapidoGestor}
                  onChange={(e) => setNomeRapidoGestor(e.target.value)}
                  placeholder="Ex: Carlos Eduardo de Morais"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Lotação / Gerência
                </label>
                <select
                  value={lotacaoRapidoGestor}
                  onChange={(e) => setLotacaoRapidoGestor(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                >
                  <option value="GAD — Gerência Administrativa e de Suporte">
                    GAD — Gerência Administrativa e de Suporte
                  </option>
                  <option value="CSG — Coordenação de Serviços Gerais">
                    CSG — Coordenação de Serviços Gerais
                  </option>
                  <option value="CGF — Gestão de Frotas">
                    CGF — Gestão de Frotas
                  </option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalRapidoGestor(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoRapidoGestor}
                  className="px-4 py-1.5 rounded-lg bg-blue-700 text-white font-bold disabled:opacity-50"
                >
                  {salvandoRapidoGestor ? 'Salvando...' : 'Adicionar Gestor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sub-modal rápido de Empresa */}
      {modalRapidoEmpresa && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Cadastrar Nova Empresa Contratada
              </h4>
              <button
                type="button"
                onClick={() => setModalRapidoEmpresa(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSalvarRapidaEmpresa} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Razão Social *
                </label>
                <input
                  required
                  type="text"
                  value={razaoRapidoEmpresa}
                  onChange={(e) => setRazaoRapidoEmpresa(e.target.value)}
                  placeholder="Ex: Nordeste Engenharia e Serviços Ltda"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  CNPJ *
                </label>
                <input
                  required
                  type="text"
                  value={cnpjRapidoEmpresa}
                  onChange={(e) => setCnpjRapidoEmpresa(mascaraCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalRapidoEmpresa(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoRapidoEmpresa}
                  className="px-4 py-1.5 rounded-lg bg-blue-700 text-white font-bold disabled:opacity-50"
                >
                  {salvandoRapidoEmpresa ? 'Salvando...' : 'Adicionar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
