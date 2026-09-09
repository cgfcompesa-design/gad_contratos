import React from 'react';
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
  FileText,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { PerfilUsuario } from '../types';
import { CompesaLogo } from './CompesaLogo';

export type MainTabType = 'contratos_vigentes' | 'processos' | 'gestores' | 'empresas';

interface HeaderProps {
  currentTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  currentProcessView: 'grid' | 'kanban';
  onProcessViewChange: (view: 'grid' | 'kanban') => void;
  onOpenNovoProcesso: () => void;
  onOpenUsuarios: () => void;
  contratosCount: number;
  processosCount: number;
  gestoresCount?: number;
  empresasCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  currentProcessView,
  onProcessViewChange,
  onOpenNovoProcesso,
  onOpenUsuarios,
  contratosCount,
  processosCount,
  gestoresCount = 0,
  empresasCount = 0
}) => {
  const {
    usuario,
    isMaster,
    isApoio,
    isAtivo,
    logout
  } = useAuth();

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
              <div className="p-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs shrink-0 flex items-center justify-center">
                <CompesaLogo size="sm" variant="symbol" />
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

            {/* Primary Navigation Tabs */}
            <nav className="flex flex-wrap items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold gap-0.5">
              <button
                id="tab-contratos-vigentes"
                onClick={() => onTabChange('contratos_vigentes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
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

              <button
                id="tab-gestores"
                onClick={() => onTabChange('gestores')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  currentTab === 'gestores'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Gestores</span>
                {gestoresCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                    {gestoresCount}
                  </span>
                )}
              </button>

              <button
                id="tab-empresas"
                onClick={() => onTabChange('empresas')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  currentTab === 'empresas'
                    ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs ring-1 ring-slate-200 dark:ring-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Empresas</span>
                {empresasCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                    {empresasCount}
                  </span>
                )}
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
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    await logout();
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/80 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 hover:text-rose-800 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                  title="Sair do Sistema"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span className="hidden sm:inline">Sair do Sistema</span>
                  <span className="sm:hidden">Sair</span>
                </button>
              </div>
            ) : null}
          </div>

        </div>
      </div>
    </header>
  );
};
