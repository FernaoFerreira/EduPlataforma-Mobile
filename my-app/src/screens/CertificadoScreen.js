import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Tela from '../components/Tela';
import { Cartao, Etiqueta, EstadoVazio } from '../components/Cartao';
import Botao from '../components/Botao';
import { useDados } from '../context/DadosContext';
import { useFeedback } from '../context/FeedbackContext';
import { usePreferencias } from '../context/PreferenciasContext';
import { compartilharCertificado, exportarCertificadoLocal } from '../services/dispositivo';
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
  const { alunoAtivoId, coresTema } = usePreferencias();

  const [compartilhando, setCompartilhando] = useState(false);
  const [exportando, setExportando] = useState(false);

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
  const ehAlunoAtivo = alunoAtivoId && alunoAtivoId === matricula.alunoId;

  const emitir = () => {
    dados.emitirCertificado(matricula.id);
    mostrar('Certificado emitido.');
  };

  const handleCompartilhar = async () => {
    setCompartilhando(true);
    mostrar('Preparando compartilhamento...', 'info');
    try {
      const resultado = await compartilharCertificado({ aluno, curso, matricula, professor });
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

  const handleExportar = async () => {
    setExportando(true);
    mostrar('Solicitando autorização e gerando arquivo...', 'info');
    try {
      const resultado = await exportarCertificadoLocal({ matricula, aluno, curso, professor });
      if (resultado.sucesso) {
        mostrar(resultado.mensagem, 'sucesso');
      } else if (resultado.permissaoNegada) {
        mostrar(resultado.mensagem, 'erro');
      } else {
        mostrar(resultado.mensagem || 'Falha ao exportar documento.', 'erro');
      }
    } catch (erro) {
      mostrar(`Erro ao exportar: ${erro.message}`, 'erro');
    } finally {
      setExportando(false);
    }
  };

  return (
    <Tela>
      {ehAlunoAtivo && (
        <View style={estilos.tarjaAtiva}>
          <Etiqueta texto="Matrícula do Aluno Selecionado no Painel" tom="sucesso" />
        </View>
      )}

      <View
        style={[
          estilos.certificado,
          coresTema && { backgroundColor: coresTema.papel, borderColor: coresTema.acento },
        ]}
        accessible
        accessibilityRole="summary"
        accessibilityLabel={`Certificado de conclusão de ${aluno?.nome ?? 'aluno'} no curso ${curso?.titulo ?? ''}, ${curso?.cargaHoraria ?? 0} horas`}
      >
        <Text style={[estilos.selo, coresTema && { color: coresTema.acento }]}>Certificado de conclusão</Text>
        <Text style={[estilos.nome, coresTema && { color: coresTema.tinta }]}>{aluno?.nome ?? 'Aluno'}</Text>
        <Text style={[estilos.texto, coresTema && { color: coresTema.textoSecundario }]}>concluiu o curso</Text>
        <Text style={[estilos.curso, coresTema && { color: coresTema.primaria }]}>{curso?.titulo ?? 'Curso'}</Text>
        <View style={[estilos.divisor, coresTema && { backgroundColor: coresTema.borda }]} />
        <Text style={[estilos.rodape, coresTema && { color: coresTema.textoSecundario }]}>
          {curso?.cargaHoraria ?? 0} horas · Responsável: {professor?.nome ?? 'não definido'}
        </Text>
        <Text style={[estilos.rodape, coresTema && { color: coresTema.textoSecundario }]}>
          Matrícula em {new Date(matricula.data).toLocaleDateString('pt-BR')}
        </Text>
      </View>

      <Cartao estilo={{ marginTop: espaco.lg }}>
        <Text style={tipografia.corpoForte}>
          {matricula.certificadoEmitido ? 'Certificado emitido e disponível' : 'Certificado ainda não emitido'}
        </Text>
        <Text style={[tipografia.apoio, { marginTop: espaco.xs, marginBottom: espaco.md }]}>
          {matricula.certificadoEmitido
            ? 'Você pode compartilhar o certificado diretamente através de outros aplicativos ou exportar uma cópia local para a memória do dispositivo.'
            : 'A emissão registra a data e marca a matrícula como certificada para liberar o compartilhamento.'}
        </Text>

        {!matricula.certificadoEmitido ? (
          <Botao titulo="Emitir certificado" onPress={emitir} dica="Registra a emissão do certificado" />
        ) : (
          <View style={estilos.botoesAcao}>
            <Botao
              titulo={compartilhando ? 'Abrindo compartilhamento...' : 'Compartilhar certificado'}
              onPress={handleCompartilhar}
              desabilitado={compartilhando}
              dica="Abre o menu de compartilhamento do dispositivo para enviar o certificado por WhatsApp, E-mail ou redes"
            />
            <Botao
              titulo={exportando ? 'Salvando no aparelho...' : 'Salvar no dispositivo'}
              variante="secundaria"
              onPress={handleExportar}
              desabilitado={exportando}
              dica="Salva o certificado na memória local do aparelho, solicitando a permissão necessária"
            />
          </View>
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
  tarjaAtiva: { marginBottom: espaco.sm, alignItems: 'center' },
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
  botoesAcao: { gap: espaco.sm },
});
