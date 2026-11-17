import { Platform } from 'react-native';

/**
 * Serviço de comunicação com o backend JSON Server — EduPlataforma Mobile.
 *
 * Utiliza a API fetch nativa do React Native para realizar operações CRUD
 * sobre os endpoints REST expostos pelo JSON Server.
 *
 * Todas as funções retornam Promises e tratam erros de rede de forma
 * consistente, permitindo que a camada superior (DadosContext) decida
 * entre dados online ou fallback local (AsyncStorage).
 */

// Em emuladores Android o "localhost" do host é 10.0.2.2.
// Em iOS ou na web, localhost funciona normalmente.
// Para dispositivos físicos, substituir pelo IP da máquina na rede local.
const BASE_URL_PADRAO = Platform.select({
  android: 'http://10.0.2.2:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

let baseUrl = BASE_URL_PADRAO;

/**
 * Permite configurar a URL base da API em tempo de execução
 * (útil para testes ou dispositivos físicos).
 */
export function configurarUrlBase(url) {
  baseUrl = url;
}

export function obterUrlBase() {
  return baseUrl;
}

// Timeout padrão em milissegundos.
const TIMEOUT_MS = 8000;

/**
 * Wrapper do fetch com timeout, parse de JSON e tratamento de erros.
 */
async function requisicao(endpoint, opcoes = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const resposta = await fetch(`${baseUrl}/${endpoint}`, {
      ...opcoes,
      headers: {
        'Content-Type': 'application/json',
        ...(opcoes.headers || {}),
      },
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!resposta.ok) {
      const corpo = await resposta.text().catch(() => '');
      throw new Error(`HTTP ${resposta.status}: ${corpo || resposta.statusText}`);
    }

    // DELETE no json-server retorna {} (200), POST/PUT retornam o objeto.
    const texto = await resposta.text();
    return texto ? JSON.parse(texto) : null;
  } catch (erro) {
    clearTimeout(timer);

    if (erro.name === 'AbortError') {
      throw new Error('Tempo de conexão com o servidor esgotado.');
    }
    throw erro;
  }
}

// ---- CRUD genérico por endpoint ----

export function listar(endpoint) {
  return requisicao(endpoint);
}

export function obterPorId(endpoint, id) {
  return requisicao(`${endpoint}/${id}`);
}

export function criar(endpoint, dados) {
  return requisicao(endpoint, {
    method: 'POST',
    body: JSON.stringify(dados),
  });
}

export function atualizar(endpoint, id, dados) {
  return requisicao(`${endpoint}/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...dados, id }),
  });
}

export function atualizarParcial(endpoint, id, dados) {
  return requisicao(`${endpoint}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dados),
  });
}

export function remover(endpoint, id) {
  return requisicao(`${endpoint}/${id}`, {
    method: 'DELETE',
  });
}

// ---- Endpoints nomeados (compatíveis com db.json) ----

export const ENDPOINTS = {
  CATEGORIAS: 'categorias',
  USUARIOS: 'usuarios',
  CURSOS: 'cursos',
  MODULOS: 'modulos',
  AULAS: 'aulas',
  MATRICULAS: 'matriculas',
  PLANOS: 'planos',
  ASSINATURAS: 'assinaturas',
  PAGAMENTOS: 'pagamentos',
};

/**
 * Busca todas as coleções do backend de uma só vez.
 * Retorna um objeto com a mesma estrutura do DadosContext.
 */
export async function carregarTodosDoBackend() {
  const [
    categorias,
    usuarios,
    cursos,
    modulos,
    aulas,
    matriculas,
    planos,
    assinaturas,
    pagamentos,
  ] = await Promise.all([
    listar(ENDPOINTS.CATEGORIAS),
    listar(ENDPOINTS.USUARIOS),
    listar(ENDPOINTS.CURSOS),
    listar(ENDPOINTS.MODULOS),
    listar(ENDPOINTS.AULAS),
    listar(ENDPOINTS.MATRICULAS),
    listar(ENDPOINTS.PLANOS),
    listar(ENDPOINTS.ASSINATURAS),
    listar(ENDPOINTS.PAGAMENTOS),
  ]);

  return { categorias, usuarios, cursos, modulos, aulas, matriculas, planos, assinaturas, pagamentos };
}

/**
 * Verifica a conectividade com o JSON Server tentando acessar a raiz.
 * Retorna true se o servidor responder, false caso contrário.
 */
export async function verificarConexao() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch(baseUrl, { signal: controller.signal });
    clearTimeout(timer);
    return resp.ok;
  } catch {
    return false;
  }
}
