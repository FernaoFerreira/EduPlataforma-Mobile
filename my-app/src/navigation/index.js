import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { cores, espaco, tipografia, alvo } from '../theme';

import PainelScreen from '../screens/PainelScreen';
import CursosScreen from '../screens/CursosScreen';
import CursoFormScreen from '../screens/CursoFormScreen';
import CursoDetalheScreen from '../screens/CursoDetalheScreen';
import ModulosScreen from '../screens/ModulosScreen';
import CategoriasScreen from '../screens/CategoriasScreen';
import CategoriaFormScreen from '../screens/CategoriaFormScreen';
import UsuariosScreen from '../screens/UsuariosScreen';
import UsuarioFormScreen from '../screens/UsuarioFormScreen';
import MatriculasScreen from '../screens/MatriculasScreen';
import MatriculaFormScreen from '../screens/MatriculaFormScreen';
import CertificadoScreen from '../screens/CertificadoScreen';
import FinanceiroScreen from '../screens/FinanceiroScreen';

/**
 * ESTRUTURA DE NAVEGAÇÃO
 *
 *  Abas (nível 1)            Pilhas (nível 2+)
 *  ─────────────────────────────────────────────────────────────────
 *  Painel        →  Painel
 *  Cursos        →  Cursos → Curso (detalhe) → Módulos e aulas
 *                          → Formulário de curso
 *                          → Categorias → Formulário de categoria
 *  Matrículas    →  Matrículas → Formulário de matrícula
 *                             → Certificado
 *  Pessoas       →  Usuários → Formulário de usuário
 *  Financeiro    →  Financeiro
 *
 * As abas dão acesso lateral às áreas (sempre a um toque, em qualquer ponto
 * do app); as pilhas dão a profundidade dentro de cada área e fornecem o
 * retorno — botão "voltar" no cabeçalho e gesto nativo de voltar, incluindo
 * o botão físico/gestual do Android.
 */

const Pilha = createNativeStackNavigator();
const Abas = createBottomTabNavigator();

/** Cabeçalho comum: título legível, botão de voltar rotulado, cores AA. */
const opcoesPilha = {
  headerStyle: { backgroundColor: cores.papel },
  headerTintColor: cores.primaria,
  headerTitleStyle: { ...tipografia.secao, fontSize: 18 },
  headerShadowVisible: true,
  headerBackTitle: 'Voltar',
  headerBackButtonDisplayMode: 'minimal',
  contentStyle: { backgroundColor: cores.fundo },
  // Anima a transição mostrando de onde a tela veio; respeitado pelo
  // sistema quando o usuário ativa "reduzir movimento".
  animation: 'slide_from_right',
};

function PilhaPainel() {
  return (
    <Pilha.Navigator screenOptions={opcoesPilha}>
      <Pilha.Screen name="Painel" component={PainelScreen} options={{ title: 'Painel' }} />
    </Pilha.Navigator>
  );
}

function PilhaCursos() {
  return (
    <Pilha.Navigator screenOptions={opcoesPilha}>
      <Pilha.Screen name="Cursos" component={CursosScreen} options={{ title: 'Cursos' }} />
      <Pilha.Screen name="CursoDetalhe" component={CursoDetalheScreen} options={{ title: 'Curso' }} />
      <Pilha.Screen name="CursoForm" component={CursoFormScreen}
        options={({ route }) => ({ title: route.params?.cursoId ? 'Editar curso' : 'Novo curso' })} />
      <Pilha.Screen name="Modulos" component={ModulosScreen} options={{ title: 'Módulos e aulas' }} />
      <Pilha.Screen name="Categorias" component={CategoriasScreen} options={{ title: 'Categorias' }} />
      <Pilha.Screen name="CategoriaForm" component={CategoriaFormScreen}
        options={({ route }) => ({ title: route.params?.categoriaId ? 'Editar categoria' : 'Nova categoria' })} />
    </Pilha.Navigator>
  );
}

