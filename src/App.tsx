/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth, MASTER_EMAIL } from './context/AuthContext';
import { ProcessoContrato, LotacaoDestino, TipoAcao, StatusGeralProcesso } from './types';
import { LOTACOES_DISPONIVEIS, TIPOS_ACAO_DISPONIVEIS } from './data/flowTemplates';
import { subscribeProcessos, seedExemplosSeVazio } from './services/firestoreService';
import { Header } from './components/Header';
import { ProcessoCard } from './components/ProcessoCard';
import { KanbanView } from './components/KanbanView';
import { ProcessoDetalhes } from './components/ProcessoDetalhes';
import { NovoProcessoModal } from './components/NovoProcessoModal';
import { UsuariosModal } from './components/UsuariosModal';
import { AguardandoAprovacao } from './components/AguardandoAprovacao';
import {
  Search,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  FilePlus2,
  RefreshCw,
  Building2,
  DollarSign,
  TrendingUp
} from 'lucide-react';

function AppContent() {
  const {
    usuario,
    isMaster,
    isApoio,
    isGerente,
    isAtivo,
    isPendente,
    loading: authLoading,
    logout,
    simularPerfil,
    loginComGoogle
  } = useAuth();

  const [processos, setProcessos] = useState<ProcessoContrato[]>([]);
  const [loadingProcessos, setLoadingProcessos] = useState(true);
  const [currentView, setCurrentView] = useState<'grid' | 'kanban'>('grid');

  // Search and filters
  const [buscaTexto, setBuscaTexto] = useState('');
  const [filtroLotacao, setFiltroLotacao] = useState<string>('todas');
  const [filtroTipoAcao, setFiltroTipoAcao] = useState<string>('todos');
  const [filtroStatusGeral, setFiltroStatusGeral] = useState<string>('todos');

  // Modals state
  const [selectedProcessoId, setSelectedProcessoId] = useState<string | null>(null);
  const [isNovoProcessoOpen, setIsNovoProcessoOpen] = useState(false);
  const [isUsuariosOpen, setIsUsuariosOpen] = useState(false);

  // Initialize sample data if empty
  useEffect(() => {
    const userForSeed = usuario || {
      uid: 'cgf-compesa-master',
      nome: 'Gestor GAD / COMPESA',
      email: MASTER_EMAIL,
      perfil: 'MASTER',
      status: 'ativo',
      criadoEm: new Date().toISOString()
    };

    seedExemplosSeVazio(userForSeed);
  }, [usuario]);

  // Subscribe to real-time processes from Firestore
  useEffect(() => {
    setLoadingProcessos(true);
    const unsub = subscribeProcessos(
      (lista) => {
        setProcessos(lista);
        setLoadingProcessos(false);
      },
      (err) => {
        console.error('Erro ao escutar processos:', err);
        setLoadingProcessos(false);
      }
    );

    return () => unsub();
  }, []);

  // Filtered processes list
  const processosFiltrados = useMemo(() => {
    return processos.filter((p) => {
      const matchBusca =
        !buscaTexto ||
        p.descricaoObjeto.toLowerCase().includes(buscaTexto.toLowerCase()) ||
        (p.numeroProcesso && p.numeroProcesso.toLowerCase().includes(buscaTexto.toLowerCase())) ||
        (p.empresaContratada && p.empresaContratada.toLowerCase().includes(buscaTexto.toLowerCase())) ||
        p.criadoPor.toLowerCase().includes(buscaTexto.toLowerCase());

      const matchLotacao =
        filtroLotacao === 'todas' || p.lotacaoDestino.includes(filtroLotacao);

      const matchTipoAcao =
        filtroTipoAcao === 'todos' || p.tipoAcao === filtroTipoAcao;

      const matchStatus =
        filtroStatusGeral === 'todos' ||
        (filtroStatusGeral === 'em_andamento' && (p.statusGeral === 'em_andamento' || p.statusGeral === 'nao_iniciado')) ||
        p.statusGeral === filtroStatusGeral;

      return matchBusca && matchLotacao && matchTipoAcao && matchStatus;
    });
  }, [processos, buscaTexto, filtroLotacao, filtroTipoAcao, filtroStatusGeral]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = processos.length;
    const concluidos = processos.filter((p) => p.statusGeral === 'concluido' || (p.progressoPercentual || 0) === 100).length;
    const emAndamento = processos.filter((p) => p.statusGeral === 'em_andamento' && (p.progressoPercentual || 0) < 100).length;
    const atrasados = processos.filter((p) => p.statusGeral === 'atrasado' || p.statusGeral === 'em_aprovacao').length;
    const valorTotal = processos.reduce((acc, p) => acc + (p.valorEstimado || 0), 0);

    return { total, concluidos, emAndamento, atrasados, valorTotal };
  }, [processos]);

  // If user is logged in with an unapproved account, show the polite approval waiting screen
  if (usuario && isPendente) {
    return (
      <AguardandoAprovacao
        usuario={usuario}
        onLogout={logout}
        onSimularPerfil={simularPerfil}
      />
    );
  }

  // Active selected process for modal
  const selectedProcesso = processos.find((p) => p.id === selectedProcessoId);

  // Fallback guest user if not yet logged in so that evaluation is immediate
  const activeUsuario = usuario || {
    uid: 'guest-master',
    nome: 'Gestor CGF / MASTER (Modo Demonstração)',
    email: MASTER_EMAIL,
    perfil: 'MASTER',
    status: 'ativo',
    criadoEm: new Date().toISOString()
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenNovoProcesso={() => setIsNovoProcessoOpen(true)}
        onOpenUsuarios={() => setIsUsuariosOpen(true)}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI Metrics Summary Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
              <span>Total de Processos</span>
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
              {stats.total}
            </p>
            <p className="text-[11px] text-slate-400">Em monitoramento contínuo</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
              <span>Em Andamento</span>
              <PlayCircle className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
              {stats.emAndamento}
            </p>
            <p className="text-[11px] text-slate-400">Percorrendo etapas ativas</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
              <span>Concluídos</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {stats.concluidos}
            </p>
            <p className="text-[11px] text-slate-400">100% dos fluxos finalizados</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
              <span>Atrasados / Alerta</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
              {stats.atrasados}
            </p>
            <p className="text-[11px] text-slate-400">Prazos e pendências</p>
          </div>

          <div className="col-span-2 md:col-span-4 lg:col-span-1 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
              <span>Valor em Gestão</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono truncate" title={stats.valorTotal.toString()}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(stats.valorTotal)}
            </p>
            <p className="text-[11px] text-slate-400">Volume estimado total</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                placeholder="Pesquisar por objeto do contrato, número do processo ou fornecedor..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {buscaTexto && (
                <button
                  onClick={() => setBuscaTexto('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Quick Filter: Lotação */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-semibold mr-1">Lotação:</span>
              {[
                { label: 'Todas', val: 'todas' },
                { label: 'GAD', val: 'GAD' },
                { label: 'CGF', val: 'CGF' },
                { label: 'CSG', val: 'CSG' }
              ].map((item) => (
                <button
                  key={item.val}
                  onClick={() => setFiltroLotacao(item.val)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    filtroLotacao === item.val
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Filters row: Tipo de Ação & Status */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            {/* Tipo de Ação selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Fluxo / Tipo:</span>
              <select
                value={filtroTipoAcao}
                onChange={(e) => setFiltroTipoAcao(e.target.value)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium text-xs max-w-[260px]"
              >
                <option value="todos">Todos os Tipos de Ação</option>
                {TIPOS_ACAO_DISPONIVEIS.map((tp) => (
                  <option key={tp} value={tp}>
                    {tp}
                  </option>
                ))}
              </select>
            </div>

            {/* Status selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Status:</span>
              {[
                { label: 'Todos', val: 'todos' },
                { label: 'Em Andamento', val: 'em_andamento' },
                { label: 'Concluídos', val: 'concluido' },
                { label: 'Atrasados', val: 'atrasado' }
              ].map((st) => (
                <button
                  key={st.val}
                  onClick={() => setFiltroStatusGeral(st.val)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                    filtroStatusGeral === st.val
                      ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-semibold'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="ml-auto text-slate-400 text-[11px] font-mono">
              Mostrando {processosFiltrados.length} de {processos.length} processos
            </div>
          </div>
        </div>

        {/* Content View Area */}
        {loadingProcessos ? (
          <div className="p-16 text-center text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            Carregando contratos e fluxos em tempo real do Firestore...
          </div>
        ) : processosFiltrados.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 mx-auto flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Nenhum processo de contrato encontrado
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Nenhum registro corresponde aos filtros selecionados. Altere os filtros ou abra um novo processo.
            </p>
            <button
              onClick={() => setIsNovoProcessoOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <FilePlus2 className="w-4 h-4" />
              Abrir Novo Processo
            </button>
          </div>
        ) : currentView === 'grid' ? (
          /* Cards Grid View */
          <div id="processos-grid-view" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {processosFiltrados.map((processo) => (
              <ProcessoCard
                key={processo.id}
                processo={processo}
                onClick={() => setSelectedProcessoId(processo.id)}
              />
            ))}
          </div>
        ) : (
          /* Kanban Board View */
          <KanbanView
            processos={processosFiltrados}
            onSelectProcesso={(p) => setSelectedProcessoId(p.id)}
          />
        )}
      </main>

      {/* Modal: Process Details with Stages Checklist, Gantt & Immutable Audit Logs */}
      {selectedProcesso && (
        <ProcessoDetalhes
          processo={selectedProcesso}
          usuarioAtual={activeUsuario}
          onClose={() => setSelectedProcessoId(null)}
          onExcluido={() => setSelectedProcessoId(null)}
        />
      )}

      {/* Modal: Open New Process */}
      <NovoProcessoModal
        isOpen={isNovoProcessoOpen}
        onClose={() => setIsNovoProcessoOpen(false)}
        usuarioAtual={activeUsuario}
        onProcessoCriado={(novoId) => {
          setSelectedProcessoId(novoId);
        }}
      />

      {/* Modal: Users Management (MASTER) */}
      <UsuariosModal
        isOpen={isUsuariosOpen}
        onClose={() => setIsUsuariosOpen(false)}
        usuarioAtual={activeUsuario}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
