import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import {
  ProcessoContrato,
  EtapaProcesso,
  LogAcao,
  Usuario,
  PerfilUsuario,
  StatusUsuario,
  TipoAcao,
  StatusEtapa,
  StatusGeralProcesso,
  AnexoEtapa,
  ContratoVigente,
  StatusPrazo,
  GestorResponsavel,
  EmpresaContratada
} from '../types';
import { TEMPLATES_FLUXOS } from '../data/flowTemplates';
import { calcularStatusPrazo, CONTRATOS_EXEMPLO_GAD } from '../data/sampleContratos';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to calculate business/calendar days
export function calcularDiasCorridos(inicioStr?: string | null, fimStr?: string | null): number {
  if (!inicioStr) return 0;
  const inicio = new Date(inicioStr);
  const fim = fimStr ? new Date(fimStr) : new Date();
  const diffMs = fim.getTime() - inicio.getTime();
  const dias = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  return dias;
}

// Format date in pt-BR
export function formatarDataHora(isoStr: string): string {
  try {
    const data = new Date(isoStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(data);
  } catch {
    return isoStr;
  }
}

// 1. Subscribe to all processes in real-time
export function subscribeProcessos(
  callback: (processos: ProcessoContrato[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, 'processos');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const lista: ProcessoContrato[] = [];
      snapshot.forEach((d) => {
        lista.push({ id: d.id, ...d.data() } as ProcessoContrato);
      });
      // Sort newest first
      lista.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
      callback(lista);
    },
    (error) => {
      console.error('Erro ao escutar processos:', error);
      if (onError) onError(error);
    }
  );
}

// 2. Subscribe to stages of a specific process
export function subscribeEtapas(
  processoId: string,
  callback: (etapas: EtapaProcesso[]) => void
) {
  const colRef = collection(db, 'processos', processoId, 'etapas');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const lista: EtapaProcesso[] = [];
      snapshot.forEach((d) => {
        lista.push({ id: d.id, ...d.data() } as EtapaProcesso);
      });
      lista.sort((a, b) => a.ordem - b.ordem);
      callback(lista);
    },
    (err) => {
      console.error(`Erro ao escutar etapas do processo ${processoId}:`, err);
    }
  );
}

// 3. Subscribe to audit logs of a process
export function subscribeLogs(
  processoId: string,
  callback: (logs: LogAcao[]) => void
) {
  const colRef = collection(db, 'processos', processoId, 'logs');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const lista: LogAcao[] = [];
      snapshot.forEach((d) => {
        lista.push({ id: d.id, ...d.data() } as LogAcao);
      });
      lista.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
      callback(lista);
    },
    (err) => {
      console.error(`Erro ao escutar logs do processo ${processoId}:`, err);
    }
  );
}

// 4. Subscribe to users collection (for MASTER)
export function subscribeUsuarios(callback: (usuarios: Usuario[]) => void) {
  const colRef = collection(db, 'usuarios');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const lista: Usuario[] = [];
      snapshot.forEach((d) => {
        lista.push({ uid: d.id, ...d.data() } as Usuario);
      });
      lista.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
      callback(lista);
    },
    (err) => {
      console.error('Erro ao escutar usuários:', err);
    }
  );
}

// Helper: Add immutable log
export async function registrarLog(
  processoId: string,
  log: Omit<LogAcao, 'id' | 'dataHora'>
) {
  try {
    const logsCol = collection(db, 'processos', processoId, 'logs');
    const logData: Omit<LogAcao, 'id'> = {
      ...log,
      dataHora: new Date().toISOString()
    };
    await addDoc(logsCol, logData);

    // Also register in global audit
    try {
      await addDoc(collection(db, 'auditoria_geral'), {
        processoId,
        ...logData
      });
    } catch {
      // Non-blocking
    }
  } catch (error) {
    console.error('Erro ao registrar log imutável:', error);
  }
}

// 4b. Subscribe to Contratos Vigentes (real-time from planilha GAD)
export function subscribeContratosVigentes(
  callback: (contratos: ContratoVigente[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, 'contratosVigentes');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const lista: ContratoVigente[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as ContratoVigente;
        const statusPrazo = calcularStatusPrazo(data.dataFinalExecucao);
        lista.push({
          id: d.id,
          ...data,
          statusPrazo
        });
      });
      // Sort by sequence number ascending
      lista.sort((a, b) => (a.numero || 0) - (b.numero || 0));
      callback(lista);
    },
    (error) => {
      console.error('Erro ao escutar contratos vigentes:', error);
      if (onError) onError(error);
    }
  );
}

// 4c. Create a new Contrato Vigente
export async function criarContratoVigente(
  dados: Omit<ContratoVigente, 'id' | 'criadoEm' | 'atualizadoEm' | 'statusPrazo'>,
  usuarioAtual: Usuario
): Promise<string> {
  const colRef = collection(db, 'contratosVigentes');
  const agora = new Date().toISOString();
  const statusPrazo = calcularStatusPrazo(dados.dataFinalExecucao);

  const docRef = await addDoc(colRef, {
    ...dados,
    statusPrazo,
    criadoEm: agora,
    atualizadoEm: agora
  });

  try {
    await addDoc(collection(db, 'auditoria_geral'), {
      contratoId: docRef.id,
      usuario: usuarioAtual.nome,
      email: usuarioAtual.email,
      acao: `Cadastrou o contrato vigente #${dados.numeroContrato} (${dados.empresa})`,
      dataHora: agora,
      referencia: `Contrato: ${dados.numeroContrato}`,
      tipoAcao: 'criacao'
    });
  } catch {
    // Non-blocking
  }

  return docRef.id;
}

