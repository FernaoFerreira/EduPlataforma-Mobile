import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import Tela from '../components/Tela';
import { Cartao, Etiqueta, TituloSecao, EstadoVazio } from '../components/Cartao';
import Botao from '../components/Botao';
import CampoTexto from '../components/CampoTexto';
import { useDados } from '../context/DadosContext';
import { useFeedback } from '../context/FeedbackContext';
import { usePreferencias } from '../context/PreferenciasContext';
import { buscarLivrosPorTermo } from '../services/livrosApi';
import { compartilharCurso } from '../services/dispositivo';
import { cores, espaco, tipografia, raio } from '../theme';

const moeda = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function CursoDetalheScreen({ navigation, route }) {
  const { cursoId } = route.params;
  const dados = useDados();
  const { mostrar } = useFeedback();
  const { exibirBibliografia, alternarBibliografia } = usePreferencias();
  const curso = dados.cursoPorId(cursoId);

  // Estados da integração externa com a Open Library
  const [termoBusca, setTermoBusca] = useState('');
  const [statusLivros, setStatusLivros] = useState('ocioso'); // 'carregando' | 'sucesso' | 'erro' | 'vazio' | 'ocioso'
  const [livros, setLivros] = useState([]);
  const [totalLivros, setTotalLivros] = useState(0);
  const [erroLivros, setErroLivros] = useState(null);
  const [compartilhando, setCompartilhando] = useState(false);

  // Define o termo de busca inicial com base no título do curso
  useEffect(() => {
    if (curso) {
      // Limpa sufixos comuns para melhorar o match na API
      const termoSugerido = curso.titulo
        .replace(/ do zero| básico| avançado| fundamentos/gi, '')
        .trim();
      setTermoBusca(termoSugerido || curso.titulo);
    }
  }, [curso?.id]);

  // Função para executar a busca externa
  const carregarLivros = useCallback(async (termo) => {
    const termoAlvo = (termo || termoBusca || '').trim();
    if (!termoAlvo) return;

    setStatusLivros('carregando');
    setErroLivros(null);

    try {
      const resultado = await buscarLivrosPorTermo(termoAlvo, 4);
      if (resultado.livros.length === 0) {
        setLivros([]);
        setTotalLivros(0);
        setStatusLivros('vazio');
      } else {
        setLivros(resultado.livros);
        setTotalLivros(resultado.total);
        setStatusLivros('sucesso');
      }
    } catch (erro) {
      setErroLivros(erro.message || 'Falha ao consultar a Open Library.');
      setStatusLivros('erro');
    }
  }, [termoBusca]);

  // Carrega automaticamente os livros quando a tela abre com o curso definido e a preferência global permite
  useEffect(() => {
    if (curso && termoBusca && statusLivros === 'ocioso' && exibirBibliografia) {
      carregarLivros(termoBusca);
    }
  }, [curso, termoBusca, statusLivros, carregarLivros, exibirBibliografia]);

  // O curso pode ter sido excluído em outra tela enquanto esta estava na pilha.
  if (!curso) {
    return (
      <Tela>
        <EstadoVazio
          titulo="Curso não encontrado"
          descricao="Este curso foi removido. Volte para a lista para ver os cursos atuais."
        >
          <Botao titulo="Voltar para cursos" onPress={() => navigation.goBack()} />
        </EstadoVazio>
      </Tela>
    );
  }

  const categoria = dados.categoriaPorId(curso.categoriaId);
  const professor = dados.usuarioPorId(curso.professorId);
  const modulos = dados.modulosDoCurso(curso.id);
  const matriculas = dados.matriculasDoCurso(curso.id);
  const totalAulas = modulos.reduce((soma, m) => soma + dados.aulasDoModulo(m.id).length, 0);
  const concluidas = matriculas.filter((m) => m.concluida).length;

  const handleCompartilhar = async () => {
    setCompartilhando(true);
    mostrar('Preparando compartilhamento do curso...', 'info');
    try {
      const resultado = await compartilharCurso({ curso, professor, categoria });
      if (resultado.sucesso) {
        mostrar(resultado.mensagem, 'sucesso');
      } else if (resultado.acao === 'cancelado') {
        mostrar('Compartilhamento cancelado.', 'info');
      } else {
        mostrar(resultado.mensagem || 'Não foi possível compartilhar.', 'erro');
      }
    } catch (erro) {
      mostrar(`Erro ao compartilhar: ${erro.message}`, 'erro');
    } finally {
      setCompartilhando(false);
    }
  };

  return (
    <Tela>
      <Text style={tipografia.titulo} accessibilityRole="header">{curso.titulo}</Text>
      <View style={estilos.etiquetas}>
        <Etiqueta
          texto={curso.publicado ? 'Publicado' : 'Rascunho'}
          tom={curso.publicado ? 'sucesso' : 'aviso'}
        />
        <Etiqueta texto={categoria?.nome ?? 'Sem categoria'} tom="info" />
      </View>

      {!!curso.descricao && <Text style={estilos.descricao}>{curso.descricao}</Text>}

      <Cartao>
        <Info rotulo="Professor responsável" valor={professor?.nome ?? 'Não definido'} />
        <Info rotulo="Carga horária" valor={`${curso.cargaHoraria} horas`} />
        <Info rotulo="Preço" valor={curso.preco > 0 ? moeda(curso.preco) : 'Gratuito'} />
        <Info rotulo="Conteúdo" valor={`${modulos.length} módulos, ${totalAulas} aulas`} ultimo />
      </Cartao>

      <TituloSecao texto="Conteúdo do curso" />
      {modulos.length === 0 ? (
        <EstadoVazio
          titulo="Sem módulos"
          descricao="Organize o curso em módulos e aulas para que os alunos saibam a ordem do conteúdo."
        >
          <Botao
            titulo="Adicionar módulos"
            onPress={() => navigation.navigate('Modulos', { cursoId: curso.id })}
          />
        </EstadoVazio>
      ) : (
        <>
          {modulos.slice(0, 3).map((modulo) => (
            <Cartao key={modulo.id} estilo={estilos.modulo}>
              <Text style={tipografia.corpoForte}>
                {modulo.ordem}. {modulo.titulo}
              </Text>
              <Text style={tipografia.apoio}>
                {dados.aulasDoModulo(modulo.id).length} aulas
              </Text>
            </Cartao>
          ))}
          <Botao
            titulo={`Gerenciar módulos e aulas (${modulos.length})`}
            variante="secundaria"
            onPress={() => navigation.navigate('Modulos', { cursoId: curso.id })}
            dica="Abre a tela de módulos e aulas deste curso"
          />
        </>
      )}

      {/* SEÇÃO DA ETAPA 06: INTEGRAÇÃO COM SERVIÇO EXTERNO (OPEN LIBRARY API) */}
      <TituloSecao
        texto="Bibliografia e referências recomendadas"
        apoio="Obras e literatura complementar consultadas via Open Library API."
      />

      {!exibirBibliografia ? (
        <Cartao faixa={cores.aviso} estilo={{ marginBottom: espaco.md }}>
          <View style={{ marginBottom: espaco.xs }}>
            <Etiqueta texto="Consulta Oculta por Preferência" tom="aviso" />
          </View>
          <Text style={[tipografia.corpo, { marginBottom: espaco.sm }]}>
            A exibição de referências bibliográficas da Open Library está desativada nas preferências globais do aplicativo.
          </Text>
          <Botao
            titulo="Ativar busca de referências"
            variante="secundaria"
            onPress={() => {
              alternarBibliografia();
              mostrar('Exibição de referências ativada nas preferências.', 'sucesso');
            }}
            dica="Habilita a exibição de livros da Open Library nas preferências globais"
          />
        </Cartao>
      ) : (
        <>
          <View style={estilos.buscaContainer}>
            <CampoTexto
              rotulo="Pesquisar referências por tema"
              valor={termoBusca}
              onChangeText={setTermoBusca}
              placeholder="Ex.: React Native, SQL, Design de Interface..."
              ajuda="Consulte livros do acervo mundial relacionados ao curso."
              returnKeyType="search"
              onSubmitEditing={() => carregarLivros(termoBusca)}
            />
            <View style={estilos.botoesBusca}>
              <Botao
                titulo="Buscar referências"
                onPress={() => carregarLivros(termoBusca)}
                dica="Consulta livros na Open Library usando o termo digitado"
              />
            </View>
          </View>

          {/* ESTADO 1: CARREGANDO */}
          {statusLivros === 'carregando' && (
            <View
              style={estilos.estadoContainer}
              accessibilityRole="progressbar"
              accessibilityLabel="Consultando acervo da Open Library"
            >
              <ActivityIndicator size="small" color={cores.primaria} />
              <Text style={estilos.estadoTexto}>
                Consultando acervo da Open Library para "{termoBusca}"...
              </Text>
            </View>
          )}

          {/* ESTADO 2: ERRO */}
          {statusLivros === 'erro' && (
            <Cartao faixa={cores.erro} estilo={estilos.cartaoErro}>
              <View style={estilos.erroTopo}>
                <Etiqueta texto="Falha de conexão externa" tom="erro" />
              </View>
              <Text style={[tipografia.corpo, estilos.erroTexto]}>
                {erroLivros}
              </Text>
              <Botao
                titulo="Tentar novamente"
                variante="secundaria"
                onPress={() => carregarLivros(termoBusca)}
                dica="Tenta consultar novamente a Open Library"
              />
            </Cartao>
          )}

          {/* ESTADO 3: AUSÊNCIA DE DADOS (VAZIO) */}
          {statusLivros === 'vazio' && (
            <EstadoVazio
              titulo="Nenhuma obra encontrada"
              descricao={`A Open Library não retornou obras para o termo "${termoBusca}". Tente pesquisar por palavras-chave mais gerais.`}
            >
              <Botao
                titulo={`Buscar por "${categoria?.nome || 'Educação'}"`}
                variante="secundaria"
                onPress={() => {
                  const termoCat = categoria?.nome || 'Educação';
                  setTermoBusca(termoCat);
                  carregarLivros(termoCat);
                }}
                dica="Busca referências usando o nome da categoria"
              />
            </EstadoVazio>
          )}

          {/* ESTADO 4: SUCESSO COM DADOS */}
          {statusLivros === 'sucesso' && (
            <View style={estilos.listaLivros}>
              <Text style={estilos.totalResultados} accessibilityLiveRegion="polite">
                {totalLivros > livros.length
                  ? `Exibindo ${livros.length} principais de ${totalLivros} referências encontradas:`
                  : `${livros.length} ${livros.length === 1 ? 'referência encontrada' : 'referências encontradas'}:`}
              </Text>

              {livros.map((livro) => (
                <Cartao
                  key={livro.id}
                  estilo={estilos.livroItem}
                  faixa={cores.primaria}
                  onPress={
                    livro.linkUrl
                      ? () => Linking.openURL(livro.linkUrl).catch(() => {})
                      : undefined
                  }
                  rotuloAcessivel={`Livro ${livro.titulo}, autores ${livro.autoresTexto}`}
                  dica={livro.linkUrl ? 'Abre o registro do livro no site da Open Library' : undefined}
                >
                  <Text style={tipografia.corpoForte}>{livro.titulo}</Text>
                  <Text style={tipografia.apoio}>
                    {livro.autoresTexto}
                    {livro.anoPublicacao ? ` · 1ª pub. ${livro.anoPublicacao}` : ''}
                  </Text>

                  <View style={estilos.livroRodape}>
                    <Etiqueta
                      texto={`${livro.edicoes} ${livro.edicoes === 1 ? 'edição' : 'edições'}`}
                      tom="neutro"
                    />
                    {!!livro.isbn && (
                      <Text style={tipografia.micro}>ISBN: {livro.isbn}</Text>
                    )}
                    {!!livro.linkUrl && (
                      <Text style={estilos.linkExterno}>
                        Ver na Open Library ↗
                      </Text>
                    )}
                  </View>
                </Cartao>
              ))}
            </View>
          )}
        </>
      )}

      <TituloSecao texto="Matrículas" apoio={`${concluidas} de ${matriculas.length} concluíram o curso.`} />
      {matriculas.length === 0 ? (
        <EstadoVazio titulo="Nenhum aluno matriculado" descricao="As matrículas feitas neste curso aparecem aqui." />
      ) : (
        matriculas.map((matricula) => {
          const aluno = dados.usuarioPorId(matricula.alunoId);
          return (
            <Cartao key={matricula.id} estilo={estilos.modulo} faixa={matricula.concluida ? cores.sucesso : cores.borda}>
              <Text style={tipografia.corpoForte}>{aluno?.nome ?? 'Aluno removido'}</Text>
              <Etiqueta
                texto={matricula.concluida ? 'Concluído' : 'Em andamento'}
                tom={matricula.concluida ? 'sucesso' : 'neutro'}
              />
            </Cartao>
          );
        })
      )}

      <View style={estilos.acoes}>
        <Botao
          titulo={compartilhando ? 'Compartilhando...' : 'Compartilhar curso'}
          onPress={handleCompartilhar}
          desabilitado={compartilhando}
          dica="Abre o compartilhador nativo do aparelho com os dados deste curso"
        />
        <Botao
          titulo="Editar curso"
          variante="secundaria"
          onPress={() => navigation.navigate('CursoForm', { cursoId: curso.id })}
          dica="Abre o formulário de edição deste curso"
        />
      </View>
          dica="Abre o formulário de edição deste curso"
        />
      </View>
    </Tela>
  );
}

