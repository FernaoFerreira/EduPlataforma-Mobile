import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { cores, espaco, raio, tipografia, alvo } from '../theme';

/**
 * Trilha da plataforma: Categorias → Cursos → Módulos → Matrículas.
 *
 * A numeração e as setas não são enfeite — representam a dependência real
 * entre os cadastros (não existe curso sem categoria, nem módulo sem curso).
 * Cada degrau é também um atalho de navegação para a respectiva listagem.
 */
export function Trilha({ etapas }) {
  return (
    <View
      style={estilos.trilha}
      accessibilityRole="menu"
      accessibilityLabel="Trilha de cadastros da plataforma"
    >
      {etapas.map((etapa, indice) => (
        <View key={etapa.nome} style={estilos.degrauEnvoltorio}>
          <Pressable
            onPress={etapa.onPress}
            accessibilityRole="button"
            accessibilityLabel={`${etapa.nome}: ${etapa.total} ${etapa.total === 1 ? 'registro' : 'registros'}`}
            accessibilityHint={`Etapa ${indice + 1} de ${etapas.length}. Abre a lista de ${etapa.nome.toLowerCase()}`}
            hitSlop={6}
            style={({ pressed }) => [estilos.degrau, pressed && estilos.degrauPressionado]}
          >
            <Text style={estilos.ordem}>{indice + 1}</Text>
            <Text style={estilos.total}>{etapa.total}</Text>
            <Text style={estilos.nome} numberOfLines={1}>{etapa.nome}</Text>
          </Pressable>
          {indice < etapas.length - 1 && (
            <Text style={estilos.seta} importantForAccessibility="no" accessible={false}>›</Text>
          )}
        </View>
      ))}
    </View>
  );
}

/**
 * Métrica secundária do painel.
 */
export function CartaoMetrica({ rotulo, valor, apoio, onPress, dica }) {
  const conteudo = (
    <View style={estilos.metrica}>
      <Text style={estilos.metricaValor}>{valor}</Text>
      <Text style={estilos.metricaRotulo}>{rotulo}</Text>
      {!!apoio && <Text style={estilos.metricaApoio}>{apoio}</Text>}
    </View>
  );

  if (!onPress) return conteudo;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${rotulo}: ${valor}`}
      accessibilityHint={dica}
      style={({ pressed }) => [pressed && { opacity: 0.75 }]}
    >
      {conteudo}
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  trilha: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: cores.papel,
    borderRadius: raio.lg,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: espaco.sm,
  },
  degrauEnvoltorio: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  degrau: {
    flex: 1,
    minHeight: alvo.confortavel + 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: espaco.sm,
    paddingHorizontal: 2,
    borderRadius: raio.md,
  },
  degrauPressionado: { backgroundColor: cores.primariaClara },
  ordem: { ...tipografia.micro, color: cores.acento, marginBottom: 2 },
  total: { fontSize: 22, fontWeight: '700', color: cores.primaria, letterSpacing: -0.5 },
  nome: { ...tipografia.micro, color: cores.textoSecundario, textAlign: 'center' },
  seta: { fontSize: 20, color: cores.bordaForte, paddingHorizontal: 2 },

  metrica: {
    backgroundColor: cores.papel,
    borderRadius: raio.lg,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: espaco.lg,
    minHeight: 96,
    justifyContent: 'center',
  },
  metricaValor: { ...tipografia.numero },
  metricaRotulo: { ...tipografia.corpoForte, marginTop: 2 },
  metricaApoio: { ...tipografia.apoio, marginTop: 2 },
});
