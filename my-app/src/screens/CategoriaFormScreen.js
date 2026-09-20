import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Tela from '../components/Tela';
import CampoTexto from '../components/CampoTexto';
import Botao from '../components/Botao';
import { useDados } from '../context/DadosContext';
import { useFeedback } from '../context/FeedbackContext';
import { espaco } from '../theme';

export default function CategoriaFormScreen({ navigation, route }) {
  const { categoriaId } = route.params ?? {};
  const dados = useDados();
  const { mostrar } = useFeedback();

  const existente = categoriaId ? dados.categoriaPorId(categoriaId) : null;
  const edicao = !!existente;

  const [nome, setNome] = useState(existente?.nome ?? '');
  const [descricao, setDescricao] = useState(existente?.descricao ?? '');
  const [erro, setErro] = useState(null);

  const salvar = () => {
    const limpo = nome.trim();
    if (!limpo) {
      setErro('Informe o nome da categoria.');
      mostrar('Verifique os campos destacados.', 'erro');
      return;
    }
    const duplicada = dados.categorias.some(
      (c) => c.nome.toLowerCase() === limpo.toLowerCase() && c.id !== categoriaId
    );
    if (duplicada) {
      setErro('Já existe uma categoria com este nome.');
      mostrar('Verifique os campos destacados.', 'erro');
      return;
    }

    const payload = { nome: limpo, descricao: descricao.trim() };
    if (edicao) dados.crudCategorias.atualizar(categoriaId, payload);
    else dados.crudCategorias.criar(payload);

    mostrar(edicao ? 'Categoria atualizada.' : 'Categoria criada.');
    navigation.goBack();
  };

  return (
    <Tela>
      <CampoTexto
        rotulo="Nome"
        valor={nome}
        onChangeText={(v) => { setNome(v); if (erro) setErro(null); }}
        placeholder="Ex.: Programação"
        erro={erro}
        obrigatorio
      />
      <CampoTexto
        rotulo="Descrição"
        valor={descricao}
        onChangeText={setDescricao}
        placeholder="O que esta categoria agrupa"
        multilinha
      />
      <View style={estilos.acoes}>
        <Botao
          titulo={edicao ? 'Salvar alterações' : 'Criar categoria'}
          onPress={salvar}
          tamanho="grande"
        />
        <Botao titulo="Cancelar" variante="texto" onPress={() => navigation.goBack()} />
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  acoes: { gap: espaco.sm, marginTop: espaco.lg },
});
