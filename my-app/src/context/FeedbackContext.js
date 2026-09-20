import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Animated, StyleSheet, Text, View, AccessibilityInfo, Platform } from 'react-native';
import { cores, espaco, raio, tipografia, sombra } from '../theme';

/**
 * Feedback visual global das ações (Etapa 3).
 *
 * Além de exibir a mensagem, o componente:
 *  - marca a região com accessibilityLiveRegion="polite" (Android), para que
 *    o leitor de tela anuncie a mudança sem interromper a leitura em curso;
 *  - dispara AccessibilityInfo.announceForAccessibility no iOS, que não
 *    possui live region equivalente.
 */

const FeedbackContext = createContext(null);

const DURACAO_MS = 2600;

export function FeedbackProvider({ children }) {
  const [aviso, setAviso] = useState(null); // { mensagem, tipo }
  const opacidade = useRef(new Animated.Value(0)).current;
  const temporizador = useRef(null);

  const esconder = useCallback(() => {
    Animated.timing(opacidade, { toValue: 0, duration: 180, useNativeDriver: true })
      .start(() => setAviso(null));
  }, [opacidade]);

  const mostrar = useCallback((mensagem, tipo = 'sucesso') => {
    setAviso({ mensagem, tipo });
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(mensagem);

    Animated.timing(opacidade, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(esconder, DURACAO_MS);
  }, [opacidade, esconder]);

  useEffect(() => () => { if (temporizador.current) clearTimeout(temporizador.current); }, []);

  const paleta = {
    sucesso: { fundo: cores.sucesso },
    erro: { fundo: cores.erro },
    info: { fundo: cores.primariaEscura },
  }[aviso?.tipo ?? 'sucesso'];

  return (
    <FeedbackContext.Provider value={{ mostrar }}>
      {children}
      {aviso && (
        <Animated.View
          pointerEvents="none"
          style={[estilos.barra, { backgroundColor: paleta.fundo, opacity: opacidade }]}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          <Text style={estilos.texto}>{aviso.mensagem}</Text>
        </Animated.View>
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback precisa estar dentro de <FeedbackProvider>.');
  return ctx;
}

const estilos = StyleSheet.create({
  barra: {
    position: 'absolute',
    left: espaco.lg,
    right: espaco.lg,
    bottom: 96, // acima da barra de abas
    paddingVertical: espaco.md,
    paddingHorizontal: espaco.lg,
    borderRadius: raio.md,
    ...sombra,
  },
  texto: { ...tipografia.corpo, color: cores.papel, fontWeight: '600' },
});
