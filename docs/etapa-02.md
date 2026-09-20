# Etapa 2 — Implementação do protótipo de interface

Versão da entrega: tag Git `etapa-02`.

Esta etapa implementa a camada visual e estrutural do EduPlataforma Mobile. Conforme o enunciado, ainda **não há persistência de dados nem comunicação com servidor**: o estado vive em memória durante a execução do aplicativo.

---

## 1. Telas implementadas

O enunciado pede uma tela inicial e pelo menos três adicionais. Foram implementadas **treze** telas, cobrindo os módulos do sistema web de origem.

| # | Tela | Arquivo | Papel |
|---|------|---------|-------|
| 1 | **Painel** (tela inicial) | `src/screens/PainelScreen.js` | Visão geral: trilha de cadastros, métricas e atalhos |
| 2 | Cursos | `src/screens/CursosScreen.js` | Listagem com busca e filtro por categoria |
| 3 | Curso — detalhe | `src/screens/CursoDetalheScreen.js` | Dados do curso, prévia dos módulos e matrículas |
| 4 | Curso — formulário | `src/screens/CursoFormScreen.js` | Cadastro e edição de curso |
| 5 | Módulos e aulas | `src/screens/ModulosScreen.js` | Hierarquia curso → módulo → aula |
| 6 | Categorias | `src/screens/CategoriasScreen.js` | Listagem de categorias |
| 7 | Categoria — formulário | `src/screens/CategoriaFormScreen.js` | Cadastro e edição de categoria |
| 8 | Pessoas | `src/screens/UsuariosScreen.js` | Listagem com filtro por perfil |
| 9 | Pessoa — formulário | `src/screens/UsuarioFormScreen.js` | Cadastro e edição de usuário |
| 10 | Matrículas | `src/screens/MatriculasScreen.js` | Listagem com filtros de situação |
| 11 | Matrícula — formulário | `src/screens/MatriculaFormScreen.js` | Vínculo aluno ↔ curso |
| 12 | Certificado | `src/screens/CertificadoScreen.js` | Visualização e emissão do certificado |
| 13 | Financeiro | `src/screens/FinanceiroScreen.js` | Planos, assinaturas e pagamentos |

---

## 2. Principais componentes utilizados

Componentes nativos do React Native empregados e a razão de cada escolha:

| Componente | Onde | Por quê |
|---|---|---|
| `View` | estrutura de todas as telas | contêiner de layout com Flexbox |
| `Text` | todo conteúdo textual | único elemento que renderiza texto em RN |
| `Pressable` | botões, cartões, chips, abas | expõe o estado `pressed`, usado para o realce ao toque (`ScrollView`+`TouchableOpacity` não dão o mesmo controle de estilo por estado) |
| `TextInput` | formulários e busca | entrada de dados, com `keyboardType` adequado por campo |
| `ScrollView` | `Tela` | rolagem vertical; as listas do protótipo são curtas e não justificam `FlatList` |
| `KeyboardAvoidingView` | `Tela` | impede que o teclado cubra o campo em foco no iOS |
| `Alert` | exclusões | confirmação nativa para ações destrutivas |
| `ActivityIndicator` | `Botao` | estado de carregamento |
| `Animated` | `FeedbackContext` | transição de entrada/saída do aviso |

---

## 3. Componentes reutilizáveis

Ficam em `src/components/` e são consumidos pelas telas; nenhuma tela redefine estilo de botão, campo ou cartão por conta própria.

| Componente | Arquivo | Responsabilidade |
|---|---|---|
| `Tela` | `Tela.js` | Envoltório padrão: fundo, respiro, rolagem, recuo de teclado, largura máxima |
| `Grade` | `Tela.js` | Grade que alterna entre 1 e 2 colunas conforme a largura |
| `Botao` | `Botao.js` | 4 variantes (primária, secundária, perigo, texto), 2 tamanhos, estados de pressão/desabilitado/carregando |
| `CampoTexto` | `CampoTexto.js` | Entrada de texto com rótulo, ajuda, erro e marcação de obrigatoriedade |
| `CampoSelecao` | `CampoSelecao.js` | Escolha única em chips, com papel de grupo de rádio |
| `Cartao` | `Cartao.js` | Superfície de conteúdo, opcionalmente acionável, com faixa de status |
| `Etiqueta` | `Cartao.js` | Marcador de estado (cor + texto) |
| `TituloSecao` | `Cartao.js` | Cabeçalho de seção com texto de apoio |
| `EstadoVazio` | `Cartao.js` | Tela/lista sem dados, com a próxima ação sugerida |
| `LinhaLista` | `LinhaLista.js` | Item de listagem com título, etiquetas e ações |
| `BotaoAcao` | `LinhaLista.js` | Botão secundário compacto dentro de cartões |
| `BotaoFlutuante` | `BotaoFlutuante.js` | Ação principal da tela, fixa no canto inferior |
| `Trilha` | `Trilha.js` | Trilha de cadastros do painel |
| `CartaoMetrica` | `Trilha.js` | Métrica numérica do painel |

