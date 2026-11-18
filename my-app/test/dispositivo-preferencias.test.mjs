import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  setStorageBackend,
  carregarPreferencias,
  salvarPreferencias,
  PREFERENCIAS_PADRAO,
  salvarDocumentoLocal,
  listarDocumentosLocais,
  limparArmazenamento,
} from '../src/services/storage.js';

import {
  obterCores,
  coresClaro,
  coresEscuro,
} from '../src/theme/index.js';

import {
  compartilharTexto,
  formatarTextoCertificado,
  compartilharCertificado,
  formatarTextoCurso,
  compartilharCurso,
  verificarPermissao,
  solicitarPermissao,
  vibrarDispositivo,
  exportarCertificadoLocal,
  listarCertificadosExportados,
  setDispositivoBackend,
  resetDispositivoBackend,
} from '../src/services/dispositivo.js';

// Mock de armazenamento em memória para testes
function criarStorageMock() {
  const map = new Map();
  return {
    async getItem(k) {
      return map.has(k) ? map.get(k) : null;
    },
    async setItem(k, v) {
      map.set(k, String(v));
    },
    async removeItem(k) {
      map.delete(k);
    },
    async clear() {
      map.clear();
    },
  };
}

describe('ETAPA 07 — Gerenciamento de Estado Global (Preferências e Tema)', () => {
  beforeEach(async () => {
    setStorageBackend(criarStorageMock());
    await limparArmazenamento();
  });

  it('1. PREFERENCIAS_PADRAO possui a estrutura e valores iniciais esperados', () => {
    assert.equal(PREFERENCIAS_PADRAO.tema, 'claro');
    assert.equal(PREFERENCIAS_PADRAO.exibirBibliografia, true);
    assert.equal(PREFERENCIAS_PADRAO.alunoAtivoId, null);
    assert.equal(PREFERENCIAS_PADRAO.notificacoesHabilitadas, true);
  });

  it('2. carregarPreferencias() retorna os padrões na primeira execução', async () => {
    const prefs = await carregarPreferencias();
    assert.deepEqual(prefs, PREFERENCIAS_PADRAO);
  });

  it('3. salvarPreferencias() persiste alterações e mescla com dados existentes', async () => {
    await salvarPreferencias({ tema: 'escuro', alunoAtivoId: 'usr-1' });
    const atualizadas = await carregarPreferencias();

    assert.equal(atualizadas.tema, 'escuro');
    assert.equal(atualizadas.alunoAtivoId, 'usr-1');
    assert.equal(atualizadas.exibirBibliografia, true); // manteve o padrão
    assert.equal(atualizadas.notificacoesHabilitadas, true);
  });

  it('4. alternar preferência de bibliografia persiste no armazenamento', async () => {
    await salvarPreferencias({ exibirBibliografia: false });
    let prefs = await carregarPreferencias();
    assert.equal(prefs.exibirBibliografia, false);

    await salvarPreferencias({ exibirBibliografia: true });
    prefs = await carregarPreferencias();
    assert.equal(prefs.exibirBibliografia, true);
  });

  it('5. obterCores() retorna paleta correta para claro e escuro', () => {
    const claro = obterCores('claro');
    const escuro = obterCores('escuro');

    assert.equal(claro.fundo, coresClaro.fundo);
    assert.equal(escuro.fundo, coresEscuro.fundo);
    assert.notEqual(claro.fundo, escuro.fundo);
    assert.notEqual(claro.papel, escuro.papel);
    assert.notEqual(claro.tinta, escuro.tinta);
  });

  it('6. Paleta escura possui tokens de alto contraste para acessibilidade', () => {
    assert.ok(coresEscuro.fundo.startsWith('#'));
    assert.ok(coresEscuro.papel.startsWith('#'));
    assert.ok(coresEscuro.tinta.startsWith('#'));
    assert.ok(coresEscuro.primaria.startsWith('#'));
    assert.ok(coresEscuro.sucesso.startsWith('#'));
    assert.ok(coresEscuro.erro.startsWith('#'));
  });
});