function Info({ rotulo, valor, ultimo = false }) {
  return (
    <View style={[estilos.info, !ultimo && estilos.infoComBorda]}>
      <Text style={estilos.infoRotulo}>{rotulo}</Text>
      <Text style={estilos.infoValor}>{valor}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  etiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm, marginTop: espaco.sm, marginBottom: espaco.md },
  descricao: { ...tipografia.corpo, marginBottom: espaco.lg },
  info: { flexDirection: 'row', justifyContent: 'space-between', gap: espaco.md, paddingVertical: espaco.md },
  infoComBorda: { borderBottomWidth: 1, borderBottomColor: cores.borda },
  infoRotulo: { ...tipografia.apoio, flexShrink: 1 },
  infoValor: { ...tipografia.corpoForte, textAlign: 'right', flexShrink: 1 },
  modulo: { marginBottom: espaco.sm, gap: espaco.xs },
  acoes: { marginTop: espaco.xl, marginBottom: espaco.xl },

  // Estilos da integração externa (Open Library)
  buscaContainer: { marginBottom: espaco.md },
  botoesBusca: { marginTop: -espaco.sm, marginBottom: espaco.sm },
  estadoContainer: {
    padding: espaco.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.papel,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.borda,
    marginBottom: espaco.md,
    gap: espaco.sm,
  },
  estadoTexto: { ...tipografia.apoio, color: cores.textoMudo, textAlign: 'center' },
  cartaoErro: { marginBottom: espaco.md, gap: espaco.sm },
  erroTopo: { marginBottom: espaco.xs },
  erroTexto: { ...tipografia.corpo, color: cores.texto, marginBottom: espaco.xs },
  listaLivros: { gap: espaco.sm, marginBottom: espaco.md },
  totalResultados: { ...tipografia.apoio, marginBottom: espaco.xs },
  livroItem: { gap: espaco.xs },
  livroRodape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: espaco.sm,
    marginTop: espaco.xs,
  },
  linkExterno: { ...tipografia.micro, color: cores.primaria, fontWeight: '700' },
});