// 4d. Update Contrato Vigente
export async function atualizarContratoVigente(
  contratoId: string,
  dados: Partial<ContratoVigente>,
  usuarioAtual: Usuario
) {
  const docRef = doc(db, 'contratosVigentes', contratoId);
  const agora = new Date().toISOString();
  const statusPrazo = dados.dataFinalExecucao ? calcularStatusPrazo(dados.dataFinalExecucao) : undefined;

  const updatePayload: any = {
    ...dados,
    atualizadoEm: agora
  };
  if (statusPrazo) updatePayload.statusPrazo = statusPrazo;

  await updateDoc(docRef, updatePayload);

  try {
    await addDoc(collection(db, 'auditoria_geral'), {
      contratoId,
      usuario: usuarioAtual.nome,
      email: usuarioAtual.email,
      acao: `Atualizou os dados do contrato vigente`,
      dataHora: agora,
      referencia: `Contrato ID: ${contratoId}`,
      tipoAcao: 'edicao'
    });
  } catch {
    // Non-blocking
  }
}

// 4e. Update Situacao Manual (when no active process)
export async function atualizarSituacaoManualContrato(
  contratoId: string,
  situacaoManual: string,
  usuarioAtual: Usuario
) {
  const docRef = doc(db, 'contratosVigentes', contratoId);
  await updateDoc(docRef, {
    situacaoManual: situacaoManual.trim(),
    atualizadoEm: new Date().toISOString()
  });

  try {
    await addDoc(collection(db, 'auditoria_geral'), {
      contratoId,
      usuario: usuarioAtual.nome,
      email: usuarioAtual.email,
      acao: `Definiu observação de situação manual: "${situacaoManual.trim()}"`,
      dataHora: new Date().toISOString(),
      referencia: `Contrato ID: ${contratoId}`,
      tipoAcao: 'edicao'
    });
  } catch {
    // Non-blocking
  }
}

// 4f. Delete Contrato Vigente
export async function excluirContratoVigente(
  contratoId: string,
  numeroContrato: string,
  usuarioAtual: Usuario
) {
  const docRef = doc(db, 'contratosVigentes', contratoId);
  await deleteDoc(docRef);

  try {
    await addDoc(collection(db, 'auditoria_geral'), {
      contratoId,
      usuario: usuarioAtual.nome,
      email: usuarioAtual.email,
      acao: `Excluiu o contrato vigente #${numeroContrato}`,
      dataHora: new Date().toISOString(),
      referencia: `Contrato #${numeroContrato}`,
      tipoAcao: 'exclusao'
    });
  } catch {
    // Non-blocking
  }
}

// 4g. Import batch contracts (from CSV or spreadsheet)
export async function importarContratosEmLote(
  contratos: Omit<ContratoVigente, 'id' | 'criadoEm' | 'atualizadoEm' | 'statusPrazo'>[],
  usuarioAtual: Usuario
): Promise<number> {
  const agora = new Date().toISOString();
  const batch = writeBatch(db);
  const colRef = collection(db, 'contratosVigentes');

  contratos.forEach((c) => {
    const docRef = doc(colRef);
    const statusPrazo = calcularStatusPrazo(c.dataFinalExecucao);
    batch.set(docRef, {
      ...c,
      statusPrazo,
      criadoEm: agora,
      atualizadoEm: agora
    });
  });

  await batch.commit();

  try {
    await addDoc(collection(db, 'auditoria_geral'), {
      usuario: usuarioAtual.nome,
      email: usuarioAtual.email,
      acao: `Importou lote de ${contratos.length} contratos vigentes`,
      dataHora: agora,
      referencia: 'Importação em Lote',
      tipoAcao: 'criacao'
    });
  } catch {
    // Non-blocking
  }

  return contratos.length;
}

// 4h. Convert concluded/homologated Licitação process into a new Contrato Vigente
export async function converterProcessoEmContratoVigente(
  processo: ProcessoContrato,
  usuarioAtual: Usuario,
  dadosExtras?: {
    numeroContrato?: string;
    projeto?: string;
    gestor?: string;
    dataOrdemServico?: string;
    dataInicialExecucao?: string;
    dataFinalExecucao?: string;
  }
): Promise<string> {
  const colRef = collection(db, 'contratosVigentes');
  const snap = await getDocs(colRef);
  const nextNumero = snap.size + 1;
  const agora = new Date().toISOString();
  const dataFinalExec = dadosExtras?.dataFinalExecucao || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const novoContrato: Omit<ContratoVigente, 'id'> = {
    numero: nextNumero,
    gestor: dadosExtras?.gestor || usuarioAtual.nome,
    numeroContrato: dadosExtras?.numeroContrato || processo.numeroProcesso || `CT.PS.${new Date().getFullYear() % 100}.1.${Math.floor(100 + Math.random() * 900)}`,
    projeto: dadosExtras?.projeto || (processo.lotacaoDestino.includes('CGF') ? 'CGF001FLT' : processo.lotacaoDestino.includes('CSG') ? 'CSG001MNT' : 'GAD001ADM'),
    empresa: processo.empresaContratada || 'Empresa Vencedora da Licitação',
    objeto: processo.descricaoObjeto,
    valorAnual: processo.valorEstimado || 0,
    dataOrdemServico: dadosExtras?.dataOrdemServico || agora.split('T')[0],
    dataInicialExecucao: dadosExtras?.dataInicialExecucao || agora.split('T')[0],
    dataFinalExecucao: dataFinalExec,
    dataInicialVigencia: dadosExtras?.dataInicialExecucao || agora.split('T')[0],
    dataFinalVigencia: dataFinalExec,
    statusPrazo: calcularStatusPrazo(dataFinalExec),
    situacaoManual: '',
    criadoEm: agora,
    atualizadoEm: agora
  };

  const docRef = await addDoc(colRef, novoContrato);

  // Link back to the process
  await updateDoc(doc(db, 'processos', processo.id), {
    contratoVigenteId: docRef.id,
    atualizadoEm: agora
  });

  await registrarLog(processo.id, {
    usuario: usuarioAtual.nome,
    email: usuarioAtual.email,
    acao: `Converteu o processo de Licitação no Contrato Vigente oficial #${novoContrato.numeroContrato}`,
    referencia: `Contrato: ${novoContrato.numeroContrato}`,
    tipoAcao: 'criacao',
    detalhes: `Novo contrato registrado na base da GAD com ID: ${docRef.id}`
  });

  return docRef.id;
}