describe('ETAPA 07 — Recursos do Dispositivo: Compartilhamento Nativo (Share API)', () => {
  beforeEach(() => {
    resetDispositivoBackend();
  });

  it('1. formatarTextoCertificado() gera mensagem completa com aluno, curso e validação', () => {
    const aluno = { nome: 'Lucas Silva' };
    const curso = { titulo: 'React Native Avançado', cargaHoraria: 40 };
    const matricula = { id: 'mat-100', data: '2026-05-10T10:00:00Z' };
    const professor = { nome: 'Prof. Carlos' };

    const texto = formatarTextoCertificado({ aluno, curso, matricula, professor });

    assert.ok(texto.includes('Lucas Silva'));
    assert.ok(texto.includes('React Native Avançado'));
    assert.ok(texto.includes('40 horas'));
    assert.ok(texto.includes('Prof. Carlos'));
    assert.ok(texto.includes('mat-100'));
    assert.ok(texto.includes('https://eduplataforma.app/validar/mat-100'));
  });

  it('2. formatarTextoCurso() gera resumo com investimento, professor e ementa', () => {
    const curso = {
      id: 'cur-1',
      titulo: 'TypeScript para Iniciantes',
      cargaHoraria: 20,
      preco: 150,
      descricao: 'Aprenda tipos estáticos.',
    };
    const professor = { nome: 'Mariana Lima' };
    const categoria = { nome: 'Programação' };

    const texto = formatarTextoCurso({ curso, professor, categoria });

    assert.ok(texto.includes('TypeScript para Iniciantes'));
    assert.ok(texto.includes('Mariana Lima'));
    assert.ok(texto.includes('Programação'));
    assert.ok(texto.includes('20 horas'));
    assert.ok(texto.includes('R$'));
    assert.ok(texto.includes('https://eduplataforma.app/cursos/cur-1'));
  });

  it('3. compartilharTexto() rejeita conteúdo vazio com erro explicativo', async () => {
    const resultado = await compartilharTexto({ titulo: '', mensagem: '', url: '' });
    assert.equal(resultado.sucesso, false);
    assert.ok(resultado.mensagem.includes('não pode ser vazio'));
  });

  it('4. ESTADO SUCESSO: compartilharTexto() processa compartilhamento concluído', async () => {
    let compartilhado = false;
    setDispositivoBackend({
      async compartilhar({ titulo, mensagem, url }) {
        compartilhado = true;
        return {
          sucesso: true,
          acao: 'compartilhado',
          activityType: 'com.whatsapp',
          mensagem: 'Conteúdo compartilhado com sucesso!',
        };
      },
    });

    const resultado = await compartilharTexto({
      titulo: 'Certificado',
      mensagem: 'Meu certificado',
      url: 'https://eduplataforma.app',
    });

    assert.equal(compartilhado, true);
    assert.equal(resultado.sucesso, true);
    assert.equal(resultado.acao, 'compartilhado');
  });

  it('5. ESTADO CANCELAMENTO: compartilharTexto() detecta cancelamento pelo usuário', async () => {
    setDispositivoBackend({
      async compartilhar() {
        return {
          sucesso: false,
          acao: 'cancelado',
          mensagem: 'Compartilhamento cancelado pelo usuário.',
        };
      },
    });

    const resultado = await compartilharTexto({ titulo: 'Teste', mensagem: 'Mensagem' });
    assert.equal(resultado.sucesso, false);
    assert.equal(resultado.acao, 'cancelado');
  });

  it('6. ESTADO ERRO/FALHA: compartilharTexto() trata exceção da plataforma nativa', async () => {
    setDispositivoBackend({
      async compartilhar() {
        throw new Error('Serviço de compartilhamento do SO inacessível.');
      },
    });

    try {
      await compartilharTexto({ titulo: 'Erro', mensagem: 'Falha' });
    } catch (e) {
      assert.ok(e.message.includes('inacessível'));
    }
  });

  it('7. compartilharCertificado() e compartilharCurso() delegam corretamente', async () => {
    let enviado = null;
    setDispositivoBackend({
      async compartilhar(dados) {
        enviado = dados;
        return { sucesso: true, mensagem: 'OK' };
      },
    });

    await compartilharCertificado({
      aluno: { nome: 'Ana' },
      curso: { titulo: 'UX Design', cargaHoraria: 10 },
      matricula: { id: 'mat-50', data: '2026-01-01' },
      professor: { nome: 'Bia' },
    });

    assert.ok(enviado.mensagem.includes('Ana'));
    assert.ok(enviado.mensagem.includes('UX Design'));

    await compartilharCurso({
      curso: { id: 'c1', titulo: 'DevOps', cargaHoraria: 30, preco: 0 },
      professor: { nome: 'Lucas' },
      categoria: { nome: 'Infra' },
    });

    assert.ok(enviado.mensagem.includes('DevOps'));
    assert.ok(enviado.mensagem.includes('Gratuito'));
  });
});

