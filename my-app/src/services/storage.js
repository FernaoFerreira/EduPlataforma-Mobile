import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  categoriasIniciais,
  usuariosIniciais,
  cursosIniciais,
  modulosIniciais,
  aulasIniciais,
  matriculasIniciais,
  planosIniciais,
  assinaturasIniciais,
  pagamentosIniciais,
} from '../data/seed.js';

/**
 * Serviço de Persistência Local — EduPlataforma Mobile
 *
 * Utiliza o AsyncStorage (@react-native-async-storage/async-storage) como
 * mecanismo de persistência chave-valor local no dispositivo.
 *
 * Cada coleção do domínio possui sua própria chave nomeada sob o prefixo
 * '@eduplataforma:'.
 */

export const CHAVES_STORAGE = {
  CATEGORIAS: '@eduplataforma:categorias',
  USUARIOS: '@eduplataforma:usuarios',
  CURSOS: '@eduplataforma:cursos',
  MODULOS: '@eduplataforma:modulos',
  AULAS: '@eduplataforma:aulas',
  MATRICULAS: '@eduplataforma:matriculas',
  PLANOS: '@eduplataforma:planos',
  ASSINATURAS: '@eduplataforma:assinaturas',
  PAGAMENTOS: '@eduplataforma:pagamentos',
  INICIALIZADO: '@eduplataforma:inicializado',
};

// Fallback de memória para ambientes sem driver nativo/browser (ex.: testes unitários puros em Node)
const memoriaFallback = new Map();

let backendStorage = AsyncStorage;

/**
 * Permite alternar o driver de armazenamento (útil para testes automatizados).
 */
export function setStorageBackend(customBackend) {
  backendStorage = customBackend;
}

export function getStorageBackend() {
  return backendStorage;
}

/**
 * Obtém um item desserializado a partir do AsyncStorage.
 */
export async function obterItem(chave) {
  try {
    const raw = await backendStorage.getItem(chave);
    if (raw === null || raw === undefined) return null;
    return JSON.parse(raw);
  } catch (error) {
    if (memoriaFallback.has(chave)) {
      const raw = memoriaFallback.get(chave);
      return raw ? JSON.parse(raw) : null;
    }
    console.warn(`[Armazenamento] Falha ao obter chave "${chave}":`, error.message);
    return null;
  }
}

/**
 * Persiste um item serializado em JSON no AsyncStorage.
 */
export async function salvarItem(chave, valor) {
  try {
    const serializado = JSON.stringify(valor);
    await backendStorage.setItem(chave, serializado);
    memoriaFallback.set(chave, serializado);
  } catch (error) {
    console.warn(`[Armazenamento] Falha ao gravar chave "${chave}":`, error.message);
    memoriaFallback.set(chave, JSON.stringify(valor));
  }
}

/**
 * Remove um item do AsyncStorage.
 */
export async function removerItem(chave) {
  try {
    await backendStorage.removeItem(chave);
    memoriaFallback.delete(chave);
  } catch (error) {
    console.warn(`[Armazenamento] Falha ao remover chave "${chave}":`, error.message);
    memoriaFallback.delete(chave);
  }
}

/**
 * Salva uma coleção inteira do domínio de forma persistente.
 */
export async function salvarColecao(chave, dados) {
  await salvarItem(chave, dados);
}

/**
 * Salva todas as coleções do domínio de forma simultânea.
 */
export async function salvarTodosOsDados(dados) {
  await Promise.all([
    salvarItem(CHAVES_STORAGE.CATEGORIAS, dados.categorias ?? []),
    salvarItem(CHAVES_STORAGE.USUARIOS, dados.usuarios ?? []),
    salvarItem(CHAVES_STORAGE.CURSOS, dados.cursos ?? []),
    salvarItem(CHAVES_STORAGE.MODULOS, dados.modulos ?? []),
    salvarItem(CHAVES_STORAGE.AULAS, dados.aulas ?? []),
    salvarItem(CHAVES_STORAGE.MATRICULAS, dados.matriculas ?? []),
    salvarItem(CHAVES_STORAGE.PLANOS, dados.planos ?? []),
    salvarItem(CHAVES_STORAGE.ASSINATURAS, dados.assinaturas ?? []),
    salvarItem(CHAVES_STORAGE.PAGAMENTOS, dados.pagamentos ?? []),
  ]);
}

/**
 * Carrega todos os dados persistidos do aplicativo.
 *
 * Se a chave de inicialização não for encontrada (primeira execução após instalação),
 * inicializa o AsyncStorage com a semente de dados (seed.js) e retorna os dados iniciais.
 * Se já houver dados salvos, retorna os registros persistidos.
 */
