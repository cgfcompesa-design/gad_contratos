import React, { useState, useMemo } from 'react';
import { ContratoVigente, ProcessoContrato, Usuario, StatusPrazo, GestorResponsavel, EmpresaContratada } from '../types';
import {
  calcularStatusPrazo,
  formatarStatusPrazoLabel,
  calcularSituacaoAtual
} from '../data/sampleContratos';
import {
  criarContratoVigente,
  importarContratosEmLote,
  criarGestor,
  criarEmpresaContratada,
  excluirContratoVigente
} from '../services/firestoreService';
import { EditarContratoModal } from './EditarContratoModal';
import { ExcluirContratoModal } from './ExcluirContratoModal';
import {
  Search,
  Filter,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle,
  Plus,
  Upload,
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Briefcase,
  Users,
  Settings2,
  Pencil,
  Trash2
} from 'lucide-react';

interface ContratosVigentesViewProps {
  contratos: ContratoVigente[];
  processos: ProcessoContrato[];
  usuarioAtual: Usuario;
  gestores?: GestorResponsavel[];
  empresas?: EmpresaContratada[];
  onSelecionarContrato: (contrato: ContratoVigente) => void;
  onAbrirProcessoNesteContrato: (contrato: ContratoVigente) => void;
  onNovoContratoLicitacao: () => void;
  onEditarContrato?: (contrato: ContratoVigente) => void;
  onExcluirContrato?: (contrato: ContratoVigente) => void;
  onNavegarParaGestores?: () => void;
  onNavegarParaEmpresas?: () => void;
}

