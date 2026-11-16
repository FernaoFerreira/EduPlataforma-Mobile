import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAVES_STORAGE,
  carregarTodosOsDados,
  salvarColecao,
  salvarItem,
  obterItem,
  removerItem,
  limparArmazenamento,
  restaurarDadosIniciais,
  obterStatusArmazenamento,
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

// Cria um mock isolado em memória compatível com a interface do AsyncStorage
function criarMockAsyncStorage() {
  const store = new Map();
  return {
    getItem: async (chave) => (store.has(chave) ? store.get(chave) : null),
    setItem: async (chave, valor) => {
      store.set(chave, String(valor));
    },
    removeItem: async (chave) => {
      store.delete(chave);
    },
    clear: async () => {
      store.clear();
    },
    getAllKeys: async () => Array.from(store.keys()),
    _store: store,
  };
}

test.describe('ETAPA 04 — Persistência Local de Dados', () => {
  let mockStorage;

  test.beforeEach(async () => {
    mockStorage = criarMockAsyncStorage();
    setStorageBackend(mockStorage);
  });

  test('1. Primeira execução: inicializa AsyncStorage com dados semente (seed)', async () => {
    // Garante que o storage está inicialmente vazio
    assert.equal(await mockStorage.getItem(CHAVES_STORAGE.INICIALIZADO), null);

    const dados = await carregarTodosOsDados();

    // Deve carregar as contagens corretas do seed
    assert.equal(dados.categorias.length, categoriasIniciais.length);
    assert.equal(dados.cursos.length, cursosIniciais.length);
    assert.equal(dados.usuarios.length, usuariosIniciais.length);
    assert.equal(dados.modulos.length, modulosIniciais.length);
    assert.equal(dados.aulas.length, aulasIniciais.length);
    assert.equal(dados.matriculas.length, matriculasIniciais.length);
    assert.equal(dados.planos.length, planosIniciais.length);
    assert.equal(dados.assinaturas.length, assinaturasIniciais.length);
    assert.equal(dados.pagamentos.length, pagamentosIniciais.length);

    // Deve ter gravado a chave de inicialização no AsyncStorage
    const flagInicializado = await mockStorage.getItem(CHAVES_STORAGE.INICIALIZADO);
    assert.ok(flagInicializado, 'Chave de inicialização deve estar preenchida');

    // Chaves de cada entidade devem existir no armazenamento
    const cursosSalvos = JSON.parse(await mockStorage.getItem(CHAVES_STORAGE.CURSOS));
    assert.equal(cursosSalvos.length, cursosIniciais.length);
  });

  test('2. CRUD — Criação e persistência de novo registro', async () => {
    await carregarTodosOsDados();

    // Cria nova categoria
    const novaCategoria = {
      id: 'cat-teste-1',
      nome: 'Inteligência Artificial',
      descricao: 'Machine Learning, Redes Neurais e LLMs',
    };

    const categoriasAtuais = await obterItem(CHAVES_STORAGE.CATEGORIAS);
    const atualizadas = [...categoriasAtuais, novaCategoria];
    await salvarColecao(CHAVES_STORAGE.CATEGORIAS, atualizadas);

    // Recupera do storage e valida
    const recuperadas = await obterItem(CHAVES_STORAGE.CATEGORIAS);
    assert.equal(recuperadas.length, categoriasIniciais.length + 1);
    const encontrada = recuperadas.find((c) => c.id === 'cat-teste-1');
    assert.ok(encontrada);
    assert.equal(encontrada.nome, 'Inteligência Artificial');
  });

  test('3. CRUD — Atualização de registro persistido', async () => {
    await carregarTodosOsDados();

    const cursos = await obterItem(CHAVES_STORAGE.CURSOS);
    const cursoParaEditar = cursos[0];
    const tituloNovo = 'React Native do Zero ao Avançado (Atualizado)';

    const cursosAtualizados = cursos.map((c) =>
      c.id === cursoParaEditar.id ? { ...c, titulo: tituloNovo, preco: 299.9 } : c
    );

    await salvarColecao(CHAVES_STORAGE.CURSOS, cursosAtualizados);

    // Verifica que a alteração persiste
    const cursosDoStorage = await obterItem(CHAVES_STORAGE.CURSOS);
    const modificado = cursosDoStorage.find((c) => c.id === cursoParaEditar.id);
    assert.equal(modificado.titulo, tituloNovo);
    assert.equal(modificado.preco, 299.9);
  });

  test('4. CRUD — Remoção de registro e persistência da exclusão', async () => {
    await carregarTodosOsDados();

    const usuarios = await obterItem(CHAVES_STORAGE.USUARIOS);
    const totalAntes = usuarios.length;
    const usuarioRemover = usuarios[usuarios.length - 1]; // pega o último

    const usuariosRestantes = usuarios.filter((u) => u.id !== usuarioRemover.id);
    await salvarColecao(CHAVES_STORAGE.USUARIOS, usuariosRestantes);

    const usuariosDepois = await obterItem(CHAVES_STORAGE.USUARIOS);
    assert.equal(usuariosDepois.length, totalAntes - 1);
    assert.equal(usuariosDepois.some((u) => u.id === usuarioRemover.id), false);
  });

  test('5. Remoção em cascata: exclusão de curso remove módulos, aulas e matrículas vinculadas', async () => {
    await carregarTodosOsDados();

    const cursoAlvoId = 'cur-1'; // React Native do Zero

    const modulosAntes = await obterItem(CHAVES_STORAGE.MODULOS);
    const modulosDoCurso = modulosAntes.filter((m) => m.cursoId === cursoAlvoId).map((m) => m.id);
    const modulosRestantes = modulosAntes.filter((m) => m.cursoId !== cursoAlvoId);

    const aulasAntes = await obterItem(CHAVES_STORAGE.AULAS);
    const aulasRestantes = aulasAntes.filter((a) => !modulosDoCurso.includes(a.moduloId));

    const matriculasAntes = await obterItem(CHAVES_STORAGE.MATRICULAS);
    const matriculasRestantes = matriculasAntes.filter((m) => m.cursoId !== cursoAlvoId);

    const cursosAntes = await obterItem(CHAVES_STORAGE.CURSOS);
    const cursosRestantes = cursosAntes.filter((c) => c.id !== cursoAlvoId);

    // Persiste todas as coleções afetadas pela cascata
    await salvarColecao(CHAVES_STORAGE.CURSOS, cursosRestantes);
    await salvarColecao(CHAVES_STORAGE.MODULOS, modulosRestantes);
    await salvarColecao(CHAVES_STORAGE.AULAS, aulasRestantes);
    await salvarColecao(CHAVES_STORAGE.MATRICULAS, matriculasRestantes);

    // Valida no armazenamento persistente
    const cursosGravados = await obterItem(CHAVES_STORAGE.CURSOS);
    const modulosGravados = await obterItem(CHAVES_STORAGE.MODULOS);
    const aulasGravadas = await obterItem(CHAVES_STORAGE.AULAS);
    const matriculasGravadas = await obterItem(CHAVES_STORAGE.MATRICULAS);

    assert.equal(cursosGravados.some((c) => c.id === cursoAlvoId), false);
    assert.equal(modulosGravados.some((m) => m.cursoId === cursoAlvoId), false);
    assert.equal(aulasGravadas.some((a) => modulosDoCurso.includes(a.moduloId)), false);
    assert.equal(matriculasGravadas.some((m) => m.cursoId === cursoAlvoId), false);
  });

  test('6. Regras de negócio: conclusão de matrícula e emissão de certificado persistidas', async () => {
    await carregarTodosOsDados();

    const matriculas = await obterItem(CHAVES_STORAGE.MATRICULAS);
    const matriculaAlvo = matriculas.find((m) => !m.concluida);
    assert.ok(matriculaAlvo, 'Deve existir matrícula em andamento');

    // Conclui matrícula
    const matriculasConcluidas = matriculas.map((m) =>
      m.id === matriculaAlvo.id ? { ...m, concluida: true } : m
    );
    await salvarColecao(CHAVES_STORAGE.MATRICULAS, matriculasConcluidas);

    let doStorage = await obterItem(CHAVES_STORAGE.MATRICULAS);
    assert.equal(doStorage.find((m) => m.id === matriculaAlvo.id).concluida, true);

    // Emite certificado
    const matriculasCertificadas = doStorage.map((m) =>
      m.id === matriculaAlvo.id ? { ...m, certificadoEmitido: true } : m
    );
    await salvarColecao(CHAVES_STORAGE.MATRICULAS, matriculasCertificadas);

    doStorage = await obterItem(CHAVES_STORAGE.MATRICULAS);
    assert.equal(doStorage.find((m) => m.id === matriculaAlvo.id).certificadoEmitido, true);
  });

  test('7. Ciclo de vida: dados permanecem disponíveis após encerramento e reabertura da aplicação', async () => {
    // 1ª SESSÃO: Usuário abre o app, cria um curso e sai
    await carregarTodosOsDados();

    const novoCurso = {
      id: 'cur-persistente-99',
      titulo: 'Engenharia de Prompt e Agentes de IA',
      descricao: 'Curso persistido para validação de reabertura',
      categoriaId: 'cat-1',
      professorId: 'usr-1',
      cargaHoraria: 60,
      preco: 350.0,
      publicado: true,
    };

    const cursosSessao1 = await obterItem(CHAVES_STORAGE.CURSOS);
    await salvarColecao(CHAVES_STORAGE.CURSOS, [...cursosSessao1, novoCurso]);

    // Simula encerramento do app (desmontagem completa de memória / reinício)
    // O mockStorage permanece com os dados gravados no "disco"

    // 2ª SESSÃO: Usuário reabre o aplicativo
    const dadosSessao2 = await carregarTodosOsDados();

    // Deve conter o curso criado na 1ª sessão
    const cursoRecuperado = dadosSessao2.cursos.find((c) => c.id === 'cur-persistente-99');
    assert.ok(cursoRecuperado, 'O curso cadastrado na sessão anterior deve continuar presente');
    assert.equal(cursoRecuperado.titulo, 'Engenharia de Prompt e Agentes de IA');
    assert.equal(cursoRecuperado.preco, 350.0);
    assert.equal(dadosSessao2.cursos.length, cursosIniciais.length + 1);
  });

  test('8. Restauração de dados iniciais reestabelece o seed no armazenamento', async () => {
    await carregarTodosOsDados();

    // Modifica o storage
    await salvarColecao(CHAVES_STORAGE.CATEGORIAS, []);
    assert.equal((await obterItem(CHAVES_STORAGE.CATEGORIAS)).length, 0);

    // Restaura
    const restaurados = await restaurarDadosIniciais();
    assert.equal(restaurados.categorias.length, categoriasIniciais.length);

    // Verifica que o storage agora possui o seed novamente
    const categoriasDoStorage = await obterItem(CHAVES_STORAGE.CATEGORIAS);
    assert.equal(categoriasDoStorage.length, categoriasIniciais.length);
  });

  test('9. Obtenção de status e metadados de armazenamento', async () => {
    await carregarTodosOsDados();

    const status = await obterStatusArmazenamento();
    assert.equal(status.inicializado, true);
    assert.ok(status.dataInicializacao);
    assert.equal(status.totais.cursos, cursosIniciais.length);
    assert.equal(status.totais.usuarios, usuariosIniciais.length);
  });

  test('10. Limpeza completa do armazenamento (limparArmazenamento)', async () => {
    await carregarTodosOsDados();
    assert.ok(await obterItem(CHAVES_STORAGE.INICIALIZADO));

    await limparArmazenamento();

    assert.equal(await obterItem(CHAVES_STORAGE.INICIALIZADO), null);
    assert.equal(await obterItem(CHAVES_STORAGE.CURSOS), null);
    assert.equal(await obterItem(CHAVES_STORAGE.CATEGORIAS), null);
  });
});
