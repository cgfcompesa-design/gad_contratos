import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  AlertCircle,
  FileText,
  Clock,
  BarChart3,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import { PerfilUsuario } from '../types';

export const LoginScreen: React.FC = () => {
  const { loginComGoogle, simularPerfil } = useAuth();
  const [carregandoGoogle, setCarregandoGoogle] = useState(false);
  const [erroLogin, setErroLogin] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setCarregandoGoogle(true);
      setErroLogin(null);
      await loginComGoogle();
    } catch (err: any) {
      console.error('Erro no login Google:', err);
      // If popup was blocked or iframe restriction
      setErroLogin(
        err?.message?.includes('popup')
          ? 'Janela de autenticação foi bloqueada pelo navegador. Permita pop-ups ou use o acesso rápido abaixo para testar.'
          : 'Não foi possível completar o login com Google no momento. Use as credenciais de teste abaixo.'
      );
    } finally {
      setCarregandoGoogle(false);
    }
  };

  const handleSimular = (perfil: PerfilUsuario) => {
    simularPerfil(perfil);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between text-slate-800 dark:text-slate-200">
      {/* Top institutional strip */}
      <div className="w-full bg-blue-900 text-white text-xs py-2 px-4 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold tracking-wide">
            <Building2 className="w-4 h-4 text-blue-300" />
            <span>COMPESA — Companhia Pernambucana de Saneamento</span>
          </div>
          <span className="text-blue-200 text-[11px] hidden sm:inline">
            Sistema Integrado de Gestão Administrativa
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero / Context (Visible on desktop) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-bold tracking-wide border border-blue-200 dark:border-blue-900">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>GAD • CGF • CSG</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Controle e Acompanhamento de Contratos
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Plataforma oficial da <strong>Gerência Administrativa e de Suporte</strong> para monitoramento visual de vigências, fluxos de licitações, reajustes retroativos e termos aditivos.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 dark:text-white">Contratos Vigentes</h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Base cadastral com status dinâmico de prazos</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 dark:text-white">Fluxos & Gantt</h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Linha do tempo com tempo decorrido por etapa</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 dark:text-white">Situação Atual</h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Cálculo automático da próxima etapa pendente</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 dark:text-white">Trilha de Auditoria</h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Registro imutável de quem fez e quando fez</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Login Card */}
          <div className="lg:col-span-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
              
              {/* Card Header */}
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-800 text-white flex items-center justify-center shadow-lg shadow-blue-800/25">
                  <Building2 className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Acesse sua conta institucional
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  A autenticação é realizada com sua conta Google corporativa. O acesso a rotas internas requer login ativo.
                </p>
              </div>

              {/* Error notice if any */}
              {erroLogin && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{erroLogin}</span>
                </div>
              )}

              {/* Main Google Login Button */}
              <div className="space-y-3">
                <button
                  id="btn-login-google"
                  onClick={handleGoogleLogin}
                  disabled={carregandoGoogle}
                  className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-bold text-sm shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
                >
                  {carregandoGoogle ? (
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>{carregandoGoogle ? 'Conectando ao Google...' : 'Entrar com Google'}</span>
                </button>

                <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
                  Primeiro acesso é registrado como <strong>PENDENTE</strong> até liberação por MASTER (cgf.compesa@gmail.com).
                </p>
              </div>

              {/* Fast Evaluation / Demonstration Mode Divider */}
              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="shrink mx-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 px-2">
                  Ambiente de Demonstração & Avaliação
                </span>
                <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              {/* Quick simulation buttons for evaluator convenience */}
              <div className="space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  Selecione um perfil pré-configurado para testar o sistema imediatamente:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    id="btn-login-demo-master"
                    onClick={() => handleSimular('MASTER')}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/70 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-900 dark:text-purple-200 text-xs font-semibold transition-all text-left"
                  >
                    <div>
                      <div className="font-extrabold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>MASTER</span>
                      </div>
                      <span className="text-[10px] text-purple-700 dark:text-purple-300 font-normal">
                        cgf.compesa@gmail.com
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  </button>

                  <button
                    id="btn-login-demo-apoio"
                    onClick={() => handleSimular('APOIO CONTRATOS')}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-900 dark:text-blue-200 text-xs font-semibold transition-all text-left"
                  >
                    <div>
                      <div className="font-extrabold flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>APOIO CONTRATOS</span>
                      </div>
                      <span className="text-[10px] text-blue-700 dark:text-blue-300 font-normal">
                        apoio.contratos@compesa.com.br
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  </button>

                  <button
                    id="btn-login-demo-gerente"
                    onClick={() => handleSimular('GERENTE')}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-900 dark:text-emerald-200 text-xs font-semibold transition-all text-left"
                  >
                    <div>
                      <div className="font-extrabold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>GERENTE</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-normal">
                        gerente.gad@compesa.com.br
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  </button>

                  <button
                    id="btn-login-demo-pendente"
                    onClick={() => handleSimular('PENDENTE')}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-900 dark:text-amber-200 text-xs font-semibold transition-all text-left"
                  >
                    <div>
                      <div className="font-extrabold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>PENDENTE</span>
                      </div>
                      <span className="text-[10px] text-amber-700 dark:text-amber-300 font-normal">
                        Aguardando aprovação
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>© {new Date().getFullYear()} COMPESA — Gerência Administrativa e de Suporte (GAD). Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};
