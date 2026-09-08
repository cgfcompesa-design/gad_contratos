import React, { useState } from 'react';
import { useAuth, MASTER_EMAIL } from '../context/AuthContext';
import {
  ShieldCheck,
  AlertCircle,
  FileText,
  Clock,
  BarChart3,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { CompesaLogo } from './CompesaLogo';

export const LoginScreen: React.FC = () => {
  const { loginComGoogle, simularPerfil } = useAuth();
  const [carregandoGoogle, setCarregandoGoogle] = useState(false);
  const [erroLogin, setErroLogin] = useState<string | null>(null);
  const [erroUnauthorizedDomain, setErroUnauthorizedDomain] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [mostrarAjudaDominio, setMostrarAjudaDominio] = useState(false);
  const [emailCustom, setEmailCustom] = useState('');

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleGoogleLogin = async () => {
    try {
      setCarregandoGoogle(true);
      setErroLogin(null);
      setErroUnauthorizedDomain(false);
      await loginComGoogle();
    } catch (err: any) {
      console.error('Erro no login Google:', err);
      const isUnauthorizedDomain =
        err?.code === 'auth/unauthorized-domain' ||
        err?.message?.includes('unauthorized-domain');

      if (isUnauthorizedDomain) {
        setErroUnauthorizedDomain(true);
        setErroLogin('Este domínio ainda não foi adicionado aos Domínios Autorizados do Firebase.');
      } else if (err?.message?.includes('popup') || err?.code === 'auth/popup-blocked') {
        setErroLogin('Janela de autenticação foi bloqueada pelo navegador. Permita pop-ups para continuar.');
      } else {
        setErroLogin('Não foi possível autenticar com o Google no momento. Verifique sua conexão.');
      }
    } finally {
      setCarregandoGoogle(false);
    }
  };

  const handleCopiarDominio = () => {
    if (currentHostname) {
      navigator.clipboard.writeText(currentHostname);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  const handleEntrarProvisorio = (email?: string) => {
    const emailFinal = (email || MASTER_EMAIL).trim().toLowerCase();
    const isMaster = emailFinal === MASTER_EMAIL.toLowerCase();
    simularPerfil(isMaster ? 'MASTER' : 'APOIO CONTRATOS', emailFinal);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between text-slate-800 dark:text-slate-200">
      {/* Top institutional strip */}
      <div className="w-full bg-[#0a3d7a] text-white text-xs py-2.5 px-4 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-semibold tracking-wide">
            <CompesaLogo size="xs" variant="symbol" />
            <span>COMPESA — Companhia Pernambucana de Saneamento</span>
          </div>
          <span className="text-blue-100 text-[11px] hidden sm:inline font-medium">
            Sistema Integrado de Gestão Administrativa
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero / Context (Visible on desktop) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CompesaLogo size="lg" variant="full" />
              </div>
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
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-white dark:bg-slate-800 p-2 flex items-center justify-center shadow-md border border-slate-100 dark:border-slate-700">
                  <CompesaLogo size="md" variant="symbol" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Acesso Institucional COMPESA
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                    Entre com sua conta Google corporativa para acessar o painel de contratos e fluxos da GAD.
                  </p>
                </div>
              </div>

              {/* Error notice if any */}
              {erroLogin && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{erroLogin}</span>
                </div>
              )}

              {/* Main Google Login Button */}
              <div className="space-y-3 pt-2">
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
                  <span>{carregandoGoogle ? 'Conectando ao Google...' : 'Entrar com Conta Google'}</span>
                </button>

                <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
                  O primeiro acesso é cadastrado como <strong>PENDENTE</strong> e aguarda aprovação pelo gestor MASTER.
                </p>
              </div>

              {/* Specialized guidance card when auth/unauthorized-domain occurs or user requests it */}
              {(erroUnauthorizedDomain || mostrarAjudaDominio) && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-slate-800 dark:text-slate-200 text-xs space-y-3.5 animate-scale-in">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                        Domínio não autorizado no Firebase Auth
                      </h4>
                      <p className="text-[12px] text-amber-800 dark:text-amber-300 leading-relaxed">
                        O projeto Firebase recém-criado (<strong>gadcontratos</strong>) exige que o domínio desta aplicação seja cadastrado na lista de <strong>Domínios autorizados</strong> para permitir o pop-up do Google.
                      </p>
                    </div>
                  </div>

                  {/* Current Hostname to copy */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Domínio atual para autorizar:
                    </label>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900">
                      <code className="text-xs font-mono font-bold text-blue-700 dark:text-blue-300 truncate select-all flex-1">
                        {currentHostname}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopiarDominio}
                        className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                      >
                        {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiado ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>

                  {/* Direct link & steps */}
                  <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-amber-200/70 dark:border-amber-900/70 space-y-2 text-[11px]">
                    <p className="font-bold text-slate-700 dark:text-slate-300">Como autorizar no Firebase Console (30 segundos):</p>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400">
                      <li>
                        Acesse as <a
                          href="https://console.firebase.google.com/project/gadcontratos/authentication/settings"
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 dark:text-blue-400 underline font-semibold inline-flex items-center gap-0.5"
                        >
                          Configurações de Auth do Firebase <ExternalLink className="w-3 h-3" />
                        </a>
                      </li>
                      <li>Na seção <strong>Domínios autorizados</strong>, clique em <strong>Adicionar domínio</strong></li>
                      <li>Cole o domínio copiado acima e clique em <strong>Salvar</strong></li>
                    </ol>
                  </div>

                  {/* Instant bypass button while configuring */}
                  <div className="pt-2 border-t border-amber-200 dark:border-amber-800 space-y-2">
                    <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Acesso imediato de contingência (sem bloqueio):
                    </p>
                    <button
                      type="button"
                      id="btn-login-provisorio-master"
                      onClick={() => handleEntrarProvisorio(MASTER_EMAIL)}
                      className="w-full py-2.5 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-blue-200" />
                      <span>Entrar Imediatamente como MASTER ({MASTER_EMAIL})</span>
                    </button>

                    <div className="flex gap-1.5 pt-1">
                      <input
                        type="email"
                        value={emailCustom}
                        onChange={(e) => setEmailCustom(e.target.value)}
                        placeholder="Ou digite outro e-mail institucional..."
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                      />
                      <button
                        type="button"
                        disabled={!emailCustom.trim()}
                        onClick={() => handleEntrarProvisorio(emailCustom)}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-bold disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        Entrar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!erroUnauthorizedDomain && !mostrarAjudaDominio && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setMostrarAjudaDominio(true)}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Problemas com autorização de domínio ou login? Clique aqui</span>
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>© {new Date().getFullYear()} COMPESA — Companhia Pernambucana de Saneamento • GAD</p>
      </footer>
    </div>
  );
};
