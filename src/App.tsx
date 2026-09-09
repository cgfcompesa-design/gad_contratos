/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth, MASTER_EMAIL } from './context/AuthContext';
import {
  ProcessoContrato,
  ContratoVigente,
  LotacaoDestino,
  TipoAcao,
  Usuario,
  GestorResponsavel,
  EmpresaContratada
} from './types';
import { TIPOS_ACAO_DISPONIVEIS } from './data/flowTemplates';
import {
  subscribeProcessos,
  subscribeContratosVigentes,
  subscribeGestores,
  subscribeEmpresasContratadas,
  seedExemplosSeVazio,
  excluirContratoVigente
} from './services/firestoreService';
import { Header, MainTabType } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { ContratosVigentesView } from './components/ContratosVigentesView';
import { FichaContratoModal } from './components/FichaContratoModal';
import { EditarContratoModal } from './components/EditarContratoModal';
import { ExcluirContratoModal } from './components/ExcluirContratoModal';
import { ProcessoCard } from './components/ProcessoCard';
import { KanbanView } from './components/KanbanView';
import { ProcessoDetalhes } from './components/ProcessoDetalhes';
import { NovoProcessoModal } from './components/NovoProcessoModal';
import { UsuariosModal } from './components/UsuariosModal';
import { AguardandoAprovacao } from './components/AguardandoAprovacao';
import { GestoresView } from './components/GestoresView';
import { EmpresasView } from './components/EmpresasView';
import { CompesaLogo } from './components/CompesaLogo';
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
  TrendingUp,
  Layers,
  FileText
} from 'lucide-react';

