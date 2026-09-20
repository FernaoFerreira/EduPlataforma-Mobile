import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Tela from '../components/Tela';
import CampoTexto from '../components/CampoTexto';
import CampoSelecao from '../components/CampoSelecao';
import Botao from '../components/Botao';
import { useDados } from '../context/DadosContext';
import { useFeedback } from '../context/FeedbackContext';
import { espaco } from '../theme';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function UsuarioFormScreen({ navigation, route }) {
  const { usuarioId } = route.params ?? {};
  const dados = useDados();
  const { mostrar } = useFeedback();

  const existente = usuarioId ? dados.usuarioPorId(usuarioId) : null;
  const edicao = !!existente;

  const [form, setForm] = useState({
    nome: existente?.nome ?? '',
    email: existente?.email ?? '',
    perfil: existente?.perfil ?? 'Aluno',
  });
  const [erros, setErros] = useState({});

  const campo = (chave) => (valor) => {
    setForm((a) => ({ ...a, [chave]: valor }));
    if (erros[chave]) setErros((a) => ({ ...a, [chave]: null }));
  };

  const salvar = () => {
    const novos = {};
    if (!form.nome.trim()) novos.nome = 'Informe o nome completo.';
    if (!form.email.trim()) novos.email = 'Informe o e-mail.';
    else if (!EMAIL.test(form.email.trim())) novos.email = 'Use um e-mail válido, como nome@dominio.com.';
    else if (dados.usuarios.some((u) => u.email.toLowerCase() === form.email.trim().toLowerCase() && u.id !== usuarioId))
      novos.email = 'Este e-mail já está cadastrado.';

    setErros(novos);
    if (Object.keys(novos).length) {
      mostrar('Verifique os campos destacados.', 'erro');
      return;
    }

    const payload = { nome: form.nome.trim(), email: form.email.trim(), perfil: form.perfil };
    if (edicao) dados.crudUsuarios.atualizar(usuarioId, payload);
    else dados.crudUsuarios.criar(payload);

    mostrar(edicao ? 'Cadastro atualizado.' : 'Pessoa cadastrada.');
    navigation.goBack();
  };

  return (
    <Tela>
      <CampoTexto
        rotulo="Nome completo"
        valor={form.nome}
        onChangeText={campo('nome')}
        placeholder="Ex.: Ana Ribeiro"
        erro={erros.nome}
        obrigatorio
        autoCapitalize="words"
      />
      <CampoTexto
        rotulo="E-mail"
        valor={form.email}
        onChangeText={campo('email')}
        placeholder="nome@dominio.com"
        erro={erros.email}
        obrigatorio
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <CampoSelecao
        rotulo="Perfil"
        opcoes={['Administrador', 'Professor', 'Aluno'].map((p) => ({ valor: p, texto: p }))}
        valorSelecionado={form.perfil}
        onSelecionar={campo('perfil')}
        obrigatorio
      />
      <View style={estilos.acoes}>
        <Botao titulo={edicao ? 'Salvar alterações' : 'Cadastrar pessoa'} onPress={salvar} tamanho="grande" />
        <Botao titulo="Cancelar" variante="texto" onPress={() => navigation.goBack()} />
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  acoes: { gap: espaco.sm, marginTop: espaco.lg },
});
