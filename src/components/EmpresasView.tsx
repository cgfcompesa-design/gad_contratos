import React, { useState } from 'react';
import { EmpresaContratada, Usuario } from '../types';
import {
  criarEmpresaContratada,
  atualizarEmpresaContratada,
  excluirEmpresaContratada
} from '../services/firestoreService';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Hash,
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';

interface EmpresasViewProps {
  empresas?: EmpresaContratada[];
  usuarioAtual: Usuario;
  onVoltarParaContratos?: () => void;
}

export const EmpresasView: React.FC<EmpresasViewProps> = ({
  empresas = [],
  usuarioAtual,
  onVoltarParaContratos
}) => {
  const isMasterOuApoio = usuarioAtual.perfil === 'MASTER' || usuarioAtual.perfil === 'APOIO CONTRATOS';

  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [empresaEmEdicao, setEmpresaEmEdicao] = useState<EmpresaContratada | null>(null);
  const [empresaParaExcluir, setEmpresaParaExcluir] = useState<EmpresaContratada | null>(null);

  const [formData, setFormData] = useState({
    razaoSocial: '',
    cnpj: '',
    nomeFantasia: '',
    email: '',
    telefone: ''
  });

  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [cnpjCopiadoId, setCnpjCopiadoId] = useState<string | null>(null);

  const mascaraCNPJ = (valor: string) => {
    return valor
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const listaEmpresas = Array.isArray(empresas) ? empresas : [];
  const empresasFiltradas = listaEmpresas.filter((emp) => {
    if (!busca.trim()) return true;
    const termo = busca.toLowerCase();
    const termoLimpo = busca.replace(/\D/g, '');
    return (
      emp.razaoSocial.toLowerCase().includes(termo) ||
      (emp.nomeFantasia && emp.nomeFantasia.toLowerCase().includes(termo)) ||
      (emp.cnpj && emp.cnpj.includes(termo)) ||
      (termoLimpo && emp.cnpj && emp.cnpj.replace(/\D/g, '').includes(termoLimpo)) ||
      (emp.email && emp.email.toLowerCase().includes(termo))
    );
  });

  const abrirModalNovo = () => {
    setEmpresaEmEdicao(null);
    setFormData({
      razaoSocial: '',
      cnpj: '',
      nomeFantasia: '',
      email: '',
      telefone: ''
    });
    setErro(null);
    setModalAberto(true);
  };

  const abrirModalEditar = (emp: EmpresaContratada) => {
    setEmpresaEmEdicao(emp);
    setFormData({
      razaoSocial: emp.razaoSocial,
      cnpj: emp.cnpj,
      nomeFantasia: emp.nomeFantasia || '',
      email: emp.email || '',
      telefone: emp.telefone || ''
    });
    setErro(null);
    setModalAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.razaoSocial.trim()) {
      setErro('Informe a Razão Social da empresa.');
      return;
    }
    if (!formData.cnpj.trim()) {
      setErro('Informe o CNPJ da empresa.');
      return;
    }

    try {
      setSalvando(true);
      setErro(null);

      if (empresaEmEdicao) {
        await atualizarEmpresaContratada(
          empresaEmEdicao.id,
          {
            razaoSocial: formData.razaoSocial.trim(),
            cnpj: formData.cnpj.trim(),
            nomeFantasia: formData.nomeFantasia.trim(),
            email: formData.email.trim(),
            telefone: formData.telefone.trim()
          },
          usuarioAtual
        );
      } else {
        await criarEmpresaContratada(
          {
            razaoSocial: formData.razaoSocial.trim(),
            cnpj: formData.cnpj.trim(),
            nomeFantasia: formData.nomeFantasia.trim(),
            email: formData.email.trim(),
            telefone: formData.telefone.trim(),
            ativo: true
          },
          usuarioAtual
        );
      }

      setFormData({
        razaoSocial: '',
        cnpj: '',
        nomeFantasia: '',
        email: '',
        telefone: ''
      });
      setEmpresaEmEdicao(null);
      setModalAberto(false);
    } catch (err: any) {
      console.error('Erro ao salvar empresa:', err);
      setErro(err?.message || 'Erro ao salvar empresa contratada.');
    } finally {
      setSalvando(false);
    }
  };

  const handleConfirmarExclusao = async () => {
    if (!empresaParaExcluir) return;

    try {
      setExcluindo(true);
      await excluirEmpresaContratada(empresaParaExcluir.id, empresaParaExcluir.razaoSocial, usuarioAtual);
      setEmpresaParaExcluir(null);
    } catch (err: any) {
      console.error('Erro ao excluir empresa:', err);
      alert('Erro ao excluir empresa: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setExcluindo(false);
    }
  };

  const copiarCNPJ = (id: string, cnpj: string) => {
    navigator.clipboard.writeText(cnpj);
    setCnpjCopiadoId(id);
    setTimeout(() => setCnpjCopiadoId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-700 dark:text-indigo-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Empresas Contratadas GAD
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cadastro central de fornecedores e prestadores de serviços com RAZÃO SOCIAL e CNPJ
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
              id="btn-nova-empresa"
              onClick={abrirModalNovo}
              className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer ml-auto md:ml-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Empresa</span>
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
            placeholder="Buscar por Razão Social, CNPJ ou Nome Fantasia..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Total: <strong className="text-slate-800 dark:text-slate-200">{empresasFiltradas.length}</strong> empresa(s) cadastrada(s)
        </span>
      </div>

      {/* Grid of Empresas */}
      {empresasFiltradas.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
          <Building2 className="w-12 h-12 mx-auto text-slate-400 opacity-40" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Nenhuma empresa encontrada
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {busca
              ? 'Nenhum resultado corresponde aos termos da pesquisa.'
              : 'Nenhuma empresa cadastrada ainda. Clique em "Nova Empresa" para cadastrar.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {empresasFiltradas.map((emp) => (
            <div
              key={emp.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-300 shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                        {emp.razaoSocial}
                      </h4>
                      {emp.nomeFantasia && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                          {emp.nomeFantasia}
                        </p>
                      )}
                    </div>
                  </div>

                  {isMasterOuApoio && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        title="Editar empresa"
                        onClick={() => abrirModalEditar(emp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Excluir empresa"
                        onClick={() => setEmpresaParaExcluir(emp)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* CNPJ Badge */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Hash className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>{emp.cnpj}</span>
                  </div>
                  <button
                    onClick={() => copiarCNPJ(emp.id, emp.cnpj)}
                    title="Copiar CNPJ"
                    className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer p-1"
                  >
                    {cnpjCopiadoId === emp.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="space-y-1.5 pt-1 text-xs text-slate-600 dark:text-slate-300">
                  {emp.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                  )}
                  {emp.telefone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{emp.telefone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Criar / Editar Empresa */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 my-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {empresaEmEdicao ? 'Editar Empresa Contratada' : 'Cadastrar Empresa Contratada'}
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
                  Razão Social *
                </label>
                <input
                  required
                  type="text"
                  value={formData.razaoSocial}
                  onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                  placeholder="Ex: ServSul Gestão & Facilities Ltda"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  CNPJ *
                </label>
                <input
                  required
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: mascaraCNPJ(e.target.value) })}
                  placeholder="00.000.000/0000-00"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Fantasia (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.nomeFantasia}
                  onChange={(e) => setFormData({ ...formData, nomeFantasia: e.target.value })}
                  placeholder="Ex: ServSul Facilities"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail de Contato
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@empresa.com.br"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(81) 3456-7890"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="px-4 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold cursor-pointer disabled:opacity-60"
                >
                  {salvando ? 'Salvando...' : empresaEmEdicao ? 'Atualizar Empresa' : 'Cadastrar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Exclusão */}
      {empresaParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Excluir Empresa?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tem certeza que deseja remover <strong>{empresaParaExcluir.razaoSocial}</strong> (CNPJ: {empresaParaExcluir.cnpj}) da lista de empresas cadastradas?
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEmpresaParaExcluir(null)}
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