// 5. Create new process with all default stages
export async function criarNovoProcesso(dados: {
  lotacaoDestino: ProcessoContrato['lotacaoDestino'];
  tipoAcao: TipoAcao;
  descricaoObjeto: string;
  contratoVigenteId?: string | null;
  dataReferencia?: string | null;
  numeroProcesso?: string;
  empresaContratada?: string;
  valorEstimado?: number;
  usuarioAtual: Usuario;
}): Promise<string> {
  const {
    lotacaoDestino,
    tipoAcao,
    descricaoObjeto,
    contratoVigenteId,
    dataReferencia,
    numeroProcesso,
    empresaContratada,
    valorEstimado,
    usuarioAtual
  } = dados;
  const agora = new Date().toISOString();

  const processoRef = doc(collection(db, 'processos'));
  const processoId = processoRef.id;

  const template = TEMPLATES_FLUXOS[tipoAcao] || [];
  const primeiraEtapaNome = template[0]?.nome || null;

  const novoProcesso: Omit<ProcessoContrato, 'id'> = {
    lotacaoDestino,
    tipoAcao,
    descricaoObjeto,
    contratoVigenteId: contratoVigenteId || null,
    dataReferencia: dataReferencia || null,
    proximaEtapaPendenteNome: primeiraEtapaNome,
    numeroProcesso: numeroProcesso?.trim() || `PROC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    empresaContratada: empresaContratada || '',
    valorEstimado: valorEstimado || 0,
    statusGeral: 'em_andamento',
    criadoPor: usuarioAtual.nome,
    emailCriador: usuarioAtual.email,
    criadoEm: agora,
    atualizadoEm: agora,
    etapasTotal: template.length,
    etapasConcluidas: 0,
    progressoPercentual: 0
  };

  await setDoc(processoRef, novoProcesso);

  // Add all template stages
  const batch = writeBatch(db);
  const etapasCol = collection(db, 'processos', processoId, 'etapas');

  template.forEach((item, index) => {
    const etapaDoc = doc(etapasCol);
    const ordem = index + 1;
    const isPrimeira = ordem === 1;

    const novaEtapa: Omit<EtapaProcesso, 'id'> = {
      ordem,
      nome: item.nome,
      status: isPrimeira ? 'em_andamento' : 'pendente',
      condicional: !!item.condicional,
      descricaoCondicional: item.descricaoCondicional || '',
      dataInicio: isPrimeira ? agora : null,
      dataConclusao: null,
      responsavelConclusao: null,
      emailResponsavelConclusao: null,
      diasCorridos: 0,
      observacao: '',
      anexos: [],
      criadaEm: agora
    };

    batch.set(etapaDoc, novaEtapa);
  });

  await batch.commit();

  // Audit log
  await registrarLog(processoId, {
    usuario: usuarioAtual.nome,
    email: usuarioAtual.email,
    acao: `Criou o processo de contrato (${tipoAcao})`,
    referencia: `Processo #${novoProcesso.numeroProcesso}`,
    tipoAcao: 'criacao',
    detalhes: `Lotação: ${lotacaoDestino} | Objeto: ${descricaoObjeto.substring(0, 100)}`
  });

  return processoId;
}

