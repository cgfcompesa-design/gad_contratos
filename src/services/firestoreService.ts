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
import { db } from '../firebase';
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
  AnexoEtapa
} from '../types';
import { TEMPLATES_FLUXOS } from '../data/flowTemplates';

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

// 5. Create new process with all default stages
export async function criarNovoProcesso(dados: {
  lotacaoDestino: ProcessoContrato['lotacaoDestino'];
  tipoAcao: TipoAcao;
  descricaoObjeto: string;
  numeroProcesso?: string;
  empresaContratada?: string;
  valorEstimado?: number;
  usuarioAtual: Usuario;
}): Promise<string> {
  const { lotacaoDestino, tipoAcao, descricaoObjeto, numeroProcesso, empresaContratada, valorEstimado, usuarioAtual } = dados;
  const agora = new Date().toISOString();

  const processoRef = doc(collection(db, 'processos'));
  const processoId = processoRef.id;

  const template = TEMPLATES_FLUXOS[tipoAcao] || [];

  const novoProcesso: Omit<ProcessoContrato, 'id'> = {
    lotacaoDestino,
    tipoAcao,
    descricaoObjeto,
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

  const processoRef = doc(db, 'processos', processoId);
  await updateDoc(processoRef, {
    etapasTotal: total,
    etapasConcluidas: concluidasReais,
    progressoPercentual: percentual,
    statusGeral: novoStatusGeral,
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
export async function seedExemplosSeVazio(usuarioAtual: Usuario) {
  try {
    const snap = await getDocs(collection(db, 'processos'));
    if (!snap.empty) {
      return; // Already has data
    }

    console.log('Populando dados iniciais da GAD...');

    // Exemplo 1: Licitação de Mão de Obra para GAD
    const id1 = await criarNovoProcesso({
      lotacaoDestino: 'GAD — Gerência Administrativa e de Suporte',
      tipoAcao: 'LICITAÇÃO / NOVO CONTRATO com Mão de Obra',
      descricaoObjeto: 'Contratação de serviços continuados de apoio administrativo, recepção e copeiragem com dedicação exclusiva de mão de obra para os prédios da Sede e Unidades Regionais da COMPESA.',
      numeroProcesso: 'PROC-2026-0814',
      empresaContratada: 'Consórcio ServSul Gestão & Serviços',
      valorEstimado: 4850000.0,
      usuarioAtual
    });

    // Exemplo 2: Aditivo na Coordenação de Gestão de Frotas (CGF)
    const id2 = await criarNovoProcesso({
      lotacaoDestino: 'CGF — Coordenação de Gestão de Frotas',
      tipoAcao: 'ADITIVO (RENOVAÇÃO/SUPRESSÃO/ACRÉSCIMO) EM CONTRATO',
      descricaoObjeto: '1º Termo Aditivo de renovação do Contrato de locação e manutenção preventiva/corretiva de veículos operacionais leves e utilitários da frota COMPESA.',
      numeroProcesso: 'PROC-2026-1120',
      empresaContratada: 'Locavel Frotas Nordeste S/A',
      valorEstimado: 1720000.0,
      usuarioAtual
    });

    // Exemplo 3: Reajuste Retroativo na CSG
    const id3 = await criarNovoProcesso({
      lotacaoDestino: 'CSG — Coordenação de Serviços Gerais',
      tipoAcao: 'REAJUSTE RETROATIVO EM CONTRATO',
      descricaoObjeto: 'Reajuste retroativo por índice IPCA referente ao período 2024-2025 para contrato de manutenção predial e climatização.',
      numeroProcesso: 'PROC-2026-0419',
      empresaContratada: 'ClimaFrio Engenharia Térmica Ltda',
      valorEstimado: 340000.0,
      usuarioAtual
    });

    // Advance some stages in sample 1 to make Gantt and Kanban immediately impressive
    const etapasSnap = await getDocs(collection(db, 'processos', id1, 'etapas'));
    const etapasList: EtapaProcesso[] = [];
    etapasSnap.forEach((docSnap) => {
      etapasList.push({ id: docSnap.id, ...docSnap.data() } as EtapaProcesso);
    });
    etapasList.sort((a, b) => a.ordem - b.ordem);

    if (etapasList.length >= 6) {
      // Mark step 1, 2, 3 as done with days, step 4 as in progress
      const diasAtras = (dias: number) => new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();

      await updateDoc(doc(db, 'processos', id1, 'etapas', etapasList[0].id), {
        status: 'concluida',
        dataInicio: diasAtras(25),
        dataConclusao: diasAtras(18),
        diasCorridos: 7,
        responsavelConclusao: usuarioAtual.nome,
        emailResponsavelConclusao: usuarioAtual.email,
        observacao: 'Planilha de dimensionamento de postos validada com todas as gerências.'
      });

      await updateDoc(doc(db, 'processos', id1, 'etapas', etapasList[1].id), {
        status: 'concluida',
        dataInicio: diasAtras(18),
        dataConclusao: diasAtras(10),
        diasCorridos: 8,
        responsavelConclusao: 'Analista de Custos CCR',
        emailResponsavelConclusao: 'ccr.custos@compesa.com.br',
        observacao: 'Pesquisa com base em Acordo Coletivo e convenção sindical regional.'
      });

      await updateDoc(doc(db, 'processos', id1, 'etapas', etapasList[2].id), {
        status: 'concluida',
        dataInicio: diasAtras(10),
        dataConclusao: diasAtras(4),
        diasCorridos: 6,
        responsavelConclusao: usuarioAtual.nome,
        emailResponsavelConclusao: usuarioAtual.email
      });

      await updateDoc(doc(db, 'processos', id1, 'etapas', etapasList[3].id), {
        status: 'em_andamento',
        dataInicio: diasAtras(4),
        observacao: 'Aguardando validação jurídica do capítulo de sanções administrativas.'
      });

      // Update parent process 1 metrics
      await updateDoc(doc(db, 'processos', id1), {
        etapasConcluidas: 3,
        progressoPercentual: Math.round((3 / etapasList.length) * 100),
        statusGeral: 'em_andamento'
      });
    }

    console.log('Dados de demonstração populados com sucesso!');
  } catch (error) {
    console.error('Aviso ao popular exemplos:', error);
  }
}
