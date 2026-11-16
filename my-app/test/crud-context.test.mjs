import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAVES_STORAGE,
  carregarTodosOsDados,
  salvarColecao,
  obterItem,
  setStorageBackend,
} from '../src/services/storage.js';
import {
  categoriasIniciais,
  cursosIniciais,
  usuariosIniciais,
  modulosIniciais,
  aulasIniciais,
  matriculasIniciais,
  planosIniciais,
  assinaturasIniciais,
  pagamentosIniciais,
} from '../src/data/seed.js';

function criarMockAsyncStorage() {
  const store = new Map();
  return {
    getItem: async (chave) => (store.has(chave) ? store.get(chave) : null),
    setItem: async (chave, valor) => store.set(chave, String(valor)),
    removeItem: async (chave) => store.delete(chave),
    clear: async () => store.clear(),
    getAllKeys: async () => Array.from(store.keys()),
  };
}

// Simulador leve do DadosContext para testar regras de negócio e consultas
class DadosContextSimulator {
  constructor() {
    this.categorias = [];
    this.usuarios = [];
    this.cursos = [];
    this.modulos = [];
    this.aulas = [];
    this.matriculas = [];
    this.planos = [];
    this.assinaturas = [];
    this.pagamentos = [];
    this.contador = 0;
  }

  novoId(prefixo) {
    return `${prefixo}-${Date.now()}-${this.contador++}`;
  }

  async inicializar() {
    const dados = await carregarTodosOsDados();
    this.categorias = [...dados.categorias];
    this.usuarios = [...dados.usuarios];
    this.cursos = [...dados.cursos];
    this.modulos = [...dados.modulos];
    this.aulas = [...dados.aulas];
    this.matriculas = [...dados.matriculas];
    this.planos = [...dados.planos];
    this.assinaturas = [...dados.assinaturas];
    this.pagamentos = [...dados.pagamentos];
  }

  criarCrud(colecaoNome, prefixo, chaveStorage) {
    return {
      criar: async (dados) => {
        const registro = { ...dados, id: this.novoId(prefixo) };
        this[colecaoNome] = [...this[colecaoNome], registro];
        await salvarColecao(chaveStorage, this[colecaoNome]);
        return registro;
      },
      atualizar: async (id, dados) => {
        let atualizado = null;
        this[colecaoNome] = this[colecaoNome].map((item) => {
          if (item.id === id) {
            atualizado = { ...item, ...dados };
            return atualizado;
          }
          return item;
        });
        await salvarColecao(chaveStorage, this[colecaoNome]);
        return atualizado;
      },
      remover: async (id) => {
        this[colecaoNome] = this[colecaoNome].filter((item) => item.id !== id);
        await salvarColecao(chaveStorage, this[colecaoNome]);
      },
    };
  }

  async removerCurso(id) {
    const modulosDoCurso = this.modulos.filter((m) => m.cursoId === id).map((m) => m.id);
    this.aulas = this.aulas.filter((a) => !modulosDoCurso.includes(a.moduloId));
    this.modulos = this.modulos.filter((m) => m.cursoId !== id);
    this.matriculas = this.matriculas.filter((mat) => mat.cursoId !== id);
    this.cursos = this.cursos.filter((c) => c.id !== id);

    await Promise.all([
      salvarColecao(CHAVES_STORAGE.AULAS, this.aulas),
      salvarColecao(CHAVES_STORAGE.MODULOS, this.modulos),
      salvarColecao(CHAVES_STORAGE.MATRICULAS, this.matriculas),
      salvarColecao(CHAVES_STORAGE.CURSOS, this.cursos),
    ]);
  }

  async removerModulo(id) {
    this.aulas = this.aulas.filter((a) => a.moduloId !== id);
    this.modulos = this.modulos.filter((m) => m.id !== id);

    await Promise.all([
      salvarColecao(CHAVES_STORAGE.AULAS, this.aulas),
      salvarColecao(CHAVES_STORAGE.MODULOS, this.modulos),
    ]);
  }