// 6. Update stage status (Concluir, Desfazer, Não Aplicável, Em Andamento)
export async function atualizarStatusEtapa(params: {
  processoId: string;
  etapaId: string;
  novoStatus: StatusEtapa;
  usuarioAtual: Usuario;
  etapaNome: string;
  todasEtapas: EtapaProcesso[];
}) {
  const { processoId, etapaId, novoStatus, usuarioAtual, etapaNome, todasEtapas } = params;
  const etapaRef = doc(db, 'processos', processoId, 'etapas', etapaId);
  const etapaAtual = todasEtapas.find((e) => e.id === etapaId);
  const agora = new Date().toISOString();

  let updateData: Partial<EtapaProcesso> = {
    status: novoStatus
  };

  let acaoDesc = '';
  let tipoLog: LogAcao['tipoAcao'] = 'etapa';

  if (novoStatus === 'concluida') {
    const dataInicioCalculada = etapaAtual?.dataInicio || etapaAtual?.criadaEm || agora;
    const dias = calcularDiasCorridos(dataInicioCalculada, agora);
    updateData = {
      ...updateData,
      status: 'concluida',
      dataConclusao: agora,
      dataInicio: dataInicioCalculada,
      responsavelConclusao: usuarioAtual.nome,
      emailResponsavelConclusao: usuarioAtual.email,
      diasCorridos: dias
    };
    acaoDesc = `Concluiu a etapa "${etapaNome}" (${dias} dias decorridos)`;
    tipoLog = 'conclusao';
  } else if (novoStatus === 'pendente') {
    updateData = {
      ...updateData,
      status: 'pendente',
      dataConclusao: null,
      responsavelConclusao: null,
      emailResponsavelConclusao: null,
      diasCorridos: 0
    };
    acaoDesc = `Desfez a conclusão da etapa "${etapaNome}" (revertida para pendente)`;
    tipoLog = 'reversao';
  } else if (novoStatus === 'nao_aplicavel') {
    updateData = {
      ...updateData,
      status: 'nao_aplicavel',
      dataConclusao: null,
      responsavelConclusao: usuarioAtual.nome,
      emailResponsavelConclusao: usuarioAtual.email
    };
    acaoDesc = `Marcou a etapa "${etapaNome}" como NÃO APLICÁVEL`;
  } else if (novoStatus === 'em_andamento') {
    updateData = {
      ...updateData,
      status: 'em_andamento',
      dataInicio: etapaAtual?.dataInicio || agora,
      dataConclusao: null
    };
    acaoDesc = `Iniciou a etapa "${etapaNome}" (em andamento)`;
  }

  await updateDoc(etapaRef, updateData);

  // Recalculate metrics on parent process
  const etapasAtualizadas = todasEtapas.map((e) => (e.id === etapaId ? { ...e, ...updateData } : e));
  const concluidasOuNaoAplicaveis = etapasAtualizadas.filter(
    (e) => e.status === 'concluida' || e.status === 'nao_aplicavel'
  ).length;
  const concluidasReais = etapasAtualizadas.filter((e) => e.status === 'concluida').length;
  const total = etapasAtualizadas.length;
  const percentual = total > 0 ? Math.round((concluidasOuNaoAplicaveis / total) * 100) : 0;

  let novoStatusGeral: StatusGeralProcesso = 'em_andamento';
  if (percentual === 100) {
    novoStatusGeral = 'concluido';
  } else if (concluidasOuNaoAplicaveis === 0) {
    novoStatusGeral = 'nao_iniciado';
  }

  // Find next pending or in-progress stage to feed dynamic Situação Atual
  const pendenteOuAndamento = etapasAtualizadas
    .filter((e) => e.status !== 'concluida' && e.status !== 'nao_aplicavel')
    .sort((a, b) => a.ordem - b.ordem);
  const proximaEtapaPendenteNome = pendenteOuAndamento.length > 0 ? pendenteOuAndamento[0].nome : null;

  const processoRef = doc(db, 'processos', processoId);
  await updateDoc(processoRef, {
    etapasTotal: total,
    etapasConcluidas: concluidasReais,
    progressoPercentual: percentual,
    statusGeral: novoStatusGeral,
    proximaEtapaPendenteNome,
    atualizadoEm: agora
  });

  // Log action
  await registrarLog(processoId, {
    usuario: usuarioAtual.nome,
    email: usuarioAtual.email,
    acao: acaoDesc,
    referencia: `Etapa: ${etapaNome}`,
    tipoAcao: tipoLog,
    detalhes: `Status alterado para: ${novoStatus.toUpperCase()}`
  });
}

// 7. Save observation for a stage
export async function salvarObservacaoEtapa(params: {
  processoId: string;
  etapaId: string;
  etapaNome: string;
  observacao: string;
  usuarioAtual: Usuario;
}) {
  const { processoId, etapaId, etapaNome, observacao, usuarioAtual } = params;
  const etapaRef = doc(db, 'processos', processoId, 'etapas', etapaId);
  await updateDoc(etapaRef, { observacao });

  await registrarLog(processoId, {
    usuario: usuarioAtual.nome,
    email: usuarioAtual.email,
    acao: `Atualizou observação na etapa "${etapaNome}"`,
    referencia: `Etapa: ${etapaNome}`,
    tipoAcao: 'edicao',
    detalhes: observacao ? `Observação: ${observacao.substring(0, 80)}...` : 'Observação limpa'
  });
}

// 8. Add attachment to a stage
export async function adicionarAnexoEtapa(params: {
  processoId: string;
  etapaId: string;
  etapaNome: string;
  novoAnexo: AnexoEtapa;
  anexosAtuais: AnexoEtapa[];
  usuarioAtual: Usuario;
}) {
  const { processoId, etapaId, etapaNome, novoAnexo, anexosAtuais, usuarioAtual } = params;
  const etapaRef = doc(db, 'processos', processoId, 'etapas', etapaId);
  const atualizados = [...(anexosAtuais || []), novoAnexo];
  await updateDoc(etapaRef, { anexos: atualizados });

  await registrarLog(processoId, {
    usuario: usuarioAtual.nome,
    email: usuarioAtual.email,
    acao: `Anexou documento "${novoAnexo.nome}" na etapa "${etapaNome}"`,
    referencia: `Etapa: ${etapaNome}`,
    tipoAcao: 'edicao',
    detalhes: `Arquivo: ${novoAnexo.nome}`
  });
}

