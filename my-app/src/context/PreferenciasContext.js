import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  carregarPreferencias,
  salvarPreferencias,
  PREFERENCIAS_PADRAO,
} from '../services/storage.js';
import { obterCores, coresClaro } from '../theme/index.js';

const PreferenciasContext = createContext(null);

export function PreferenciasProvider({ children }) {
  const [preferencias, setPreferencias] = useState(PREFERENCIAS_PADRAO);
  const [carregado, setCarregado] = useState(false);

  // Carrega preferências persistidas no AsyncStorage ao iniciar
  useEffect(() => {
    let ativo = true;
    async function inicializar() {
      try {
        const salvas = await carregarPreferencias();
        if (ativo) {
          setPreferencias(salvas);
          setCarregado(true);
        }
      } catch {
        if (ativo) {
          setCarregado(true);
        }
      }
    }
    inicializar();
    return () => {
      ativo = false;
    };
  }, []);

  // Atualiza e persiste alterações
  const atualizarPreferencias = useCallback(async (atualizacoes) => {
    setPreferencias((anteriores) => {
      const novas = { ...anteriores, ...atualizacoes };
      // Persiste assincronamente no AsyncStorage
      salvarPreferencias(novas).catch(() => {});
      return novas;
    });
  }, []);

  const alternarTema = useCallback(() => {
    const proximoTema = preferencias.tema === 'claro' ? 'escuro' : 'claro';
    atualizarPreferencias({ tema: proximoTema });
  }, [preferencias.tema, atualizarPreferencias]);

  const definirTema = useCallback((novoTema) => {
    if (novoTema === 'claro' || novoTema === 'escuro') {
      atualizarPreferencias({ tema: novoTema });
    }
  }, [atualizarPreferencias]);

  const alternarBibliografia = useCallback(() => {
    atualizarPreferencias({ exibirBibliografia: !preferencias.exibirBibliografia });
  }, [preferencias.exibirBibliografia, atualizarPreferencias]);

  const definirAlunoAtivo = useCallback((alunoId) => {
    atualizarPreferencias({ alunoAtivoId: alunoId || null });
  }, [atualizarPreferencias]);

  const alternarNotificacoes = useCallback(() => {
    atualizarPreferencias({ notificacoesHabilitadas: !preferencias.notificacoesHabilitadas });
  }, [preferencias.notificacoesHabilitadas, atualizarPreferencias]);

  const redefinirPreferencias = useCallback(async () => {
    setPreferencias(PREFERENCIAS_PADRAO);
    await salvarPreferencias(PREFERENCIAS_PADRAO);
  }, []);

  // Cores dinâmicas ativas para o tema atual
  const coresTema = useMemo(() => {
    return obterCores(preferencias.tema);
  }, [preferencias.tema]);

  const valor = useMemo(() => ({
    tema: preferencias.tema,
    coresTema,
    exibirBibliografia: preferencias.exibirBibliografia,
    alunoAtivoId: preferencias.alunoAtivoId,
    notificacoesHabilitadas: preferencias.notificacoesHabilitadas,
    carregado,
    alternarTema,
    definirTema,
    alternarBibliografia,
    definirAlunoAtivo,
    alternarNotificacoes,
    redefinirPreferencias,
  }), [
    preferencias,
    coresTema,
    carregado,
    alternarTema,
    definirTema,
    alternarBibliografia,
    definirAlunoAtivo,
    alternarNotificacoes,
    redefinirPreferencias,
  ]);

  return (
    <PreferenciasContext.Provider value={valor}>
      {children}
    </PreferenciasContext.Provider>
  );
}

/**
 * Hook para acessar o estado global de preferências em qualquer tela ou componente.
 * Retorna valores seguros caso seja executado fora do Provider (ex.: testes isolados).
 */
export function usePreferencias() {
  const contexto = useContext(PreferenciasContext);
  if (!contexto) {
    return {
      tema: 'claro',
      coresTema: coresClaro,
      exibirBibliografia: true,
      alunoAtivoId: null,
      notificacoesHabilitadas: true,
      carregado: true,
      alternarTema: () => {},
      definirTema: () => {},
      alternarBibliografia: () => {},
      definirAlunoAtivo: () => {},
      alternarNotificacoes: () => {},
      redefinirPreferencias: async () => {},
    };
  }
  return contexto;
}

export default PreferenciasContext;
