import React from 'react';
import {
  View, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, useWindowDimensions,
} from 'react-native';
import { cores, espaco } from '../theme';

/**
 * Adaptação a diferentes tamanhos de tela.
 *
 * Um único ponto de quebra em 600dp separa telefone de tablet/telefone
 * deitado. Acima dele o conteúdo para de esticar (largura máxima de 680dp,
 * mantendo a linha de texto legível) e as grades passam de 1 para 2 colunas.
 */
export const PONTO_QUEBRA = 600;

export function useLayoutResponsivo() {
  const { width } = useWindowDimensions();
  const largo = width >= PONTO_QUEBRA;
  return {
    largura: width,
    largo,
    colunas: largo ? 2 : 1,
    larguraMaxima: 680,
  };
}

/**
 * Envoltório padrão das telas: fundo, respiro lateral, rolagem e
 * recuo automático do teclado nos formulários.
 */
export default function Tela({ children, comRolagem = true, estiloConteudo }) {
  const { larguraMaxima } = useLayoutResponsivo();

  const corpo = (
    <View style={[estilos.limite, { maxWidth: larguraMaxima }, estiloConteudo]}>
      {children}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={estilos.raiz}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {comRolagem ? (
        <ScrollView
          contentContainerStyle={estilos.rolagem}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {corpo}
        </ScrollView>
      ) : (
        <View style={estilos.rolagem}>{corpo}</View>
      )}
    </KeyboardAvoidingView>
  );
}

/**
 * Grade que vira duas colunas em telas largas e uma em telefones.
 */
export function Grade({ children, espacamento = espaco.md }) {
  const { colunas } = useLayoutResponsivo();
  const itens = React.Children.toArray(children);

  return (
    <View style={[estilos.grade, { gap: espacamento }]}>
      {itens.map((filho, indice) => (
        <View
          key={indice}
          style={{ flexBasis: colunas === 2 ? '48%' : '100%', flexGrow: 1, minWidth: 0 }}
        >
          {filho}
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
  rolagem: {
    flexGrow: 1,
    paddingHorizontal: espaco.lg,
    paddingTop: espaco.lg,
    paddingBottom: espaco.xxl * 2, // espaço para o botão flutuante e a barra de abas
    alignItems: 'center',
  },
  limite: { width: '100%' },
  grade: { flexDirection: 'row', flexWrap: 'wrap' },
});
