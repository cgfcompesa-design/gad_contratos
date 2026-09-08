import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FilePlus2,
  Users,
  LogOut,
  LogIn,
  ShieldCheck,
  Building2,
  LayoutGrid,
  Kanban,
  Sparkles,
  ChevronDown,
  FileText,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { PerfilUsuario } from '../types';

interface HeaderProps {
  currentTab: 'contratos_vigentes' | 'processos';
  onTabChange: (tab: 'contratos_vigentes' | 'processos') => void;
  currentProcessView: 'grid' | 'kanban';
  onProcessViewChange: (view: 'grid' | 'kanban') => void;
  onOpenNovoProcesso: () => void;
  onOpenUsuarios: () => void;
  contratosCount: number;
  processosCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  currentProcessView,
  onProcessViewChange,
  onOpenNovoProcesso,
  onOpenUsuarios,
  contratosCount,
  processosCount
}) => {
  const {
    usuario,
    isMaster,
    isApoio,
    isAtivo,
    logout,
    simularPerfil,
    modoSimulado,
    restaurarUsuarioReal
  } = useAuth();

  const [isDemoDropdownOpen, setIsDemoDropdownOpen] = useState(false);

  const getPerfilBadge = (perfil?: string) => {
    switch (perfil) {
      case 'MASTER':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300';
      case 'APOIO CONTRATOS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300';
      case 'GERENTE':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300';
      default:
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Logo & Main Tabs */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-700 to-blue-900 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                    Controle de Contratos GAD
                  </h1>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    COMPESA
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Gerência Administrativa e de Suporte • CGF • CSG
                </p>
              </div>
            </div>

            {/* Primary Navigation Tabs (Contratos Vigentes vs Processos) */}
            <nav className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                id="tab-contratos-vigentes"
                onClick={() => onTabChange('contratos_vigentes')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  currentTab === 'contratos_vigentes'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Contratos Vigentes</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono">
                  {contratosCount}
                </span>
              </button>

              <button
                id="tab-processos"
                onClick={() => onTabChange('processos')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  currentTab === 'processos'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Processos & Fluxos</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono">
                  {processosCount}
                </span>
              </button>
            </nav>
          </div>

          {/* Right Action and User Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            
            {/* View Switcher (Grid vs Kanban) - Only active when in 'processos' tab */}
            {currentTab === 'processos' && (
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  onClick={() => onProcessViewChange('grid')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    currentProcessView === 'grid'
                      ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Painel</span>
                </button>
                <button
                  onClick={() => onProcessViewChange('kanban')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    currentProcessView === 'kanban'
                      ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Kanban className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kanban</span>
                </button>
              </div>
            )}

            {/* Novo Processo button (for active users) */}
            {isAtivo && (
              <button
                id="btn-header-novo-processo"
                onClick={onOpenNovoProcesso}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
              >
                <FilePlus2 className="w-4 h-4" />
                <span>Novo Processo</span>
              </button>
            )}

            {/* Gestão de Usuários button (for MASTER) */}
            {isMaster && (
              <button
                id="btn-header-usuarios-perfis"
                onClick={onOpenUsuarios}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800 shadow-xs transition-colors cursor-pointer"
                title="Gerenciar usuários e permissões de acesso"
              >
                <Users className="w-4 h-4 text-purple-600" />
                <span className="hidden sm:inline">Usuários</span>
              </button>
            )}

            {/* Demo Role Switcher Dropdown */}
            <div className="relative">
              <button
                id="btn-header-perfil-demo"
                onClick={() => setIsDemoDropdownOpen(!isDemoDropdownOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                title="Testar diferentes perfis de usuário"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline">Perfil Demo</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {isDemoDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 text-xs z-50 animate-scale-in">
                  <span className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Alternar Perfil em Teste:
                  </span>
                  <button
                    onClick={() => {
                      simularPerfil('MASTER');
                      setIsDemoDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-semibold flex items-center justify-between cursor-pointer"
                  >
                    <span>MASTER (Total)</span>
                    <span className="text-[10px] bg-purple-100 dark:bg-purple-900 px-1.5 py-0.5 rounded font-mono">cgf.compesa</span>
                  </button>
                  <button
                    onClick={() => {
                      simularPerfil('APOIO CONTRATOS');
                      setIsDemoDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold cursor-pointer"
                  >
                    APOIO CONTRATOS
                  </button>
                  <button
                    onClick={() => {
                      simularPerfil('GERENTE');
                      setIsDemoDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold cursor-pointer"
                  >
                    GERENTE
                  </button>
                  <button
                    onClick={() => {
                      simularPerfil('PENDENTE');
                      setIsDemoDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-semibold cursor-pointer"
                  >
                    PENDENTE (Aguardando)
                  </button>

                  {modoSimulado && (
                    <div className="pt-1.5 mt-1.5 border-t border-slate-100 dark:border-slate-700">
                      <button
                        onClick={() => {
                          restaurarUsuarioReal();
                          setIsDemoDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 text-[11px] cursor-pointer"
                      >
                        Restaurar Usuário Google Real
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Current user badge & auth status */}
            {usuario ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                <div className="text-right hidden sm:block">
                  <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                    {usuario.nome}
                  </span>
                  <span className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${getPerfilBadge(usuario.perfil)}`}>
                    {usuario.perfil}
                  </span>
                </div>

                <div
                  className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs ring-2 ring-blue-500/20"
                  title={`${usuario.nome} (${usuario.email}) - Perfil: ${usuario.perfil}`}
                >
                  {usuario.fotoUrl ? (
                    <img src={usuario.fotoUrl} alt={usuario.nome} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    usuario.nome.charAt(0).toUpperCase()
                  )}
                </div>

                <button
                  id="btn-header-logout"
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                  title="Sair do sistema"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>

        </div>
      </div>
    </header>
  );
};
