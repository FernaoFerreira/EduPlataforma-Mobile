import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { cores, espaco, raio, tipografia, sombra, alvo } from '../theme';

/**
 * Ação principal da tela (sempre "adicionar", em todas as listagens).
 *
 * Lei de Fitts aplicada de duas formas:
 *  1. alvo grande — 56dp de altura, acima do mínimo de 48dp;
 *  2. posição — canto inferior direito, dentro do arco natural do polegar em
 *     uso com uma mão, e distante das ações destrutivas dos cartões, o que
 *     reduz acionamento acidental.
 */
export default function BotaoFlutuante({ titulo, onPress, dica }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityHint={dica}
      hitSlop={10}
      style={({ pressed }) => [estilos.botao, pressed && estilos.pressionado]}
    >
      <Text style={estilos.texto}>+ {titulo}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  botao: {
    position: 'absolute',
    right: espaco.lg,
    bottom: espaco.lg,
    minHeight: alvo.confortavel,
    paddingHorizontal: espaco.xl,
    justifyContent: 'center',
    borderRadius: raio.pilula,
    backgroundColor: cores.primaria,
    ...sombra,
    shadowOpacity: 0.22,
    elevation: 6,
  },
  pressionado: { backgroundColor: cores.primariaEscura, transform: [{ scale: 0.97 }] },
  texto: { ...tipografia.corpoForte, color: cores.papel },
});