// 9. Add custom stage to process
export async function adicionarEtapaCustomizada(params: {
  processoId: string;
  nome: string;
  usuarioAtual: Usuario;
  posicaoOrdem: number;
}) {
  const { processoId, nome, usuarioAtual, posicaoOrdem } = params;
  const etapasCol = collection(db, 'processos', processoId, 'etapas');
  const agora = new Date().toISOString();

  const novaEtapaDoc = doc(etapasCol);
  const novaEtapa: Omit<EtapaProcesso, 'id'> = {
    ordem: posicaoOrdem,
    nome: nome.trim(),
    status: 'pendente',
    condicional: false,
    dataInicio: null,
    dataConclusao: null,
    responsavelConclusao: null,
    emailResponsavelConclusao: null,
    diasCorridos: 0,
    observacao: '',
    anexos: [],
    criadaEm: agora
  };

  await setDoc(novaEtapaDoc, novaEtapa);

  await registrarLog(processoId, {
    usuario: usuarioAtual.nome,
    email: usuarioAtual.email,
    acao: `Adicionou nova etapa customizada: "${nome.trim()}"`,
    referencia: `Etapa: ${nome.trim()}`,
    tipoAcao: 'etapa',
    detalhes: `Posição de ordem: ${posicaoOrdem}`
  });
}

// 10. Remove stage
export async function removerEtapa(params: {
  processoId: string;
  etapaId: string;
  etapaNome: string;
  usuarioAtual: Usuario;
}) {
  const { processoId, etapaId, etapaNome, usuarioAtual } = params;
  const etapaRef = doc(db, 'processos', processoId, 'etapas', etapaId);
  await deleteDoc(etapaRef);

  await registrarLog(processoId, {
    usuario: usuarioAtual.nome,
    email: usuarioAtual.email,
    acao: `Removeu a etapa "${etapaNome}"`,
    referencia: `Etapa: ${etapaNome}`,
    tipoAcao: 'exclusao'
  });
}

// 11. Edit process info
export async function editarProcesso(params: {
  processoId: string;
  dados: Partial<ProcessoContrato>;
  usuarioAtual: Usuario;
}) {
  const { processoId, dados, usuarioAtual } = params;
  const procRef = doc(db, 'processos', processoId);
  await updateDoc(procRef, {
    ...dados,
    atualizadoEm: new Date().toISOString()
  });

  await registrarLog(processoId, {
    usuario: usuarioAtual.nome,
    email: usuarioAtual.email,
    acao: 'Atualizou dados cadastrais do processo',
    referencia: `Processo ID: ${processoId}`,
    tipoAcao: 'edicao',
    detalhes: Object.keys(dados).join(', ')
  });
}

// 12. Delete process
export async function excluirProcesso(processoId: string, numeroProcesso: string, usuarioAtual: Usuario) {
  const procRef = doc(db, 'processos', processoId);
  await deleteDoc(procRef);

  try {
    await addDoc(collection(db, 'auditoria_geral'), {
      processoId,
      usuario: usuarioAtual.nome,
      email: usuarioAtual.email,
      acao: `Excluiu o processo #${numeroProcesso}`,
      dataHora: new Date().toISOString(),
      referencia: `Processo #${numeroProcesso}`,
      tipoAcao: 'exclusao'
    });
  } catch {
    // Non-blocking
  }
}

// 13. Update user profile and approval status (MASTER only)
export async function atualizarUsuarioPerfil(params: {
  targetUid: string;
  targetEmail: string;
  targetNome: string;
  novoPerfil: PerfilUsuario;
  novoStatus: StatusUsuario;
  usuarioAtual: Usuario;
}) {
  const { targetUid, targetEmail, targetNome, novoPerfil, novoStatus, usuarioAtual } = params;
  const userRef = doc(db, 'usuarios', targetUid);

  await updateDoc(userRef, {
    perfil: novoPerfil,
    status: novoStatus,
    aprovadoPor: usuarioAtual.email,
    aprovadoEm: new Date().toISOString()
  });

  // Global audit log for user profile changes
  await addDoc(collection(db, 'auditoria_geral'), {
    usuario: usuarioAtual.nome,
    email: usuarioAtual.email,
    acao: `Alterou perfil do usuário ${targetNome} (${targetEmail}) para ${novoPerfil} [${novoStatus}]`,
    dataHora: new Date().toISOString(),
    referencia: `Usuário: ${targetEmail}`,
    tipoAcao: 'perfil',
    detalhes: `Perfil: ${novoPerfil} | Status: ${novoStatus}`
  });
}

