import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { cores, espaco, raio, tipografia, alvo } from '../theme';

/**
 * Campo de entrada de texto.
 *
 * Acessibilidade:
 *  - o rótulo é um <Text> visível (nunca apenas placeholder, que desaparece
 *    ao digitar e não é lido de forma confiável);
 *  - accessibilityLabel repete o rótulo e marca campos obrigatórios;
 *  - a mensagem de erro entra em accessibilityHint e é anunciada por
 *    live region, além de ser sinalizada por texto + ícone, não só por cor.
 */
export default function CampoTexto({
  rotulo,
  valor,
  onChangeText,
  placeholder,
  erro,
  obrigatorio = false,
  multilinha = false,
  ajuda,
  ...resto
}) {
  const [focado, setFocado] = useState(false);

  return (
    <View style={estilos.grupo}>
      <Text style={estilos.rotulo}>
        {rotulo}
        {obrigatorio ? <Text style={estilos.asterisco}> *</Text> : null}
      </Text>

      <TextInput
        value={valor}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={cores.textoSecundario}
        onFocus={() => setFocado(true)}
        onBlur={() => setFocado(false)}
        multiline={multilinha}
        accessibilityLabel={`${rotulo}${obrigatorio ? ', campo obrigatório' : ''}`}
        accessibilityHint={erro || ajuda}
        style={[
          estilos.campo,
          multilinha && estilos.campoMultilinha,
          focado && estilos.campoFocado,
          !!erro && estilos.campoErro,
        ]}
        {...resto}
      />

      {!!erro && (
        <Text style={estilos.erro} accessibilityLiveRegion="polite">
          ⚠ {erro}
        </Text>
      )}
      {!erro && !!ajuda && <Text style={estilos.ajuda}>{ajuda}</Text>}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { marginBottom: espaco.lg },
  rotulo: { ...tipografia.corpoForte, marginBottom: espaco.sm },
  asterisco: { color: cores.erro },
  campo: {
    minHeight: alvo.minimo,
    borderWidth: 1.5,
    borderColor: cores.bordaForte,
    borderRadius: raio.md,
    paddingHorizontal: espaco.md,
    paddingVertical: espaco.md,
    backgroundColor: cores.papel,
    ...tipografia.corpo,
  },
  campoMultilinha: { minHeight: 96, textAlignVertical: 'top' },
  campoFocado: { borderColor: cores.primaria, borderWidth: 2 },
  campoErro: { borderColor: cores.erro, backgroundColor: cores.erroClaro },
  erro: { ...tipografia.apoio, color: cores.erro, marginTop: espaco.xs, fontWeight: '600' },
  ajuda: { ...tipografia.apoio, marginTop: espaco.xs },
});
