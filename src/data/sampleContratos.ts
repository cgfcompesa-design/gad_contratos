import { ContratoVigente, StatusPrazo, ProcessoContrato } from '../types';

/**
 * Calcula o Status de Prazo do contrato com base na Data Final de Execução vs Hoje
 * 🔴 Venceu — Data Final Execução já passou.
 * 🟠 Vence Hoje — Data Final Execução é hoje.
 * 🟡 Prazo - Menos de 4 Meses — vence em até 120 dias.
 * 🟢 Prazo - Mais de 4 Meses — prazo confortável (> 120 dias).
 */
export function calcularStatusPrazo(dataFinalExecucao?: string): StatusPrazo {
  if (!dataFinalExecucao) return 'mais_4_meses';

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Consider ISO string or YYYY-MM-DD
  const partes = dataFinalExecucao.split('T')[0].split('-');
  if (partes.length < 3) return 'mais_4_meses';

  const ano = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10) - 1;
  const dia = parseInt(partes[2], 10);

  const dataFim = new Date(ano, mes, dia, 0, 0, 0, 0);
  const diffMs = dataFim.getTime() - hoje.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias < 0) return 'venceu';
  if (diffDias === 0) return 'vence_hoje';
  if (diffDias <= 120) return 'menos_4_meses';
  return 'mais_4_meses';
}

export function formatarStatusPrazoLabel(status?: StatusPrazo): {
  label: string;
  badgeClass: string;
  dotClass: string;
  icone: string;
} {
  switch (status) {
    case 'venceu':
      return {
        label: 'Venceu',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900',
        dotClass: 'bg-rose-500',
        icone: '🔴'
      };
    case 'vence_hoje':
      return {
        label: 'Vence Hoje',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900',
        dotClass: 'bg-amber-500 animate-ping',
        icone: '🟠'
      };
    case 'menos_4_meses':
      return {
        label: 'Prazo - Menos de 4 Meses',
        badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-400 dark:border-yellow-900',
        dotClass: 'bg-yellow-500',
        icone: '🟡'
      };
    case 'mais_4_meses':
    default:
      return {
        label: 'Prazo - Mais de 4 Meses',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900',
        dotClass: 'bg-emerald-500',
        icone: '🟢'
      };
  }
}

/**
 * Calcula a Situação Atual dinâmica do contrato com base nos processos ativos vinculados
 */
export function calcularSituacaoAtual(contrato: ContratoVigente, processos: ProcessoContrato[]): {
  texto: string;
  tipo: 'processo_ativo' | 'processo_concluido' | 'manual' | 'sem_processo';
  detalhesProcessos?: ProcessoContrato[];
} {
  // Encontrar processos associados a este contrato
  const processosVinculados = processos.filter((p) => {
    if (p.contratoVigenteId && p.contratoVigenteId === contrato.id) return true;
    if (p.numeroProcesso && contrato.numeroContrato && p.numeroProcesso.includes(contrato.numeroContrato)) return true;
    if (p.empresaContratada && contrato.empresa && p.empresaContratada.toLowerCase().includes(contrato.empresa.toLowerCase())) return true;
    return false;
  });

  if (processosVinculados.length === 0) {
    if (contrato.situacaoManual && contrato.situacaoManual.trim()) {
      return {
        texto: contrato.situacaoManual.trim(),
        tipo: 'manual'
      };
    }
    return {
      texto: 'Sem processo em andamento',
      tipo: 'sem_processo'
    };
  }

  // Filtrar processos em andamento
  const emAndamento = processosVinculados.filter((p) => p.statusGeral !== 'concluido');

  if (emAndamento.length === 0) {
    // Todos vinculados foram concluídos
    const ultimo = processosVinculados[0];
    const tipoAbrev = ultimo.tipoAcao.includes('REAJUSTE')
      ? 'Reajuste'
      : ultimo.tipoAcao.includes('ADITIVO')
      ? 'Aditivo'
      : 'Licitação';
    return {
      texto: `Processo concluído — ${tipoAbrev}`,
      tipo: 'processo_concluido',
      detalhesProcessos: processosVinculados
    };
  }

  // Se houver mais de um processo ativo (ex: Reajuste e Aditivo simultâneos)
  if (emAndamento.length > 1) {
    const descricoes = emAndamento.map((p) => {
      const tipoPrefix = p.tipoAcao.includes('REAJUSTE')
        ? 'Reajuste'
        : p.tipoAcao.includes('ADITIVO')
        ? 'Aditivo'
        : 'Licitação';
      const etapa = p.proximaEtapaPendenteNome || 'Etapas em andamento';
      return `${tipoPrefix}: Aguardando ${etapa}`;
    });

    return {
      texto: descricoes.join(' | '),
      tipo: 'processo_ativo',
      detalhesProcessos: emAndamento
    };
  }

  // Exatamente um processo em andamento
  const p = emAndamento[0];
  const proximaEtapa = p.proximaEtapaPendenteNome || 'Em andamento';
  return {
    texto: `Aguardando: ${proximaEtapa}`,
    tipo: 'processo_ativo',
    detalhesProcessos: [p]
  };
}

/**
 * Base de contratos importada da planilha CONTROLE_DE_CONTRATOS_-_GAD_2026 (aba PRAZO)
 */