export async function carregarTodosOsDados() {
  try {
    const inicializado = await obterItem(CHAVES_STORAGE.INICIALIZADO);

    if (!inicializado) {
      // Primeira execução: carrega e persiste a semente inicial
      const dadosIniciais = {
        categorias: categoriasIniciais,
        usuarios: usuariosIniciais,
        cursos: cursosIniciais,
        modulos: modulosIniciais,
        aulas: aulasIniciais,
        matriculas: matriculasIniciais,
        planos: planosIniciais,
        assinaturas: assinaturasIniciais,
        pagamentos: pagamentosIniciais,
      };

      await salvarTodosOsDados(dadosIniciais);
      await salvarItem(CHAVES_STORAGE.INICIALIZADO, new Date().toISOString());
      return dadosIniciais;
    }

    // Execuções seguintes: recupera os dados salvos pelo usuário
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
      obterItem(CHAVES_STORAGE.CATEGORIAS),
      obterItem(CHAVES_STORAGE.USUARIOS),
      obterItem(CHAVES_STORAGE.CURSOS),
      obterItem(CHAVES_STORAGE.MODULOS),
      obterItem(CHAVES_STORAGE.AULAS),
      obterItem(CHAVES_STORAGE.MATRICULAS),
      obterItem(CHAVES_STORAGE.PLANOS),
      obterItem(CHAVES_STORAGE.ASSINATURAS),
      obterItem(CHAVES_STORAGE.PAGAMENTOS),
    ]);

    return {
      categorias: Array.isArray(categorias) ? categorias : categoriasIniciais,
      usuarios: Array.isArray(usuarios) ? usuarios : usuariosIniciais,
      cursos: Array.isArray(cursos) ? cursos : cursosIniciais,
      modulos: Array.isArray(modulos) ? modulos : modulosIniciais,
      aulas: Array.isArray(aulas) ? aulas : aulasIniciais,
      matriculas: Array.isArray(matriculas) ? matriculas : matriculasIniciais,
      planos: Array.isArray(planos) ? planos : planosIniciais,
      assinaturas: Array.isArray(assinaturas) ? assinaturas : assinaturasIniciais,
      pagamentos: Array.isArray(pagamentos) ? pagamentos : pagamentosIniciais,
    };
  } catch (error) {
    console.error('[Armazenamento] Erro ao carregar dados do dispositivo:', error);
    return {
      categorias: categoriasIniciais,
      usuarios: usuariosIniciais,
      cursos: cursosIniciais,
      modulos: modulosIniciais,
      aulas: aulasIniciais,
      matriculas: matriculasIniciais,
      planos: planosIniciais,
      assinaturas: assinaturasIniciais,
      pagamentos: pagamentosIniciais,
    };
  }
}

/**
 * Restaura o estado inicial da aplicação com os dados padrão de demonstração.
 */
export async function restaurarDadosIniciais() {
  const dadosIniciais = {
    categorias: categoriasIniciais,
    usuarios: usuariosIniciais,
    cursos: cursosIniciais,
    modulos: modulosIniciais,
    aulas: aulasIniciais,
    matriculas: matriculasIniciais,
    planos: planosIniciais,
    assinaturas: assinaturasIniciais,
    pagamentos: pagamentosIniciais,
  };

  await salvarTodosOsDados(dadosIniciais);
  await salvarItem(CHAVES_STORAGE.INICIALIZADO, new Date().toISOString());
  return dadosIniciais;
}

/**
 * Limpa todos os dados armazenados pela aplicação.
 */
export async function limparArmazenamento() {
  const chaves = Object.values(CHAVES_STORAGE);
  await Promise.all(chaves.map((k) => removerItem(k)));
}

/**
 * Retorna metadados de diagnóstico sobre o armazenamento.
 */
export async function obterStatusArmazenamento() {
  const inicializado = await obterItem(CHAVES_STORAGE.INICIALIZADO);
  const dados = await carregarTodosOsDados();
  return {
    inicializado: !!inicializado,
    dataInicializacao: inicializado,
    totais: {
      categorias: dados.categorias.length,
      usuarios: dados.usuarios.length,
      cursos: dados.cursos.length,
      modulos: dados.modulos.length,
      aulas: dados.aulas.length,
      matriculas: dados.matriculas.length,
      planos: dados.planos.length,
      assinaturas: dados.assinaturas.length,
      pagamentos: dados.pagamentos.length,
    },
  };
}
