import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Tela from '../components/Tela';
import CampoTexto from '../components/CampoTexto';
import CampoSelecao from '../components/CampoSelecao';
import Botao from '../components/Botao';
import { TituloSecao } from '../components/Cartao';
import { useDados } from '../context/DadosContext';
import { useFeedback } from '../context/FeedbackContext';
import { cores, espaco, raio, tipografia, alvo } from '../theme';

export default function CursoFormScreen({ navigation, route }) {
  const { cursoId } = route.params ?? {};
  const dados = useDados();
  const { mostrar } = useFeedback();

  const cursoExistente = cursoId ? dados.cursoPorId(cursoId) : null;
  const edicao = !!cursoExistente;

  const [form, setForm] = useState({
    titulo: cursoExistente?.titulo ?? '',
    descricao: cursoExistente?.descricao ?? '',
    categoriaId: cursoExistente?.categoriaId ?? null,
    professorId: cursoExistente?.professorId ?? null,
    cargaHoraria: cursoExistente ? String(cursoExistente.cargaHoraria) : '',
    preco: cursoExistente ? String(cursoExistente.preco) : '',
    publicado: cursoExistente?.publicado ?? false,
  });
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

  const campo = (chave) => (valor) => {
    setForm((atual) => ({ ...atual, [chave]: valor }));
    if (erros[chave]) setErros((atual) => ({ ...atual, [chave]: null }));
  };

  /** Mensagens dizem o que está errado e como corrigir, nunca só "inválido". */
  const validar = () => {
    const novos = {};
    if (!form.titulo.trim()) novos.titulo = 'Informe o título do curso.';
    else if (form.titulo.trim().length < 3) novos.titulo = 'O título precisa ter ao menos 3 caracteres.';
    if (!form.categoriaId) novos.categoriaId = 'Escolha uma categoria.';
    if (!form.professorId) novos.professorId = 'Escolha o professor responsável.';

    const carga = Number(form.cargaHoraria);
    if (!form.cargaHoraria.trim()) novos.cargaHoraria = 'Informe a carga horária em horas.';
    else if (!Number.isFinite(carga) || carga <= 0) novos.cargaHoraria = 'A carga horária deve ser um número maior que zero.';

    const preco = Number(form.preco.replace(',', '.'));
    if (!form.preco.trim()) novos.preco = 'Informe o preço. Use 0 para cursos gratuitos.';
    else if (!Number.isFinite(preco) || preco < 0) novos.preco = 'O preço deve ser um número igual ou maior que zero.';

    setErros(novos);
    return Object.keys(novos).length === 0;
  };

  const salvar = () => {
    if (!validar()) {
      mostrar('Verifique os campos destacados.', 'erro');
      return;
    }
    setSalvando(true);

    const dadosCurso = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      categoriaId: form.categoriaId,
      professorId: form.professorId,
      cargaHoraria: Number(form.cargaHoraria),
      preco: Number(form.preco.replace(',', '.')),
      publicado: form.publicado,
    };

    if (edicao) dados.crudCursos.atualizar(cursoId, dadosCurso);
    else dados.crudCursos.criar(dadosCurso);

    setSalvando(false);
    mostrar(edicao ? 'Curso atualizado.' : 'Curso cadastrado.');
    navigation.goBack();
  };

  const professores = dados.professores();

  return (
    <Tela>
      <Text style={estilos.instrucao}>
        Campos marcados com <Text style={{ color: cores.erro }}>*</Text> são obrigatórios.
      </Text>

      <CampoTexto
        rotulo="Título"
        valor={form.titulo}
        onChangeText={campo('titulo')}
        placeholder="Ex.: Introdução a bancos de dados"
        erro={erros.titulo}
        obrigatorio
        autoCapitalize="sentences"
      />

      <CampoTexto
        rotulo="Descrição"
        valor={form.descricao}
        onChangeText={campo('descricao')}
        placeholder="O que o aluno vai aprender"
        multilinha
        ajuda="Aparece na listagem e na tela do curso."
      />

      <CampoSelecao
        rotulo="Categoria"
        opcoes={dados.categorias.map((c) => ({ valor: c.id, texto: c.nome }))}
        valorSelecionado={form.categoriaId}
        onSelecionar={campo('categoriaId')}
        erro={erros.categoriaId}
        obrigatorio
        mensagemVazia="Cadastre uma categoria antes de criar o curso."
      />

      <CampoSelecao
        rotulo="Professor responsável"
        opcoes={professores.map((p) => ({ valor: p.id, texto: p.nome }))}
        valorSelecionado={form.professorId}
        onSelecionar={campo('professorId')}
        erro={erros.professorId}
        obrigatorio
        mensagemVazia="Cadastre uma pessoa com perfil Professor antes de criar o curso."
      />

      <CampoTexto
        rotulo="Carga horária (horas)"
        valor={form.cargaHoraria}
        onChangeText={campo('cargaHoraria')}
        placeholder="40"
        keyboardType="number-pad"
        erro={erros.cargaHoraria}
        obrigatorio
      />

      <CampoTexto
        rotulo="Preço (R$)"
        valor={form.preco}
        onChangeText={campo('preco')}
        placeholder="199,90"
        keyboardType="decimal-pad"
        erro={erros.preco}
        obrigatorio
      />

      <TituloSecao texto="Publicação" />
      <Pressable
        onPress={() => campo('publicado')(!form.publicado)}
        accessibilityRole="switch"
        accessibilityLabel="Curso publicado"
        accessibilityHint="Cursos em rascunho não aparecem para os alunos"
        accessibilityState={{ checked: form.publicado }}
        style={({ pressed }) => [estilos.interruptor, pressed && estilos.interruptorPressionado]}
      >
        <View style={[estilos.marcador, form.publicado && estilos.marcadorAtivo]}>
          <Text style={estilos.marcadorTexto}>{form.publicado ? '✓' : ''}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={tipografia.corpoForte}>
            {form.publicado ? 'Publicado' : 'Rascunho'}
          </Text>
          <Text style={tipografia.apoio}>
            {form.publicado
              ? 'Visível no catálogo e aberto a matrículas.'
              : 'Só aparece para a administração.'}
          </Text>
        </View>
      </Pressable>

      <View style={estilos.acoes}>
        <Botao
          titulo={edicao ? 'Salvar alterações' : 'Cadastrar curso'}
          onPress={salvar}
          carregando={salvando}
          tamanho="grande"
          dica={edicao ? 'Grava as alterações e volta para a lista' : 'Cria o curso e volta para a lista'}
        />
        <Botao
          titulo="Cancelar"
          variante="texto"
          onPress={() => navigation.goBack()}
          dica="Descarta o preenchimento e volta para a tela anterior"
        />
      </View>
    </Tela>
  );
}

const estilos = StyleSheet.create({
  instrucao: { ...tipografia.apoio, marginBottom: espaco.lg },
  interruptor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    minHeight: alvo.confortavel,
    padding: espaco.lg,
    backgroundColor: cores.papel,
    borderRadius: raio.md,
    borderWidth: 1.5,
    borderColor: cores.borda,
  },
  interruptorPressionado: { backgroundColor: cores.primariaClara },
  marcador: {
    width: 28, height: 28, borderRadius: raio.sm,
    borderWidth: 2, borderColor: cores.bordaForte,
    alignItems: 'center', justifyContent: 'center',
  },
  marcadorAtivo: { backgroundColor: cores.primaria, borderColor: cores.primaria },
  marcadorTexto: { color: cores.papel, fontWeight: '700' },
  acoes: { gap: espaco.sm, marginTop: espaco.xl, marginBottom: espaco.xl },
});