  async alternarConclusao(matriculaId) {
    this.matriculas = this.matriculas.map((m) => {
      if (m.id !== matriculaId) return m;
      const concluida = !m.concluida;
      return { ...m, concluida, certificadoEmitido: concluida && m.certificadoEmitido };
    });
    await salvarColecao(CHAVES_STORAGE.MATRICULAS, this.matriculas);
  }

  async emitirCertificado(matriculaId) {
    this.matriculas = this.matriculas.map((m) =>
      m.id === matriculaId ? { ...m, certificadoEmitido: true } : m
    );
    await salvarColecao(CHAVES_STORAGE.MATRICULAS, this.matriculas);
  }

  async alternarAssinatura(assinaturaId) {
    this.assinaturas = this.assinaturas.map((a) =>
      a.id === assinaturaId ? { ...a, ativa: !a.ativa } : a
    );
    await salvarColecao(CHAVES_STORAGE.ASSINATURAS, this.assinaturas);
  }

  async registrarPagamento(pagamentoId) {
    this.pagamentos = this.pagamentos.map((p) =>
      p.id === pagamentoId ? { ...p, status: 'Pago' } : p
    );
    await salvarColecao(CHAVES_STORAGE.PAGAMENTOS, this.pagamentos);
  }

  // Consultas
  categoriaPorId(id) { return this.categorias.find((c) => c.id === id); }
  cursoPorId(id) { return this.cursos.find((c) => c.id === id); }
  usuarioPorId(id) { return this.usuarios.find((u) => u.id === id); }
  professores() { return this.usuarios.filter((u) => u.perfil === 'Professor'); }
  alunos() { return this.usuarios.filter((u) => u.perfil === 'Aluno'); }
  cursosDaCategoria(categoriaId) { return this.cursos.filter((c) => c.categoriaId === categoriaId); }
  modulosDoCurso(cursoId) { return this.modulos.filter((m) => m.cursoId === cursoId).sort((a, b) => a.ordem - b.ordem); }
  aulasDoModulo(moduloId) { return this.aulas.filter((a) => a.moduloId === moduloId).sort((a, b) => a.ordem - b.ordem); }
  matriculasDoCurso(cursoId) { return this.matriculas.filter((m) => m.cursoId === cursoId); }
  receitaConfirmada() { return this.pagamentos.filter((p) => p.status === 'Pago').reduce((t, p) => t + p.valor, 0); }
  receitaPendente() { return this.pagamentos.filter((p) => p.status !== 'Pago').reduce((t, p) => t + p.valor, 0); }
}

