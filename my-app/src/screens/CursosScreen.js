import React, { useState, useLayoutEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Tela from '../components/Tela';
import LinhaLista, { BotaoAcao } from '../components/LinhaLista';
import { Etiqueta, EstadoVazio } from '../components/Cartao';
import CampoTexto from '../components/CampoTexto';
import Botao from '../components/Botao';
import BotaoFlutuante from '../components/BotaoFlutuante';
import { useDados } from '../context/DadosContext';
import { useFeedback } from '../context/FeedbackContext';
import { cores, espaco, tipografia, alvo, raio } from '../theme';
import { Pressable } from 'react-native';

export default function CursosScreen({ navigation }) {
  const dados = useDados();
  const { mostrar } = useFeedback();
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState(null);

  // Acesso às categorias pelo cabeçalho: é um cadastro de apoio aos cursos,
  // então mora dentro desta pilha em vez de ocupar uma aba própria.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('Categorias')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Categorias"
          accessibilityHint="Abre o cadastro de categorias"
          style={({ pressed }) => [estilos.acaoCabecalho, pressed && estilos.acaoCabecalhoPressionada]}
        >
          <Text style={estilos.acaoCabecalhoTexto}>Categorias</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  const cursosVisiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return dados.cursos.filter((curso) => {
      const casaBusca = !termo || curso.titulo.toLowerCase().includes(termo);
      const casaCategoria = !filtroCategoria || curso.categoriaId === filtroCategoria;
      return casaBusca && casaCategoria;
    });
  }, [dados.cursos, busca, filtroCategoria]);

  const excluir = (curso) => {
    dados.removerCurso(curso.id);
    mostrar(`Curso "${curso.titulo}" excluído.`, 'info');
  };

  return (
    <View style={{ flex: 1 }}>
      <Tela>
        <CampoTexto
          rotulo="Buscar curso"
          valor={busca}
          onChangeText={setBusca}
          placeholder="Digite parte do título"
          ajuda="A lista é filtrada enquanto você digita."
          returnKeyType="search"
        />

        <View
          style={estilos.filtros}
          accessibilityRole="radiogroup"
          accessibilityLabel="Filtrar por categoria"
        >
          <FiltroChip
            texto="Todas"
            ativo={filtroCategoria === null}
            onPress={() => setFiltroCategoria(null)}
          />
          {dados.categorias.map((cat) => (
            <FiltroChip
              key={cat.id}
              texto={cat.nome}
              ativo={filtroCategoria === cat.id}
              onPress={() => setFiltroCategoria(filtroCategoria === cat.id ? null : cat.id)}
            />
          ))}
        </View>

        <Text style={estilos.contagem} accessibilityLiveRegion="polite">
          {cursosVisiveis.length}{' '}
          {cursosVisiveis.length === 1 ? 'curso encontrado' : 'cursos encontrados'}
        </Text>

        {cursosVisiveis.length === 0 ? (
          <EstadoVazio
            titulo={dados.cursos.length === 0 ? 'Nenhum curso cadastrado' : 'Nenhum curso corresponde ao filtro'}
            descricao={
              dados.cursos.length === 0
                ? 'Cadastre o primeiro curso para começar a montar o catálogo.'
                : 'Ajuste a busca ou escolha outra categoria.'
            }
          >
            {dados.cursos.length === 0 ? (
              <Botao titulo="Cadastrar curso" onPress={() => navigation.navigate('CursoForm', {})} />
            ) : (
              <Botao
                titulo="Limpar filtros"
                variante="secundaria"
                onPress={() => { setBusca(''); setFiltroCategoria(null); }}
              />
            )}
          </EstadoVazio>
        ) : (
          cursosVisiveis.map((curso) => {
            const categoria = dados.categoriaPorId(curso.categoriaId);
            const professor = dados.usuarioPorId(curso.professorId);
            const totalModulos = dados.modulosDoCurso(curso.id).length;

            return (
              <LinhaLista
                key={curso.id}
                titulo={curso.titulo}
                descricao={curso.descricao}
                detalhe={`${categoria?.nome ?? 'Sem categoria'} · ${professor?.nome ?? 'Sem professor'} · ${curso.cargaHoraria}h`}
                faixa={curso.publicado ? cores.sucesso : cores.aviso}
                onPress={() => navigation.navigate('CursoDetalhe', { cursoId: curso.id })}
                dicaPress="Abre os detalhes do curso"
                etiquetas={[
                  <Etiqueta
                    key="pub"
                    texto={curso.publicado ? 'Publicado' : 'Rascunho'}
                    tom={curso.publicado ? 'sucesso' : 'aviso'}
                  />,
                  <Etiqueta key="mod" texto={`${totalModulos} módulos`} tom="info" />,
                ]}
                onEditar={() => navigation.navigate('CursoForm', { cursoId: curso.id })}
                onExcluir={() => excluir(curso)}
                textoConfirmacaoExclusao={`Excluir "${curso.titulo}"? Os módulos, aulas e matrículas vinculados também serão removidos.`}
                acoesExtras={
                  <BotaoAcao
                    texto="Módulos"
                    onPress={() => navigation.navigate('Modulos', { cursoId: curso.id })}
                    rotulo={`Módulos de ${curso.titulo}`}
                    dica="Abre os módulos e aulas do curso"
                  />
                }
              />
            );
          })
        )}
      </Tela>

      <BotaoFlutuante
        titulo="Novo curso"
        onPress={() => navigation.navigate('CursoForm', {})}
        dica="Abre o formulário de cadastro de curso"
      />
    </View>
  );
}

function FiltroChip({ texto, ativo, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="radio"
      accessibilityLabel={`Categoria ${texto}`}
      accessibilityState={{ selected: ativo, checked: ativo }}
      style={({ pressed }) => [
        estilos.chip,
        ativo && estilos.chipAtivo,
        pressed && !ativo && estilos.chipPressionado,
      ]}
    >
      <Text style={[estilos.chipTexto, ativo && estilos.chipTextoAtivo]}>{texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  filtros: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm, marginBottom: espaco.md },
  chip: {
    minHeight: alvo.minimo,
    justifyContent: 'center',
    paddingHorizontal: espaco.lg,
    borderRadius: raio.pilula,
    borderWidth: 1.5,
    borderColor: cores.bordaForte,
    backgroundColor: cores.papel,
  },
  chipAtivo: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  chipPressionado: { backgroundColor: cores.primariaClara },
  chipTexto: { ...tipografia.corpo, fontWeight: '600', fontSize: 15 },
  chipTextoAtivo: { color: cores.papel },
  contagem: { ...tipografia.apoio, marginBottom: espaco.md },
  acaoCabecalho: {
    minHeight: alvo.minimo,
    justifyContent: 'center',
    paddingHorizontal: espaco.sm,
    borderRadius: raio.sm,
  },
  acaoCabecalhoPressionada: { backgroundColor: cores.primariaClara },
  acaoCabecalhoTexto: { ...tipografia.corpoForte, color: cores.primaria, fontSize: 15 },
});