export const ContratosVigentesView: React.FC<ContratosVigentesViewProps> = ({
  contratos,
  processos,
  usuarioAtual,
  gestores = [],
  empresas = [],
  onSelecionarContrato,
  onAbrirProcessoNesteContrato,
  onNovoContratoLicitacao,
  onEditarContrato,
  onExcluirContrato,
  onNavegarParaGestores,
  onNavegarParaEmpresas
}) => {
  const isMasterOuApoio = usuarioAtual.perfil === 'MASTER' || usuarioAtual.perfil === 'APOIO CONTRATOS';

  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroGestor, setFiltroGestor] = useState<string>('todos');
  const [ordenacao, setOrdenacao] = useState<'prazo_asc' | 'numero_asc' | 'valor_desc'>('prazo_asc');

  // Modal para cadastro manual de contrato
  const [modalNovoContratoAberto, setModalNovoContratoAberto] = useState(false);
  const [salvandoContrato, setSalvandoContrato] = useState(false);
  const [formNovo, setFormNovo] = useState({
    gestor: '',
    numeroContrato: '',
    projeto: '',
    empresa: '',
    objeto: '',
    valorAnual: '',
    dataOrdemServico: '',
    dataInicialExecucao: '',
    dataFinalExecucao: '',
    dataInicialVigencia: '',
    dataFinalVigencia: '',
    situacaoManual: ''
  });

  // Estado para Edição e Exclusão de Contratos Vigentes
  const [contratoEmEdicao, setContratoEmEdicao] = useState<ContratoVigente | null>(null);
  const [contratoParaExcluir, setContratoParaExcluir] = useState<ContratoVigente | null>(null);
  const [excluindoContrato, setExcluindoContrato] = useState(false);

  // Lista unificada de gestores para seleção suspensa estritamente da base oficial de Gestores Responsáveis
  const listaGestoresOpcoes = useMemo(() => {
    return gestores
      .filter((g) => g.ativo !== false && g.nome)
      .map((g) => ({ nome: g.nome, lotacao: g.lotacao }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [gestores]);

  // Lista unificada de empresas contratadas para seleção suspensa estritamente da base oficial
  const listaEmpresasOpcoes = useMemo(() => {
    return empresas
      .filter((e) => e.ativo !== false && e.razaoSocial)
      .map((e) => ({ razaoSocial: e.razaoSocial, cnpj: e.cnpj }))
      .sort((a, b) => a.razaoSocial.localeCompare(b.razaoSocial));
  }, [empresas]);

  const handleConfirmarExcluirContrato = async () => {
    if (!contratoParaExcluir) return;
    try {
      setExcluindoContrato(true);
      await excluirContratoVigente(
        contratoParaExcluir.id,
        contratoParaExcluir.numeroContrato,
        usuarioAtual
      );
      setContratoParaExcluir(null);
    } catch (err) {
      console.error('Erro ao excluir contrato:', err);
    } finally {
      setExcluindoContrato(false);
    }
  };

  // Modais rápidos para inclusão on-the-fly
  const [modalRapidoGestor, setModalRapidoGestor] = useState(false);
  const [nomeRapidoGestor, setNomeRapidoGestor] = useState('');
  const [lotacaoRapidoGestor, setLotacaoRapidoGestor] = useState('GAD — Gerência Administrativa e de Suporte');
  const [salvandoRapidoGestor, setSalvandoRapidoGestor] = useState(false);

  const [modalRapidoEmpresa, setModalRapidoEmpresa] = useState(false);
  const [razaoRapidoEmpresa, setRazaoRapidoEmpresa] = useState('');
  const [cnpjRapidoEmpresa, setCnpjRapidoEmpresa] = useState('');
  const [salvandoRapidoEmpresa, setSalvandoRapidoEmpresa] = useState(false);

  const mascaraCNPJ = (valor: string) => {
    return valor
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const handleSalvarRapidoGestor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeRapidoGestor.trim()) return;
    try {
      setSalvandoRapidoGestor(true);
      await criarGestor(
        {
          nome: nomeRapidoGestor.trim(),
          lotacao: lotacaoRapidoGestor.trim(),
          ativo: true
        },
        usuarioAtual
      );
      setFormNovo((prev) => ({ ...prev, gestor: nomeRapidoGestor.trim() }));
      setNomeRapidoGestor('');
      setModalRapidoGestor(false);
    } catch (err) {
      console.error('Erro ao criar gestor rápido:', err);
    } finally {
      setSalvandoRapidoGestor(false);
    }
  };

  const handleSalvarRapidaEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!razaoRapidoEmpresa.trim() || !cnpjRapidoEmpresa.trim()) return;
    try {
      setSalvandoRapidoEmpresa(true);
      await criarEmpresaContratada(
        {
          razaoSocial: razaoRapidoEmpresa.trim(),
          cnpj: cnpjRapidoEmpresa.trim(),
          ativo: true
        },
        usuarioAtual
      );
      setFormNovo((prev) => ({ ...prev, empresa: razaoRapidoEmpresa.trim() }));
      setRazaoRapidoEmpresa('');
      setCnpjRapidoEmpresa('');
      setModalRapidoEmpresa(false);
    } catch (err) {
      console.error('Erro ao criar empresa rápida:', err);
    } finally {
      setSalvandoRapidoEmpresa(false);
    }
  };

  // Unique gestores list for filter
  const gestoresUnicos = useMemo(() => {
    const set = new Set<string>();
    contratos.forEach((c) => {
      if (c.gestor) set.add(c.gestor);
    });
    gestores.forEach((g) => {
      if (g.nome) set.add(g.nome);
    });
    return Array.from(set).sort();
  }, [contratos, gestores]);

  // Metrics summary
  const metricas = useMemo(() => {
    let vencidos = 0;
    let venceHoje = 0;
    let menos4Meses = 0;
    let mais4Meses = 0;
    let valorTotal = 0;

    contratos.forEach((c) => {
      const status = calcularStatusPrazo(c.dataFinalExecucao);
      if (status === 'venceu') vencidos++;
      else if (status === 'vence_hoje') venceHoje++;
      else if (status === 'menos_4_meses') menos4Meses++;
      else mais4Meses++;

      valorTotal += c.valorAnual || 0;
    });

    return {
      total: contratos.length,
      vencidos,
      venceHoje,
      menos4Meses,
      mais4Meses,
      valorTotal
    };
  }, [contratos]);

  // Filtered and sorted contracts
  const contratosFiltrados = useMemo(() => {
    return contratos
      .filter((c) => {
        // Status filter
        const status = calcularStatusPrazo(c.dataFinalExecucao);
        if (filtroStatus !== 'todos' && status !== filtroStatus) {
          return false;
        }

        // Gestor filter
        if (filtroGestor !== 'todos' && c.gestor !== filtroGestor) {
          return false;
        }

        // Search text
        if (busca.trim()) {
          const termo = busca.toLowerCase();
          const matchNumero = c.numeroContrato?.toLowerCase().includes(termo);
          const matchEmpresa = c.empresa?.toLowerCase().includes(termo);
          const matchObjeto = c.objeto?.toLowerCase().includes(termo);
          const matchProjeto = c.projeto?.toLowerCase().includes(termo);
          const matchGestor = c.gestor?.toLowerCase().includes(termo);
          if (!matchNumero && !matchEmpresa && !matchObjeto && !matchProjeto && !matchGestor) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (ordenacao === 'numero_asc') {
          return (a.numero || 0) - (b.numero || 0);
        }
        if (ordenacao === 'valor_desc') {
          return (b.valorAnual || 0) - (a.valorAnual || 0);
        }
        // Default: prazo mais próximo de vencer primeiro
        const timeA = a.dataFinalExecucao ? new Date(a.dataFinalExecucao).getTime() : Infinity;
        const timeB = b.dataFinalExecucao ? new Date(b.dataFinalExecucao).getTime() : Infinity;
        return timeA - timeB;
      });
  }, [contratos, busca, filtroStatus, filtroGestor, ordenacao]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(valor || 0);
  };

  const formatarDataSimples = (dataIso?: string) => {
    if (!dataIso) return '—';
    try {
      const p = dataIso.split('T')[0].split('-');
      if (p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
      return dataIso;
    } catch {
      return dataIso;
    }
  };

  const handleSalvarNovoContrato = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNovo.numeroContrato.trim() || !formNovo.empresa.trim()) {
      alert('Informe ao menos o Número do Contrato e a Empresa.');
      return;
    }

    try {
      setSalvandoContrato(true);
      await criarContratoVigente(
        {
          numero: contratos.length + 1,
          gestor: formNovo.gestor.trim(),
          numeroContrato: formNovo.numeroContrato.trim(),
          projeto: formNovo.projeto.trim(),
          empresa: formNovo.empresa.trim(),
          objeto: formNovo.objeto.trim(),
          valorAnual: parseFloat(formNovo.valorAnual) || 0,
          dataOrdemServico: formNovo.dataOrdemServico || undefined,
          dataInicialExecucao: formNovo.dataInicialExecucao || undefined,
          dataFinalExecucao: formNovo.dataFinalExecucao || undefined,
          dataInicialVigencia: formNovo.dataInicialVigencia || undefined,
          dataFinalVigencia: formNovo.dataFinalVigencia || undefined,
          situacaoManual: formNovo.situacaoManual.trim() || undefined
        },
        usuarioAtual
      );
      setModalNovoContratoAberto(false);
      setFormNovo({
        gestor: '',
        numeroContrato: '',
        projeto: '',
        empresa: '',
        objeto: '',
        valorAnual: '',
        dataOrdemServico: '',
        dataInicialExecucao: '',
        dataFinalExecucao: '',
        dataInicialVigencia: '',
        dataFinalVigencia: '',
        situacaoManual: ''
      });
    } catch (err) {
      console.error('Erro ao criar contrato:', err);
    } finally {
      setSalvandoContrato(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total de Contratos
          </span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {metricas.total}
          </p>
          <span className="text-[10px] text-slate-400">Base GAD 2026</span>
        </div>

        {/* Vencidos */}
        <button
          onClick={() => setFiltroStatus(filtroStatus === 'venceu' ? 'todos' : 'venceu')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            filtroStatus === 'venceu'
              ? 'bg-rose-100 border-rose-400 dark:bg-rose-950 dark:border-rose-700'
              : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 hover:bg-rose-100/80'
          }`}
        >
          <span className="text-[11px] font-extrabold text-rose-800 dark:text-rose-300 uppercase tracking-wider flex items-center gap-1">
            <span>🔴</span>
            <span>Vencidos</span>
          </span>
          <p className="text-2xl font-black text-rose-900 dark:text-rose-200 mt-1">
            {metricas.vencidos}
          </p>
          <span className="text-[10px] text-rose-700 dark:text-rose-400">Execução expirada</span>
        </button>

        {/* Vence Hoje */}
        <button
          onClick={() => setFiltroStatus(filtroStatus === 'vence_hoje' ? 'todos' : 'vence_hoje')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            filtroStatus === 'vence_hoje'
              ? 'bg-amber-100 border-amber-400 dark:bg-amber-950 dark:border-amber-700'
              : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 hover:bg-amber-100/80'
          }`}
        >
          <span className="text-[11px] font-extrabold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
            <span>🟠</span>
            <span>Vence Hoje</span>
          </span>
          <p className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-1">
            {metricas.venceHoje}
          </p>
          <span className="text-[10px] text-amber-700 dark:text-amber-400">Atenção máxima</span>
        </button>

        {/* Menos de 4 Meses */}
        <button
          onClick={() => setFiltroStatus(filtroStatus === 'menos_4_meses' ? 'todos' : 'menos_4_meses')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            filtroStatus === 'menos_4_meses'
              ? 'bg-yellow-100 border-yellow-400 dark:bg-yellow-950 dark:border-yellow-700'
              : 'bg-yellow-50/70 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900 hover:bg-yellow-100/80'
          }`}
        >
          <span className="text-[11px] font-extrabold text-yellow-800 dark:text-yellow-300 uppercase tracking-wider flex items-center gap-1">
            <span>🟡</span>
            <span>Até 4 Meses</span>
          </span>
          <p className="text-2xl font-black text-yellow-900 dark:text-yellow-200 mt-1">
            {metricas.menos4Meses}
          </p>
          <span className="text-[10px] text-yellow-700 dark:text-yellow-400">Abrir aditivo</span>
        </button>

        {/* Mais de 4 Meses */}
        <button
          onClick={() => setFiltroStatus(filtroStatus === 'mais_4_meses' ? 'todos' : 'mais_4_meses')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
            filtroStatus === 'mais_4_meses'
              ? 'bg-emerald-100 border-emerald-400 dark:bg-emerald-950 dark:border-emerald-700'
              : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100/80'
          }`}
        >
          <span className="text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
            <span>🟢</span>
            <span>&gt; 4 Meses</span>
          </span>
          <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200 mt-1">
            {metricas.mais4Meses}
          </p>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Prazo confortável</span>
        </button>

        {/* Valor Global */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Valor Anual Global
          </span>
          <p className="text-lg sm:text-xl font-black text-blue-700 dark:text-blue-400 mt-1 truncate">
            {formatarMoeda(metricas.valorTotal)}
          </p>
          <span className="text-[10px] text-slate-400">Soma anual GAD</span>
        </div>
      </div>

      {/* Control & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-busca-contratos"
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por Nº Contrato (ex: CT.PS.23...), Empresa, Objeto, Gestor ou Projeto..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {isMasterOuApoio && (
              <button
                id="btn-cadastrar-contrato-vigente"
                onClick={() => setModalNovoContratoAberto(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Contrato Vigente</span>
              </button>
            )}

            <button
              id="btn-novo-processo-licitacao-atalho"
              onClick={onNovoContratoLicitacao}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-900 dark:text-blue-200 text-xs font-bold transition-all cursor-pointer"
            >
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>Abrir Licitação (Novo)</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-500 dark:text-slate-400">Prazo:</span>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="todos">Todos os Status</option>
              <option value="venceu">🔴 Venceu</option>
              <option value="vence_hoje">🟠 Vence Hoje</option>
              <option value="menos_4_meses">🟡 Menos de 4 Meses</option>
              <option value="mais_4_meses">🟢 Mais de 4 Meses</option>
            </select>
          </div>

          {/* Gestor filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Gestor:</span>
            <select
              value={filtroGestor}
              onChange={(e) => setFiltroGestor(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="todos">Todos os Gestores</option>
              {gestoresUnicos.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Order by */}
          <div className="flex items-center gap-1.5 ml-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-500 dark:text-slate-400">Ordenar por:</span>
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="prazo_asc">Vencimento mais próximo</option>
              <option value="numero_asc">Nº Sequencial (Planilha)</option>
              <option value="valor_desc">Maior Valor Anual</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Contracts Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3 w-12 text-center">Nº</th>
                <th className="py-3 px-3">Contrato & Projeto</th>
                <th className="py-3 px-3">Empresa & Objeto</th>
                <th className="py-3 px-3">Valor Anual</th>
                <th className="py-3 px-3">Status de Prazo</th>
                <th className="py-3 px-3 min-w-[220px]">Situação Atual (Em Tempo Real)</th>
                <th className="py-3 px-3 text-right min-w-[210px]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {contratosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nenhum contrato encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                contratosFiltrados.map((c) => {
                  const statusInfo = formatarStatusPrazoLabel(calcularStatusPrazo(c.dataFinalExecucao));
                  const situacao = calcularSituacaoAtual(c, processos);

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                      onClick={() => onSelecionarContrato(c)}
                    >
                      {/* Nº */}
                      <td className="py-3.5 px-3 text-center font-bold text-slate-400 font-mono">
                        {c.numero}
                      </td>

                      {/* Contrato & Projeto */}
                      <td className="py-3.5 px-3">
                        <div className="font-extrabold text-slate-900 dark:text-white font-mono text-xs group-hover:text-blue-600 transition-colors">
                          {c.numeroContrato}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Proj: <span className="font-medium text-slate-600 dark:text-slate-300">{c.projeto || '—'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {c.gestor}
                        </div>
                      </td>

                      {/* Empresa & Objeto */}
                      <td className="py-3.5 px-3 max-w-xs sm:max-w-sm">
                        <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                          {c.empresa}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {c.objeto}
                        </p>
                      </td>

                      {/* Valor Anual */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatarMoeda(c.valorAnual)}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          OS: {formatarDataSimples(c.dataOrdemServico)}
                        </div>
                      </td>

                      {/* Status de Prazo */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold ${statusInfo.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                          <span>{statusInfo.label}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Término: {formatarDataSimples(c.dataFinalExecucao)}
                        </div>
                      </td>

                      {/* Situação Atual */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${
                            situacao.tipo === 'processo_ativo'
                              ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300 font-bold'
                              : situacao.tipo === 'processo_concluido'
                              ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                              : situacao.tipo === 'manual'
                              ? 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 italic'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {situacao.texto}
                          </span>
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Abrir novo processo (Reajuste ou Aditivo)"
                            onClick={() => onAbrirProcessoNesteContrato(c)}
                            className="p-1.5 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Processo</span>
                          </button>

                          <button
                            title="Corrigir ou editar os dados deste contrato"
                            onClick={() => onEditarContrato ? onEditarContrato(c) : setContratoEmEdicao(c)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400 transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span className="hidden sm:inline">Corrigir</span>
                          </button>

                          <button
                            title="Excluir este contrato da base vigente"
                            onClick={() => onExcluirContrato ? onExcluirContrato(c) : setContratoParaExcluir(c)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-400 transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            <span className="hidden sm:inline">Excluir</span>
                          </button>

                          <button
                            title="Ver ficha completa do contrato"
                            onClick={() => onSelecionarContrato(c)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cadastro Manual de Contrato */}
      {modalNovoContratoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 my-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Cadastrar Contrato na Base Vigente GAD
              </h3>
              <button
                onClick={() => setModalNovoContratoAberto(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarNovoContrato} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nº do Contrato */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nº do Contrato *
                  </label>
                  <input
                    required
                    type="text"
                    value={formNovo.numeroContrato}
                    onChange={(e) => setFormNovo({ ...formNovo, numeroContrato: e.target.value })}
                    placeholder="Ex: CT.PS.24.2.140"
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Empresa Contratada (Dropdown com Razão Social e CNPJ) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      Empresa Contratada *
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setModalRapidoEmpresa(true)}
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                        title="Cadastrar nova empresa"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Nova Empresa</span>
                      </button>
                      {onNavegarParaEmpresas && (
                        <button
                          type="button"
                          onClick={() => {
                            setModalNovoContratoAberto(false);
                            onNavegarParaEmpresas();
                          }}
                          className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                          title="Ir para a página de gestão de empresas"
                        >
                          Gerenciar
                        </button>
                      )}
                    </div>
                  </div>
                  <select
                    required
                    value={formNovo.empresa}
                    onChange={(e) => {
                      if (e.target.value === '__nova__') {
                        setModalRapidoEmpresa(true);
                      } else {
                        setFormNovo({ ...formNovo, empresa: e.target.value });
                      }
                    }}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Selecione a Empresa Contratada...</option>
                    {listaEmpresasOpcoes.map((e) => (
                      <option key={e.razaoSocial} value={e.razaoSocial}>
                        {e.razaoSocial} {e.cnpj ? `— CNPJ: ${e.cnpj}` : ''}
                      </option>
                    ))}
                    <option value="__nova__" className="text-blue-600 font-bold">
                      + Cadastrar Nova Empresa na Base...
                    </option>
                  </select>
                </div>

                {/* Gestor Responsável (Dropdown com lista de gestores) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      Gestor Responsável
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setModalRapidoGestor(true)}
                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                        title="Cadastrar novo gestor"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Novo Gestor</span>
                      </button>
                      {onNavegarParaGestores && (
                        <button
                          type="button"
                          onClick={() => {
                            setModalNovoContratoAberto(false);
                            onNavegarParaGestores();
                          }}
                          className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                          title="Ir para a página de gestão de gestores"
                        >
                          Gerenciar
                        </button>
                      )}
                    </div>
                  </div>
                  <select
                    value={formNovo.gestor}
                    onChange={(e) => {
                      if (e.target.value === '__novo__') {
                        setModalRapidoGestor(true);
                      } else {
                        setFormNovo({ ...formNovo, gestor: e.target.value });
                      }
                    }}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Selecione o Gestor Responsável...</option>
                    {listaGestoresOpcoes.map((g) => (
                      <option key={g.nome} value={g.nome}>
                        {g.nome} {g.lotacao ? `(${g.lotacao.split('—')[0].trim()})` : ''}
                      </option>
                    ))}
                    <option value="__novo__" className="text-blue-600 font-bold">
                      + Cadastrar Novo Gestor na Base...
                    </option>
                  </select>
                </div>

                {/* Projeto */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Projeto
                  </label>
                  <input
                    type="text"
                    value={formNovo.projeto}
                    onChange={(e) => setFormNovo({ ...formNovo, projeto: e.target.value })}
                    placeholder="Ex: GO014DGC17"
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Valor Anual */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Valor Anual (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formNovo.valorAnual}
                    onChange={(e) => setFormNovo({ ...formNovo, valorAnual: e.target.value })}
                    placeholder="0.00"
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Data da Ordem de Serviço (OS) */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data da Ordem de Serviço (OS)
                  </label>
                  <input
                    type="date"
                    value={formNovo.dataOrdemServico}
                    onChange={(e) => setFormNovo({ ...formNovo, dataOrdemServico: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Data Inicial Execução */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data Inicial Execução
                  </label>
                  <input
                    type="date"
                    value={formNovo.dataInicialExecucao}
                    onChange={(e) => setFormNovo({ ...formNovo, dataInicialExecucao: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Data Final de Execução (Término) */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data Final Execução (Término)
                  </label>
                  <input
                    type="date"
                    value={formNovo.dataFinalExecucao}
                    onChange={(e) => setFormNovo({ ...formNovo, dataFinalExecucao: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Data Inicial Vigência */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data Inicial Vigência
                  </label>
                  <input
                    type="date"
                    value={formNovo.dataInicialVigencia}
                    onChange={(e) => setFormNovo({ ...formNovo, dataInicialVigencia: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Data Final Vigência */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data Final Vigência
                  </label>
                  <input
                    type="date"
                    value={formNovo.dataFinalVigencia}
                    onChange={(e) => setFormNovo({ ...formNovo, dataFinalVigencia: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Situação Manual */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Situação Manual (quando sem processo em andamento)
                  </label>
                  <input
                    type="text"
                    value={formNovo.situacaoManual}
                    onChange={(e) => setFormNovo({ ...formNovo, situacaoManual: e.target.value })}
                    placeholder="Ex: AGUARDANDO LINHAS 2027"
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Objeto do Contrato */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Objeto do Contrato
                </label>
                <textarea
                  rows={3}
                  value={formNovo.objeto}
                  onChange={(e) => setFormNovo({ ...formNovo, objeto: e.target.value })}
                  placeholder="Descrição do objeto contratual..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalNovoContratoAberto(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 font-bold hover:bg-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoContrato}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold cursor-pointer disabled:opacity-60"
                >
                  {salvandoContrato ? 'Cadastrando...' : 'Cadastrar Contrato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rápido: Adicionar Gestor */}
      {modalRapidoGestor && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Cadastrar Novo Gestor na Base
              </h4>
              <button
                type="button"
                onClick={() => setModalRapidoGestor(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSalvarRapidoGestor} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Gestor *
                </label>
                <input
                  required
                  type="text"
                  value={nomeRapidoGestor}
                  onChange={(e) => setNomeRapidoGestor(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Lotação / Gerência
                </label>
                <input
                  type="text"
                  value={lotacaoRapidoGestor}
                  onChange={(e) => setLotacaoRapidoGestor(e.target.value)}
                  placeholder="Ex: GAD — Gerência Administrativa e de Suporte"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalRapidoGestor(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 font-bold hover:bg-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoRapidoGestor || !nomeRapidoGestor.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold cursor-pointer disabled:opacity-60"
                >
                  {salvandoRapidoGestor ? 'Salvando...' : 'Salvar e Selecionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Rápido: Adicionar Empresa Contratada */}
      {modalRapidoEmpresa && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                Cadastrar Nova Empresa na Base
              </h4>
              <button
                type="button"
                onClick={() => setModalRapidoEmpresa(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSalvarRapidaEmpresa} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Razão Social *
                </label>
                <input
                  required
                  type="text"
                  value={razaoRapidoEmpresa}
                  onChange={(e) => setRazaoRapidoEmpresa(e.target.value)}
                  placeholder="Ex: COMPANHIA DE SERVIÇOS LTDA"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  CNPJ *
                </label>
                <input
                  required
                  type="text"
                  value={cnpjRapidoEmpresa}
                  onChange={(e) => setCnpjRapidoEmpresa(mascaraCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalRapidoEmpresa(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 font-bold hover:bg-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoRapidoEmpresa || !razaoRapidoEmpresa.trim() || !cnpjRapidoEmpresa.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white font-bold cursor-pointer disabled:opacity-60"
                >
                  {salvandoRapidoEmpresa ? 'Salvando...' : 'Salvar e Selecionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar / Corrigir Contrato Vigente */}
      <EditarContratoModal
        isOpen={!!contratoEmEdicao}
        contrato={contratoEmEdicao}
        usuarioAtual={usuarioAtual}
        gestores={gestores}
        empresas={empresas}
        onClose={() => setContratoEmEdicao(null)}
        onSalvo={() => setContratoEmEdicao(null)}
        onNavegarParaGestores={onNavegarParaGestores}
        onNavegarParaEmpresas={onNavegarParaEmpresas}
      />

      {/* Modal: Excluir Contrato Vigente */}
      <ExcluirContratoModal
        isOpen={!!contratoParaExcluir}
        contrato={contratoParaExcluir}
        excluindo={excluindoContrato}
        onClose={() => setContratoParaExcluir(null)}
        onConfirmar={handleConfirmarExcluirContrato}
      />

    </div>
  );
};
