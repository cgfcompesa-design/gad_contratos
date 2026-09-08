import React from 'react';
import { Usuario } from '../types';
import { Clock, ShieldAlert, LogOut, RefreshCw, Sparkles, Building2 } from 'lucide-react';
import { MASTER_EMAIL } from '../context/AuthContext';

interface AguardandoAprovacaoProps {
  usuario: Usuario;
  onLogout: () => void;
  onSimularPerfil?: (perfil: any) => void;
}

export const AguardandoAprovacao: React.FC<AguardandoAprovacaoProps> = ({
  usuario,
  onLogout,
  onSimularPerfil
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 text-center space-y-5 animate-scale-in">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center ring-8 ring-amber-50 dark:ring-amber-950/30">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
            Aguardando Liberação
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Conta em Análise de Acesso
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sistema de Controle de Contratos da Gerência Administrativa e de Suporte (GAD)
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-left space-y-2">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
            <span className="text-slate-500">Usuário Conectado:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{usuario.nome}</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
            <span className="text-slate-500">E-mail Google:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">{usuario.email}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Perfil Inicial:</span>
            <span className="font-semibold text-amber-600">Pendente de Atribuição</span>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Sua solicitação de acesso foi registrada com sucesso. O administrador <strong>MASTER</strong> ({MASTER_EMAIL}) deve definir o seu perfil (<strong>APOIO CONTRATOS</strong> ou <strong>GERENTE</strong>) antes de liberar as funcionalidades de gestão contratual.
        </p>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Verificar se Já Foi Liberado
          </button>

          <button
            onClick={onLogout}
            className="w-full py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair da Conta
          </button>
        </div>

        {/* Demo fast switch for previewing */}
        {onSimularPerfil && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-left">
            <span className="text-[11px] font-semibold text-slate-500 block mb-2 text-center">
              Ambiente de Demonstração / Avaliação:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onSimularPerfil('MASTER')}
                className="p-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 text-center font-semibold text-[11px]"
              >
                Alternar para MASTER
              </button>
              <button
                onClick={() => onSimularPerfil('APOIO CONTRATOS')}
                className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 text-center font-semibold text-[11px]"
              >
                Alternar para APOIO
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
