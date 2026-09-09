import * as XLSX from 'xlsx';
import { ContratoVigente } from '../types';

export const COLUNAS_PLANILHA_BASE = [
  'GESTOR',
  'Nº CONTRATO',
  'PROJETO',
  'EMPRESA',
  'OBJETO',
  'VALOR ANUAL DO CONTRATO',
  'DATA DA ORDEM DE SERVIÇO',
  'DATA INICIAL EXECUÇÃO',
  'DATA FINAL EXECUÇÃO',
  'DATA INICIAL VIGÊNCIA',
  'DATA FINAL VIGÊNCIA'
] as const;

export interface ContratoImportadoItem {
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
  linhaPlanilha: number;
}

/**
 * Normaliza qualquer data (Excel serial, Date object, string DD/MM/YYYY ou YYYY-MM-DD)
 * para o formato ISO YYYY-MM-DD. Se inválida ou ausente, retorna string vazia "".
 */
export function normalizarDataPlanilha(valor: unknown): string {
  if (valor === undefined || valor === null || valor === '') return '';

  // Se já for Date
  if (valor instanceof Date && !isNaN(valor.getTime())) {
    return valor.toISOString().split('T')[0];
  }

  // Se for número serial do Excel (ex: 44967)
  if (typeof valor === 'number') {
    try {
      const dateObj = XLSX.SSF.parse_date_code(valor);
      if (dateObj && dateObj.y && dateObj.m && dateObj.d) {
        const y = String(dateObj.y).padStart(4, '0');
        const m = String(dateObj.m).padStart(2, '0');
        const d = String(dateObj.d).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    } catch {
      return '';
    }
  }

  const str = String(valor).trim();
  if (!str) return '';

  // Formato DD/MM/YYYY ou DD-MM-YYYY
  const regexBR = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
  const matchBR = str.match(regexBR);
  if (matchBR) {
    const dia = matchBR[1].padStart(2, '0');
    const mes = matchBR[2].padStart(2, '0');
    const ano = matchBR[3];
    return `${ano}-${mes}-${dia}`;
  }

  // Formato YYYY-MM-DD
  const regexISO = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/;
  const matchISO = str.match(regexISO);
  if (matchISO) {
    const ano = matchISO[1];
    const mes = matchISO[2].padStart(2, '0');
    const dia = matchISO[3].padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  // Se não corresponder a uma data válida, deixa em branco conforme solicitado
  return '';
}

/**
 * Converte qualquer representação monetária ou numérica para número (float).
 * Se vazio, inválido ou não numérico, retorna 0.
 */
export function normalizarValorPlanilha(valor: unknown): number {
  if (valor === undefined || valor === null || valor === '') return 0;
  if (typeof valor === 'number') return isNaN(valor) ? 0 : valor;

  let str = String(valor).trim();
  if (!str) return 0;

  // Remove símbolos monetários e espaços
  str = str.replace(/[R$\s]/gi, '');

  // Trata formato brasileiro (1.234.567,89) vs internacional (1,234,567.89)
  if (str.includes(',') && str.includes('.')) {
    // Se o ponto vem antes da vírgula (ex: 1.234,56)
    if (str.indexOf('.') < str.indexOf(',')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      // Se a vírgula vem antes do ponto (ex: 1,234.56)
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    // Apenas vírgula decimal (ex: 1234,56)
    str = str.replace(',', '.');
  }

  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Gera e dispara download da Planilha Modelo Base em formato .xlsx
 */
export function baixarPlanilhaModeloXLSX() {
  const cabecalho = [...COLUNAS_PLANILHA_BASE];

  // Linhas de exemplo para orientar o usuário
  const linhasExemplo = [
    [
      'Gildson Barbalho dos Anjos',
      'CT.PS.26.1.001',
      'CSG001ADM26',
      'LimpClean Servicos e Manutencao Ltda',
      'Prestacao de servicos continuados de limpeza, higienizacao e asseio predial',
      3250000.0,
      '15/01/2026',
      '01/02/2026',
      '01/02/2027',
      '01/02/2026',
      '01/02/2027'
    ],
    [
      'Roberto Carlos da Silva',
      'CT.OS.26.2.015',
      'CGF003FLT26',
      'Locavel Frotas do Nordeste S/A',
      'Locacao e gestao de veiculos operacionais leves e pesados',
      1850000.0,
      '20/02/2026',
      '01/03/2026',
      '01/03/2027',
      '01/03/2026',
      '01/03/2027'
    ]
  ];

  const wsData = [cabecalho, ...linhasExemplo];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Ajusta larguras das colunas
  ws['!cols'] = [
    { wch: 30 }, // GESTOR
    { wch: 18 }, // Nº CONTRATO
    { wch: 16 }, // PROJETO
    { wch: 35 }, // EMPRESA
    { wch: 45 }, // OBJETO
    { wch: 26 }, // VALOR ANUAL DO CONTRATO
    { wch: 26 }, // DATA DA ORDEM DE SERVIÇO
    { wch: 24 }, // DATA INICIAL EXECUÇÃO
    { wch: 24 }, // DATA FINAL EXECUÇÃO
    { wch: 24 }, // DATA INICIAL VIGÊNCIA
    { wch: 24 }  // DATA FINAL VIGÊNCIA
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Contratos_Vigentes');

  XLSX.writeFile(wb, 'planilha_base_contratos_vigentes.xlsx');
}

/**
 * Gera e dispara download da Planilha Modelo Base em formato .csv (com ponto-e-vírgula e UTF-8 BOM)
 */
export function baixarPlanilhaModeloCSV() {
  const cabecalho = COLUNAS_PLANILHA_BASE.join(';');
  const exemplo1 = [
    'Gildson Barbalho dos Anjos',
    'CT.PS.26.1.001',
    'CSG001ADM26',
    'LimpClean Servicos e Manutencao Ltda',
    '"Prestacao de servicos continuados de limpeza, higienizacao e asseio predial"',
    '3250000,00',
    '15/01/2026',
    '01/02/2026',
    '01/02/2027',
    '01/02/2026',
    '01/02/2027'
  ].join(';');

  const csvConteudo = '\uFEFF' + [cabecalho, exemplo1].join('\r\n');
  const blob = new Blob([csvConteudo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'planilha_base_contratos_vigentes.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Normaliza o cabeçalho para facilitar o casamento
 */
function normalizarTextoHeader(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim();
}

/**
 * Lê e processa arquivo .xlsx, .xls ou .csv selecionado pelo usuário.
 * Deixa em branco qualquer campo que não corresponder.
 */
export async function processarArquivoPlanilha(
  file: File
): Promise<{ itens: ContratoImportadoItem[]; totalLinhas: number; erros: string[] }> {
  const erros: string[] = [];

  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: false
  });

  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    throw new Error('A planilha selecionada não contém abas ou dados legíveis.');
  }

  const ws = wb.Sheets[sheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  if (!rows || rows.length < 2) {
    throw new Error('A planilha está vazia ou contém apenas a linha de cabeçalho.');
  }

  // Identifica o cabeçalho
  const headerRow = rows[0].map((h) => String(h || '').trim());
  const headerNorm = headerRow.map((h) => normalizarTextoHeader(h));

  // Mapa de índices das colunas solicitadas
  let idxGestor = -1;
  let idxContrato = -1;
  let idxProjeto = -1;
  let idxEmpresa = -1;
  let idxObjeto = -1;
  let idxValor = -1;
  let idxDataOS = -1;
  let idxDataIniExec = -1;
  let idxDataFimExec = -1;
  let idxDataIniVig = -1;
  let idxDataFimVig = -1;

  headerNorm.forEach((h, i) => {
    if (h.includes('GESTOR')) idxGestor = i;
    else if (h.includes('CONTRATO') && !h.includes('VALOR')) idxContrato = i;
    else if (h.includes('PROJETO') || h.includes('PROJ')) idxProjeto = i;
    else if (h.includes('EMPRESA') || h.includes('FORNECEDOR') || h.includes('CONTRATADA')) idxEmpresa = i;
    else if (h.includes('OBJETO') || h.includes('DESCRICAO')) idxObjeto = i;
    else if (h.includes('VALOR')) idxValor = i;
    else if (h.includes('ORDEM') || h.includes('OS')) idxDataOS = i;
    else if ((h.includes('INIC') || h.includes('INI')) && h.includes('EXEC')) idxDataIniExec = i;
    else if ((h.includes('FIM') || h.includes('FINAL') || h.includes('TERM')) && h.includes('EXEC')) idxDataFimExec = i;
    else if ((h.includes('INIC') || h.includes('INI')) && (h.includes('VIG') || h.includes('PRAZO'))) idxDataIniVig = i;
    else if ((h.includes('FIM') || h.includes('FINAL') || h.includes('TERM')) && (h.includes('VIG') || h.includes('PRAZO'))) idxDataFimVig = i;
  });

  // Fallback posicional estrito se os cabeçalhos não tiverem nomes coincidentes:
  // Ordem requisitada:
  // 0: GESTOR
  // 1: Nº CONTRATO
  // 2: PROJETO
  // 3: EMPRESA
  // 4: OBJETO
  // 5: VALOR ANUAL DO CONTRATO
  // 6: DATA DA ORDEM DE SERVIÇO
  // 7: DATA INICIAL EXECUÇÃO
  // 8: DATA FINAL EXECUÇÃO
  // 9: DATA INICIAL VIGÊNCIA
  // 10: DATA FINAL VIGÊNCIA
  if (idxGestor === -1 && rows[0].length >= 1) idxGestor = 0;
  if (idxContrato === -1 && rows[0].length >= 2) idxContrato = 1;
  if (idxProjeto === -1 && rows[0].length >= 3) idxProjeto = 2;
  if (idxEmpresa === -1 && rows[0].length >= 4) idxEmpresa = 3;
  if (idxObjeto === -1 && rows[0].length >= 5) idxObjeto = 4;
  if (idxValor === -1 && rows[0].length >= 6) idxValor = 5;
  if (idxDataOS === -1 && rows[0].length >= 7) idxDataOS = 6;
  if (idxDataIniExec === -1 && rows[0].length >= 8) idxDataIniExec = 7;
  if (idxDataFimExec === -1 && rows[0].length >= 9) idxDataFimExec = 8;
  if (idxDataIniVig === -1 && rows[0].length >= 10) idxDataIniVig = 9;
  if (idxDataFimVig === -1 && rows[0].length >= 11) idxDataFimVig = 10;

  const itens: ContratoImportadoItem[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    // Se toda a linha for vazia, pula
    const isVazia = row.every((c) => c === undefined || c === null || String(c).trim() === '');
    if (isVazia) continue;

    const gestorRaw = idxGestor !== -1 ? row[idxGestor] : '';
    const contratoRaw = idxContrato !== -1 ? row[idxContrato] : '';
    const projetoRaw = idxProjeto !== -1 ? row[idxProjeto] : '';
    const empresaRaw = idxEmpresa !== -1 ? row[idxEmpresa] : '';
    const objetoRaw = idxObjeto !== -1 ? row[idxObjeto] : '';
    const valorRaw = idxValor !== -1 ? row[idxValor] : '';
    const dataOSRaw = idxDataOS !== -1 ? row[idxDataOS] : '';
    const dataIniExecRaw = idxDataIniExec !== -1 ? row[idxDataIniExec] : '';
    const dataFimExecRaw = idxDataFimExec !== -1 ? row[idxDataFimExec] : '';
    const dataIniVigRaw = idxDataIniVig !== -1 ? row[idxDataIniVig] : '';
    const dataFimVigRaw = idxDataFimVig !== -1 ? row[idxDataFimVig] : '';

    const numeroContrato = String(contratoRaw || '').trim();
    const empresa = String(empresaRaw || '').trim();
    const gestor = String(gestorRaw || '').trim();
    const projeto = String(projetoRaw || '').trim();
    const objeto = String(objetoRaw || '').trim();

    // Se nem o número do contrato nem a empresa existirem, apenas registra aviso se houver algum conteúdo
    if (!numeroContrato && !empresa && !objeto) {
      continue;
    }

    const valorAnual = normalizarValorPlanilha(valorRaw);
    const dataOrdemServico = normalizarDataPlanilha(dataOSRaw);
    const dataInicialExecucao = normalizarDataPlanilha(dataIniExecRaw);
    const dataFinalExecucao = normalizarDataPlanilha(dataFimExecRaw);
    const dataInicialVigencia = normalizarDataPlanilha(dataIniVigRaw);
    const dataFinalVigencia = normalizarDataPlanilha(dataFimVigRaw);

    itens.push({
      linhaPlanilha: r + 1,
      gestor,
      numeroContrato: numeroContrato || `CT-IMPORT-${r}`,
      projeto,
      empresa: empresa || 'Empresa a Definir',
      objeto,
      valorAnual,
      dataOrdemServico: dataOrdemServico || undefined,
      dataInicialExecucao: dataInicialExecucao || undefined,
      dataFinalExecucao: dataFinalExecucao || undefined,
      dataInicialVigencia: dataInicialVigencia || undefined,
      dataFinalVigencia: dataFinalVigencia || undefined
    });
  }

  return {
    itens,
    totalLinhas: rows.length - 1,
    erros
  };
}