describe('ETAPA 07 — Recursos do Dispositivo: Permissões, Vibração e Exportação de Arquivos', () => {
  beforeEach(async () => {
    resetDispositivoBackend();
    setStorageBackend(criarStorageMock());
    await limparArmazenamento();
  });

  it('1. verificarPermissao() retorna status estruturado', async () => {
    setDispositivoBackend({
      async verificarPermissao(tipo) {
        return { status: 'granted', concedida: true, mensagem: `Permissão para ${tipo} concedida.` };
      },
    });

    const res = await verificarPermissao('armazenamento');
    assert.equal(res.status, 'granted');
    assert.equal(res.concedida, true);
  });

  it('2. solicitarPermissao() trata cenário de concessão de permissão', async () => {
    setDispositivoBackend({
      async solicitarPermissao(tipo, just) {
        return {
          status: 'granted',
          concedida: true,
          mensagem: 'Permissão concedida com sucesso pelo usuário.',
        };
      },
    });

    const res = await solicitarPermissao('armazenamento', {
      titulo: 'Acesso a arquivos',
      mensagem: 'Salvar certificado no aparelho',
    });

    assert.equal(res.concedida, true);
    assert.equal(res.status, 'granted');
  });

  it('3. solicitarPermissao() trata cenário de recusa com mensagem explicativa', async () => {
    setDispositivoBackend({
      async solicitarPermissao() {
        return {
          status: 'denied',
          concedida: false,
          mensagem: 'Permissão recusada pelo usuário. A operação não pôde ser concluída.',
        };
      },
    });

    const res = await solicitarPermissao('armazenamento');
    assert.equal(res.concedida, false);
    assert.equal(res.status, 'denied');
    assert.ok(res.mensagem.includes('recusada'));
  });

  it('4. vibrarDispositivo() dispara feedback tátil com duração', () => {
    let duracaoVibrada = 0;
    setDispositivoBackend({
      vibrar(ms) {
        duracaoVibrada = ms;
        return true;
      },
    });

    const retorno = vibrarDispositivo(150);
    assert.equal(retorno, true);
    assert.equal(duracaoVibrada, 150);
  });

  it('5. exportarCertificadoLocal() bloqueia operação quando permissão é negada', async () => {
    setDispositivoBackend({
      async solicitarPermissao() {
        return {
          status: 'denied',
          concedida: false,
          mensagem: 'Permissão negada.',
        };
      },
    });

    const resultado = await exportarCertificadoLocal({
      matricula: { id: 'mat-1', data: '2026-01-01' },
      aluno: { nome: 'João' },
      curso: { titulo: 'Node.js', cargaHoraria: 20 },
      professor: { nome: 'Carlos' },
    });

    assert.equal(resultado.sucesso, false);
    assert.equal(resultado.permissaoNegada, true);
    assert.ok(resultado.mensagem.includes('recusada'));

    // Garante que nenhum documento foi gravado sem permissão
    const exportados = await listarCertificadosExportados();
    assert.equal(exportados.length, 0);
  });

  it('6. exportarCertificadoLocal() gera comprovante digital, aciona vibração e persiste', async () => {
    let vibrou = false;
    setDispositivoBackend({
      async solicitarPermissao() {
        return { status: 'granted', concedida: true, mensagem: 'Concedida' };
      },
      vibrar() {
        vibrou = true;
        return true;
      },
    });

    const resultado = await exportarCertificadoLocal({
      matricula: { id: 'mat-888', data: '2026-03-15' },
      aluno: { nome: 'Mariana Duarte' },
      curso: { titulo: 'Design de Interfaces', cargaHoraria: 35 },
      professor: { nome: 'Prof. Sofia' },
    });

    assert.equal(resultado.sucesso, true);
    assert.equal(vibrou, true);
    assert.ok(resultado.documento);
    assert.equal(resultado.documento.matriculaId, 'mat-888');
    assert.ok(resultado.documento.hashAutenticidade.startsWith('SHA256-'));
    assert.equal(resultado.documento.formato, 'JSON-CERT-DIGITAL');

    // Confirma persistência do arquivo no dispositivo
    const exportados = await listarCertificadosExportados();
    assert.equal(exportados.length, 1);
    assert.equal(exportados[0].id, resultado.documento.id);
  });
});
