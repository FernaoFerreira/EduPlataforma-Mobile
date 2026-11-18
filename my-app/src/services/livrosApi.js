/**
 * Serviço de integração com a API externa da Open Library.
 *
 * Fornece consulta a obras bibliográficas, permitindo que a EduPlataforma Mobile
 * recomende livros e referências teóricas complementares para os cursos cadastrados.
 *
 * API pública, sem exigência de chave de autenticação (API Key).
 * Base URL: https://openlibrary.org
 * Endpoint: /search.json?q={termo}&limit={limite}
 */

const BASE_URL_PADRAO = 'https://openlibrary.org';
let baseUrl = BASE_URL_PADRAO;

/**
 * Permite customizar a URL base (útil para testes unitários com mock server).
 */
export function configurarUrlBaseLivros(novaUrl) {
  baseUrl = novaUrl;
}

export function obterUrlBaseLivros() {
  return baseUrl;
}

// Tempo limite padrão de 10 segundos para requisições externas
const TIMEOUT_MS = 10000;

/**
 * Normaliza e formata um registro retornado pela Open Library.
 */
export function formatarLivro(item) {
  const autores = Array.isArray(item.author_name) && item.author_name.length > 0
    ? item.author_name
    : ['Autor não informado'];

  const chaveTratada = item.key ? item.key.replace(/^\//, '') : '';
  const id = item.key || `livro-${Math.random().toString(36).substring(2, 9)}`;

  return {
    id,
    chave: item.key || null,
    titulo: item.title || 'Título não informado',
    autores,
    autoresTexto: autores.join(', '),
    anoPublicacao: item.first_publish_year || null,
    edicoes: typeof item.edition_count === 'number' ? item.edition_count : 1,
    isbn: Array.isArray(item.isbn) && item.isbn.length > 0 ? item.isbn[0] : null,
    capaUrl: item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg` : null,
    linkUrl: chaveTratada ? `https://openlibrary.org/${chaveTratada}` : null,
  };
}

/**
 * Realiza a busca de livros na Open Library por termo/tópico.
 *
 * @param {string} termo Palavra-chave ou título de interesse
 * @param {number} limite Quantidade máxima de resultados (padrão: 5)
 * @returns {Promise<{ total: number, termo: string, livros: Array }>}
 */
export async function buscarLivrosPorTermo(termo, limite = 5) {
  const termoLimpo = (termo || '').trim();
  if (!termoLimpo) {
    return { total: 0, termo: '', livros: [] };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const url = `${baseUrl}/search.json?q=${encodeURIComponent(termoLimpo)}&limit=${encodeURIComponent(limite)}`;

  try {
    const resposta = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!resposta.ok) {
      throw new Error(`Erro no serviço Open Library (HTTP ${resposta.status}).`);
    }

    const dados = await resposta.json();
    const docs = Array.isArray(dados.docs) ? dados.docs : [];
    const livros = docs.map(formatarLivro);

    return {
      total: typeof dados.numFound === 'number' ? dados.numFound : livros.length,
      termo: termoLimpo,
      livros,
    };
  } catch (erro) {
    clearTimeout(timer);

    if (erro.name === 'AbortError') {
      throw new Error('Tempo limite excedido ao consultar a Open Library. Tente novamente.');
    }

    if (erro.message && erro.message.includes('HTTP')) {
      throw erro;
    }

    throw new Error('Falha na comunicação com o serviço externo da Open Library. Verifique sua conexão.');
  }
}
