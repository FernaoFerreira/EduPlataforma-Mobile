import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
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

/**
 * Camada de acesso a dados da aplicação.
 *
 * Hoje o estado vive em memória (Etapa 2 dispensa persistência). Toda a
 * interface consome os dados por este contexto, nunca pelo arquivo de seed
 * diretamente — assim, substituir este arquivo por chamadas HTTP não exige
 * alterar nenhuma tela.
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
  const [planos] = useState(planosIniciais);
  const [assinaturas, setAssinaturas] = useState(assinaturasIniciais);
  const [pagamentos, setPagamentos] = useState(pagamentosIniciais);

  // ---- Fábrica genérica de CRUD, para não repetir a mesma lógica 6 vezes ----
  const criarCrud = (setter, prefixo) => ({
    criar: (dados) => {
      const registro = { ...dados, id: novoId(prefixo) };
      setter((atual) => [...atual, registro]);
      return registro;
    },
    atualizar: (id, dados) =>
      setter((atual) => atual.map((item) => (item.id === id ? { ...item, ...dados } : item))),
    remover: (id) => setter((atual) => atual.filter((item) => item.id !== id)),
  });

  const crudCategorias = useMemo(() => criarCrud(setCategorias, 'cat'), []);
  const crudCursos = useMemo(() => criarCrud(setCursos, 'cur'), []);
  const crudUsuarios = useMemo(() => criarCrud(setUsuarios, 'usr'), []);
  const crudModulos = useMemo(() => criarCrud(setModulos, 'mod'), []);
  const crudAulas = useMemo(() => criarCrud(setAulas, 'aul'), []);
  const crudMatriculas = useMemo(() => criarCrud(setMatriculas, 'mat'), []);

  // ---- Remoções em cascata: manter a hierarquia coerente ----
  const removerCurso = useCallback((id) => {
    const modulosDoCurso = modulos.filter((m) => m.cursoId === id).map((m) => m.id);
    setAulas((atual) => atual.filter((a) => !modulosDoCurso.includes(a.moduloId)));
    setModulos((atual) => atual.filter((m) => m.cursoId !== id));
    setMatriculas((atual) => atual.filter((mat) => mat.cursoId !== id));
    setCursos((atual) => atual.filter((c) => c.id !== id));
  }, [modulos]);

  const removerModulo = useCallback((id) => {
    setAulas((atual) => atual.filter((a) => a.moduloId !== id));
    setModulos((atual) => atual.filter((m) => m.id !== id));
  }, []);

  // ---- Regras de negócio específicas ----
  const alternarConclusao = useCallback((matriculaId) => {
    setMatriculas((atual) =>
      atual.map((m) => {
        if (m.id !== matriculaId) return m;
        const concluida = !m.concluida;
        // Desfazer a conclusão invalida o certificado emitido.
        return { ...m, concluida, certificadoEmitido: concluida && m.certificadoEmitido };
      })
    );
  }, []);

  const emitirCertificado = useCallback((matriculaId) => {
    setMatriculas((atual) =>
      atual.map((m) => (m.id === matriculaId ? { ...m, certificadoEmitido: true } : m))
    );
  }, []);

  const alternarAssinatura = useCallback((assinaturaId) => {
    setAssinaturas((atual) =>
      atual.map((a) => (a.id === assinaturaId ? { ...a, ativa: !a.ativa } : a))
    );
  }, []);

  const registrarPagamento = useCallback((pagamentoId) => {
    setPagamentos((atual) =>
      atual.map((p) => (p.id === pagamentoId ? { ...p, status: 'Pago' } : p))
    );
  }, []);

  // ---- Consultas derivadas ----
  const consultas = useMemo(() => ({
    categoriaPorId: (id) => categorias.find((c) => c.id === id),
    cursoPorId: (id) => cursos.find((c) => c.id === id),
    usuarioPorId: (id) => usuarios.find((u) => u.id === id),
    professores: () => usuarios.filter((u) => u.perfil === 'Professor'),
    alunos: () => usuarios.filter((u) => u.perfil === 'Aluno'),
    cursosDaCategoria: (categoriaId) => cursos.filter((c) => c.categoriaId === categoriaId),
    modulosDoCurso: (cursoId) =>
      modulos.filter((m) => m.cursoId === cursoId).sort((a, b) => a.ordem - b.ordem),
    aulasDoModulo: (moduloId) =>
      aulas.filter((a) => a.moduloId === moduloId).sort((a, b) => a.ordem - b.ordem),
    matriculasDoCurso: (cursoId) => matriculas.filter((m) => m.cursoId === cursoId),
    receitaConfirmada: () =>
      pagamentos.filter((p) => p.status === 'Pago').reduce((total, p) => total + p.valor, 0),
    receitaPendente: () =>
      pagamentos.filter((p) => p.status !== 'Pago').reduce((total, p) => total + p.valor, 0),
  }), [categorias, cursos, usuarios, modulos, aulas, matriculas, pagamentos]);

  const valor = useMemo(() => ({
    categorias, cursos, usuarios, modulos, aulas, matriculas, planos, assinaturas, pagamentos,
    crudCategorias, crudCursos, crudUsuarios, crudModulos, crudAulas, crudMatriculas,
    removerCurso, removerModulo,
    alternarConclusao, emitirCertificado, alternarAssinatura, registrarPagamento,
    ...consultas,
  }), [
    categorias, cursos, usuarios, modulos, aulas, matriculas, planos, assinaturas, pagamentos,
    crudCategorias, crudCursos, crudUsuarios, crudModulos, crudAulas, crudMatriculas,
    removerCurso, removerModulo,
    alternarConclusao, emitirCertificado, alternarAssinatura, registrarPagamento, consultas,
  ]);

  return <DadosContext.Provider value={valor}>{children}</DadosContext.Provider>;
}

export function useDados() {
  const ctx = useContext(DadosContext);
  if (!ctx) throw new Error('useDados precisa estar dentro de <DadosProvider>.');
  return ctx;
}
