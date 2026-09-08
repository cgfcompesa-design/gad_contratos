import React, { useState, useEffect } from 'react';
import { Usuario, PerfilUsuario, StatusUsuario } from '../types';
import { subscribeUsuarios, atualizarUsuarioPerfil, formatarDataHora } from '../services/firestoreService';
import {
  Users,
  X,
  CheckCircle,
  Clock,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  Search,
  Filter
} from 'lucide-react';

interface UsuariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuarioAtual: Usuario;
}

export const UsuariosModal: React.FC<UsuariosModalProps> = ({ isOpen, onClose, usuarioAtual }) => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    const unsub = subscribeUsuarios((lista) => {
      setUsuarios(lista);
      setLoading(false);
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdatePerfil = async (
    targetUser: Usuario,
    novoPerfil: PerfilUsuario,
    novoStatus: StatusUsuario
  ) => {
    try {
      setUpdatingUid(targetUser.uid);
      await atualizarUsuarioPerfil({
        targetUid: targetUser.uid,
        targetEmail: targetUser.email,
        targetNome: targetUser.nome,
        novoPerfil,
        novoStatus,
        usuarioAtual
      });
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
      alert('Erro ao atualizar perfil do usuário.');
    } finally {
      setUpdatingUid(null);
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const matchBusca =
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase()) ||
      u.perfil.toLowerCase().includes(busca.toLowerCase());

    const matchStatus = filtroStatus === 'todos' || u.status === filtroStatus;

    return matchBusca && matchStatus;
  });

  const pendentesCount = usuarios.filter((u) => u.status === 'pendente').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="usuarios-gestao-modal"
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-scale-in"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Gestão de Usuários e Perfis de Acesso
                {pendentesCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-white animate-pulse">
                    {pendentesCount} {pendentesCount === 1 ? 'pendência' : 'pendências'}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aprovação de acessos com atribuição de papéis (MASTER, APOIO CONTRATOS, GERENTE)
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

        {/* Filters and search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs bg-white dark:bg-slate-900">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, email ou perfil..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Status:</span>
            {['todos', 'pendente', 'ativo', 'inativo'].map((st) => (
              <button
                key={st}
                onClick={() => setFiltroStatus(st)}
                className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                  filtroStatus === st
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {st === 'pendente' ? `Pendentes (${pendentesCount})` : st}
              </button>
            ))}
          </div>
        </div>

        {/* User List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Carregando lista de usuários do Firestore...
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Nenhum usuário encontrado com os filtros atuais.
            </div>
          ) : (
            usuariosFiltrados.map((u) => {
              const isMaster = u.perfil === 'MASTER' || u.email.toLowerCase() === 'cgf.compesa@gmail.com';
              const isPendente = u.status === 'pendente';
              const isUpdating = updatingUid === u.uid;

              return (
                <div
                  key={u.uid}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isPendente
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80 ring-1 ring-amber-400/40'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {/* User info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 shrink-0">
                      {u.fotoUrl ? (
                        <img src={u.fotoUrl} alt={u.nome} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        u.nome.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {u.nome}
                        </span>
                        {/* Perfil badge */}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            u.perfil === 'MASTER'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300'
                              : u.perfil === 'APOIO CONTRATOS'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300'
                              : u.perfil === 'GERENTE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                          }`}
                        >
                          {u.perfil}
                        </span>

                        {/* Status badge */}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-medium uppercase ${
                            u.status === 'ativo'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : u.status === 'pendente'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 font-bold'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                          }`}
                        >
                          {u.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{u.email}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        Cadastrado em: {formatarDataHora(u.criadoEm)}
                        {u.aprovadoPor && <span> • Liberado por {u.aprovadoPor}</span>}
                      </p>
                    </div>
                  </div>

                  {/* Role Assignment Actions */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {isMaster ? (
                      <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 px-3 py-1.5 bg-purple-50 dark:bg-purple-950/40 rounded-lg border border-purple-200 dark:border-purple-800">
                        Administrador MASTER Permanente
                      </span>
                    ) : (
                      <>
                        {isPendente ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleUpdatePerfil(u, 'APOIO CONTRATOS', 'ativo')}
                              disabled={isUpdating}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Aprovar: APOIO CONTRATOS
                            </button>
                            <button
                              onClick={() => handleUpdatePerfil(u, 'GERENTE', 'ativo')}
                              disabled={isUpdating}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              Aprovar: GERENTE
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs">
                            <select
                              value={u.perfil}
                              disabled={isUpdating}
                              onChange={(e) => handleUpdatePerfil(u, e.target.value as PerfilUsuario, u.status)}
                              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium text-xs"
                            >
                              <option value="APOIO CONTRATOS">APOIO CONTRATOS</option>
                              <option value="GERENTE">GERENTE</option>
                              <option value="PENDENTE">PENDENTE</option>
                            </select>

                            <button
                              onClick={() =>
                                handleUpdatePerfil(
                                  u,
                                  u.perfil,
                                  u.status === 'ativo' ? 'inativo' : 'ativo'
                                )
                              }
                              disabled={isUpdating}
                              className={`px-2 py-1.5 rounded-lg border font-medium text-xs transition-colors ${
                                u.status === 'ativo'
                                  ? 'text-rose-600 hover:bg-rose-50 border-rose-200 dark:border-rose-900'
                                  : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200 dark:border-emerald-900'
                              }`}
                            >
                              {u.status === 'ativo' ? 'Inativar' : 'Reativar'}
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
