import React, { useState, useLayoutEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import Tela from '../components/Tela';
import { Cartao, EstadoVazio, TituloSecao } from '../components/Cartao';
import CampoTexto from '../components/CampoTexto';
import Botao from '../components/Botao';
import { BotaoAcao } from '../components/LinhaLista';
import { useDados } from '../context/DadosContext';
import { useFeedback } from '../context/FeedbackContext';
import { cores, espaco, raio, tipografia, alvo } from '../theme';

/**
 * Hierarquia curso → módulo → aula em uma única tela, com módulos
 * expansíveis (acordeão).
 *
 * Optamos por acordeão em vez de mais um nível de navegação: a relação entre
 * módulo e aula é o conteúdo principal aqui, e empurrar as aulas para outra
 * tela esconderia justamente a estrutura que o usuário veio conferir.
 */
export default function ModulosScreen({ navigation, route }) {
  const { cursoId } = route.params;
  const dados = useDados();
  const { mostrar } = useFeedback();
  const curso = dados.cursoPorId(cursoId);

  const [expandidos, setExpandidos] = useState({});
  const [novoModulo, setNovoModulo] = useState('');
  const [erroModulo, setErroModulo] = useState(null);
  const [novaAula, setNovaAula] = useState({});

  useLayoutEffect(() => {
    if (curso) navigation.setOptions({ title: `Módulos · ${curso.titulo}` });
  }, [navigation, curso]);

  if (!curso) {
    return (
      <Tela>
        <EstadoVazio titulo="Curso não encontrado" descricao="Este curso foi removido.">
          <Botao titulo="Voltar" onPress={() => navigation.goBack()} />
        </EstadoVazio>
      </Tela>
    );
  }

  const modulos = dados.modulosDoCurso(cursoId);

  const adicionarModulo = () => {
    if (!novoModulo.trim()) {
      setErroModulo('Informe o título do módulo.');
      return;
    }
    dados.crudModulos.criar({
      cursoId,
      titulo: novoModulo.trim(),
      ordem: modulos.length + 1,
    });
    setNovoModulo('');
    setErroModulo(null);
    mostrar('Módulo adicionado.');
  };

  const adicionarAula = (moduloId) => {
    const titulo = (novaAula[moduloId] ?? '').trim();
    if (!titulo) {
      mostrar('Informe o título da aula.', 'erro');
      return;
    }
    dados.crudAulas.criar({
      moduloId,
      titulo,
      duracaoMin: 10,
      ordem: dados.aulasDoModulo(moduloId).length + 1,
    });
    setNovaAula((atual) => ({ ...atual, [moduloId]: '' }));
    mostrar('Aula adicionada.');
  };

  const excluirModulo = (modulo) => {
    Alert.alert(
      'Excluir módulo',
      `Excluir "${modulo.titulo}"? As aulas dentro dele também serão removidas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            dados.removerModulo(modulo.id);
            mostrar('Módulo excluído.', 'info');
          },
        },
      ]
    );
  };

  return (
    <Tela>
      <Text style={tipografia.apoio}>
        Organize o conteúdo em módulos e, dentro de cada um, as aulas.
      </Text>

      <TituloSecao texto="Novo módulo" />
      <Cartao>
        <CampoTexto
          rotulo="Título do módulo"
          valor={novoModulo}
          onChangeText={(v) => { setNovoModulo(v); if (erroModulo) setErroModulo(null); }}
          placeholder="Ex.: Fundamentos"
          erro={erroModulo}
          obrigatorio
        />
        <Botao titulo="Adicionar módulo" onPress={adicionarModulo} dica="Cria o módulo ao final da lista" />
      </Cartao>

      <TituloSecao texto={`Módulos (${modulos.length})`} />

      {modulos.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum módulo ainda"
          descricao="Use o campo acima para criar o primeiro módulo do curso."
        />
      ) : (
        modulos.map((modulo) => {
          const aulas = dados.aulasDoModulo(modulo.id);
          const aberto = !!expandidos[modulo.id];

          return (
            <Cartao key={modulo.id} estilo={estilos.modulo}>
              <Pressable
                onPress={() => setExpandidos((a) => ({ ...a, [modulo.id]: !aberto }))}
                accessibilityRole="button"
                accessibilityLabel={`Módulo ${modulo.ordem}: ${modulo.titulo}, ${aulas.length} aulas`}
                accessibilityHint={aberto ? 'Toque duas vezes para recolher as aulas' : 'Toque duas vezes para ver as aulas'}
                accessibilityState={{ expanded: aberto }}
                style={({ pressed }) => [estilos.cabecalho, pressed && estilos.cabecalhoPressionado]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={tipografia.corpoForte}>
                    {modulo.ordem}. {modulo.titulo}
                  </Text>
                  <Text style={tipografia.apoio}>
                    {aulas.length} {aulas.length === 1 ? 'aula' : 'aulas'}
                  </Text>
                </View>
                <Text style={estilos.seta} accessible={false} importantForAccessibility="no">
                  {aberto ? '▲' : '▼'}
                </Text>
              </Pressable>

              {aberto && (
                <View style={estilos.corpo}>
                  {aulas.length === 0 ? (
                    <Text style={estilos.semAulas}>Nenhuma aula neste módulo.</Text>
                  ) : (
                    aulas.map((aula) => (
                      <View key={aula.id} style={estilos.aula}>
                        <Text style={estilos.aulaTexto}>
                          {aula.ordem}. {aula.titulo}
                        </Text>
                        <Text style={estilos.aulaDuracao}>{aula.duracaoMin} min</Text>
                        <BotaoAcao
                          texto="Excluir"
                          destrutivo
                          rotulo={`Excluir aula ${aula.titulo}`}
                          dica="Remove a aula do módulo"
                          onPress={() => {
                            dados.crudAulas.remover(aula.id);
                            mostrar('Aula excluída.', 'info');
                          }}
                        />
                      </View>
                    ))
                  )}

                  <CampoTexto
                    rotulo="Nova aula"
                    valor={novaAula[modulo.id] ?? ''}
                    onChangeText={(v) => setNovaAula((a) => ({ ...a, [modulo.id]: v }))}
                    placeholder="Título da aula"
                  />
                  <View style={estilos.acoesModulo}>
                    <Botao
                      titulo="Adicionar aula"
                      variante="secundaria"
                      onPress={() => adicionarAula(modulo.id)}
                      dica={`Adiciona uma aula ao módulo ${modulo.titulo}`}
                    />
                    <Botao
                      titulo="Excluir módulo"
                      variante="perigo"
                      onPress={() => excluirModulo(modulo)}
                      dica="Pede confirmação antes de excluir o módulo e suas aulas"
                    />
                  </View>
                </View>
              )}
            </Cartao>
          );
        })
      )}
    </Tela>
  );
}

const estilos = StyleSheet.create({
  modulo: { marginBottom: espaco.md, padding: 0, overflow: 'hidden' },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: alvo.confortavel,
    padding: espaco.lg,
    gap: espaco.md,
  },
  cabecalhoPressionado: { backgroundColor: cores.primariaClara },
  seta: { fontSize: 14, color: cores.primaria },
  corpo: {
    paddingHorizontal: espaco.lg,
    paddingBottom: espaco.lg,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
    paddingTop: espaco.md,
    gap: espaco.sm,
  },
  aula: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    paddingVertical: espaco.sm,
    borderBottomWidth: 1,
    borderBottomColor: cores.fundo,
  },
  aulaTexto: { ...tipografia.corpo, flex: 1 },
  aulaDuracao: { ...tipografia.micro },
  semAulas: { ...tipografia.apoio, fontStyle: 'italic', marginBottom: espaco.sm },
  acoesModulo: { gap: espaco.sm, marginTop: espaco.sm },
});
