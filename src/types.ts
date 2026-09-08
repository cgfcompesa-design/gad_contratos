export type PerfilUsuario = 'MASTER' | 'APOIO CONTRATOS' | 'GERENTE' | 'PENDENTE';
export type StatusUsuario = 'ativo' | 'pendente' | 'inativo';

export interface Usuario {
  uid: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  status: StatusUsuario;
  fotoUrl?: string;
  criadoEm: string;
  aprovadoPor?: string;
  aprovadoEm?: string;
}

export type LotacaoDestino =
  | 'GAD — Gerência Administrativa e de Suporte'
  | 'CGF — Coordenação de Gestão de Frotas'
  | 'CSG — Coordenação de Serviços Gerais';

export type TipoAcao =
  | 'LICITAÇÃO / NOVO CONTRATO'
  | 'LICITAÇÃO / NOVO CONTRATO com Mão de Obra'
  | 'REAJUSTE RETROATIVO EM CONTRATO'
  | 'ADITIVO (RENOVAÇÃO/SUPRESSÃO/ACRÉSCIMO) EM CONTRATO';

export type StatusPrazo = 'venceu' | 'vence_hoje' | 'menos_4_meses' | 'mais_4_meses';

export interface ContratoVigente {
  id: string;
  numero: number;
  gestor: string;
  numeroContrato: string;
  projeto: string;
  empresa: string;
  objeto: string;
  valorAnual: number;
  dataOrdemServico?: string;
  dataInicialExecucao?: string;
  dataFinalExecucao?: string;
  dataInicialVigencia?: string;
  dataFinalVigencia?: string;
  statusPrazo?: StatusPrazo;
  situacaoManual?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export type StatusGeralProcesso =
  | 'nao_iniciado'
  | 'em_andamento'
  | 'em_aprovacao'
  | 'atrasado'
  | 'concluido';

export type StatusEtapa =
  | 'pendente'
  | 'em_andamento'
  | 'concluida'
  | 'nao_aplicavel'
  | 'atrasada';

export interface AnexoEtapa {
  nome: string;
  url: string;
  tamanho?: string;
  tipo?: string;
  dataEnvio: string;
}

export interface EtapaProcesso {
  id: string;
  ordem: number;
  nome: string;
  status: StatusEtapa;
  condicional?: boolean;
  descricaoCondicional?: string;
  dataInicio?: string | null;
  dataConclusao?: string | null;
  responsavelConclusao?: string | null;
  emailResponsavelConclusao?: string | null;
  diasCorridos?: number;
  observacao?: string;
  anexos?: AnexoEtapa[];
  criadaEm?: string;
}

export interface LogAcao {
  id: string;
  usuario: string;
  email: string;
  acao: string;
  dataHora: string;
  referencia: string;
  tipoAcao?: 'criacao' | 'conclusao' | 'reversao' | 'edicao' | 'perfil' | 'etapa' | 'exclusao';
  detalhes?: string;
}

export interface ProcessoContrato {
  id: string;
  numeroProcesso?: string;
  lotacaoDestino: LotacaoDestino;
  tipoAcao: TipoAcao;
  descricaoObjeto: string;
  contratoVigenteId?: string | null;
  dataReferencia?: string | null;
  proximaEtapaPendenteNome?: string | null;
  empresaContratada?: string;
  valorEstimado?: number;
  statusGeral: StatusGeralProcesso;
  criadoPor: string;
  emailCriador: string;
  criadoEm: string;
  atualizadoEm: string;
  etapasTotal?: number;
  etapasConcluidas?: number;
  progressoPercentual?: number;
}
