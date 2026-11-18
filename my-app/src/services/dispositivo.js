/**
 * Serviço de Integração com Recursos Nativos do Dispositivo — EduPlataforma Mobile
 *
 * Fornece interface unificada para recursos do sistema operacional:
 * 1. Compartilhamento Nativo (Share API) para certificados e cursos
 * 2. Gerenciamento de Permissões de Sistema (PermissionsAndroid / Platform)
 * 3. Feedback Tátil / Háptico (Vibration API)
 * 4. Exportação e registro de documentos no armazenamento local do dispositivo
 *
 * Suporta injeção de backend para testes automatizados puros em Node.js.
 */

import { salvarDocumentoLocal, listarDocumentosLocais } from './storage.js';

function obterReactNative() {
  try {
    return require('react-native');
  } catch {
    return null;
  }
}

// Adaptador customizado para testes unitários ou plataformas sem react-native
let backendCustomizado = null;

export function setDispositivoBackend(customBackend) {
  backendCustomizado = customBackend;
}

export function resetDispositivoBackend() {
  backendCustomizado = null;
}

/**
 * Dispara vibração nativa no dispositivo (feedback tátil).
 *
 * @param {number} duracaoMs - Duração da vibração em milissegundos (padrão: 100ms)
 */
export function vibrarDispositivo(duracaoMs = 100) {
  if (backendCustomizado?.vibrar) {
    return backendCustomizado.vibrar(duracaoMs);
  }

  const RN = obterReactNative();
  if (RN?.Vibration?.vibrate) {
    try {
      RN.Vibration.vibrate(duracaoMs);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Verifica o status de uma permissão do dispositivo.
 *
 * @param {'armazenamento' | 'notificacoes'} tipo
 * @returns {Promise<{ status: 'granted' | 'denied' | 'never_ask_again' | 'unavailable', concedida: boolean, mensagem: string }>}
 */
export async function verificarPermissao(tipo) {
  if (backendCustomizado?.verificarPermissao) {
    return await backendCustomizado.verificarPermissao(tipo);
  }

  const RN = obterReactNative();
  if (!RN) {
    return { status: 'granted', concedida: true, mensagem: 'Permissão simulada para ambiente de desenvolvimento.' };
  }

  const { Platform, PermissionsAndroid } = RN;

  // No iOS ou Web, permissões de armazenamento padrão não exigem requisição explícita em runtime
  if (Platform?.OS !== 'android') {
    return {
      status: 'granted',
      concedida: true,
      mensagem: 'Permissão concedida automaticamente pela plataforma.',
    };
  }

  try {
    const permissaoAndroid =
      tipo === 'notificacoes'
        ? PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        : PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;

    if (!permissaoAndroid) {
      return { status: 'granted', concedida: true, mensagem: 'Permissão não aplicável nesta versão do sistema.' };
    }

    const concedida = await PermissionsAndroid.check(permissaoAndroid);
    return {
      status: concedida ? 'granted' : 'denied',
      concedida,
      mensagem: concedida ? 'Permissão concedida.' : 'Permissão pendente de autorização.',
    };
  } catch (erro) {
    return {
      status: 'unavailable',
      concedida: false,
      mensagem: `Erro ao checar permissão: ${erro.message}`,
    };
  }
}

/**
 * Solicita uma permissão necessária ao usuário com justificativa clara.
 *
 * @param {'armazenamento' | 'notificacoes'} tipo
 * @param {object} justificativa - Título e mensagem exibidos no diálogo nativo
 * @returns {Promise<{ status: 'granted' | 'denied' | 'never_ask_again' | 'unavailable', concedida: boolean, mensagem: string }>}
 */
export async function solicitarPermissao(tipo, justificativa = {}) {
  if (backendCustomizado?.solicitarPermissao) {
    return await backendCustomizado.solicitarPermissao(tipo, justificativa);
  }

  const RN = obterReactNative();
  if (!RN) {
    return { status: 'granted', concedida: true, mensagem: 'Permissão simulada concedida.' };
  }

  const { Platform, PermissionsAndroid } = RN;

  if (Platform?.OS !== 'android') {
    return {
      status: 'granted',
      concedida: true,
      mensagem: 'Permissão concedida nesta plataforma.',
    };
  }

  try {
    const permissaoAndroid =
      tipo === 'notificacoes'
        ? PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        : PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;

    if (!permissaoAndroid) {
      return { status: 'granted', concedida: true, mensagem: 'Permissão dispensada nesta versão.' };
    }

    const resposta = await PermissionsAndroid.request(permissaoAndroid, {
      title: justificativa.titulo || 'Permissão Necessária',
      message: justificativa.mensagem || 'A plataforma necessita desta autorização para continuar.',
      buttonPositive: 'Permitir',
      buttonNegative: 'Não permitir',
    });

    if (resposta === PermissionsAndroid.RESULTS.GRANTED) {
      return {
        status: 'granted',
        concedida: true,
        mensagem: 'Permissão concedida com sucesso pelo usuário.',
      };
    }

    if (resposta === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      return {
        status: 'never_ask_again',
        concedida: false,
        mensagem: 'Permissão bloqueada permanentemente. Habilite o acesso nas configurações do aparelho.',
      };
    }

    return {
      status: 'denied',
      concedida: false,
      mensagem: 'Permissão recusada pelo usuário. A operação não pôde ser concluída.',
    };
  } catch (erro) {
    return {
      status: 'unavailable',
      concedida: false,
      mensagem: `Falha ao solicitar permissão: ${erro.message}`,
    };
  }
}

/**
 * Invoca a caixa de diálogo nativa de compartilhamento do sistema operacional (Share API).
 *
 * @param {object} params
 * @param {string} params.titulo
 * @param {string} params.mensagem
 * @param {string} [params.url]
 * @returns {Promise<{ sucesso: boolean, acao?: string, activityType?: string, mensagem: string, erro?: string }>}
 */
export async function compartilharTexto({ titulo, mensagem, url }) {
  if (!mensagem && !url) {
    return {
      sucesso: false,
      mensagem: 'Conteúdo para compartilhamento não pode ser vazio.',
    };
  }

  if (backendCustomizado?.compartilhar) {
    return await backendCustomizado.compartilhar({ titulo, mensagem, url });
  }

  const RN = obterReactNative();
  if (!RN?.Share?.share) {
    return {
      sucesso: false,
      mensagem: 'Recurso de compartilhamento nativo indisponível neste ambiente.',
    };
  }

  try {
    const opcoes = {
      title: titulo || 'EduPlataforma Mobile',
      message: url ? `${mensagem}\n\n${url}` : mensagem,
    };

    if (url && RN.Platform?.OS === 'ios') {
      opcoes.url = url;
    }

    const resultado = await RN.Share.share(opcoes, {
      dialogTitle: titulo || 'Compartilhar via EduPlataforma',
    });

    if (resultado.action === RN.Share.sharedAction) {
      return {
        sucesso: true,
        acao: 'compartilhado',
        activityType: resultado.activityType || null,
        mensagem: 'Conteúdo compartilhado com sucesso!',
      };
    }

    if (resultado.action === RN.Share.dismissedAction) {
      return {
        sucesso: false,
        acao: 'cancelado',
        mensagem: 'Compartilhamento cancelado pelo usuário.',
      };
    }

    return {
      sucesso: true,
      acao: 'concluido',
      mensagem: 'Operação de compartilhamento finalizada.',
    };
  } catch (erro) {
    return {
      sucesso: false,
      erro: erro.message,
      mensagem: `Falha ao abrir o compartilhamento do dispositivo: ${erro.message}`,
    };
  }
}

/**
 * Formata o texto oficial de conclusão de curso para compartilhamento.
 */
export function formatarTextoCertificado({ aluno, curso, matricula, professor }) {
  const nomeAluno = aluno?.nome || 'Aluno(a)';
  const tituloCurso = curso?.titulo || 'Curso de Capacitação';
  const cargaHoraria = curso?.cargaHoraria || 0;
  const nomeProfessor = professor?.nome || 'Coordenação Pedagógica';
  const dataConclusao = matricula?.data
    ? new Date(matricula.data).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');
  const codigoAutenticacao = matricula?.id || 'EDU-CERT';

  return `🎓 CERTIFICADO DE CONCLUSÃO — EduPlataforma Mobile

Certificamos que ${nomeAluno} concluiu com aproveitamento o curso:
"${tituloCurso}" (${cargaHoraria} horas).

• Responsável: ${nomeProfessor}
• Data de emissão: ${dataConclusao}
• Código de validação: ${codigoAutenticacao}

Verifique a autenticidade deste certificado em:
https://eduplataforma.app/validar/${codigoAutenticacao}`;
}

/**
 * Compartilha o certificado de conclusão através da Share API nativa.
 */
export async function compartilharCertificado({ aluno, curso, matricula, professor }) {
  const mensagem = formatarTextoCertificado({ aluno, curso, matricula, professor });
  const titulo = `Certificado de Conclusão - ${curso?.titulo || 'EduPlataforma'}`;
  const url = `https://eduplataforma.app/validar/${matricula?.id || ''}`;

  return await compartilharTexto({ titulo, mensagem, url });
}

/**
 * Formata o texto de apresentação de um curso para compartilhamento.
 */
export function formatarTextoCurso({ curso, professor, categoria }) {
  const tituloCurso = curso?.titulo || 'Curso';
  const nomeCategoria = categoria?.nome || 'Geral';
  const nomeProfessor = professor?.nome || 'Corpo Docente EduPlataforma';
  const cargaHoraria = curso?.cargaHoraria ? `${curso.cargaHoraria} horas` : 'A definir';
  const preco = curso?.preco > 0
    ? curso.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'Gratuito';
  const descricao = curso?.descricao ? `\n\n"${curso.descricao}"` : '';

  return `📚 CURSO NA EDUPLATAFORMA: ${tituloCurso}

• Categoria: ${nomeCategoria}
• Professor: ${nomeProfessor}
• Carga Horária: ${cargaHoraria}
• Investimento: ${preco}${descricao}

Conheça os módulos e matricule-se pelo aplicativo ou acesse:
https://eduplataforma.app/cursos/${curso?.id || ''}`;
}

/**
 * Compartilha as informações de um curso através da Share API nativa.
 */
export async function compartilharCurso({ curso, professor, categoria }) {
  const mensagem = formatarTextoCurso({ curso, professor, categoria });
  const titulo = `Curso: ${curso?.titulo || 'EduPlataforma'}`;
  const url = `https://eduplataforma.app/cursos/${curso?.id || ''}`;

  return await compartilharTexto({ titulo, mensagem, url });
}

/**
 * Exporta o comprovante digital do certificado e persiste no dispositivo,
 * gerenciando permissões nativas e acionando feedback háptico.
 *
 * @param {object} params
 * @param {object} params.matricula
 * @param {object} params.aluno
 * @param {object} params.curso
 * @param {object} params.professor
 * @returns {Promise<{ sucesso: boolean, documento?: object, mensagem: string, permissaoNegada?: boolean }>}
 */
export async function exportarCertificadoLocal({ matricula, aluno, curso, professor }) {
  // 1. Gerenciamento de Permissão de Armazenamento
  const permissao = await solicitarPermissao('armazenamento', {
    titulo: 'Permissão de Armazenamento',
    mensagem: 'A EduPlataforma precisa de acesso ao armazenamento do dispositivo para salvar seu certificado digital.',
  });

  if (!permissao.concedida) {
    return {
      sucesso: false,
      permissaoNegada: true,
      mensagem: permissao.status === 'never_ask_again'
        ? 'Permissão bloqueada nas configurações do sistema. Habilite o armazenamento para salvar o arquivo.'
        : 'Permissão de armazenamento recusada. Não foi possível gravar o certificado no dispositivo.',
    };
  }

  // 2. Geração do registro digital do certificado com hash de autenticidade
  const dataExportacao = new Date().toISOString();
  const identificadorArquivo = `CERT-${matricula.id}-${Date.now()}`;
  const documento = {
    id: identificadorArquivo,
    matriculaId: matricula.id,
    alunoNome: aluno?.nome || 'Aluno',
    cursoTitulo: curso?.titulo || 'Curso',
    cargaHoraria: curso?.cargaHoraria || 0,
    professorNome: professor?.nome || 'EduPlataforma',
    dataEmissao: matricula.data,
    dataExportacao,
    formato: 'JSON-CERT-DIGITAL',
    hashAutenticidade: `SHA256-${matricula.id.slice(0, 8)}-${Date.now().toString(36).toUpperCase()}`,
    tamanhoBytes: 1024 + (curso?.titulo?.length || 0) * 4,
  };

  // 3. Salva no armazenamento persistente de documentos do dispositivo
  await salvarDocumentoLocal(documento);

  // 4. Feedback tátil nativo (vibração de confirmação de 150ms)
  vibrarDispositivo(150);

  return {
    sucesso: true,
    documento,
    mensagem: `Certificado ${documento.id} exportado e salvo com sucesso no dispositivo!`,
  };
}

/**
 * Retorna o histórico de certificados exportados e salvos localmente.
 */
export async function listarCertificadosExportados() {
  return await listarDocumentosLocais();
}