// 14. Seed default sample data if empty
let hasSeededOrChecked = false;
export async function seedExemplosSeVazio(usuarioAtual: Usuario) {
  if (hasSeededOrChecked) return;
  hasSeededOrChecked = true;
  try {
    const agora = new Date().toISOString();

    // 1. Seed Contratos Vigentes se a coleção estiver vazia
    const contratosSnap = await getDocs(collection(db, 'contratosVigentes'));
    const contratoIdMap: Record<string, string> = {};

    if (contratosSnap.empty) {
      console.log('Populando base de Contratos Vigentes da GAD...');

      for (const item of CONTRATOS_EXEMPLO_GAD) {
        const statusPrazo = calcularStatusPrazo(item.dataFinalExecucao);
        const docRef = await addDoc(collection(db, 'contratosVigentes'), {
          ...item,
          statusPrazo,
          criadoEm: agora,
          atualizadoEm: agora
        });
        contratoIdMap[item.numeroContrato] = docRef.id;
      }
    } else {
      contratosSnap.forEach((d) => {
        const c = d.data() as ContratoVigente;
        if (c.numeroContrato) contratoIdMap[c.numeroContrato] = d.id;
      });
    }

    // 2. Seed Processos se a coleção estiver vazia
    const procSnap = await getDocs(collection(db, 'processos'));
    if (procSnap.empty) {
      console.log('Populando processos e fluxos da GAD...');

    // Processo 1: Licitação de Novo Contrato para GAD
    const id1 = await criarNovoProcesso({
      lotacaoDestino: 'GAD — Gerência Administrativa e de Suporte',
      tipoAcao: 'LICITAÇÃO / NOVO CONTRATO',
      descricaoObjeto: 'Contratação de serviços continuados de apoio administrativo, recepção e copeiragem com dedicação exclusiva de mão de obra para os prédios da Sede e Unidades Regionais da COMPESA.',
      numeroProcesso: 'PROC-2026-0814',
      empresaContratada: 'Consórcio ServSul Gestão & Serviços',
      valorEstimado: 4850000.0,
      usuarioAtual
    });

    // Processo 2: Aditivo em Contrato Vigente (CT.PS.23.2.203)
    const id2 = await criarNovoProcesso({
      lotacaoDestino: 'GAD — Gerência Administrativa e de Suporte',
      tipoAcao: 'ADITIVO (RENOVAÇÃO/SUPRESSÃO/ACRÉSCIMO) EM CONTRATO',
      descricaoObjeto: '1º Termo Aditivo de prorrogação e readequação de quantitativos do Contrato CT.PS.23.2.203 de apoio operacional.',
      numeroProcesso: 'ADIT-2026-0203',
      contratoVigenteId: contratoIdMap['CT.PS.23.2.203'] || null,
      dataReferencia: '2026-10-15',
      empresaContratada: 'ServSul Gestão & Facilities Ltda',
      valorEstimado: 4850000.0,
      usuarioAtual
    });

    // Processo 3: Reajuste Retroativo em Contrato Vigente (CT.PS.24.1.089)
    const id3 = await criarNovoProcesso({
      lotacaoDestino: 'CSG — Coordenação de Serviços Gerais',
      tipoAcao: 'REAJUSTE RETROATIVO EM CONTRATO',
      descricaoObjeto: 'Reajuste retroativo por índice IPCA referente ao período 2024-2025 para contrato de manutenção predial e climatização.',
      numeroProcesso: 'REAJ-2026-0419',
      contratoVigenteId: contratoIdMap['CT.PS.24.1.089'] || null,
      dataReferencia: '2024-03-20',
      empresaContratada: 'ClimaFrio Engenharia Térmica Ltda',
      valorEstimado: 890000.0,
      usuarioAtual
    });

    const diasAtras = (dias: number) => new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();

    // Advance stages in Licitação (Proc 1)
    const etapas1Snap = await getDocs(collection(db, 'processos', id1, 'etapas'));
    const etapas1List: EtapaProcesso[] = [];
    etapas1Snap.forEach((docSnap) => {
      etapas1List.push({ id: docSnap.id, ...docSnap.data() } as EtapaProcesso);
    });
    etapas1List.sort((a, b) => a.ordem - b.ordem);

    if (etapas1List.length >= 4) {
      await updateDoc(doc(db, 'processos', id1, 'etapas', etapas1List[0].id), {
        status: 'concluida',
        dataInicio: diasAtras(25),
        dataConclusao: diasAtras(18),
        diasCorridos: 7,
        responsavelConclusao: usuarioAtual.nome,
        emailResponsavelConclusao: usuarioAtual.email,
        observacao: 'Planilha de dimensionamento de postos validada com todas as gerências.'
      });

      await updateDoc(doc(db, 'processos', id1, 'etapas', etapas1List[1].id), {
        status: 'concluida',
        dataInicio: diasAtras(18),
        dataConclusao: diasAtras(10),
        diasCorridos: 8,
        responsavelConclusao: 'Analista de Custos CCR',
        emailResponsavelConclusao: 'ccr.custos@compesa.com.br',
        observacao: 'Pesquisa com base em Acordo Coletivo e convenção sindical regional.'
      });

      await updateDoc(doc(db, 'processos', id1, 'etapas', etapas1List[2].id), {
        status: 'concluida',
        dataInicio: diasAtras(10),
        dataConclusao: diasAtras(4),
        diasCorridos: 6,
        responsavelConclusao: usuarioAtual.nome,
        emailResponsavelConclusao: usuarioAtual.email
      });

      await updateDoc(doc(db, 'processos', id1, 'etapas', etapas1List[3].id), {
        status: 'em_andamento',
        dataInicio: diasAtras(4),
        observacao: 'Aguardando validação jurídica do capítulo de sanções administrativas.'
      });

      await updateDoc(doc(db, 'processos', id1), {
        etapasConcluidas: 3,
        progressoPercentual: Math.round((3 / etapas1List.length) * 100),
        proximaEtapaPendenteNome: etapas1List[3].nome,
        statusGeral: 'em_andamento'
      });
    }

    // Advance stages in Aditivo (Proc 2): 5 steps completed, 6th pending: "Carta de concordância (Contratada)"
    const etapas2Snap = await getDocs(collection(db, 'processos', id2, 'etapas'));
    const etapas2List: EtapaProcesso[] = [];
    etapas2Snap.forEach((docSnap) => {
      etapas2List.push({ id: docSnap.id, ...docSnap.data() } as EtapaProcesso);
    });
    etapas2List.sort((a, b) => a.ordem - b.ordem);

    if (etapas2List.length >= 6) {
      // Complete steps 0, 1, 2, 3, 4
      for (let i = 0; i < 5; i++) {
        await updateDoc(doc(db, 'processos', id2, 'etapas', etapas2List[i].id), {
          status: 'concluida',
          dataInicio: diasAtras(30 - i * 5),
          dataConclusao: diasAtras(25 - i * 5),
          diasCorridos: 5,
          responsavelConclusao: usuarioAtual.nome,
          emailResponsavelConclusao: usuarioAtual.email
        });
      }

      // Step 5 (index 5) is "Carta de concordância (Contratada)" -> set as em_andamento / pendente
      await updateDoc(doc(db, 'processos', id2, 'etapas', etapas2List[5].id), {
        status: 'em_andamento',
        dataInicio: diasAtras(2),
        observacao: 'Ofício enviado à empresa contratada, aguardando manifestação formal.'
      });

      await updateDoc(doc(db, 'processos', id2), {
        etapasConcluidas: 5,
        progressoPercentual: Math.round((5 / etapas2List.length) * 100),
        proximaEtapaPendenteNome: etapas2List[5].nome, // "Carta de concordância (Contratada)"
        statusGeral: 'em_andamento'
      });
    }

    // Advance stages in Reajuste (Proc 3): step 0 done, step 1 pending: "Cálculo de reajuste retroativo (CCR)"
    const etapas3Snap = await getDocs(collection(db, 'processos', id3, 'etapas'));
    const etapas3List: EtapaProcesso[] = [];
    etapas3Snap.forEach((docSnap) => {
      etapas3List.push({ id: docSnap.id, ...docSnap.data() } as EtapaProcesso);
    });
    etapas3List.sort((a, b) => a.ordem - b.ordem);

    if (etapas3List.length >= 2) {
      await updateDoc(doc(db, 'processos', id3, 'etapas', etapas3List[0].id), {
        status: 'concluida',
        dataInicio: diasAtras(12),
        dataConclusao: diasAtras(7),
        diasCorridos: 5,
        responsavelConclusao: 'Protocolo Central',
        emailResponsavelConclusao: 'protocolo@compesa.com.br'
      });

      await updateDoc(doc(db, 'processos', id3, 'etapas', etapas3List[1].id), {
        status: 'em_andamento',
        dataInicio: diasAtras(7),
        observacao: 'Memória de cálculo em análise técnica na Coordenação de Custos (CCR).'
      });

      await updateDoc(doc(db, 'processos', id3), {
        etapasConcluidas: 1,
        progressoPercentual: Math.round((1 / etapas3List.length) * 100),
        proximaEtapaPendenteNome: etapas3List[1].nome,
        statusGeral: 'em_andamento'
      });
    }
  }

  // 3. Seed Gestores se vazio
    const gestoresSnap = await getDocs(collection(db, 'gestores'));
    if (gestoresSnap.empty) {
      const gestoresPadrao = [
        { nome: 'Gildson Barbalho dos Anjos', lotacao: 'GAD — Gerência Administrativa', cargo: 'Gestor de Contratos', email: 'gildson.anjos@compesa.com.br' },
        { nome: 'Marcio de Andrade Miranda', lotacao: 'GAD — Gerência Administrativa', cargo: 'Gestor Administrativo', email: 'marcio.miranda@compesa.com.br' },
        { nome: 'Ana Cristina de Albuquerque', lotacao: 'CSG — Serviços Gerais', cargo: 'Coordenadora Técnica', email: 'ana.albuquerque@compesa.com.br' },
        { nome: 'Roberto Carlos da Silva', lotacao: 'CGF — Gestão de Frotas', cargo: 'Supervisor de Frotas', email: 'roberto.silva@compesa.com.br' },
        { nome: 'Mariana Duarte Tavares', lotacao: 'GAD — Gerência Administrativa', cargo: 'Analista de Contratos', email: 'mariana.tavares@compesa.com.br' }
      ];
      for (const g of gestoresPadrao) {
        await addDoc(collection(db, 'gestores'), {
          ...g,
          ativo: true,
          criadoEm: agora,
          atualizadoEm: agora
        });
      }
    }

    // 4. Seed Empresas se vazio
    const empresasSnap = await getDocs(collection(db, 'empresasContratadas'));
    if (empresasSnap.empty) {
      const empresasPadrao = [
        { razaoSocial: 'ServSul Gestão & Facilities Ltda', cnpj: '12.345.678/0001-90', nomeFantasia: 'ServSul Facilities', email: 'contato@servsul.com.br' },
        { razaoSocial: 'ClimaFrio Engenharia Térmica Ltda', cnpj: '98.765.432/0001-10', nomeFantasia: 'ClimaFrio', email: 'comercial@climafrio.com.br' },
        { razaoSocial: 'Segurança Total Vigilância Armada Ltda', cnpj: '45.678.901/0001-23', nomeFantasia: 'Segurança Total', email: 'operacoes@segurancatotal.com.br' },
        { razaoSocial: 'LocaFácil Frotas e Serviços S/A', cnpj: '23.456.789/0001-45', nomeFantasia: 'LocaFácil', email: 'frotas@locafacil.com.br' },
        { razaoSocial: 'TeleCom Soluções e Redes Corporativas', cnpj: '34.567.890/0001-67', nomeFantasia: 'TeleCom Soluções', email: 'suporte@telecom.com.br' },
        { razaoSocial: 'Limpeza & Cia Terceirização de Serviços', cnpj: '56.789.012/0001-89', nomeFantasia: 'Limpeza & Cia', email: 'atendimento@limpezacia.com.br' },
        { razaoSocial: 'Engenharia Predial Pernambuco Ltda', cnpj: '67.890.123/0001-01', nomeFantasia: 'Predial PE', email: 'obras@predialpe.com.br' }
      ];
      for (const emp of empresasPadrao) {
        await addDoc(collection(db, 'empresasContratadas'), {
          ...emp,
          ativo: true,
          criadoEm: agora,
          atualizadoEm: agora
        });
      }
    }

    console.log('Dados de demonstração populados com sucesso!');
  } catch (error) {
    console.error('Aviso ao popular exemplos:', error);
  }
}

