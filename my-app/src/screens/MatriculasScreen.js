import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Tela from '../components/Tela';
import LinhaLista, { BotaoAcao } from '../components/LinhaLista';
import { Etiqueta, EstadoVazio } from '../components/Cartao';
import CampoSelecao from '../components/CampoSelecao';
import Botao from '../components/Botao';
import BotaoFlutuante from '../components/BotaoFlutuante';
import { useDados } from '../context/DadosContext';
import { useFeedback } from '../context/FeedbackContext';
import { cores, espaco, tipografia } from '../theme';

const FILTROS = [
  { valor: 'todas', texto: 'Todas' },
  { valor: 'andamento', texto: 'Em andamento' },
  { valor: 'concluidas', texto: 'Concluídas' },
  { valor: 'certificar', texto: 'A certificar' },
];

export default function MatriculasScreen({ navigation }) {
  const dados = useDados();
  const { mostrar } = useFeedback();
  const [filtro, setFiltro] = useState('todas');

  const visiveis = dados.matriculas.filter((m) => {
    if (filtro === 'andamento') return !m.concluida;
    if (filtro === 'concluidas') return m.concluida;
    if (filtro === 'certificar') return m.concluida && !m.certificadoEmitido;
    return true;
  });

  const alternar = (matricula, curso, aluno) => {
    dados.alternarConclusao(matricula.id);
    mostrar(
      matricula.concluida
        ? `Conclusão de ${aluno?.nome ?? 'aluno'} desfeita em "${curso?.titulo ?? 'curso'}".`
        : `${aluno?.nome ?? 'Aluno'} concluiu "${curso?.titulo ?? 'curso'}".`,
      matricula.concluida ? 'info' : 'sucesso'
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Tela>
        <CampoSelecao
          rotulo="Filtrar matrículas"
          opcoes={FILTROS}
          valorSelecionado={filtro}
          onSelecionar={setFiltro}
        />

        <Text style={estilos.contagem} accessibilityLiveRegion="polite">
          {visiveis.length} {visiveis.length === 1 ? 'matrícula' : 'matrículas'}
        </Text>

        {visiveis.length === 0 ? (
          <EstadoVazio
            titulo={dados.matriculas.length === 0 ? 'Nenhuma matrícula' : 'Nada neste filtro'}
            descricao={
              dados.matriculas.length === 0
                ? 'Matricule um aluno em um curso para acompanhar o progresso aqui.'
                : 'Escolha outro filtro para ver mais matrículas.'
            }
          >
            {dados.matriculas.length === 0 ? (
              <Botao titulo="Matricular aluno" onPress={() => navigation.navigate('MatriculaForm')} />
            ) : (
              <Botao titulo="Ver todas" variante="secundaria" onPress={() => setFiltro('todas')} />
            )}
          </EstadoVazio>
        ) : (
          visiveis.map((matricula) => {
            const curso = dados.cursoPorId(matricula.cursoId);
            const aluno = dados.usuarioPorId(matricula.alunoId);
            const podeCertificar = matricula.concluida && !matricula.certificadoEmitido;

            return (
              <LinhaLista
                key={matricula.id}
                titulo={aluno?.nome ?? 'Aluno removido'}
                descricao={curso?.titulo ?? 'Curso removido'}
                detalhe={`Matriculado em ${new Date(matricula.data).toLocaleDateString('pt-BR')}`}
                faixa={matricula.concluida ? cores.sucesso : cores.borda}
                etiquetas={[
                  <Etiqueta
                    key="s"
                    texto={matricula.concluida ? 'Concluído' : 'Em andamento'}
                    tom={matricula.concluida ? 'sucesso' : 'neutro'}
                  />,
                  matricula.certificadoEmitido ? (
                    <Etiqueta key="c" texto="Certificado emitido" tom="info" />
                  ) : null,
                ].filter(Boolean)}
                onExcluir={() => {
                  dados.crudMatriculas.remover(matricula.id);
                  mostrar('Matrícula cancelada.', 'info');
                }}
                textoConfirmacaoExclusao={`Cancelar a matrícula de ${aluno?.nome ?? 'este aluno'} em "${curso?.titulo ?? 'este curso'}"?`}
                acoesExtras={
                  <>
                    <BotaoAcao
                      texto={matricula.concluida ? 'Reabrir' : 'Concluir'}
                      ativo={!matricula.concluida}
                      rotulo={
                        matricula.concluida
                          ? `Reabrir o curso para ${aluno?.nome ?? 'o aluno'}`
                          : `Marcar como concluído para ${aluno?.nome ?? 'o aluno'}`
                      }
                      dica={
                        matricula.concluida
                          ? 'Desfaz a conclusão e invalida o certificado'
                          : 'Marca o curso como concluído e libera o certificado'
                      }
                      onPress={() => alternar(matricula, curso, aluno)}
                    />
                    {(podeCertificar || matricula.certificadoEmitido) && (
                      <BotaoAcao
                        texto={matricula.certificadoEmitido ? 'Ver certificado' : 'Emitir certificado'}
                        rotulo={`${matricula.certificadoEmitido ? 'Ver' : 'Emitir'} certificado de ${aluno?.nome ?? 'aluno'}`}
                        dica="Abre a tela do certificado"
                        onPress={() => navigation.navigate('Certificado', { matriculaId: matricula.id })}
                      />
                    )}
                  </>
                }
              />
            );
          })
        )}
      </Tela>

      <BotaoFlutuante
        titulo="Nova matrícula"
        onPress={() => navigation.navigate('MatriculaForm')}
        dica="Abre o formulário de matrícula"
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contagem: { ...tipografia.apoio, marginBottom: espaco.md },
});
