import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { cores, espaco, raio, tipografia, alvo } from '../theme';

/**
 * Botão da aplicação.
 *
 * Lei de Fitts: altura mínima de 48dp (alvo.minimo) e área de toque estendida
 * por hitSlop, reduzindo o tempo e o erro de aquisição do alvo.
 *
 * Estados tratados visualmente: normal, pressionado, desabilitado e carregando.
 * Os dois últimos também são informados ao leitor de tela por accessibilityState.
 */
export default function Botao({
  titulo,
  onPress,
  variante = 'primaria',   // primaria | secundaria | perigo | texto
  tamanho = 'medio',       // medio | grande
  desabilitado = false,
  carregando = false,
  iconeEsquerda = null,
  dica,                    // accessibilityHint: o que acontece ao acionar
  estilo,
}) {
  const inativo = desabilitado || carregando;
  const v = variantes[variante];

  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityHint={dica}
      accessibilityState={{ disabled: inativo, busy: carregando }}
      style={({ pressed }) => [
        base.botao,
        tamanho === 'grande' && base.grande,
        { backgroundColor: v.fundo, borderColor: v.borda },
        pressed && !inativo && { backgroundColor: v.fundoPressionado, transform: [{ scale: 0.985 }] },
        inativo && base.inativo,
        estilo,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={v.texto} />
      ) : (
        <View style={base.conteudo}>
          {iconeEsquerda ? <View style={base.icone}>{iconeEsquerda}</View> : null}
          <Text style={[base.rotulo, { color: inativo ? cores.desabilitado : v.texto }]}>
            {titulo}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const variantes = {
  primaria: {
    fundo: cores.primaria,
    fundoPressionado: cores.primariaEscura,
    borda: cores.primaria,
    texto: cores.papel,
  },
  secundaria: {
    fundo: cores.papel,
    fundoPressionado: cores.primariaClara,
    borda: cores.primaria,
    texto: cores.primaria,
  },
  perigo: {
    fundo: cores.erroClaro,
    fundoPressionado: '#F3D3D1',
    borda: cores.erro,
    texto: cores.erro,
  },
  texto: {
    fundo: 'transparent',
    fundoPressionado: cores.primariaClara,
    borda: 'transparent',
    texto: cores.primaria,
  },
};

const base = StyleSheet.create({
  botao: {
    minHeight: alvo.minimo,
    paddingHorizontal: espaco.lg,
    borderRadius: raio.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grande: { minHeight: alvo.confortavel },
  inativo: { backgroundColor: cores.fundo, borderColor: cores.borda },
  conteudo: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  icone: { marginRight: 2 },
  rotulo: { ...tipografia.corpoForte, textAlign: 'center' },
});