test.describe('Operações de Domínio e Integração de Contexto', () => {
  let sim;

  test.beforeEach(async () => {
    setStorageBackend(criarMockAsyncStorage());
    sim = new DadosContextSimulator();
    await sim.inicializar();
  });

  test('Operações de Categorias e bloqueio relacional', async () => {
    const crud = sim.criarCrud('categorias', 'cat', CHAVES_STORAGE.CATEGORIAS);

    // Criar
    const nova = await crud.criar({ nome: 'DevOps', descricao: 'CI/CD, Docker, Kubernetes' });
    assert.ok(nova.id.startsWith('cat-'));
    assert.equal(sim.categorias.length, categoriasIniciais.length + 1);

    // Consulta relacional: verificar cursos da categoria recém criada (deve ser 0)
    assert.equal(sim.cursosDaCategoria(nova.id).length, 0);

    // Atualizar
    await crud.atualizar(nova.id, { nome: 'DevOps & Nuvem' });
    assert.equal(sim.categoriaPorId(nova.id).nome, 'DevOps & Nuvem');

    // Remover
    await crud.remover(nova.id);
    assert.equal(sim.categoriaPorId(nova.id), undefined);
    assert.equal(sim.categorias.length, categoriasIniciais.length);
  });

  test('Operações de Cursos com cascata completa', async () => {
    const crudCursos = sim.criarCrud('cursos', 'cur', CHAVES_STORAGE.CURSOS);
    const crudModulos = sim.criarCrud('modulos', 'mod', CHAVES_STORAGE.MODULOS);
    const crudAulas = sim.criarCrud('aulas', 'aul', CHAVES_STORAGE.AULAS);
    const crudMatriculas = sim.criarCrud('matriculas', 'mat', CHAVES_STORAGE.MATRICULAS);

    // Criar curso
    const curso = await crudCursos.criar({
      titulo: 'Next.js 15 Fullstack',
      descricao: 'SSR, App Router e Server Actions',
      categoriaId: 'cat-1',
      professorId: 'usr-1',
      cargaHoraria: 50,
      preco: 199.0,
      publicado: true,
    });

    // Criar módulo para o curso
    const modulo = await crudModulos.criar({
      cursoId: curso.id,
      titulo: 'Fundamentos de Next.js',
      ordem: 1,
    });

    // Criar aula para o módulo
    const aula = await crudAulas.criar({
      moduloId: modulo.id,
      titulo: 'Server vs Client Components',
      duracaoMin: 20,
      ordem: 1,
    });

    // Criar matrícula para o curso
    const matricula = await crudMatriculas.criar({
      cursoId: curso.id,
      alunoId: 'usr-3',
      data: '2026-11-16',
      concluida: false,
      certificadoEmitido: false,
    });

    assert.equal(sim.modulosDoCurso(curso.id).length, 1);
    assert.equal(sim.aulasDoModulo(modulo.id).length, 1);
    assert.equal(sim.matriculasDoCurso(curso.id).length, 1);

    // Remover curso com cascata
    await sim.removerCurso(curso.id);

    // Tudo deve ter sido removido
    assert.equal(sim.cursoPorId(curso.id), undefined);
    assert.equal(sim.modulosDoCurso(curso.id).length, 0);
    assert.equal(sim.aulasDoModulo(modulo.id).length, 0);
    assert.equal(sim.matriculasDoCurso(curso.id).length, 0);

    // Conferir no storage persistente
    const cursosStorage = await obterItem(CHAVES_STORAGE.CURSOS);
    const modulosStorage = await obterItem(CHAVES_STORAGE.MODULOS);
    const aulasStorage = await obterItem(CHAVES_STORAGE.AULAS);
    const matriculasStorage = await obterItem(CHAVES_STORAGE.MATRICULAS);

    assert.equal(cursosStorage.some((c) => c.id === curso.id), false);
    assert.equal(modulosStorage.some((m) => m.id === modulo.id), false);
    assert.equal(aulasStorage.some((a) => a.id === aula.id), false);
    assert.equal(matriculasStorage.some((m) => m.id === matricula.id), false);
  });

  test('Operações financeiras: assinaturas e confirmação de pagamentos', async () => {
    const pendenteAntes = sim.receitaPendente();
    const confirmadaAntes = sim.receitaConfirmada();

    const pagamentoPendente = sim.pagamentos.find((p) => p.status !== 'Pago');
    assert.ok(pagamentoPendente, 'Deve haver ao menos um pagamento pendente');

    // Registra pagamento
    await sim.registrarPagamento(pagamentoPendente.id);

    assert.equal(sim.receitaConfirmada(), confirmadaAntes + pagamentoPendente.valor);
    assert.equal(sim.receitaPendente(), pendenteAntes - pagamentoPendente.valor);

    // Confere no storage
    const pagamentosStorage = await obterItem(CHAVES_STORAGE.PAGAMENTOS);
    const atualizado = pagamentosStorage.find((p) => p.id === pagamentoPendente.id);
    assert.equal(atualizado.status, 'Pago');
  });

  test('Alternar assinatura ativa/cancelada', async () => {
    const assinatura = sim.assinaturas[0];
    const statusOriginal = assinatura.ativa;

    await sim.alternarAssinatura(assinatura.id);
    assert.equal(sim.assinaturas.find((a) => a.id === assinatura.id).ativa, !statusOriginal);

    const assinaturasStorage = await obterItem(CHAVES_STORAGE.ASSINATURAS);
    assert.equal(assinaturasStorage.find((a) => a.id === assinatura.id).ativa, !statusOriginal);
  });
});
