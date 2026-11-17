import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
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
} from '../data/seed';
import {
  CHAVES_STORAGE,
  carregarTodosOsDados,
  salvarColecao,
  salvarTodosOsDados,
  restaurarDadosIniciais,
} from '../services/storage';
import {
  carregarTodosDoBackend,
  verificarConexao,
  criar as apiCriar,
  atualizar as apiAtualizar,
  remover as apiRemover,
  atualizarParcial as apiPatch,
  ENDPOINTS,
} from '../services/api';
import { cores, espaco, tipografia } from '../theme';

/**
 * Camada de acesso a dados da aplicação — Etapa 05.
 *
 * Integra três camadas de dados:
 *   1. Backend (JSON Server) — fonte de verdade quando online.
 *   2. AsyncStorage — cache local e fallback offline (Etapa 04).
 *   3. Seed (seed.js) — dados de demonstração para inicialização.
 *
 * Estratégia:
 *   - Na inicialização, tenta carregar do backend. Se falhar,
 *     utiliza os dados do AsyncStorage (que, por sua vez, pode
 *     cair no seed na primeira execução).
 *   - Operações de escrita (criar, atualizar, remover) são enviadas
 *     ao backend quando online. Em qualquer caso, o AsyncStorage é
 *     atualizado como cache local para manter consistência offline.
 *   - O estado `online` é exposto para a UI exibir o status de conexão.
 */

const DadosContext = createContext(null);

let contador = 0;
const novoId = (prefixo) => `${prefixo}-${Date.now()}-${contador++}`;

// Mapeamento prefixo → endpoint para o CRUD genérico.
const PREFIXO_ENDPOINT = {
  cat: ENDPOINTS.CATEGORIAS,
  usr: ENDPOINTS.USUARIOS,
  cur: ENDPOINTS.CURSOS,
  mod: ENDPOINTS.MODULOS,
  aul: ENDPOINTS.AULAS,
  mat: ENDPOINTS.MATRICULAS,
};