export const CONTRATOS_EXEMPLO_GAD: Omit<ContratoVigente, 'id' | 'criadoEm' | 'atualizadoEm'>[] = [
  {
    numero: 1,
    gestor: 'Carlos Alberto Silva (GAD)',
    numeroContrato: 'CT.PS.23.2.203',
    projeto: 'GO014DGC17',
    empresa: 'ServSul Gestão & Facilities Ltda',
    objeto: 'Serviços continuados de apoio administrativo, recepção e copeiragem com dedicação exclusiva de mão de obra para Sede e regionais da COMPESA',
    valorAnual: 4850000.0,
    dataOrdemServico: '2023-05-15',
    dataInicialExecucao: '2023-06-01',
    dataFinalExecucao: '2026-10-15',
    dataInicialVigencia: '2023-06-01',
    dataFinalVigencia: '2026-10-15',
    situacaoManual: ''
  },
  {
    numero: 2,
    gestor: 'Mariana Fernandes Rocha (CGF)',
    numeroContrato: 'CT.OS.22.2.045',
    projeto: 'CGF002FLT22',
    empresa: 'Locavel Frotas Nordeste S/A',
    objeto: 'Locação e manutenção de veículos operacionais leves e utilitários da frota de suporte ao saneamento',
    valorAnual: 1720000.0,
    dataOrdemServico: '2022-11-10',
    dataInicialExecucao: '2022-12-01',
    dataFinalExecucao: '2026-11-30',
    dataInicialVigencia: '2022-12-01',
    dataFinalVigencia: '2026-11-30',
    situacaoManual: ''
  },
  {
    numero: 3,
    gestor: 'Roberto Menezes (CSG)',
    numeroContrato: 'CT.PS.24.1.089',
    projeto: 'CSG008MNT24',
    empresa: 'ClimaFrio Engenharia Térmica Ltda',
    objeto: 'Manutenção preventiva e corretiva dos sistemas de ar-condicionado central, chillers e split',
    valorAnual: 890000.0,
    dataOrdemServico: '2024-03-20',
    dataInicialExecucao: '2024-04-01',
    dataFinalExecucao: '2026-10-01',
    dataInicialVigencia: '2024-04-01',
    dataFinalVigencia: '2026-10-01',
    situacaoManual: ''
  },
  {
    numero: 4,
    gestor: 'Patrícia Albuquerque (GAD)',
    numeroContrato: 'CT.PS.21.2.115',
    projeto: 'GAD003SEG21',
    empresa: 'Nordeste Segurança e Vigilância Armada Ltda',
    objeto: 'Serviços continuados de vigilância armada e monitoramento eletrônico de estações de tratamento',
    valorAnual: 6420000.0,
    dataOrdemServico: '2021-08-01',
    dataInicialExecucao: '2021-09-01',
    dataFinalExecucao: '2026-09-28',
    dataInicialVigencia: '2021-09-01',
    dataFinalVigencia: '2026-09-28',
    situacaoManual: ''
  },
  {
    numero: 5,
    gestor: 'Carlos Alberto Silva (GAD)',
    numeroContrato: 'CT.PS.23.1.077',
    projeto: 'CSG012LMP23',
    empresa: 'LimpClean Conservação e Serviços Ambientais Ltda',
    objeto: 'Limpeza, higienização, asseio e conservação predial das gerências regionais',
    valorAnual: 3150000.0,
    dataOrdemServico: '2023-02-10',
    dataInicialExecucao: '2023-03-01',
    dataFinalExecucao: '2026-03-01',
    dataInicialVigencia: '2023-03-01',
    dataFinalVigencia: '2026-03-01',
    situacaoManual: 'AGUARDANDO FINALIZAÇÃO DE NOVO EDITAL GCL'
  },
  {
    numero: 6,
    gestor: 'Mariana Fernandes Rocha (CGF)',
    numeroContrato: 'CT.OS.25.1.012',
    projeto: 'CGF005TRN25',
    empresa: 'PetroVale Combustíveis & Frotas Ltda',
    objeto: 'Gerenciamento e abastecimento de combustíveis (gasolina, diesel e etanol) via cartão magnético',
    valorAnual: 5900000.0,
    dataOrdemServico: '2025-01-15',
    dataInicialExecucao: '2025-02-01',
    dataFinalExecucao: '2027-02-01',
    dataInicialVigencia: '2025-02-01',
    dataFinalVigencia: '2027-02-01',
    situacaoManual: ''
  },
  {
    numero: 7,
    gestor: 'Roberto Menezes (CSG)',
    numeroContrato: 'CT.PS.24.2.140',
    projeto: 'GAD019ENG24',
    empresa: 'Delta Elevadores & Automação Predial',
    objeto: 'Modernização e assistência técnica contínua dos elevadores e monta-cargas do Edifício Sede COMPESA',
    valorAnual: 420000.0,
    dataOrdemServico: '2024-07-01',
    dataInicialExecucao: '2024-08-01',
    dataFinalExecucao: '2026-12-10',
    dataInicialVigencia: '2024-08-01',
    dataFinalVigencia: '2026-12-10',
    situacaoManual: 'AGUARDANDO LINHAS 2027'
  },
  {
    numero: 8,
    gestor: 'Patrícia Albuquerque (GAD)',
    numeroContrato: 'CT.PS.22.1.003',
    projeto: 'CSG001RES22',
    empresa: 'EcoResíduos Tratamento & Logística Reversa',
    objeto: 'Coleta seletiva, transporte e destinação ambiental de resíduos sólidos classe I e II',
    valorAnual: 780000.0,
    dataOrdemServico: '2022-04-12',
    dataInicialExecucao: '2022-05-01',
    dataFinalExecucao: '2026-09-08',
    dataInicialVigencia: '2022-05-01',
    dataFinalVigencia: '2026-09-08',
    situacaoManual: ''
  }
];
