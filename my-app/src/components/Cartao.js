import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { cores, espaco, raio, tipografia, sombra, alvo } from '../theme';

/**
 * Superfície de conteúdo. Quando recebe onPress, vira um alvo de toque com
 * papel de botão e realce ao pressionar; sem onPress, é apenas um contêiner
 * e não entra na ordem de foco do leitor de tela como elemento acionável.
 *
 * A faixa colorida à esquerda (prop `faixa`) codifica o estado do registro —
 * é informação, não ornamento, e nunca aparece sozinha: o mesmo estado
 * também é dito em texto pela Etiqueta.
 */
export function Cartao({ children, onPress, faixa, rotuloAcessivel, dica, estilo }) {
  const conteudo = (
    <View style={[estilos.cartao, !!faixa && { borderLeftWidth: 5, borderLeftColor: faixa }, estilo]}>
      {children}
    </View>
  );

  if (!onPress) return conteudo;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotuloAcessivel}
      accessibilityHint={dica}
      style={({ pressed }) => [pressed && estilos.pressionado]}
    >
      {conteudo}
    </Pressable>
  );
}

/**
 * Etiqueta de status. Combina cor + texto, para que a informação continue
 * disponível a quem não distingue as cores (WCAG 1.4.1 — uso de cor).
 */
export function Etiqueta({ texto, tom = 'neutro' }) {
  const tons = {
    sucesso: { fundo: cores.sucessoClaro, texto: cores.sucesso },
    aviso: { fundo: cores.avisoClaro, texto: cores.aviso },
    erro: { fundo: cores.erroClaro, texto: cores.erro },
    info: { fundo: cores.primariaClara, texto: cores.primariaEscura },
    neutro: { fundo: cores.fundo, texto: cores.textoSecundario },
  }[tom];

  return (
    <View style={[estilos.etiqueta, { backgroundColor: tons.fundo }]}>
      <Text style={[estilos.etiquetaTexto, { color: tons.texto }]}>{texto}</Text>
    </View>
  );
}

export function TituloSecao({ texto, apoio }) {
  return (
    <View style={estilos.secao}>
      <Text style={tipografia.secao} accessibilityRole="header">{texto}</Text>
      {!!apoio && <Text style={estilos.secaoApoio}>{apoio}</Text>}
    </View>
  );
}

/**
 * Estado vazio. Além de informar a ausência de dados, indica a próxima ação
 * possível — uma tela vazia é um convite para agir, não um beco sem saída.
 */
export function EstadoVazio({ titulo, descricao, children }) {
  return (
    <View style={estilos.vazio}>
      <Text style={estilos.vazioTitulo}>{titulo}</Text>
      <Text style={estilos.vazioDescricao}>{descricao}</Text>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    backgroundColor: cores.papel,
    borderRadius: raio.lg,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: espaco.lg,
    minHeight: alvo.confortavel,
    ...sombra,
  },
  pressionado: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  etiqueta: {
    alignSelf: 'flex-start',
    paddingHorizontal: espaco.md,
    paddingVertical: 5,
    borderRadius: raio.pilula,
  },
  etiquetaTexto: { ...tipografia.micro },
  secao: { marginBottom: espaco.md, marginTop: espaco.lg },
  secaoApoio: { ...tipografia.apoio, marginTop: 2 },
  vazio: {
    padding: espaco.xl,
    alignItems: 'center',
    backgroundColor: cores.papel,
    borderRadius: raio.lg,
    borderWidth: 1,
    borderColor: cores.borda,
    borderStyle: 'dashed',
    gap: espaco.sm,
  },
  vazioTitulo: { ...tipografia.corpoForte, textAlign: 'center' },
  vazioDescricao: { ...tipografia.apoio, textAlign: 'center', marginBottom: espaco.sm },
});