// 15. Gestores Responsáveis CRUD
export function subscribeGestores(
  onUpdate: (gestores: GestorResponsavel[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, 'gestores'), orderBy('nome', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const lista: GestorResponsavel[] = [];
      snapshot.forEach((docSnap) => {
        lista.push({ id: docSnap.id, ...docSnap.data() } as GestorResponsavel);
      });
      onUpdate(lista);
    },
    (err) => {
      if (onError) onError(err);
      else console.error('Erro ao escutar gestores:', err);
    }
  );
}

export async function criarGestor(
  dados: Omit<GestorResponsavel, 'id' | 'criadoEm' | 'atualizadoEm'>,
  usuarioAtual: Usuario
): Promise<string> {
  const agora = new Date().toISOString();
  const docRef = await addDoc(collection(db, 'gestores'), {
    ...dados,
    ativo: dados.ativo !== undefined ? dados.ativo : true,
    criadoEm: agora,
    atualizadoEm: agora
  });

  try {
    await addDoc(collection(db, 'auditoria_geral'), {
      usuario: usuarioAtual.nome,
      email: usuarioAtual.email,
      acao: `Cadastrou o gestor responsável "${dados.nome}"`,
      dataHora: agora,
      referencia: `Gestor: ${dados.nome}`,
      tipoAcao: 'criacao'
    });
  } catch {
    // Non-blocking
  }

  return docRef.id;
}

