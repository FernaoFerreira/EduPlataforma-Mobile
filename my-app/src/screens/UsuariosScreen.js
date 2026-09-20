import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Tela from '../components/Tela';
import LinhaLista from '../components/LinhaLista';
import { Etiqueta, EstadoVazio } from '../components/Cartao';
import CampoSelecao from '../components/CampoSelecao';
import Botao from '../components/Botao';
import BotaoFlutuante from '../components/BotaoFlutuante';
import { useDados } from '../context/DadosContext';
import { useFeedback } from '../context/FeedbackContext';
import { espaco, tipografia } from '../theme';

const TONS = { Administrador: 'info', Professor: 'aviso', Aluno: 'neutro' };

export default function UsuariosScreen({ navigation }) {
  const dados = useDados();
  const { mostrar } = useFeedback();
  const [filtro, setFiltro] = useState('Todos');

  const visiveis = filtro === 'Todos'
    ? dados.usuarios
    : dados.usuarios.filter((u) => u.perfil === filtro);

  const excluir = (usuario) => {
    const cursos = dados.cursos.filter((c) => c.professorId === usuario.id).length;
    const matriculas = dados.matriculas.filter((m) => m.alunoId === usuario.id).length;
    if (cursos > 0) {
      mostrar(`${usuario.nome} é responsável por ${cursos} curso(s). Troque o professor antes de excluir.`, 'erro');
      return;
    }
    if (matriculas > 0) {
      mostrar(`${usuario.nome} tem ${matriculas} matrícula(s). Cancele-as antes de excluir.`, 'erro');
      return;
    }
    dados.crudUsuarios.remover(usuario.id);
    mostrar('Pessoa excluída.', 'info');
  };

  return (
    <View style={{ flex: 1 }}>
      <Tela>
        <CampoSelecao
          rotulo="Filtrar por perfil"
          opcoes={['Todos', 'Administrador', 'Professor', 'Aluno'].map((p) => ({ valor: p, texto: p }))}
          valorSelecionado={filtro}
          onSelecionar={setFiltro}
        />

        <Text style={estilos.contagem} accessibilityLiveRegion="polite">
          {visiveis.length} {visiveis.length === 1 ? 'pessoa' : 'pessoas'}
        </Text>

        {visiveis.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma pessoa neste perfil"
            descricao="Escolha outro filtro ou cadastre uma nova pessoa."
          >
            <Botao titulo="Ver todos" variante="secundaria" onPress={() => setFiltro('Todos')} />
          </EstadoVazio>
        ) : (
          visiveis.map((usuario) => (
            <LinhaLista
              key={usuario.id}
              titulo={usuario.nome}
              descricao={usuario.email}
              etiquetas={[<Etiqueta key="p" texto={usuario.perfil} tom={TONS[usuario.perfil]} />]}
              onEditar={() => navigation.navigate('UsuarioForm', { usuarioId: usuario.id })}
              onExcluir={() => excluir(usuario)}
            />
          ))
        )}
      </Tela>

      <BotaoFlutuante
        titulo="Nova pessoa"
        onPress={() => navigation.navigate('UsuarioForm', {})}
        dica="Abre o formulário de cadastro de pessoa"
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contagem: { ...tipografia.apoio, marginBottom: espaco.md },
});
