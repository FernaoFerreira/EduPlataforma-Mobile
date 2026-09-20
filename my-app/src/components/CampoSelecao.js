import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { cores, espaco, raio, tipografia, alvo } from '../theme';

/**
 * Seleção de uma opção entre poucas, apresentada como chips.
 *
 * Escolhido no lugar de um seletor suspenso porque, em listas curtas, expõe
 * todas as alternativas sem passo extra e oferece alvos grandes (Lei de
 * Fitts). Cada chip declara accessibilityRole="radio" e o estado selecionado,
 * de modo que o leitor de tela anuncia "selecionado" / "não selecionado".
 */
export default function CampoSelecao({
  rotulo,
  opcoes,            // [{ valor, texto }]
  valorSelecionado,
  onSelecionar,
  erro,
  obrigatorio = false,
  mensagemVazia = 'Nenhuma opção disponível.',
}) {
  return (
    <View style={estilos.grupo}>
      <Text style={estilos.rotulo}>
        {rotulo}
        {obrigatorio ? <Text style={estilos.asterisco}> *</Text> : null}
      </Text>

      {opcoes.length === 0 ? (
        <Text style={estilos.vazio}>{mensagemVazia}</Text>
      ) : (
        <View style={estilos.lista} accessibilityRole="radiogroup" accessibilityLabel={rotulo}>
          {opcoes.map((opcao) => {
            const selecionado = opcao.valor === valorSelecionado;
            return (
              <Pressable
                key={opcao.valor}
                onPress={() => onSelecionar(opcao.valor)}
                hitSlop={6}
                accessibilityRole="radio"
                accessibilityLabel={opcao.texto}
                accessibilityState={{ selected: selecionado, checked: selecionado }}
                style={({ pressed }) => [
                  estilos.chip,
                  selecionado && estilos.chipSelecionado,
                  pressed && estilos.chipPressionado,
                  !!erro && !selecionado && estilos.chipErro,
                ]}
              >
                <Text style={[estilos.chipTexto, selecionado && estilos.chipTextoSelecionado]}>
                  {selecionado ? '✓ ' : ''}{opcao.texto}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {!!erro && (
        <Text style={estilos.erro} accessibilityLiveRegion="polite">⚠ {erro}</Text>
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  grupo: { marginBottom: espaco.lg },
  rotulo: { ...tipografia.corpoForte, marginBottom: espaco.sm },
  asterisco: { color: cores.erro },
  lista: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  chip: {
    minHeight: alvo.minimo,
    justifyContent: 'center',
    paddingHorizontal: espaco.lg,
    borderRadius: raio.pilula,
    borderWidth: 1.5,
    borderColor: cores.bordaForte,
    backgroundColor: cores.papel,
  },
  chipSelecionado: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  chipPressionado: { backgroundColor: cores.primariaClara },
  chipErro: { borderColor: cores.erro },
  chipTexto: { ...tipografia.corpo, fontWeight: '600' },
  chipTextoSelecionado: { color: cores.papel },
  vazio: { ...tipografia.apoio, fontStyle: 'italic' },
  erro: { ...tipografia.apoio, color: cores.erro, marginTop: espaco.xs, fontWeight: '600' },
});
