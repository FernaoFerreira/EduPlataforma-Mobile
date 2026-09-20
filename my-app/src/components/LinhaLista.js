import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { cores, espaco, raio, tipografia, alvo } from '../theme';
import { Cartao } from './Cartao';

/**
 * Item de lista com título, descrição, etiquetas e ações.
 *
 * As ações ficam em botões próprios (48dp) em vez de gestos de deslizar:
 * um gesto escondido não é descobrível nem alcançável por leitor de tela.
 * A exclusão sempre passa por confirmação — ação destrutiva e irreversível.
 */
export default function LinhaLista({
  titulo,
  descricao,
  detalhe,
  etiquetas,
  faixa,
  onPress,
  dicaPress,
  onEditar,
  onExcluir,
  textoConfirmacaoExclusao,
  acoesExtras,
}) {
  const confirmarExclusao = () => {
    Alert.alert(
      'Excluir registro',
      textoConfirmacaoExclusao || `Excluir "${titulo}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: onExcluir },
      ]
    );
  };

  return (
    <Cartao
      onPress={onPress}
      dica={dicaPress}
      rotuloAcessivel={`${titulo}${descricao ? `. ${descricao}` : ''}`}
      faixa={faixa}
      estilo={estilos.cartao}
    >
      <View style={estilos.topo}>
        <View style={estilos.textos}>
          <Text style={tipografia.corpoForte}>{titulo}</Text>
          {!!descricao && <Text style={estilos.descricao}>{descricao}</Text>}
          {!!detalhe && <Text style={estilos.detalhe}>{detalhe}</Text>}
        </View>
      </View>

      {!!etiquetas?.length && <View style={estilos.etiquetas}>{etiquetas}</View>}

      {(onEditar || onExcluir || acoesExtras) && (
        <View style={estilos.acoes}>
          {acoesExtras}
          {onEditar && (
            <BotaoAcao
              texto="Editar"
              onPress={onEditar}
              rotulo={`Editar ${titulo}`}
              dica="Abre o formulário de edição"
            />
          )}
          {onExcluir && (
            <BotaoAcao
              texto="Excluir"
              onPress={confirmarExclusao}
              rotulo={`Excluir ${titulo}`}
              dica="Pede confirmação antes de excluir"
              destrutivo
            />
          )}
        </View>
      )}
    </Cartao>
  );
}

export function BotaoAcao({ texto, onPress, rotulo, dica, destrutivo = false, ativo = false }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={rotulo || texto}
      accessibilityHint={dica}
      style={({ pressed }) => [
        estilos.acao,
        destrutivo && estilos.acaoDestrutiva,
        ativo && estilos.acaoAtiva,
        pressed && estilos.acaoPressionada,
      ]}
    >
      <Text
        style={[
          estilos.acaoTexto,
          destrutivo && { color: cores.erro },
          ativo && { color: cores.papel },
        ]}
      >
        {texto}
      </Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  cartao: { marginBottom: espaco.md, gap: espaco.md },
  topo: { flexDirection: 'row', alignItems: 'flex-start' },
  textos: { flex: 1, gap: 2 },
  descricao: { ...tipografia.apoio },
  detalhe: { ...tipografia.micro, marginTop: espaco.xs },
  etiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  acoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espaco.sm,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
    paddingTop: espaco.md,
  },
  acao: {
    minHeight: alvo.minimo,
    minWidth: 88,
    paddingHorizontal: espaco.lg,
    borderRadius: raio.md,
    borderWidth: 1.5,
    borderColor: cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acaoAtiva: { backgroundColor: cores.primaria },
  acaoDestrutiva: { borderColor: cores.erro },
  acaoPressionada: { backgroundColor: cores.primariaClara },
  acaoTexto: { ...tipografia.corpoForte, color: cores.primaria, fontSize: 15 },
});