export async function atualizarGestor(
  id: string,
  dados: Partial<Omit<GestorResponsavel, 'id' | 'criadoEm'>>,
  usuarioAtual: Usuario
): Promise<void> {
  const agora = new Date().toISOString();
  await updateDoc(doc(db, 'gestores', id), {
    ...dados,
    atualizadoEm: agora
  });

  try {
    await addDoc(collection(db, 'auditoria_geral'), {
      usuario: usuarioAtual.nome,
      email: usuarioAtual.email,
      acao: `Atualizou o gestor "${dados.nome || id}"`,
      dataHora: agora,
      referencia: `Gestor: ${id}`,
      tipoAcao: 'edicao'
    });
  } catch {
    // Non-blocking
  }
}

export async function excluirGestor(
  id: string,
  nome: string,
  usuarioAtual: Usuario
): Promise<void> {
  await deleteDoc(doc(db, 'gestores', id));

  try {
    await addDoc(collection(db, 'auditoria_geral'), {
      usuario: usuarioAtual.nome,
      email: usuarioAtual.email,
      acao: `Excluiu o gestor responsável "${nome}"`,
      dataHora: new Date().toISOString(),
      referencia: `Gestor: ${id}`,
      tipoAcao: 'exclusao'
    });
  } catch {
    // Non-blocking
  }
}

// 16. Empresas Contratadas CRUD
export function subscribeEmpresasContratadas(
  onUpdate: (empresas: EmpresaContratada[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(collection(db, 'empresasContratadas'), orderBy('razaoSocial', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const lista: EmpresaContratada[] = [];
      snapshot.forEach((docSnap) => {
        lista.push({ id: docSnap.id, ...docSnap.data() } as EmpresaContratada);
      });
      onUpdate(lista);
    },
    (err) => {
      if (onError) onError(err);
      else console.error('Erro ao escutar empresas contratadas:', err);
    }
  );
}

export async function criarEmpresaContratada(
  dados: Omit<EmpresaContratada, 'id' | 'criadoEm' | 'atualizadoEm'>,
  usuarioAtual: Usuario
): Promise<string> {
  const agora = new Date().toISOString();
  const docRef = await addDoc(collection(db, 'empresasContratadas'), {
    ...dados,
    ativo: dados.ativo !== undefined ? dados.ativo : true,
    criadoEm: agora,
    atualizadoEm: agora
  });

  try {
    await addDoc(collection(db, 'auditoria_geral'), {
      usuario: usuarioAtual.nome,
      email: usuarioAtual.email,
      acao: `Cadastrou a empresa contratada "${dados.razaoSocial}" (CNPJ: ${dados.cnpj})`,
      dataHora: agora,
      referencia: `Empresa: ${dados.razaoSocial}`,
      tipoAcao: 'criacao'
    });
  } catch {
    // Non-blocking
  }

  return docRef.id;
}

export async function atualizarEmpresaContratada(
  id: string,
  dados: Partial<Omit<EmpresaContratada, 'id' | 'criadoEm'>>,
  usuarioAtual: Usuario
): Promise<void> {
  const agora = new Date().toISOString();
  await updateDoc(doc(db, 'empresasContratadas', id), {
    ...dados,
    atualizadoEm: agora
  });

  try {
    await addDoc(collection(db, 'auditoria_geral'), {
      usuario: usuarioAtual.nome,
      email: usuarioAtual.email,
      acao: `Atualizou os dados da empresa "${dados.razaoSocial || id}"`,
      dataHora: agora,
      referencia: `Empresa: ${id}`,
      tipoAcao: 'edicao'
    });
  } catch {
    // Non-blocking
  }
}

export async function excluirEmpresaContratada(
  id: string,
  razaoSocial: string,
  usuarioAtual: Usuario
): Promise<void> {
  await deleteDoc(doc(db, 'empresasContratadas', id));

  try {
    await addDoc(collection(db, 'auditoria_geral'), {
      usuario: usuarioAtual.nome,
      email: usuarioAtual.email,
      acao: `Excluiu a empresa contratada "${razaoSocial}"`,
      dataHora: new Date().toISOString(),
      referencia: `Empresa: ${id}`,
      tipoAcao: 'exclusao'
    });
  } catch {
    // Non-blocking
  }
}
