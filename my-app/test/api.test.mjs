import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

/**
 * ETAPA 05 — Testes da camada de API (api.js)
 *
 * Estes testes validam a lógica do serviço de API em isolamento,
 * usando mocks do fetch para simular o backend JSON Server sem
 * necessidade de conexão real de rede.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'db.json');
const dbOriginal = JSON.parse(readFileSync(dbPath, 'utf-8'));

// ---- Mock de fetch global ----

let fetchRequests = [];
let fetchResponses = {};

function mockFetch(url, options = {}) {
  fetchRequests.push({ url, options });

  const urlStr = String(url);

  // Verifica se há resposta customizada
  for (const [pattern, handler] of Object.entries(fetchResponses)) {
    if (urlStr.includes(pattern)) {
      return Promise.resolve(typeof handler === 'function' ? handler(url, options) : handler);
    }
  }

  // Resposta padrão genérica (200 com JSON vazio)
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    text: () => Promise.resolve('[]'),
    json: () => Promise.resolve([]),
  });
}

// Injeta o mock de fetch no escopo global
globalThis.fetch = mockFetch;

test.describe('ETAPA 05 — Serviço de API (api.js)', () => {

  test.beforeEach(() => {
    fetchRequests = [];
    fetchResponses = {};
  });

  test('1. db.json contém todas as coleções do modelo de dados', () => {
    const colecoes = [
      'categorias', 'usuarios', 'cursos', 'modulos', 'aulas',
      'matriculas', 'planos', 'assinaturas', 'pagamentos',
    ];

    for (const col of colecoes) {
      assert.ok(Array.isArray(dbOriginal[col]), `Coleção "${col}" deve ser um array em db.json`);
      assert.ok(dbOriginal[col].length > 0, `Coleção "${col}" não deve estar vazia`);
    }
  });

  test('2. db.json possui dados compatíveis com o seed do aplicativo', () => {
    // Verifica IDs do seed
    assert.ok(dbOriginal.categorias.some((c) => c.id === 'cat-1'));
    assert.ok(dbOriginal.usuarios.some((u) => u.id === 'usr-1'));
    assert.ok(dbOriginal.cursos.some((c) => c.id === 'cur-1'));
    assert.ok(dbOriginal.modulos.some((m) => m.id === 'mod-1'));
    assert.ok(dbOriginal.aulas.some((a) => a.id === 'aul-1'));
    assert.ok(dbOriginal.matriculas.some((m) => m.id === 'mat-1'));

    // Verifica campos essenciais
    const curso1 = dbOriginal.cursos.find((c) => c.id === 'cur-1');
    assert.ok(curso1.titulo);
    assert.ok(curso1.categoriaId);
    assert.ok(curso1.professorId);
    assert.ok(typeof curso1.cargaHoraria === 'number');
    assert.ok(typeof curso1.preco === 'number');
    assert.ok(typeof curso1.publicado === 'boolean');
  });

  test('3. db.json mantém relacionamentos consistentes entre coleções', () => {
    const categoriasIds = new Set(dbOriginal.categorias.map((c) => c.id));
    const usuariosIds = new Set(dbOriginal.usuarios.map((u) => u.id));
    const cursosIds = new Set(dbOriginal.cursos.map((c) => c.id));
    const modulosIds = new Set(dbOriginal.modulos.map((m) => m.id));
    const planosIds = new Set(dbOriginal.planos.map((p) => p.id));

    // Cursos → Categorias e Professores
    for (const curso of dbOriginal.cursos) {
      assert.ok(categoriasIds.has(curso.categoriaId), `Curso "${curso.id}" referencia categoria inexistente`);
      assert.ok(usuariosIds.has(curso.professorId), `Curso "${curso.id}" referencia professor inexistente`);
    }

    // Módulos → Cursos
    for (const modulo of dbOriginal.modulos) {
      assert.ok(cursosIds.has(modulo.cursoId), `Módulo "${modulo.id}" referencia curso inexistente`);
    }

    // Aulas → Módulos
    for (const aula of dbOriginal.aulas) {
      assert.ok(modulosIds.has(aula.moduloId), `Aula "${aula.id}" referencia módulo inexistente`);
    }

    // Matrículas → Cursos e Alunos
    for (const matricula of dbOriginal.matriculas) {
      assert.ok(cursosIds.has(matricula.cursoId), `Matrícula "${matricula.id}" referencia curso inexistente`);
      assert.ok(usuariosIds.has(matricula.alunoId), `Matrícula "${matricula.id}" referencia aluno inexistente`);
    }

    // Assinaturas → Planos e Alunos
    for (const assinatura of dbOriginal.assinaturas) {
      assert.ok(planosIds.has(assinatura.planoId), `Assinatura "${assinatura.id}" referencia plano inexistente`);
      assert.ok(usuariosIds.has(assinatura.alunoId), `Assinatura "${assinatura.id}" referencia aluno inexistente`);
    }
  });

  test('4. db.original.json existe como cópia de segurança', () => {
    const dbOriginalPath = path.join(__dirname, '..', 'db.original.json');
    const conteudo = JSON.parse(readFileSync(dbOriginalPath, 'utf-8'));
    assert.deepStrictEqual(conteudo, dbOriginal, 'db.original.json deve ser idêntico a db.json');
  });

  test('5. Módulo api.js exporta funções de CRUD e utilitários', async () => {
    // Importa dinamicamente para validar as exportações
    const api = await import('../src/services/api.js');

    assert.equal(typeof api.listar, 'function');
    assert.equal(typeof api.obterPorId, 'function');
    assert.equal(typeof api.criar, 'function');
    assert.equal(typeof api.atualizar, 'function');
    assert.equal(typeof api.atualizarParcial, 'function');
    assert.equal(typeof api.remover, 'function');
    assert.equal(typeof api.carregarTodosDoBackend, 'function');
    assert.equal(typeof api.verificarConexao, 'function');
    assert.equal(typeof api.configurarUrlBase, 'function');
    assert.equal(typeof api.obterUrlBase, 'function');

    // Verifica constantes de endpoints
    assert.ok(api.ENDPOINTS);
    assert.equal(api.ENDPOINTS.CATEGORIAS, 'categorias');
    assert.equal(api.ENDPOINTS.CURSOS, 'cursos');
    assert.equal(api.ENDPOINTS.USUARIOS, 'usuarios');
    assert.equal(api.ENDPOINTS.MODULOS, 'modulos');
    assert.equal(api.ENDPOINTS.AULAS, 'aulas');
    assert.equal(api.ENDPOINTS.MATRICULAS, 'matriculas');
    assert.equal(api.ENDPOINTS.PLANOS, 'planos');
    assert.equal(api.ENDPOINTS.ASSINATURAS, 'assinaturas');
    assert.equal(api.ENDPOINTS.PAGAMENTOS, 'pagamentos');
  });

  test('6. listar() faz GET no endpoint correto', async () => {
    const api = await import('../src/services/api.js');
    api.configurarUrlBase('http://mock-server:3000');

    fetchResponses['categorias'] = {
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify([{ id: 'cat-1', nome: 'Test' }])),
    };

    const resultado = await api.listar('categorias');
    assert.deepStrictEqual(resultado, [{ id: 'cat-1', nome: 'Test' }]);

    const request = fetchRequests.find((r) => r.url.includes('categorias'));
    assert.ok(request, 'Deve ter feito uma requisição para /categorias');
    assert.equal(request.options.method, undefined); // GET padrão
  });

  test('7. criar() faz POST com body JSON', async () => {
    const api = await import('../src/services/api.js');
    api.configurarUrlBase('http://mock-server:3000');

    const novaCategoria = { id: 'cat-new', nome: 'Nova', descricao: 'Teste' };

    fetchResponses['categorias'] = {
      ok: true,
      status: 201,
      text: () => Promise.resolve(JSON.stringify(novaCategoria)),
    };

    const resultado = await api.criar('categorias', novaCategoria);
    assert.deepStrictEqual(resultado, novaCategoria);

    const request = fetchRequests.find((r) => r.options?.method === 'POST');
    assert.ok(request, 'Deve ter feito uma requisição POST');
    assert.equal(JSON.parse(request.options.body).nome, 'Nova');
  });

  test('8. remover() faz DELETE no endpoint correto', async () => {
    const api = await import('../src/services/api.js');
    api.configurarUrlBase('http://mock-server:3000');

    fetchResponses['categorias/cat-1'] = {
      ok: true,
      status: 200,
      text: () => Promise.resolve('{}'),
    };

    await api.remover('categorias', 'cat-1');

    const request = fetchRequests.find((r) => r.options?.method === 'DELETE');
    assert.ok(request, 'Deve ter feito uma requisição DELETE');
    assert.ok(request.url.includes('categorias/cat-1'));
  });

  test('9. verificarConexao() retorna false quando servidor não responde', async () => {
    const api = await import('../src/services/api.js');
    api.configurarUrlBase('http://servidor-inexistente:9999');

    // Simula falha de rede
    const fetchOriginal = globalThis.fetch;
    globalThis.fetch = () => Promise.reject(new Error('Network error'));

    const resultado = await api.verificarConexao();
    assert.equal(resultado, false);

    globalThis.fetch = fetchOriginal;
  });

  test('10. verificarConexao() retorna true quando servidor responde', async () => {
    const api = await import('../src/services/api.js');
    api.configurarUrlBase('http://mock-server:3000');

    fetchResponses['mock-server:3000'] = {
      ok: true,
      status: 200,
      text: () => Promise.resolve('{}'),
    };

    // Restaura o fetch mockado normal
    globalThis.fetch = mockFetch;

    const resultado = await api.verificarConexao();
    assert.equal(resultado, true);
  });

  test('11. carregarTodosDoBackend() busca todas as 9 coleções simultaneamente', async () => {
    const api = await import('../src/services/api.js');
    api.configurarUrlBase('http://mock-server:3000');

    const mockData = {
      categorias: [{ id: 'cat-1' }],
      usuarios: [{ id: 'usr-1' }],
      cursos: [{ id: 'cur-1' }],
      modulos: [{ id: 'mod-1' }],
      aulas: [{ id: 'aul-1' }],
      matriculas: [{ id: 'mat-1' }],
      planos: [{ id: 'pln-1' }],
      assinaturas: [{ id: 'ass-1' }],
      pagamentos: [{ id: 'pag-1' }],
    };

    for (const [endpoint, dados] of Object.entries(mockData)) {
      fetchResponses[endpoint] = {
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify(dados)),
      };
    }

    fetchRequests = [];
    const resultado = await api.carregarTodosDoBackend();

    // Verifica que todas as 9 coleções foram buscadas
    assert.ok(Array.isArray(resultado.categorias));
    assert.ok(Array.isArray(resultado.usuarios));
    assert.ok(Array.isArray(resultado.cursos));
    assert.ok(Array.isArray(resultado.modulos));
    assert.ok(Array.isArray(resultado.aulas));
    assert.ok(Array.isArray(resultado.matriculas));
    assert.ok(Array.isArray(resultado.planos));
    assert.ok(Array.isArray(resultado.assinaturas));
    assert.ok(Array.isArray(resultado.pagamentos));
  });

  test('12. Tratamento de erro HTTP (status não-OK)', async () => {
    const api = await import('../src/services/api.js');
    api.configurarUrlBase('http://mock-server:3000');

    fetchResponses['inexistente'] = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: () => Promise.resolve('Recurso não encontrado'),
    };

    await assert.rejects(
      () => api.listar('inexistente'),
      (err) => {
        assert.ok(err.message.includes('404'));
        return true;
      }
    );
  });
});
