import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Tela from '../components/Tela';
import { Cartao, EstadoVazio } from '../components/Cartao';
import Botao from '../components/Botao';
import { useDados } from '../context/DadosContext';
import { useFeedback } from '../context/FeedbackContext';
import { cores, espaco, raio, tipografia } from '../theme';

/**
 * Tela apresentada como modal: é uma tarefa pontual, que termina e devolve o
 * usuário exatamente ao ponto de onde saiu. O modal reforça essa natureza e
 * traz o gesto de arrastar para baixo além do botão "Fechar".
 */
export default function CertificadoScreen({ navigation, route }) {
  const { matriculaId } = route.params;
  const dados = useDados();
  const { mostrar } = useFeedback();

  const matricula = dados.matriculas.find((m) => m.id === matriculaId);

  if (!matricula) {
    return (
      <Tela>
        <EstadoVazio titulo="Matrícula não encontrada" descricao="Este registro foi removido.">
          <Botao titulo="Fechar" onPress={() => navigation.goBack()} />
        </EstadoVazio>
      </Tela>
    );
  }

  const aluno = dados.usuarioPorId(matricula.alunoId);
  const curso = dados.cursoPorId(matricula.cursoId);
  const professor = curso ? dados.usuarioPorId(curso.professorId) : null;

  const emitir = () => {
    dados.emitirCertificado(matricula.id);
    mostrar('Certificado emitido.');
  };

  return (
    <Tela>
      <View style={estilos.certificado} accessible accessibilityRole="summary"
        accessibilityLabel={`Certificado de conclusão de ${aluno?.nome ?? 'aluno'} no curso ${curso?.titulo ?? ''}, ${curso?.cargaHoraria ?? 0} horas`}>
        <Text style={estilos.selo}>Certificado de conclusão</Text>
        <Text style={estilos.nome}>{aluno?.nome ?? 'Aluno'}</Text>
        <Text style={estilos.texto}>concluiu o curso</Text>
        <Text style={estilos.curso}>{curso?.titulo ?? 'Curso'}</Text>
        <View style={estilos.divisor} />
        <Text style={estilos.rodape}>
          {curso?.cargaHoraria ?? 0} horas · Responsável: {professor?.nome ?? 'não definido'}
        </Text>
        <Text style={estilos.rodape}>
          Matrícula em {new Date(matricula.data).toLocaleDateString('pt-BR')}
        </Text>
      </View>

      <Cartao estilo={{ marginTop: espaco.lg }}>
        <Text style={tipografia.corpoForte}>
          {matricula.certificadoEmitido ? 'Certificado já emitido' : 'Certificado ainda não emitido'}
        </Text>
        <Text style={[tipografia.apoio, { marginTop: espaco.xs, marginBottom: espaco.md }]}>
          {matricula.certificadoEmitido
            ? 'O registro consta como emitido para esta matrícula.'
            : 'A emissão registra a data e marca a matrícula como certificada.'}
        </Text>
        {!matricula.certificadoEmitido && (
          <Botao titulo="Emitir certificado" onPress={emitir} dica="Registra a emissão do certificado" />
        )}
      </Cartao>

      <Botao
        titulo="Fechar"
        variante="texto"
        onPress={() => navigation.goBack()}
        estilo={{ marginTop: espaco.md }}
      />
    </Tela>
  );
}

const estilos = StyleSheet.create({
  certificado: {
    backgroundColor: cores.papel,
    borderRadius: raio.lg,
    borderWidth: 2,
    borderColor: cores.acento,
    padding: espaco.xl,
    alignItems: 'center',
    gap: espaco.xs,
  },
  selo: { ...tipografia.micro, color: cores.acento, marginBottom: espaco.md },
  nome: { ...tipografia.titulo, textAlign: 'center' },
  texto: { ...tipografia.apoio },
  curso: { ...tipografia.secao, textAlign: 'center', color: cores.primaria },
  divisor: { height: 1, backgroundColor: cores.borda, alignSelf: 'stretch', marginVertical: espaco.lg },
  rodape: { ...tipografia.apoio, textAlign: 'center' },
});
