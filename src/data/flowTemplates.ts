import { TipoAcao } from '../types';

export interface TemplateEtapa {
  nome: string;
  condicional?: boolean;
  descricaoCondicional?: string;
}

export const TEMPLATES_FLUXOS: Record<TipoAcao, TemplateEtapa[]> = {
  'LICITAÇÃO / NOVO CONTRATO com Mão de Obra': [
    { nome: 'Levantamento de quantitativos' },
    { nome: 'Elaborar planilha de estimativa de custos' },
    { nome: 'Cotação de itens' },
    { nome: 'Elaborar termo de referência' },
    { nome: 'Termo de segurança do trabalho (CST)' },
    { nome: 'Parecer peric./insal. (CST)' },
    { nome: 'Análise/Parecer CCR' },
    { nome: 'Aprovação DGC' },
    { nome: 'PA' },
    { nome: 'Análise GCL' },
    { nome: 'Publicação e recebimento de propostas' },
    { nome: 'Diligências' },
    { nome: 'Julgamento de Propostas' },
    { nome: 'Homologação' },
    { nome: 'Elaboração de contrato (GEC)' },
    { nome: 'Assinatura de contrato' },
    { nome: 'Nomeação de gestor administrativo' },
    { nome: 'Nomeação de gestores fiscais' },
    { nome: 'Assinatura de ordem de serviço' },
    { nome: 'Apólice (Contratada)' },
    { nome: 'Entrega de EPIs, fardamentos, veículos, etc.' },
    { nome: 'Elaboração de planilha de implantação Alpha' },
    { nome: 'Elaboração de planilha de medição Alpha' },
    { nome: 'Implantação no Alpha (CCR)' },
    { nome: 'Pré-contabilização' },
  ],
  'REAJUSTE RETROATIVO EM CONTRATO': [
    { nome: 'Carta de solicitação (Contratada)' },
    { nome: 'Cálculo de reajuste retroativo (CCR)' },
    { nome: 'Negociação com contratada' },
    { nome: 'Solicitação de Termo de Apostilamento' },
    { nome: 'Aprovação DGC' },
    { nome: 'PA' },
    { nome: 'Elaboração de termo de apostilamento (GEC)' },
    { nome: 'Assinatura de termo' },
    { nome: 'Elaboração de planilha de implantação Alpha' },
    { nome: 'Apólice (Contratada)' },
    { nome: 'Implantação no Alpha (CCR)' },
    { nome: 'Pré-contabilização' },
    { nome: 'Medição' },
  ],
  'ADITIVO (RENOVAÇÃO/SUPRESSÃO/ACRÉSCIMO) EM CONTRATO': [
    { nome: 'Cotações de Mercado (Renovação)' },
    { nome: 'Elaborar planilha de estimativa de custos (se Novo item)', condicional: true, descricaoCondicional: 'Se Novo item' },
    { nome: 'Análise CCR (se Novo item)', condicional: true, descricaoCondicional: 'Se Novo item' },
    { nome: 'Atualização de custos unitários (se reajuste)', condicional: true, descricaoCondicional: 'Se reajuste' },
    { nome: 'Elaboração de planilha de implantação Alpha' },
    { nome: 'Carta de concordância (Contratada)' },
    { nome: 'Aprovação DGC' },
    { nome: 'PA' },
    { nome: 'Elaboração de termo (GEC)' },
    { nome: 'Análise CCR (Percentuais)' },
    { nome: 'Assinatura de termo' },
    { nome: 'Apólice (Contratada)' },
    { nome: 'Implantação no Alpha (CCR)' },
    { nome: 'Pré-contabilização' },
  ],
};

export const LOTACOES_DISPONIVEIS = [
  'GAD — Gerência Administrativa e de Suporte',
  'CGF — Coordenação de Gestão de Frotas',
  'CSG — Coordenação de Serviços Gerais',
] as const;

export const TIPOS_ACAO_DISPONIVEIS: TipoAcao[] = [
  'LICITAÇÃO / NOVO CONTRATO com Mão de Obra',
  'REAJUSTE RETROATIVO EM CONTRATO',
  'ADITIVO (RENOVAÇÃO/SUPRESSÃO/ACRÉSCIMO) EM CONTRATO',
];