**Separação adotada:** `components/` não conhece as regras do domínio (recebe tudo por props); `screens/` compõe os componentes e conversa com os contextos; `context/` concentra dados e feedback; `theme/` centraliza os tokens visuais. Nenhuma cor ou medida é escrita diretamente nas telas — todas vêm de `src/theme/index.js`.

---

## 4. Elementos de entrada de dados

| Elemento | Implementação | Onde aparece |
|---|---|---|
| Texto curto | `CampoTexto` | título do curso, nome da categoria, nome da pessoa, título de módulo/aula |
| Texto longo | `CampoTexto` com `multilinha` | descrições |
| Numérico inteiro | `CampoTexto` com `keyboardType="number-pad"` | carga horária |
| Numérico decimal | `CampoTexto` com `keyboardType="decimal-pad"` | preço (aceita vírgula e ponto) |
| E-mail | `CampoTexto` com `keyboardType="email-address"`, sem autocorreção nem capitalização | cadastro de pessoa |
| Busca | `CampoTexto` com `returnKeyType="search"` | lista de cursos |
| Escolha única | `CampoSelecao` (chips) | categoria, professor, perfil, aluno, filtros |
| Alternância | `Pressable` com `accessibilityRole="switch"` | publicar/rascunho no formulário de curso |

**Validação implementada:** obrigatoriedade, tamanho mínimo de título, número positivo para carga horária, número não-negativo para preço, formato de e-mail, e unicidade (e-mail já cadastrado, categoria duplicada, aluno já matriculado no mesmo curso). As mensagens dizem o que está errado **e** como corrigir.

---

## 5. Adaptação a diferentes tamanhos de tela

Estratégias usadas, todas em `src/components/Tela.js`:

1. **Ponto de quebra único em 600dp** (`PONTO_QUEBRA`), obtido por `useWindowDimensions`, que reage a rotação e a janelas redimensionáveis — diferente de `Dimensions.get()`, que é lido uma vez só.
2. **Grade adaptável** — `Grade` distribui os filhos em 2 colunas acima do ponto de quebra e 1 coluna abaixo, usando `flexBasis` + `flexWrap` em vez de largura fixa.
3. **Largura máxima de 680dp** para o conteúdo em telas largas, mantendo a linha de texto em extensão legível em vez de esticar de borda a borda em tablets.
4. **Medidas relativas** — nenhum `width` em pixels fixos; larguras são `'100%'`, `flex` ou percentuais.
5. **Tipografia escalável** — o `allowFontScaling` padrão do React Native permanece ativo, então o app acompanha o ajuste de tamanho de fonte do sistema. Por isso os contêineres usam `minHeight` em vez de `height`, evitando corte de texto ampliado.
6. **`KeyboardAvoidingView`** garante que o campo em foco continue visível quando o teclado reduz a área útil.
7. **Rolagem em todas as telas**, para que conteúdo mais alto que a tela nunca fique inacessível em aparelhos pequenos.
8. **`supportsTablet: true`** e orientação livre em `app.json`.

---

## 6. Instruções para execução

Pré-requisitos: Node.js 18+ e o app **Expo Go** no celular, ou um emulador Android/iOS.

```bash
git clone https://github.com/FernaoFerreira/EduPlataforma-Mobile.git
cd EduPlataforma-Mobile/my-app
npm install
npx expo start
```

Com o servidor no ar: escaneie o QR code com o Expo Go, ou pressione `a` (Android) / `i` (iOS) no terminal.

---

## 7. Principais decisões de interface

**Chips no lugar de seletor suspenso.** Categoria, professor, perfil e aluno são listas curtas. Chips mostram todas as opções sem um passo extra de abrir/fechar e oferecem alvos de toque muito maiores que os itens de um `Picker`.

**Ações em botões visíveis, não em gestos de deslizar.** Editar e excluir ficam em botões dentro do cartão. Gesto de deslizar é rápido para quem já o conhece, mas é invisível para quem não conhece e inalcançável por leitor de tela.

**Módulos e aulas em acordeão, não em outra tela.** A relação entre módulo e aula é justamente o que o usuário vem conferir nessa tela; empurrar as aulas para um nível mais profundo esconderia a estrutura.

**Estado sempre em cor *e* texto.** "Publicado", "Rascunho", "Concluído", "Pendente" aparecem como etiqueta escrita, acompanhada de uma faixa colorida no cartão. A cor reforça, nunca carrega a informação sozinha.

**Telas vazias como convite.** Em vez de "nenhum registro", cada estado vazio explica o que aquela área guarda e oferece o botão da próxima ação.

**Paleta e tipografia.** Cinco tokens de cor (`tinta`, `papel`, `fundo`, `primaria`, `acento`) definidos em `src/theme/index.js`, escolhidos para atender ao contraste mínimo da WCAG AA já nesta etapa — o detalhamento está em `docs/etapa-03.md`. A hierarquia tipográfica usa uma escala de seis níveis em uma única família (a do sistema), variando peso e tamanho, sem depender de fontes externas que atrasariam a inicialização.

**Trilha no painel.** A tela inicial abre com a sequência Categorias → Cursos → Módulos → Matrículas. A numeração representa a dependência real entre os cadastros: não existe curso sem categoria, nem módulo sem curso. Cada degrau é também um atalho de navegação.