export function DadosProvider({ children }) {
  const [categorias, setCategorias] = useState(categoriasIniciais);
  const [usuarios, setUsuarios] = useState(usuariosIniciais);
  const [cursos, setCursos] = useState(cursosIniciais);
  const [modulos, setModulos] = useState(modulosIniciais);
  const [aulas, setAulas] = useState(aulasIniciais);
  const [matriculas, setMatriculas] = useState(matriculasIniciais);
  const [planos, setPlanos] = useState(planosIniciais);
  const [assinaturas, setAssinaturas] = useState(assinaturasIniciais);
  const [pagamentos, setPagamentos] = useState(pagamentosIniciais);

  const [carregando, setCarregando] = useState(true);
  const [online, setOnline] = useState(false);
  const [fonteInicial, setFonteInicial] = useState('local'); // 'backend' | 'local'

  const onlineRef = useRef(false);

  // ---- Carga inicial: tenta backend → fallback AsyncStorage ----
  useEffect(() => {
    let montado = true;

    async function inicializarDados() {
      try {
        // Tenta carregar do backend primeiro
        const dadosBackend = await carregarTodosDoBackend();
        if (montado) {
          setCategorias(dadosBackend.categorias);
          setUsuarios(dadosBackend.usuarios);
          setCursos(dadosBackend.cursos);
          setModulos(dadosBackend.modulos);
          setAulas(dadosBackend.aulas);
          setMatriculas(dadosBackend.matriculas);
          setPlanos(dadosBackend.planos);
          setAssinaturas(dadosBackend.assinaturas);
          setPagamentos(dadosBackend.pagamentos);
          setOnline(true);
          onlineRef.current = true;
          setFonteInicial('backend');

          // Sincroniza o cache local com os dados do backend
          await salvarTodosOsDados(dadosBackend);
        }
      } catch (erroBackend) {
        console.warn('[DadosContext] Backend indisponível, carregando dados locais:', erroBackend.message);
        try {
          const dadosLocais = await carregarTodosOsDados();
          if (montado) {
            setCategorias(dadosLocais.categorias);
            setUsuarios(dadosLocais.usuarios);
            setCursos(dadosLocais.cursos);
            setModulos(dadosLocais.modulos);
            setAulas(dadosLocais.aulas);
            setMatriculas(dadosLocais.matriculas);
            setPlanos(dadosLocais.planos);
            setAssinaturas(dadosLocais.assinaturas);
            setPagamentos(dadosLocais.pagamentos);
            setOnline(false);
            onlineRef.current = false;
            setFonteInicial('local');
          }
        } catch (erroLocal) {
          console.error('[DadosContext] Erro ao carregar dados locais:', erroLocal);
          if (montado) {
            setOnline(false);
            onlineRef.current = false;
          }
        }
      } finally {
        if (montado) {
          setCarregando(false);
        }
      }
    }

    inicializarDados();
    return () => { montado = false; };
  }, []);

  // ---- Verificação periódica de conectividade (a cada 30s) ----
  useEffect(() => {
    const intervalo = setInterval(async () => {
      const conectado = await verificarConexao();
      setOnline(conectado);
      onlineRef.current = conectado;
    }, 30000);

    return () => clearInterval(intervalo);
  }, []);

  // ---- Fábrica genérica de CRUD com integração backend + persistência local ----
  const criarCrud = (setter, prefixo, chaveStorage) => ({
    criar: (dados) => {
      const id = novoId(prefixo);
      const registro = { ...dados, id };
      setter((atual) => {
        const novo = [...atual, registro];
        salvarColecao(chaveStorage, novo);
        return novo;
      });

      // Envia ao backend de forma assíncrona (fire-and-forget).
      const endpoint = PREFIXO_ENDPOINT[prefixo];
      if (endpoint && onlineRef.current) {
        apiCriar(endpoint, registro).catch((err) =>
          console.warn(`[API] Falha ao criar em ${endpoint}:`, err.message)
        );
      }

      return registro;
    },
    atualizar: (id, dados) => {
      let atualizado = null;
      setter((atual) => {
        const novo = atual.map((item) => {
          if (item.id === id) {
            atualizado = { ...item, ...dados };
            return atualizado;
          }
          return item;
        });
        salvarColecao(chaveStorage, novo);
        return novo;
      });

      const endpoint = PREFIXO_ENDPOINT[prefixo];
      if (endpoint && onlineRef.current && atualizado) {
        apiAtualizar(endpoint, id, atualizado).catch((err) =>
          console.warn(`[API] Falha ao atualizar em ${endpoint}/${id}:`, err.message)
        );
      }

      return atualizado;
    },
    remover: (id) => {
      setter((atual) => {
        const novo = atual.filter((item) => item.id !== id);
        salvarColecao(chaveStorage, novo);
        return novo;
      });

      const endpoint = PREFIXO_ENDPOINT[prefixo];
      if (endpoint && onlineRef.current) {
        apiRemover(endpoint, id).catch((err) =>
          console.warn(`[API] Falha ao remover ${endpoint}/${id}:`, err.message)
        );
      }
    },
  });

  const crudCategorias = useMemo(
    () => criarCrud(setCategorias, 'cat', CHAVES_STORAGE.CATEGORIAS),
    []
  );
  const crudCursos = useMemo(
    () => criarCrud(setCursos, 'cur', CHAVES_STORAGE.CURSOS),
    []
  );
  const crudUsuarios = useMemo(
    () => criarCrud(setUsuarios, 'usr', CHAVES_STORAGE.USUARIOS),
    []
  );
  const crudModulos = useMemo(
    () => criarCrud(setModulos, 'mod', CHAVES_STORAGE.MODULOS),
    []
  );
  const crudAulas = useMemo(
    () => criarCrud(setAulas, 'aul', CHAVES_STORAGE.AULAS),
    []
  );
  const crudMatriculas = useMemo(
    () => criarCrud(setMatriculas, 'mat', CHAVES_STORAGE.MATRICULAS),
    []
  );

  // ---- Remoções em cascata com backend + persistência ----
  const removerCurso = useCallback((id) => {
    setModulos((modulosAtuais) => {
      const modulosDoCurso = modulosAtuais
        .filter((m) => m.cursoId === id)
        .map((m) => m.id);
      const modulosRestantes = modulosAtuais.filter((m) => m.cursoId !== id);

      setAulas((aulasAtuais) => {
        const aulasRemovidas = aulasAtuais.filter((a) => modulosDoCurso.includes(a.moduloId));
        const aulasRestantes = aulasAtuais.filter(
          (a) => !modulosDoCurso.includes(a.moduloId)
        );
        salvarColecao(CHAVES_STORAGE.AULAS, aulasRestantes);

        // Remove aulas do backend
        if (onlineRef.current) {
          aulasRemovidas.forEach((a) =>
            apiRemover(ENDPOINTS.AULAS, a.id).catch(() => {})
          );
        }

        return aulasRestantes;
      });

      salvarColecao(CHAVES_STORAGE.MODULOS, modulosRestantes);

      // Remove módulos do backend
      if (onlineRef.current) {
        modulosDoCurso.forEach((mId) =>
          apiRemover(ENDPOINTS.MODULOS, mId).catch(() => {})
        );
      }

      return modulosRestantes;
    });

    setMatriculas((matriculasAtuais) => {
      const matriculasRemovidas = matriculasAtuais.filter((mat) => mat.cursoId === id);
      const matriculasRestantes = matriculasAtuais.filter((mat) => mat.cursoId !== id);
      salvarColecao(CHAVES_STORAGE.MATRICULAS, matriculasRestantes);

      if (onlineRef.current) {
        matriculasRemovidas.forEach((mat) =>
          apiRemover(ENDPOINTS.MATRICULAS, mat.id).catch(() => {})
        );
      }

      return matriculasRestantes;
    });

    setCursos((cursosAtuais) => {
      const cursosRestantes = cursosAtuais.filter((c) => c.id !== id);
      salvarColecao(CHAVES_STORAGE.CURSOS, cursosRestantes);

      if (onlineRef.current) {
        apiRemover(ENDPOINTS.CURSOS, id).catch(() => {});
      }

      return cursosRestantes;
    });
  }, []);

  const removerModulo = useCallback((id) => {
    setAulas((aulasAtuais) => {
      const aulasRemovidas = aulasAtuais.filter((a) => a.moduloId === id);
      const aulasRestantes = aulasAtuais.filter((a) => a.moduloId !== id);
      salvarColecao(CHAVES_STORAGE.AULAS, aulasRestantes);

      if (onlineRef.current) {
        aulasRemovidas.forEach((a) =>
          apiRemover(ENDPOINTS.AULAS, a.id).catch(() => {})
        );
      }

      return aulasRestantes;
    });
    setModulos((modulosAtuais) => {
      const modulosRestantes = modulosAtuais.filter((m) => m.id !== id);
      salvarColecao(CHAVES_STORAGE.MODULOS, modulosRestantes);

      if (onlineRef.current) {
        apiRemover(ENDPOINTS.MODULOS, id).catch(() => {});
      }

      return modulosRestantes;
    });
  }, []);

  // ---- Regras de negócio com backend ----
  const alternarConclusao = useCallback((matriculaId) => {
    setMatriculas((atual) => {
      const novo = atual.map((m) => {
        if (m.id !== matriculaId) return m;
        const concluida = !m.concluida;
        return {
          ...m,
          concluida,
          certificadoEmitido: concluida && m.certificadoEmitido,
        };
      });
      salvarColecao(CHAVES_STORAGE.MATRICULAS, novo);

      // Envia a atualização parcial ao backend
      const matricula = novo.find((m) => m.id === matriculaId);
      if (onlineRef.current && matricula) {
        apiPatch(ENDPOINTS.MATRICULAS, matriculaId, {
          concluida: matricula.concluida,
          certificadoEmitido: matricula.certificadoEmitido,
        }).catch(() => {});
      }

      return novo;
    });
  }, []);

  const emitirCertificado = useCallback((matriculaId) => {
    setMatriculas((atual) => {
      const novo = atual.map((m) =>
        m.id === matriculaId ? { ...m, certificadoEmitido: true } : m
      );
      salvarColecao(CHAVES_STORAGE.MATRICULAS, novo);

      if (onlineRef.current) {
        apiPatch(ENDPOINTS.MATRICULAS, matriculaId, { certificadoEmitido: true }).catch(() => {});
      }

      return novo;
    });
  }, []);

  const alternarAssinatura = useCallback((assinaturaId) => {
    setAssinaturas((atual) => {
      const novo = atual.map((a) =>
        a.id === assinaturaId ? { ...a, ativa: !a.ativa } : a
      );
      salvarColecao(CHAVES_STORAGE.ASSINATURAS, novo);

      const assinatura = novo.find((a) => a.id === assinaturaId);
      if (onlineRef.current && assinatura) {
        apiPatch(ENDPOINTS.ASSINATURAS, assinaturaId, { ativa: assinatura.ativa }).catch(() => {});
      }

      return novo;
    });
  }, []);

  const registrarPagamento = useCallback((pagamentoId) => {
    setPagamentos((atual) => {
      const novo = atual.map((p) =>
        p.id === pagamentoId ? { ...p, status: 'Pago' } : p
      );
      salvarColecao(CHAVES_STORAGE.PAGAMENTOS, novo);

      if (onlineRef.current) {
        apiPatch(ENDPOINTS.PAGAMENTOS, pagamentoId, { status: 'Pago' }).catch(() => {});
      }

      return novo;
    });
  }, []);

  // ---- Sincronização manual com o backend ----
  const sincronizarComBackend = useCallback(async () => {
    try {
      const dados = await carregarTodosDoBackend();
      setCategorias(dados.categorias);
      setUsuarios(dados.usuarios);
      setCursos(dados.cursos);
      setModulos(dados.modulos);
      setAulas(dados.aulas);
      setMatriculas(dados.matriculas);
      setPlanos(dados.planos);
      setAssinaturas(dados.assinaturas);
      setPagamentos(dados.pagamentos);
      setOnline(true);
      onlineRef.current = true;
      await salvarTodosOsDados(dados);
      return { sucesso: true };
    } catch (erro) {
      console.warn('[DadosContext] Falha ao sincronizar:', erro.message);
      setOnline(false);
      onlineRef.current = false;
      return { sucesso: false, erro: erro.message };
    }
  }, []);

  // ---- Restauração dos dados iniciais de demonstração ----
  const restaurarPadroes = useCallback(async () => {
    const dadosIniciais = await restaurarDadosIniciais();
    setCategorias(dadosIniciais.categorias);
    setUsuarios(dadosIniciais.usuarios);
    setCursos(dadosIniciais.cursos);
    setModulos(dadosIniciais.modulos);
    setAulas(dadosIniciais.aulas);
    setMatriculas(dadosIniciais.matriculas);
    setPlanos(dadosIniciais.planos);
    setAssinaturas(dadosIniciais.assinaturas);
    setPagamentos(dadosIniciais.pagamentos);
    return dadosIniciais;
  }, []);

  // ---- Consultas derivadas ----
  const consultas = useMemo(
    () => ({
      categoriaPorId: (id) => categorias.find((c) => c.id === id),
      cursoPorId: (id) => cursos.find((c) => c.id === id),
      usuarioPorId: (id) => usuarios.find((u) => u.id === id),
      professores: () => usuarios.filter((u) => u.perfil === 'Professor'),
      alunos: () => usuarios.filter((u) => u.perfil === 'Aluno'),
      cursosDaCategoria: (categoriaId) =>
        cursos.filter((c) => c.categoriaId === categoriaId),
      modulosDoCurso: (cursoId) =>
        modulos
          .filter((m) => m.cursoId === cursoId)
          .sort((a, b) => a.ordem - b.ordem),
      aulasDoModulo: (moduloId) =>
        aulas
          .filter((a) => a.moduloId === moduloId)
          .sort((a, b) => a.ordem - b.ordem),
      matriculasDoCurso: (cursoId) =>
        matriculas.filter((m) => m.cursoId === cursoId),
      receitaConfirmada: () =>
        pagamentos
          .filter((p) => p.status === 'Pago')
          .reduce((total, p) => total + p.valor, 0),
      receitaPendente: () =>
        pagamentos
          .filter((p) => p.status !== 'Pago')
          .reduce((total, p) => total + p.valor, 0),
    }),
    [categorias, cursos, usuarios, modulos, aulas, matriculas, pagamentos]
  );

  const valor = useMemo(
    () => ({
      categorias,
      cursos,
      usuarios,
      modulos,
      aulas,
      matriculas,
      planos,
      assinaturas,
      pagamentos,
      carregando,
      online,
      fonteInicial,
      crudCategorias,
      crudCursos,
      crudUsuarios,
      crudModulos,
      crudAulas,
      crudMatriculas,
      removerCurso,
      removerModulo,
      alternarConclusao,
      emitirCertificado,
      alternarAssinatura,
      registrarPagamento,
      sincronizarComBackend,
      restaurarPadroes,
      ...consultas,
    }),
    [
      categorias,
      cursos,
      usuarios,
      modulos,
      aulas,
      matriculas,
      planos,
      assinaturas,
      pagamentos,
      carregando,
      online,
      fonteInicial,
      crudCategorias,
      crudCursos,
      crudUsuarios,
      crudModulos,
      crudAulas,
      crudMatriculas,
      removerCurso,
      removerModulo,
      alternarConclusao,
      emitirCertificado,
      alternarAssinatura,
      registrarPagamento,
      sincronizarComBackend,
      restaurarPadroes,
      consultas,
    ]
  );

  if (carregando) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: cores.fundo,
          padding: espaco.lg,
        }}
        accessibilityRole="progressbar"
        accessibilityLabel="Carregando dados da aplicação"
      >
        <ActivityIndicator size="large" color={cores.primaria} />
        <Text
          style={{
            ...tipografia.apoio,
            marginTop: espaco.md,
            color: cores.textoMudo,
          }}
        >
          Conectando ao servidor...
        </Text>
      </View>
    );
  }

  return <DadosContext.Provider value={valor}>{children}</DadosContext.Provider>;
}

export function useDados() {
  const ctx = useContext(DadosContext);
  if (!ctx) throw new Error('useDados precisa estar dentro de <DadosProvider>.');
  return ctx;
}
