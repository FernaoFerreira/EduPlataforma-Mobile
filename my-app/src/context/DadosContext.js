import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
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
  restaurarDadosIniciais,
} from '../services/storage';
import { cores, espaco, tipografia } from '../theme';

/**
 * Camada de acesso a dados da aplicação com persistência local (Etapa 04).
 *
 * Utiliza o AsyncStorage para manter os dados persistidos no dispositivo
 * entre sessões e reinicializações da aplicação.
 *
 * Toda a interface consome os dados por este contexto, garantindo que
 * alterações reflitam instantaneamente na interface e sejam sincronizadas
 * de forma assíncrona e transparente no armazenamento local.
 */

const DadosContext = createContext(null);

let contador = 0;
const novoId = (prefixo) => `${prefixo}-${Date.now()}-${contador++}`;

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

  // ---- Carga inicial assíncrona do armazenamento local ----
  useEffect(() => {
    let montado = true;

    async function inicializarDados() {
      try {
        const dadosArmazenados = await carregarTodosOsDados();
        if (montado) {
          setCategorias(dadosArmazenados.categorias);
          setUsuarios(dadosArmazenados.usuarios);
          setCursos(dadosArmazenados.cursos);
          setModulos(dadosArmazenados.modulos);
          setAulas(dadosArmazenados.aulas);
          setMatriculas(dadosArmazenados.matriculas);
          setPlanos(dadosArmazenados.planos);
          setAssinaturas(dadosArmazenados.assinaturas);
          setPagamentos(dadosArmazenados.pagamentos);
        }
      } catch (erro) {
        console.error('[DadosContext] Erro ao carregar dados locais:', erro);
      } finally {
        if (montado) {
          setCarregando(false);
        }
      }
    }

    inicializarDados();

    return () => {
      montado = false;
    };
  }, []);

  // ---- Fábrica genérica de CRUD com persistência automática ----
  const criarCrud = (setter, prefixo, chaveStorage) => ({
    criar: (dados) => {
      const registro = { ...dados, id: novoId(prefixo) };
      setter((atual) => {
        const novo = [...atual, registro];
        salvarColecao(chaveStorage, novo);
        return novo;
      });
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
      return atualizado;
    },
    remover: (id) => {
      setter((atual) => {
        const novo = atual.filter((item) => item.id !== id);
        salvarColecao(chaveStorage, novo);
        return novo;
      });
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

  // ---- Remoções em cascata com persistência consistente ----
  const removerCurso = useCallback((id) => {
    setModulos((modulosAtuais) => {
      const modulosDoCurso = modulosAtuais
        .filter((m) => m.cursoId === id)
        .map((m) => m.id);
      const modulosRestantes = modulosAtuais.filter((m) => m.cursoId !== id);

      setAulas((aulasAtuais) => {
        const aulasRestantes = aulasAtuais.filter(
          (a) => !modulosDoCurso.includes(a.moduloId)
        );
        salvarColecao(CHAVES_STORAGE.AULAS, aulasRestantes);
        return aulasRestantes;
      });

      salvarColecao(CHAVES_STORAGE.MODULOS, modulosRestantes);
      return modulosRestantes;
    });

    setMatriculas((matriculasAtuais) => {
      const matriculasRestantes = matriculasAtuais.filter((mat) => mat.cursoId !== id);
      salvarColecao(CHAVES_STORAGE.MATRICULAS, matriculasRestantes);
      return matriculasRestantes;
    });

    setCursos((cursosAtuais) => {
      const cursosRestantes = cursosAtuais.filter((c) => c.id !== id);
      salvarColecao(CHAVES_STORAGE.CURSOS, cursosRestantes);
      return cursosRestantes;
    });
  }, []);

  const removerModulo = useCallback((id) => {
    setAulas((aulasAtuais) => {
      const aulasRestantes = aulasAtuais.filter((a) => a.moduloId !== id);
      salvarColecao(CHAVES_STORAGE.AULAS, aulasRestantes);
      return aulasRestantes;
    });
    setModulos((modulosAtuais) => {
      const modulosRestantes = modulosAtuais.filter((m) => m.id !== id);
      salvarColecao(CHAVES_STORAGE.MODULOS, modulosRestantes);
      return modulosRestantes;
    });
  }, []);

  // ---- Regras de negócio com persistência ----
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
      return novo;
    });
  }, []);

  const emitirCertificado = useCallback((matriculaId) => {
    setMatriculas((atual) => {
      const novo = atual.map((m) =>
        m.id === matriculaId ? { ...m, certificadoEmitido: true } : m
      );
      salvarColecao(CHAVES_STORAGE.MATRICULAS, novo);
      return novo;
    });
  }, []);

  const alternarAssinatura = useCallback((assinaturaId) => {
    setAssinaturas((atual) => {
      const novo = atual.map((a) =>
        a.id === assinaturaId ? { ...a, ativa: !a.ativa } : a
      );
      salvarColecao(CHAVES_STORAGE.ASSINATURAS, novo);
      return novo;
    });
  }, []);

  const registrarPagamento = useCallback((pagamentoId) => {
    setPagamentos((atual) => {
      const novo = atual.map((p) =>
        p.id === pagamentoId ? { ...p, status: 'Pago' } : p
      );
      salvarColecao(CHAVES_STORAGE.PAGAMENTOS, novo);
      return novo;
    });
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
          Carregando dados locais...
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
