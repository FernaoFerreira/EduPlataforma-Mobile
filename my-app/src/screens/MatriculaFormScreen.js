import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Tela from '../components/Tela';
import CampoSelecao from '../components/CampoSelecao';
import Botao from '../components/Botao';
import { EstadoVazio } from '../components/Cartao';
import { useDados } from '../context/DadosContext';
import { useFeedback } from '../context/FeedbackContext';
import { espaco } from '../theme';

export default function MatriculaFormScreen({ navigation }) {
  const dados = useDados();
  const { mostrar } = useFeedback();
  const [cursoId, setCursoId] = useState(null);
  const [alunoId, setAlunoId] = useState(null);
  const [erros, setErros] = useState({});

  const alunos = dados.alunos();
  const cursosPublicados = dados.cursos.filter((c) => c.publicado);

  if (cursosPublicados.length === 0 || alunos.length === 0) {
    return (
      <Tela>
        <EstadoVazio
          titulo="Ainda não é possível matricular"
          descricao={
            cursosPublicados.length === 0
              ? 'Publique ao menos um curso para abrir matrículas.'
              : 'Cadastre ao menos uma pessoa com perfil Aluno.'
          }
        >
          <Botao titulo="Voltar" onPress={() => navigation.goBack()} />
        </EstadoVazio>
      </Tela>
    );
  }

  const salvar = () => {
    const novos = {};
    if (!cursoId) novos.curso = 'Escolha o curso.';
    if (!alunoId) novos.aluno = 'Escolha o aluno.';

    if (!novos.curso && !novos.aluno) {
      const jaExiste = dados.matriculas.some((m) => m.cursoId === cursoId && m.alunoId === alunoId);
      if (jaExiste) novos.aluno = 'Este aluno já está matriculado neste curso.';
    }

    setErros(novos);
    if (Object.keys(novos).length) {
      mostrar('Verifique os campos destacados.', 'erro');
      return;
    }

    dados.crudMatriculas.criar({
      cursoId,
      alunoId,
      data: new Date().toISOString().slice(0, 10),
      concluida: false,
      certificadoEmitido: false,
    });

    mostrar('Matrícula registrada.');
    navigation.goBack();
  };

  return (
    <Tela>
      <CampoSelecao
        rotulo="Curso"
        opcoes={cursosPublicados.map((c) => ({ valor: c.id, texto: c.titulo }))}
        valorSelecionado={cursoId}
        onSelecionar={(v) => { setCursoId(v); setErros((e) => ({ ...e, curso: null })); }}
        erro={erros.curso}
        obrigatorio
      />
      <CampoSelecao
        rotulo="Aluno"
        opcoes={alunos.map((a) => ({ valor: a.id, texto: a.nome }))}
        valorSelecionado={alunoId}
        onSelecionar={(v) => { setAlunoId(v); setErros((e) => ({ ...e, aluno: null })); }}
        erro={erros.aluno}
        obrigatorio
      />
      <View style={estilos.acoes}>
        <Botao titulo="Registrar matrícula" onPress={salvar} tamanho="grande" />
        <Botao titulo="Cancelar" variante="texto" onPress={() => navigation.goBack()} />
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  acoes: { gap: espaco.sm, marginTop: espaco.lg },
});
