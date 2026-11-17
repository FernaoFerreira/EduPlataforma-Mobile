import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import Tela, { Grade } from '../components/Tela';
import { Trilha, CartaoMetrica } from '../components/Trilha';
import { Cartao, Etiqueta, TituloSecao } from '../components/Cartao';
import Botao from '../components/Botao';
import { useDados } from '../context/DadosContext';
import { useFeedback } from '../context/FeedbackContext';
import { cores, espaco, tipografia } from '../theme';

const moeda = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function PainelScreen({ navigation }) {
  const dados = useDados();
  const { mostrar } = useFeedback();

  const concluidas = dados.matriculas.filter((m) => m.concluida).length;
  const certificadosPendentes = dados.matriculas.filter(
    (m) => m.concluida && !m.certificadoEmitido
  ).length;
  const cursosPublicados = dados.cursos.filter((c) => c.publicado).length;

  const irPara = (aba, tela) =>
    navigation.navigate(aba, tela ? { screen: tela } : undefined);

  const sincronizar = async () => {
    mostrar('Sincronizando com o servidor...', 'info');
    const resultado = await dados.sincronizarComBackend();
    if (resultado.sucesso) {
      mostrar('Dados sincronizados com o servidor.', 'sucesso');
    } else {
      mostrar('Falha ao sincronizar. Usando dados locais.', 'erro');
    }
  };

  return (
    <Tela>
      <Text style={estilos.saudacao} accessibilityRole="header">
        Visão geral da plataforma
      </Text>
      <Text style={estilos.subtitulo}>
        {dados.cursos.length} cursos cadastrados, {cursosPublicados} publicados.
      </Text>

      <Trilha
        etapas={[
          { nome: 'Categorias', total: dados.categorias.length, onPress: () => navigation.navigate('Categorias') },
          { nome: 'Cursos', total: dados.cursos.length, onPress: () => irPara('AbaCursos', 'Cursos') },
          { nome: 'Módulos', total: dados.modulos.length, onPress: () => irPara('AbaCursos', 'Cursos') },
          { nome: 'Matrículas', total: dados.matriculas.length, onPress: () => irPara('AbaMatriculas', 'Matriculas') },
        ]}
      />

      <TituloSecao texto="Números" apoio="Toque em um cartão para abrir a área correspondente." />

      <Grade>
        <CartaoMetrica
          rotulo="Pessoas"
          valor={dados.usuarios.length}
          apoio={`${dados.alunos().length} alunos, ${dados.professores().length} professores`}
          onPress={() => irPara('AbaPessoas', 'Usuarios')}
          dica="Abre a lista de pessoas"
        />
        <CartaoMetrica
          rotulo="Conclusões"
          valor={concluidas}
          apoio={`de ${dados.matriculas.length} matrículas`}
          onPress={() => irPara('AbaMatriculas', 'Matriculas')}
          dica="Abre a lista de matrículas"
        />
        <CartaoMetrica
          rotulo="Receita confirmada"
          valor={moeda(dados.receitaConfirmada())}
          apoio={`${moeda(dados.receitaPendente())} pendentes`}
          onPress={() => irPara('AbaFinanceiro', 'Financeiro')}
          dica="Abre a área financeira"
        />
        <CartaoMetrica
          rotulo="Assinaturas ativas"
          valor={dados.assinaturas.filter((a) => a.ativa).length}
          apoio={`${dados.planos.length} planos disponíveis`}
          onPress={() => irPara('AbaFinanceiro', 'Financeiro')}
          dica="Abre a área financeira"
        />
      </Grade>

      {certificadosPendentes > 0 && (
        <>
          <TituloSecao texto="Precisa da sua atenção" />
          <Cartao faixa={cores.acento}>
            <View style={estilos.alertaTopo}>
              <Etiqueta texto="Certificados" tom="aviso" />
            </View>
            <Text style={[tipografia.corpo, estilos.alertaTexto]}>
              {certificadosPendentes}{' '}
              {certificadosPendentes === 1
                ? 'aluno concluiu um curso e ainda não recebeu o certificado.'
                : 'alunos concluíram cursos e ainda não receberam o certificado.'}
            </Text>
            <Botao
              titulo="Ver matrículas concluídas"
              variante="secundaria"
              onPress={() => irPara('AbaMatriculas', 'Matriculas')}
              dica="Abre a lista de matrículas para emitir os certificados"
            />
          </Cartao>
        </>
      )}

      <TituloSecao texto="Atalhos" />
      <View style={estilos.atalhos}>
        <Botao
          titulo="Cadastrar curso"
          onPress={() => navigation.navigate('AbaCursos', { screen: 'CursoForm', params: {} })}
          dica="Abre o formulário de novo curso"
        />
        <Botao
          titulo="Matricular aluno"
          variante="secundaria"
          onPress={() => navigation.navigate('AbaMatriculas', { screen: 'MatriculaForm' })}
          dica="Abre o formulário de nova matrícula"
        />
      </View>

      <TituloSecao
        texto="Conexão e dados"
        apoio="Status da integração com o backend e armazenamento local."
      />

      {/* Cartão de status do backend */}
      <Cartao faixa={dados.online ? cores.sucesso : cores.aviso}>
        <View style={estilos.persistenciaTopo}>
          <View style={{ flex: 1, paddingRight: espaco.sm }}>
            <Text style={tipografia.corpoForte}>
              {dados.online ? 'Conectado ao servidor' : 'Modo offline'}
            </Text>
            <Text style={tipografia.apoio}>
              {dados.online
                ? 'As operações são salvas no servidor e no dispositivo.'
                : 'Sem conexão com o servidor. Os dados são salvos localmente e serão sincronizados quando a conexão for restabelecida.'}
            </Text>
          </View>
          <Etiqueta
            texto={dados.online ? 'Online' : 'Offline'}
            tom={dados.online ? 'sucesso' : 'aviso'}
          />
        </View>
        <Text style={[tipografia.apoio, { marginBottom: espaco.sm }]}>
          Fonte de dados: {dados.fonteInicial === 'backend' ? 'Servidor (JSON Server)' : 'Armazenamento local (AsyncStorage)'}
        </Text>
        <Botao
          titulo="Sincronizar com servidor"
          variante="secundaria"
          onPress={sincronizar}
          dica="Busca os dados mais recentes do servidor"
        />
      </Cartao>

      {/* Cartão de persistência local (mantido da Etapa 04) */}
      <Cartao faixa={cores.primaria}>
        <View style={estilos.persistenciaTopo}>
          <View style={{ flex: 1, paddingRight: espaco.sm }}>
            <Text style={tipografia.corpoForte}>Armazenamento no dispositivo</Text>
            <Text style={tipografia.apoio}>
              Suas alterações em cursos, pessoas e matrículas permanecem salvas após fechar e reabrir o app.
            </Text>
          </View>
          <Etiqueta texto="Ativo" tom="sucesso" />
        </View>
        <Botao
          titulo="Restaurar dados de exemplo"
          variante="secundaria"
          onPress={() => {
            Alert.alert(
              'Restaurar dados de exemplo',
              'Deseja redefinir os dados para os registros de demonstração originais? As alterações feitas serão substituídas.',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Restaurar',
                  style: 'destructive',
                  onPress: async () => {
                    await dados.restaurarPadroes();
                    mostrar('Dados de exemplo restaurados.', 'info');
                  },
                },
              ]
            );
          }}
          dica="Redefine o armazenamento para os dados iniciais"
        />
      </Cartao>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  saudacao: { ...tipografia.titulo, marginBottom: espaco.xs },
  subtitulo: { ...tipografia.apoio, marginBottom: espaco.lg },
  alertaTopo: { marginBottom: espaco.sm },
  alertaTexto: { marginBottom: espaco.md },
  atalhos: { gap: espaco.md, marginBottom: espaco.xl },
  persistenciaTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: espaco.md,
  },
});