function MainDashboard({ usuario }: { usuario: Usuario }) {
  // Navigation tabs: 'contratos_vigentes', 'processos', 'gestores', 'empresas'
  const [currentTab, setCurrentTab] = useState<MainTabType>('contratos_vigentes');
  const [currentProcessView, setCurrentProcessView] = useState<'grid' | 'kanban'>('grid');

  // Real-time collections
  const [contratos, setContratos] = useState<ContratoVigente[]>([]);
  const [processos, setProcessos] = useState<ProcessoContrato[]>([]);
  const [gestores, setGestores] = useState<GestorResponsavel[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaContratada[]>([]);
  const [loadingDados, setLoadingDados] = useState(true);

  // Search & filters for Processos tab
  const [buscaTexto, setBuscaTexto] = useState('');
  const [filtroLotacao, setFiltroLotacao] = useState<string>('todas');
  const [filtroTipoAcao, setFiltroTipoAcao] = useState<string>('todos');
  const [filtroStatusGeral, setFiltroStatusGeral] = useState<string>('todos');

  // Modals state
  const [contratoParaFicha, setContratoParaFicha] = useState<ContratoVigente | null>(null);
  const [contratoParaNovoProcesso, setContratoParaNovoProcesso] = useState<ContratoVigente | null>(null);
  const [contratoParaEditar, setContratoParaEditar] = useState<ContratoVigente | null>(null);
  const [contratoParaExcluir, setContratoParaExcluir] = useState<ContratoVigente | null>(null);
  const [excluindoContrato, setExcluindoContrato] = useState(false);
  const [selectedProcessoId, setSelectedProcessoId] = useState<string | null>(null);
  const [isNovoProcessoOpen, setIsNovoProcessoOpen] = useState(false);
  const [isUsuariosOpen, setIsUsuariosOpen] = useState(false);

  const handleConfirmarExcluirContrato = async () => {
    if (!contratoParaExcluir) return;
    try {
      setExcluindoContrato(true);
      await excluirContratoVigente(
        contratoParaExcluir.id,
        contratoParaExcluir.numeroContrato,
        usuario
      );
      setContratoParaExcluir(null);
    } catch (err) {
      console.error('Erro ao excluir contrato:', err);
    } finally {
      setExcluindoContrato(false);
    }
  };

  const activeUsuario = usuario;

  // Initialize sample data if empty
  useEffect(() => {
    seedExemplosSeVazio(activeUsuario);
  }, [activeUsuario]);

  // Subscribe to real-time Contratos Vigentes, Processos, Gestores e Empresas
  useEffect(() => {
    const unsubContratos = subscribeContratosVigentes(
      (lista) => {
        setContratos(lista);
      },
      (err) => {
        console.error('Erro ao carregar contratos vigentes:', err);
      }
    );

    const unsubProcessos = subscribeProcessos(
      (lista) => {
        setProcessos(lista);
        setLoadingDados(false);
      },
      (err) => {
        console.error('Erro ao carregar processos:', err);
        setLoadingDados(false);
      }
    );

    const unsubGestores = subscribeGestores(
      (lista) => {
        setGestores(lista);
      },
      (err) => {
        console.error('Erro ao carregar gestores:', err);
      }
    );

    const unsubEmpresas = subscribeEmpresasContratadas(
      (lista) => {
        setEmpresas(lista);
      },
      (err) => {
        console.error('Erro ao carregar empresas contratadas:', err);
      }
    );

    return () => {
      unsubContratos();
      unsubProcessos();
      unsubGestores();
      unsubEmpresas();
    };
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

  // Statistics calculation for Processos
  const stats = useMemo(() => {
    const total = processos.length;
    const concluidos = processos.filter(
      (p) => p.statusGeral === 'concluido' || (p.progressoPercentual || 0) === 100
    ).length;
    const emAndamento = processos.filter(
      (p) => p.statusGeral === 'em_andamento' && (p.progressoPercentual || 0) < 100
    ).length;
    const atrasados = processos.filter(
      (p) => p.statusGeral === 'atrasado' || p.statusGeral === 'em_aprovacao'
    ).length;
    const valorTotal = processos.reduce((acc, p) => acc + (p.valorEstimado || 0), 0);

    return { total, concluidos, emAndamento, atrasados, valorTotal };
  }, [processos]);

  // Selected process for modal
  const selectedProcesso = processos.find((p) => p.id === selectedProcessoId);

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        currentProcessView={currentProcessView}
        onProcessViewChange={setCurrentProcessView}
        onOpenNovoProcesso={() => {
          setContratoParaNovoProcesso(null);
          setIsNovoProcessoOpen(true);
        }}
        onOpenUsuarios={() => setIsUsuariosOpen(true)}
        contratosCount={contratos.length}
        processosCount={processos.length}
        gestoresCount={gestores.length}
        empresasCount={empresas.length}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* TAB 1: CONTRATOS VIGENTES (From spreadsheet PRAZO) */}
        {currentTab === 'contratos_vigentes' && (
          <ContratosVigentesView
            contratos={contratos}
            processos={processos}
            usuarioAtual={activeUsuario}
            gestores={gestores}
            empresas={empresas}
            onSelecionarContrato={(contrato) => setContratoParaFicha(contrato)}
            onAbrirProcessoNesteContrato={(contrato) => {
              setContratoParaNovoProcesso(contrato);
              setIsNovoProcessoOpen(true);
            }}
            onNovoContratoLicitacao={() => {
              setContratoParaNovoProcesso(null);
              setIsNovoProcessoOpen(true);
            }}
            onEditarContrato={(contrato) => setContratoParaEditar(contrato)}
            onExcluirContrato={(contrato) => setContratoParaExcluir(contrato)}
            onNavegarParaGestores={() => setCurrentTab('gestores')}
            onNavegarParaEmpresas={() => setCurrentTab('empresas')}
          />
        )}

        {/* TAB 2: PROCESSOS & FLUXOS (Kanban, Grid, Timeline) */}
        {currentTab === 'processos' && (
          <div className="space-y-6">
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
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono truncate">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    maximumFractionDigits: 0
                  }).format(stats.valorTotal)}
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
                    placeholder="Pesquisar processo por objeto, número, fornecedor ou autor..."
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
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                        filtroLotacao === item.val
                          ? 'bg-blue-700 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secondary Filters row */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
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
                      className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
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
            {loadingDados ? (
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  <FilePlus2 className="w-4 h-4" />
                  Abrir Novo Processo
                </button>
              </div>
            ) : currentProcessView === 'grid' ? (
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
          </div>
        )}

        {/* TAB 3: GESTORES RESPONSÁVEIS */}
        {currentTab === 'gestores' && (
          <GestoresView
            gestores={gestores}
            usuarioAtual={activeUsuario}
            onVoltarParaContratos={() => setCurrentTab('contratos_vigentes')}
          />
        )}

        {/* TAB 4: EMPRESAS CONTRATADAS */}
        {currentTab === 'empresas' && (
          <EmpresasView
            empresas={empresas}
            usuarioAtual={activeUsuario}
            onVoltarParaContratos={() => setCurrentTab('contratos_vigentes')}
          />
        )}

      </main>

      {/* Modal: Ficha Cadastral do Contrato Vigente */}
      {contratoParaFicha && (
        <FichaContratoModal
          contrato={contratoParaFicha}
          processos={processos}
          usuarioAtual={activeUsuario}
          onClose={() => setContratoParaFicha(null)}
          onAbrirProcessoNesteContrato={(c) => {
            setContratoParaFicha(null);
            setContratoParaNovoProcesso(c);
            setIsNovoProcessoOpen(true);
          }}
          onVerProcessoDetalhes={(p) => {
            setContratoParaFicha(null);
            setSelectedProcessoId(p.id);
          }}
          onEditarContrato={(c) => {
            setContratoParaFicha(null);
            setContratoParaEditar(c);
          }}
          onExcluirContrato={(c) => {
            setContratoParaFicha(null);
            setContratoParaExcluir(c);
          }}
        />
      )}

      {/* Modal: Editar Contrato Vigente */}
      <EditarContratoModal
        isOpen={!!contratoParaEditar}
        contrato={contratoParaEditar}
        usuarioAtual={activeUsuario}
        gestores={gestores}
        empresas={empresas}
        onClose={() => setContratoParaEditar(null)}
        onSalvo={() => setContratoParaEditar(null)}
        onNavegarParaGestores={() => {
          setContratoParaEditar(null);
          setCurrentTab('gestores');
        }}
        onNavegarParaEmpresas={() => {
          setContratoParaEditar(null);
          setCurrentTab('empresas');
        }}
      />

      {/* Modal: Excluir Contrato Vigente */}
      <ExcluirContratoModal
        isOpen={!!contratoParaExcluir}
        contrato={contratoParaExcluir}
        excluindo={excluindoContrato}
        onClose={() => setContratoParaExcluir(null)}
        onConfirmar={handleConfirmarExcluirContrato}
      />

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
        onClose={() => {
          setIsNovoProcessoOpen(false);
          setContratoParaNovoProcesso(null);
        }}
        usuarioAtual={activeUsuario}
        contratosDisponiveis={contratos}
        contratoPreSelecionado={contratoParaNovoProcesso}
        onProcessoCriado={(novoId) => {
          setSelectedProcessoId(novoId);
          setCurrentTab('processos');
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

function AppContent() {
  const {
    usuario,
    isPendente,
    loading: authLoading,
    logout,
    simularPerfil
  } = useAuth();

  // 1. First screen rule: Login screen if not authenticated
  if (authLoading && !usuario) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="mb-4">
          <CompesaLogo size="lg" variant="symbol" />
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 animate-pulse">
          Carregando Sistema de Controle de Contratos GAD...
        </p>
      </div>
    );
  }

  if (!usuario) {
    return <LoginScreen />;
  }

  // 2. Pending authorization rule
  if (isPendente) {
    return (
      <AguardandoAprovacao
        usuario={usuario}
        onLogout={logout}
        onSimularPerfil={simularPerfil}
      />
    );
  }

  return <MainDashboard usuario={usuario} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
