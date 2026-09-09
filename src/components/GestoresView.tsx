import React, { useState } from 'react';
import { GestorResponsavel, Usuario } from '../types';
import {
  criarGestor,
  atualizarGestor,
  excluirGestor
} from '../services/firestoreService';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Mail,
  Building,
  Briefcase,
  Hash,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldAlert
} from 'lucide-react';

interface GestoresViewProps {
  gestores?: GestorResponsavel[];
  usuarioAtual: Usuario;
  onVoltarParaContratos?: () => void;
}

export const GestoresView: React.FC<GestoresViewProps> = ({
  gestores = [],
  usuarioAtual,
  onVoltarParaContratos
}) => {
  const isMasterOuApoio = usuarioAtual.perfil === 'MASTER' || usuarioAtual.perfil === 'APOIO CONTRATOS';

  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [gestorEmEdicao, setGestorEmEdicao] = useState<GestorResponsavel | null>(null);
  const [gestorParaExcluir, setGestorParaExcluir] = useState<GestorResponsavel | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    matricula: '',
    lotacao: 'GAD — Gerência Administrativa e de Suporte',
    cargo: '',
    telefone: ''
  });

  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const listaGestores = Array.isArray(gestores) ? gestores : [];
  const gestoresFiltrados = listaGestores.filter((g) => {
    if (!busca.trim()) return true;
    const termo = busca.toLowerCase();
    return (
      g.nome.toLowerCase().includes(termo) ||
      (g.matricula && g.matricula.toLowerCase().includes(termo)) ||
      (g.lotacao && g.lotacao.toLowerCase().includes(termo)) ||
      (g.cargo && g.cargo.toLowerCase().includes(termo)) ||
      (g.email && g.email.toLowerCase().includes(termo))
    );
  });

  const abrirModalNovo = () => {
    setGestorEmEdicao(null);
    setFormData({
      nome: '',
      email: '',
      matricula: '',
      lotacao: 'GAD — Gerência Administrativa e de Suporte',
      cargo: '',
      telefone: ''
    });
    setErro(null);
    setModalAberto(true);
  };

  const abrirModalEditar = (g: GestorResponsavel) => {
    setGestorEmEdicao(g);
    setFormData({
      nome: g.nome,
      email: g.email || '',
      matricula: g.matricula || '',
      lotacao: g.lotacao || 'GAD — Gerência Administrativa e de Suporte',
      cargo: g.cargo || '',
      telefone: g.telefone || ''
    });
    setErro(null);
    setModalAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      setErro('Informe o nome do Gestor Responsável.');
      return;
    }

    try {
      setSalvando(true);
      setErro(null);

      if (gestorEmEdicao) {
        await atualizarGestor(
          gestorEmEdicao.id,
          {
            nome: formData.nome.trim(),
            email: formData.email.trim(),
            matricula: formData.matricula.trim(),
            lotacao: formData.lotacao.trim(),
            cargo: formData.cargo.trim(),
            telefone: formData.telefone.trim()
          },
          usuarioAtual
        );
      } else {
        await criarGestor(
          {
            nome: formData.nome.trim(),
            email: formData.email.trim(),
            matricula: formData.matricula.trim(),
            lotacao: formData.lotacao.trim(),
            cargo: formData.cargo.trim(),
            telefone: formData.telefone.trim(),
            ativo: true
          },
          usuarioAtual
        );
      }

      setFormData({
        nome: '',
        email: '',
        matricula: '',
        lotacao: 'GAD — Gerência Administrativa e de Suporte',
        cargo: '',
        telefone: ''
      });
      setGestorEmEdicao(null);
      setModalAberto(false);
    } catch (err: any) {
      console.error('Erro ao salvar gestor:', err);
      setErro(err?.message || 'Erro ao salvar gestor.');
    } finally {
      setSalvando(false);
    }
  };

  const handleConfirmarExclusao = async () => {
    if (!gestorParaExcluir) return;

    try {
      setExcluindo(true);
      await excluirGestor(gestorParaExcluir.id, gestorParaExcluir.nome, usuarioAtual);
      setGestorParaExcluir(null);
    } catch (err: any) {
      console.error('Erro ao excluir gestor:', err);
      alert('Erro ao excluir gestor: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Gestores Responsáveis GAD
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cadastro centralizado de gestores para vinculação nos contratos vigentes e processos
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {onVoltarParaContratos && (
            <button
              onClick={onVoltarParaContratos}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Voltar aos Contratos
            </button>
          )}

          {isMasterOuApoio && (
            <button
              id="btn-novo-gestor"
              onClick={abrirModalNovo}
              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer ml-auto md:ml-0"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Gestor</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar & Total */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, lotação, cargo..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Total: <strong className="text-slate-800 dark:text-slate-200">{gestoresFiltrados.length}</strong> gestor(es) cadastrado(s)
        </span>
      </div>

      {/* Grid of Gestores */}
      {gestoresFiltrados.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
          <Users className="w-12 h-12 mx-auto text-slate-400 opacity-40" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Nenhum gestor encontrado
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {busca
              ? 'Nenhum resultado corresponde aos termos da pesquisa.'
              : 'Nenhum gestor cadastrado ainda. Clique em "Novo Gestor" para iniciar o cadastro.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gestoresFiltrados.map((g) => (
            <div
              key={g.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center font-bold text-blue-700 dark:text-blue-300 text-sm">
                      {g.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {g.nome}
                      </h4>
                      {g.cargo && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {g.cargo}
                        </p>
                      )}
                    </div>
                  </div>

                  {isMasterOuApoio && (
                    <div className="flex items-center gap-1">
                      <button
                        title="Editar gestor"
                        onClick={() => abrirModalEditar(g)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Excluir gestor"
                        onClick={() => setGestorParaExcluir(g)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  {g.lotacao && (
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{g.lotacao}</span>
                    </div>
                  )}
                  {g.matricula && (
                    <div className="flex items-center gap-2">
                      <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-[11px]">Matrícula: {g.matricula}</span>
                    </div>
                  )}
                  {g.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{g.email}</span>
                    </div>
                  )}
                  {g.telefone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{g.telefone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Criar / Editar Gestor */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 my-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {gestorEmEdicao ? 'Editar Gestor Responsável' : 'Cadastrar Novo Gestor Responsável'}
              </h3>
              <button
                onClick={() => setModalAberto(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {erro && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            <form onSubmit={handleSalvar} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  required
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Gildson Barbalho dos Anjos"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Lotação / Gerência
                </label>
                <select
                  value={formData.lotacao}
                  onChange={(e) => setFormData({ ...formData, lotacao: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="GAD — Gerência Administrativa e de Suporte">
                    GAD — Gerência Administrativa e de Suporte
                  </option>
                  <option value="CGF — Coordenação de Gestão de Frotas">
                    CGF — Coordenação de Gestão de Frotas
                  </option>
                  <option value="CSG — Coordenação de Serviços Gerais">
                    CSG — Coordenação de Serviços Gerais
                  </option>
                  <option value="Outra Unidade Compesa">Outra Unidade Compesa</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cargo / Função
                  </label>
                  <input
                    type="text"
                    value={formData.cargo}
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    placeholder="Ex: Gestor de Contratos"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Matrícula
                  </label>
                  <input
                    type="text"
                    value={formData.matricula}
                    onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                    placeholder="Ex: 14258"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail Institucional
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nome@compesa.com.br"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone / Ramal
                  </label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="Ex: (81) 98888-0000"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold cursor-pointer disabled:opacity-60"
                >
                  {salvando ? 'Salvando...' : gestorEmEdicao ? 'Atualizar Gestor' : 'Cadastrar Gestor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Exclusão */}
      {gestorParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Excluir Gestor?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tem certeza que deseja excluir <strong>{gestorParaExcluir.nome}</strong> da lista de gestores responsáveis?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setGestorParaExcluir(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={excluindo}
                onClick={handleConfirmarExclusao}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer disabled:opacity-60"
              >
                {excluindo ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
