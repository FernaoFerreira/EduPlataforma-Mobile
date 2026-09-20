import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Tela from '../components/Tela';
import { Cartao, Etiqueta, TituloSecao, EstadoVazio } from '../components/Cartao';
import Botao from '../components/Botao';
import { useDados } from '../context/DadosContext';
import { cores, espaco, tipografia } from '../theme';

const moeda = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function CursoDetalheScreen({ navigation, route }) {
  const { cursoId } = route.params;
  const dados = useDados();
  const curso = dados.cursoPorId(cursoId);

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
          titulo="Editar curso"
          onPress={() => navigation.navigate('CursoForm', { cursoId: curso.id })}
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
});