function PilhaMatriculas() {
  return (
    <Pilha.Navigator screenOptions={opcoesPilha}>
      <Pilha.Screen name="Matriculas" component={MatriculasScreen} options={{ title: 'Matrículas' }} />
      <Pilha.Screen name="MatriculaForm" component={MatriculaFormScreen} options={{ title: 'Nova matrícula' }} />
      <Pilha.Screen name="Certificado" component={CertificadoScreen}
        options={{ title: 'Certificado', presentation: 'modal' }} />
    </Pilha.Navigator>
  );
}

function PilhaPessoas() {
  return (
    <Pilha.Navigator screenOptions={opcoesPilha}>
      <Pilha.Screen name="Usuarios" component={UsuariosScreen} options={{ title: 'Pessoas' }} />
      <Pilha.Screen name="UsuarioForm" component={UsuarioFormScreen}
        options={({ route }) => ({ title: route.params?.usuarioId ? 'Editar pessoa' : 'Nova pessoa' })} />
    </Pilha.Navigator>
  );
}

function PilhaFinanceiro() {
  return (
    <Pilha.Navigator screenOptions={opcoesPilha}>
      <Pilha.Screen name="Financeiro" component={FinanceiroScreen} options={{ title: 'Financeiro' }} />
    </Pilha.Navigator>
  );
}

/** Ícone textual da aba. O rótulo sempre acompanha o ícone — ícone sozinho
 *  obriga o usuário a adivinhar o significado. */
function IconeAba({ simbolo, focada }) {
  return (
    <View style={estilos.icone}>
      <Text style={[estilos.iconeTexto, focada && estilos.iconeTextoFocado]}>{simbolo}</Text>
    </View>
  );
}

const tema = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: cores.primaria,
    background: cores.fundo,
    card: cores.papel,
    text: cores.tinta,
    border: cores.borda,
  },
};

export default function Navegacao() {
  return (
    <NavigationContainer theme={tema}>
      <Abas.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: cores.primaria,
          tabBarInactiveTintColor: cores.textoSecundario, // 6.9:1 — legível, não só "apagado"
          tabBarStyle: estilos.barraAbas,
          tabBarLabelStyle: estilos.rotuloAba,
          tabBarItemStyle: { minHeight: alvo.confortavel, paddingVertical: espaco.xs },
          tabBarIcon: ({ focused }) => (
            <IconeAba simbolo={simbolos[route.name]} focada={focused} />
          ),
          tabBarAccessibilityLabel: `${rotulos[route.name]}, aba`,
        })}
      >
        <Abas.Screen name="AbaPainel" component={PilhaPainel} options={{ title: 'Painel' }} />
        <Abas.Screen name="AbaCursos" component={PilhaCursos} options={{ title: 'Cursos' }} />
        <Abas.Screen name="AbaMatriculas" component={PilhaMatriculas} options={{ title: 'Matrículas' }} />
        <Abas.Screen name="AbaPessoas" component={PilhaPessoas} options={{ title: 'Pessoas' }} />
        <Abas.Screen name="AbaFinanceiro" component={PilhaFinanceiro} options={{ title: 'Financeiro' }} />
      </Abas.Navigator>
    </NavigationContainer>
  );
}

const simbolos = {
  AbaPainel: '▣',
  AbaCursos: '▤',
  AbaMatriculas: '✓',
  AbaPessoas: '☰',
  AbaFinanceiro: '$',
};

const rotulos = {
  AbaPainel: 'Painel',
  AbaCursos: 'Cursos',
  AbaMatriculas: 'Matrículas',
  AbaPessoas: 'Pessoas',
  AbaFinanceiro: 'Financeiro',
};

const estilos = StyleSheet.create({
  barraAbas: {
    backgroundColor: cores.papel,
    borderTopColor: cores.borda,
    borderTopWidth: 1,
    height: 68,
    paddingBottom: espaco.sm,
    paddingTop: espaco.xs,
  },
  rotuloAba: { fontSize: 12, fontWeight: '600' },
  icone: { alignItems: 'center', justifyContent: 'center' },
  iconeTexto: { fontSize: 18, color: cores.textoSecundario },
  iconeTextoFocado: { color: cores.primaria },
});
