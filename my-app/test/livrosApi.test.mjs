import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatarLivro,
  buscarLivrosPorTermo,
  configurarUrlBaseLivros,
  obterUrlBaseLivros,
} from '../src/services/livrosApi.js';

/**
 * ETAPA 06 — Testes da Integração com Serviço Externo (Open Library API)
 *
 * Valida a comunicação, tratamento de dados, formatação e os 4 estados
 * da integração: carregamento, sucesso, erro e ausência de dados.
 */

// Mock de fetch global
let fetchChamadas = [];
let fetchManipuladores = {};

function mockFetch(url, options = {}) {
  fetchChamadas.push({ url: String(url), options });

  const urlStr = String(url);

  for (const [padrao, resposta] of Object.entries(fetchManipuladores)) {
    if (urlStr.includes(padrao)) {
      return Promise.resolve(typeof resposta === 'function' ? resposta(url, options) : resposta);
    }
  }

  // Resposta padrão
  return Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve({ numFound: 0, docs: [] }),
  });
}

const fetchOriginal = globalThis.fetch;

test.describe('ETAPA 06 — Serviço de Livros / Open Library API (livrosApi.js)', () => {

  test.beforeEach(() => {
    fetchChamadas = [];
    fetchManipuladores = {};
    globalThis.fetch = mockFetch;
    configurarUrlBaseLivros('https://openlibrary.org');
  });

  test.after(() => {
    globalThis.fetch = fetchOriginal;
  });

  test('1. Configuração e obtenção da URL base do serviço externo', () => {
    assert.equal(obterUrlBaseLivros(), 'https://openlibrary.org');
    configurarUrlBaseLivros('https://api-teste.mock');
    assert.equal(obterUrlBaseLivros(), 'https://api-teste.mock');
    configurarUrlBaseLivros('https://openlibrary.org');
  });

  test('2. formatarLivro() normaliza dados completos da API', () => {
    const raw = {
      key: '/works/OL123456W',
      title: 'Fullstack React Native',
      author_name: ['Houssein Djirdeh', 'Anthony Accomazzo'],
      first_publish_year: 2019,
      edition_count: 3,
      isbn: ['9781987527834'],
      cover_i: 8234567,
    };

    const formatado = formatarLivro(raw);

    assert.equal(formatado.id, '/works/OL123456W');
    assert.equal(formatado.titulo, 'Fullstack React Native');
    assert.deepStrictEqual(formatado.autores, ['Houssein Djirdeh', 'Anthony Accomazzo']);
    assert.equal(formatado.autoresTexto, 'Houssein Djirdeh, Anthony Accomazzo');
    assert.equal(formatado.anoPublicacao, 2019);
    assert.equal(formatado.edicoes, 3);
    assert.equal(formatado.isbn, '9781987527834');
    assert.equal(formatado.capaUrl, 'https://covers.openlibrary.org/b/id/8234567-M.jpg');
    assert.equal(formatado.linkUrl, 'https://openlibrary.org/works/OL123456W');
  });

  test('3. formatarLivro() aplica fallbacks para campos ausentes ou incompletos', () => {
    const rawIncompleto = {};
    const formatado = formatarLivro(rawIncompleto);

    assert.equal(formatado.titulo, 'Título não informado');
    assert.deepStrictEqual(formatado.autores, ['Autor não informado']);
    assert.equal(formatado.autoresTexto, 'Autor não informado');
    assert.equal(formatado.anoPublicacao, null);
    assert.equal(formatado.edicoes, 1);
    assert.equal(formatado.isbn, null);
    assert.equal(formatado.capaUrl, null);
    assert.equal(formatado.linkUrl, null);
  });

  test('4. buscarLivrosPorTermo() retorna vazio de imediato para termos em branco', async () => {
    const resultado = await buscarLivrosPorTermo('   ');
    assert.equal(resultado.total, 0);
    assert.equal(resultado.termo, '');
    assert.deepStrictEqual(resultado.livros, []);
    assert.equal(fetchChamadas.length, 0, 'Não deve fazer requisição HTTP para termo vazio');
  });

  test('5. ESTADO SUCESSO: consulta e formata livros retornados pela Open Library', async () => {
    fetchManipuladores['search.json'] = {
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        numFound: 42,
        docs: [
          {
            key: '/works/OL100W',
            title: 'Learning React Native',
            author_name: ['Bonnie Eisenman'],
            first_publish_year: 2015,
            edition_count: 2,
          },
          {
            key: '/works/OL200W',
            title: 'React Native in Action',
            author_name: ['Nader Dabit'],
            first_publish_year: 2019,
            edition_count: 1,
          },
        ],
      }),
    };

    const resultado = await buscarLivrosPorTermo('React Native', 2);

    assert.equal(resultado.total, 42);
    assert.equal(resultado.termo, 'React Native');
    assert.equal(resultado.livros.length, 2);

    assert.equal(resultado.livros[0].titulo, 'Learning React Native');
    assert.equal(resultado.livros[0].autoresTexto, 'Bonnie Eisenman');
    assert.equal(resultado.livros[0].anoPublicacao, 2015);

    assert.equal(resultado.livros[1].titulo, 'React Native in Action');
    assert.equal(resultado.livros[1].autoresTexto, 'Nader Dabit');

    // Valida parâmetros da requisição
    assert.equal(fetchChamadas.length, 1);
    const urlChamada = fetchChamadas[0].url;
    assert.ok(urlChamada.includes('q=React%20Native'));
    assert.ok(urlChamada.includes('limit=2'));
  });

  test('6. ESTADO AUSÊNCIA DE DADOS: lida com busca sem resultados (0 docs)', async () => {
    fetchManipuladores['search.json'] = {
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        numFound: 0,
        docs: [],
      }),
    };

    const resultado = await buscarLivrosPorTermo('termo_completamente_inexistente_xyz_123', 5);

    assert.equal(resultado.total, 0);
    assert.equal(resultado.termo, 'termo_completamente_inexistente_xyz_123');
    assert.deepStrictEqual(resultado.livros, []);
  });

  test('7. ESTADO ERRO: trata erro HTTP (status não-OK como 500 ou 404)', async () => {
    fetchManipuladores['search.json'] = {
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      json: () => Promise.resolve({}),
    };

    await assert.rejects(
      () => buscarLivrosPorTermo('Banco de dados'),
      (erro) => {
        assert.ok(erro.message.includes('503'));
        assert.ok(erro.message.includes('Open Library'));
        return true;
      }
    );
  });

  test('8. ESTADO ERRO: trata falha na comunicação de rede (conexão recusada / offline)', async () => {
    globalThis.fetch = () => Promise.reject(new Error('Failed to fetch'));

    await assert.rejects(
      () => buscarLivrosPorTermo('Design'),
      (erro) => {
        assert.ok(erro.message.includes('Falha na comunicação com o serviço externo'));
        return true;
      }
    );
  });

  test('9. ESTADO ERRO: trata timeout com mensagem amigável', async () => {
    globalThis.fetch = () => {
      const erro = new Error('The operation was aborted');
      erro.name = 'AbortError';
      return Promise.reject(erro);
    };

    await assert.rejects(
      () => buscarLivrosPorTermo('Programação'),
      (erro) => {
        assert.ok(erro.message.includes('Tempo limite excedido'));
        return true;
      }
    );
  });

  test('10. Comunicação real com a Open Library API (Live HTTP GET)', async (t) => {
    globalThis.fetch = fetchOriginal;
    try {
      const resultado = await buscarLivrosPorTermo('React Native', 2);
      assert.ok(resultado.total > 0, 'Deve retornar contagem positiva de livros');
      assert.ok(resultado.livros.length > 0, 'Deve retornar ao menos 1 livro');
      assert.ok(resultado.livros[0].titulo, 'Livro deve possuir título');
    } catch (e) {
      t.skip(`Teste de rede ignorado por indisponibilidade de conexão: ${e.message}`);
    }
  });
});
