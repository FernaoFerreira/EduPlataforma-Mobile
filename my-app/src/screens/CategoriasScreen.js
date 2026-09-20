import React from 'react';
import { View } from 'react-native';
import Tela from '../components/Tela';
import LinhaLista from '../components/LinhaLista';
import { Etiqueta, EstadoVazio } from '../components/Cartao';
import Botao from '../components/Botao';
import BotaoFlutuante from '../components/BotaoFlutuante';
import { useDados } from '../context/DadosContext';
import { useFeedback } from '../context/FeedbackContext';

export default function CategoriasScreen({ navigation }) {
  const dados = useDados();
  const { mostrar } = useFeedback();

  const excluir = (categoria) => {
    const emUso = dados.cursosDaCategoria(categoria.id).length;
    if (emUso > 0) {
      // Bloqueio explicado: a mensagem diz o motivo e o caminho para resolver.
      mostrar(
        `"${categoria.nome}" tem ${emUso} curso(s). Altere a categoria desses cursos antes de excluir.`,
        'erro'
      );
      return;
    }
    dados.crudCategorias.remover(categoria.id);
    mostrar('Categoria excluída.', 'info');
  };

  return (
    <View style={{ flex: 1 }}>
      <Tela>
        {dados.categorias.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma categoria"
            descricao="As categorias agrupam os cursos do catálogo. Crie a primeira para poder cadastrar cursos."
          >
            <Botao titulo="Criar categoria" onPress={() => navigation.navigate('CategoriaForm', {})} />
          </EstadoVazio>
        ) : (
          dados.categorias.map((categoria) => {
            const total = dados.cursosDaCategoria(categoria.id).length;
            return (
              <LinhaLista
                key={categoria.id}
                titulo={categoria.nome}
                descricao={categoria.descricao}
                etiquetas={[
                  <Etiqueta
                    key="t"
                    texto={`${total} ${total === 1 ? 'curso' : 'cursos'}`}
                    tom={total > 0 ? 'info' : 'neutro'}
                  />,
                ]}
                onEditar={() => navigation.navigate('CategoriaForm', { categoriaId: categoria.id })}
                onExcluir={() => excluir(categoria)}
              />
            );
          })
        )}
      </Tela>

      <BotaoFlutuante
        titulo="Nova categoria"
        onPress={() => navigation.navigate('CategoriaForm', {})}
        dica="Abre o formulário de cadastro de categoria"
      />
    </View>
  );
}
