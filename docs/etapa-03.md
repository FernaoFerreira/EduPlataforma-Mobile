# Etapa 3 — Navegação, UX e acessibilidade

Versão da entrega: tag Git `etapa-03`.

Implementação em `src/navigation/index.js` (estrutura), `src/context/FeedbackContext.js` (feedback), `src/theme/index.js` (tokens de contraste e alvo) e nos componentes de `src/components/`.

---

## 1. Estrutura de navegação implementada

Duas camadas combinadas: **abas inferiores** para movimentação lateral entre áreas, e uma **pilha por aba** para profundidade dentro de cada área.

```
Abas (nível 1)      Pilha (nível 2)           Pilha (nível 3)
────────────────────────────────────────────────────────────────
Painel          →   Painel

Cursos          →   Cursos                →   Curso (detalhe)  →  Módulos e aulas
                                          →   Formulário de curso
                                          →   Categorias       →  Formulário de categoria

Matrículas      →   Matrículas            →   Formulário de matrícula
                                          →   Certificado (modal)

Pessoas         →   Pessoas               →   Formulário de pessoa

Financeiro      →   Financeiro
```

**Por que esta divisão.** As cinco abas são as cinco áreas de trabalho que o administrador alterna com frequência, e cada uma fica sempre a um toque de distância, de qualquer ponto do app. Categorias não ganhou aba própria por ser um cadastro de apoio aos cursos — vive dentro da pilha de Cursos, acessível pelo cabeçalho, o que mantém a barra de abas em cinco itens (acima disso os rótulos truncam em telefones estreitos).

**Estado independente por aba.** Cada aba mantém sua própria pilha. Sair de um curso para conferir uma matrícula e voltar devolve o usuário exatamente onde ele estava, sem refazer o caminho.

---

## 2. Telas e mecanismos de acesso

| Tela | Como se chega | Como se volta |
|---|---|---|
| Painel | Aba "Painel" (inicial ao abrir o app) | — (raiz) |
| Cursos | Aba "Cursos"; trilha e atalhos do Painel | — (raiz da pilha) |
| Curso — detalhe | Toque no cartão do curso | Botão voltar, gesto lateral, botão do Android |
| Curso — formulário | Botão flutuante "Novo curso"; ação "Editar"; atalho do Painel | Botão voltar; botão "Cancelar" |
| Módulos e aulas | Ação "Módulos" no cartão; botão no detalhe do curso | Botão voltar, gesto, botão do Android |
| Categorias | Botão "Categorias" no cabeçalho de Cursos; trilha do Painel | Botão voltar |
| Categoria — formulário | Botão flutuante; ação "Editar" | Botão voltar; "Cancelar" |
| Pessoas | Aba "Pessoas"; cartão "Pessoas" do Painel | — (raiz da pilha) |
| Pessoa — formulário | Botão flutuante; ação "Editar" | Botão voltar; "Cancelar" |
| Matrículas | Aba "Matrículas"; trilha, cartão e aviso do Painel | — (raiz da pilha) |
| Matrícula — formulário | Botão flutuante; atalho do Painel | Botão voltar; "Cancelar" |
| Certificado | Ação "Emitir/Ver certificado" no cartão da matrícula | Arrastar o modal; botão "Fechar" |
| Financeiro | Aba "Financeiro"; cartões de receita e assinaturas do Painel | — (raiz da pilha) |

### Retorno a telas anteriores

Quatro caminhos, todos funcionando em conjunto:

1. **Botão voltar no cabeçalho** — `@react-navigation/native-stack`, rotulado "Voltar".
2. **Gesto nativo** — deslizar da borda (iOS) e o gesto/botão de voltar do Android, tratados automaticamente pela pilha nativa.
3. **Botões explícitos** — "Cancelar" nos formulários, "Fechar" no certificado, "Voltar" nos estados de erro.
4. **Arrastar para baixo** — no certificado, por ser apresentado como modal (`presentation: 'modal'`).

Após salvar qualquer formulário, o app chama `navigation.goBack()`: a ação termina e devolve o usuário à lista de onde ele saiu, já atualizada. O usuário nunca precisa fechar uma tela manualmente depois de concluir a tarefa.

---

## 3. Mecanismos de navegação utilizados

| Mecanismo | Implementação | Função |
|---|---|---|
| Abas inferiores | `createBottomTabNavigator` | Acesso lateral às 5 áreas, sempre visível |
| Pilha de telas | `createNativeStackNavigator` (5 pilhas) | Profundidade e retorno dentro de cada área |
| Modal | `presentation: 'modal'` no Certificado | Tarefa pontual que devolve ao ponto de origem |
| Ação no cabeçalho | `headerRight` em Cursos | Acesso a Categorias sem gastar uma aba |
| Botão flutuante | `BotaoFlutuante` | Ação principal de cada listagem |
| Navegação aninhada | `navigate('AbaCursos', { screen: 'CursoForm' })` | Atalhos do Painel que cruzam abas |
| Trilha | `Trilha` no Painel | Atalho que também comunica a ordem dos cadastros |
| Acordeão | `ModulosScreen` | Aprofunda sem mudar de tela |

---

## 4. Feedback visual das ações

### 4.1 Aviso global (`src/context/FeedbackContext.js`)

Toda operação que altera dados dispara uma mensagem na parte inferior da tela, acima da barra de abas, com entrada e saída animadas e desaparecimento automático em 2,6 s.

- Verde para confirmação (`Curso cadastrado.`)
- Vermelho para impedimento (`Verifique os campos destacados.`)
- Azul para ações neutras ou reversíveis (`Matrícula cancelada.`)

As mensagens usam o mesmo verbo do botão que as originou — "Emitir certificado" produz "Certificado emitido" —, de modo que o usuário reconhece que aquela ação, e não outra, foi concluída.

### 4.2 Estados de interação

| Estado | Tratamento |
|---|---|
| Pressionado | Escurecimento da cor de fundo + redução de escala (0,985) em botões, cartões, chips, abas e linhas |
| Foco | Borda do campo passa de 1,5dp cinza para 2dp na cor primária |
| Erro | Borda vermelha, fundo rosado, ícone ⚠ e texto explicativo abaixo do campo |
| Carregando | `ActivityIndicator` substitui o rótulo do botão; o botão fica inativo |
| Desabilitado | Fundo e borda neutros, texto em cinza, toque ignorado |
| Selecionado | Chip preenchido na cor primária, texto branco e prefixo ✓ |
| Expandido | Seta ▲/▼ no cabeçalho do módulo |
| Vazio | Bloco tracejado com título, explicação e botão da próxima ação |

### 4.3 Confirmação de ações destrutivas

Exclusões passam por `Alert` nativo, com o nome do registro na pergunta e aviso das consequências em cascata ("Os módulos, aulas e matrículas vinculados também serão removidos"). O botão de confirmar usa `style: 'destructive'`.

### 4.4 Contagem reativa

As listagens exibem quantos registros o filtro atual retornou, dentro de uma região `accessibilityLiveRegion="polite"` — o número muda enquanto o usuário digita, e a mudança é anunciada pelo leitor de tela.

---

## 5. Decisões de UX

### 5.1 Lei de Fitts

A lei relaciona o tempo de aquisição de um alvo ao seu tamanho e à distância até ele: alvos maiores e mais próximos são atingidos mais rápido e com menos erro. Aplicações concretas:

| Decisão | Onde | Efeito |
|---|---|---|
| Piso de 48dp em **todo** alvo de toque | token `alvo.minimo`, aplicado em botões, chips, campos, ações de cartão, itens de aba | Acima do mínimo recomendado pelo Material Design; abaixo disso o erro de toque cresce rapidamente |
| 56dp nos alvos principais | botão flutuante, botões de envio dos formulários | Ação mais frequente recebe o maior alvo |
| `hitSlop` de 6–10dp | botões, chips, ações do cabeçalho | Estende a área sensível além do desenho, sem aumentar o espaço ocupado |
| Ação principal no canto inferior direito | `BotaoFlutuante` | Dentro do arco natural do polegar em uso com uma mão; distância curta a partir do repouso |
| Navegação na base, não no topo | barra de abas | O topo da tela é a região mais distante do polegar em telefones grandes |
| Espaçamento de 8dp entre alvos | `espaco.sm` entre botões de ação | Separa alvos adjacentes o bastante para não confundir "Editar" com "Excluir" |
| Destrutivo longe do principal | "Excluir" no rodapé do cartão, botão flutuante no canto oposto | Erro custoso exige distância maior, aplicando a lei ao contrário de propósito |
| Cartão inteiro como alvo | listagem de cursos | O alvo de "abrir detalhe" é a largura toda, não apenas o título |

### 5.2 Demais decisões

**Texto legível.** Corpo em 16dp com entrelinha de 23dp; nenhum texto informativo abaixo de 12dp, e o de 12dp usa peso 600 para compensar. Nada depende de fonte externa, então não há salto de layout na inicialização.

**Identificação clara das ações.** Todo botão nomeia o que acontece ao ser acionado — "Cadastrar curso", "Emitir certificado", "Registrar pagamento" —, nunca "OK", "Enviar" ou "Confirmar". O nome da ação permanece o mesmo do botão até a mensagem de confirmação.

**Mensagens compreensíveis.** Erros dizem o problema e a saída: "A carga horária deve ser um número maior que zero", não "valor inválido". Impedimentos por regra de negócio explicam o motivo e o caminho: "'Programação' tem 2 curso(s). Altere a categoria desses cursos antes de excluir."

**Ícone nunca sozinho.** Os símbolos das abas sempre vêm acompanhados do rótulo escrito.

**Prevenção de erro antes da correção.** O formulário de matrícula só oferece cursos publicados e pessoas com perfil Aluno; quando não há nenhum, a tela explica o que falta em vez de apresentar um formulário impossível de enviar.

**Telas que lidam com ausência.** Se um registro é excluído enquanto sua tela de detalhe está na pilha, a tela mostra um estado explicativo com botão de volta, em vez de quebrar.

---

## 6. Medidas de acessibilidade

### 6.1 Contraste (WCAG 2.1, critério 1.4.3 — mínimo AA)

Exige 4,5:1 para texto normal e 3:1 para texto grande e componentes de interface. Os tokens de `src/theme/index.js` foram escolhidos para atender a esse piso:

| Combinação | Razão | Exigido | Situação |
|---|---|---|---|
| `tinta #16243F` sobre `papel #FFFFFF` | ~13,6:1 | 4,5:1 | atende AAA |
| `textoSecundario #4C5B73` sobre `papel` | ~6,9:1 | 4,5:1 | atende AA |
| `papel` sobre `primaria #2F4BA8` | ~7,4:1 | 4,5:1 | atende AA |
| `papel` sobre `erro #B3261E` | ~6,2:1 | 4,5:1 | atende AA |
| `papel` sobre `sucesso #146C43` | ~5,3:1 | 4,5:1 | atende AA |
| `bordaForte #8493AE` sobre `papel` | ~3,1:1 | 3:1 | atende AA (bordas) |

A cor de aba inativa é `textoSecundario` (6,9:1), e não um cinza claro: um item inativo ainda precisa ser lido.

### 6.2 Uso de cor (critério 1.4.1)

Nenhuma informação é transmitida só por cor. Cada estado aparece **também** em texto: etiqueta "Publicado"/"Rascunho", "Concluído"/"Em andamento", "Pago"/"Pendente". As faixas coloridas nos cartões e as bordas vermelhas de erro são reforço redundante — o erro sempre traz ícone ⚠ e frase explicativa.

### 6.3 Leitores de tela (TalkBack e VoiceOver)

| Recurso | Implementação |
|---|---|
| Papel do elemento | `accessibilityRole` em botões, cabeçalhos, grupos de rádio, interruptor, alerta |
| Rótulo descritivo | `accessibilityLabel` contextualizado — "Excluir React Native do zero", não "Excluir" |
| Descrição do efeito | `accessibilityHint` em todas as ações — "Pede confirmação antes de excluir" |
| Estado atual | `accessibilityState` com `selected`, `checked`, `expanded`, `disabled`, `busy` |
| Anúncio de mudanças | `accessibilityLiveRegion="polite"` nos avisos, erros e contagens (Android) + `AccessibilityInfo.announceForAccessibility` no iOS, que não tem live region |
| Elementos decorativos | Setas da trilha e do acordeão marcadas com `accessible={false}` e `importantForAccessibility="no"`, para não poluir a leitura |
| Agrupamento | O certificado é lido como um bloco único (`accessible` + `accessibilityRole="summary"`), evitando a leitura fragmentada de sete textos soltos |
| Campos de formulário | Rótulo visível em `<Text>`, repetido em `accessibilityLabel`, com marcação "campo obrigatório"; a mensagem de erro entra em `accessibilityHint` |
| Abas | `tabBarAccessibilityLabel` identifica cada item como aba |

### 6.4 Outras medidas

- **Ampliação de fonte do sistema** respeitada (`allowFontScaling` padrão ativo). Os contêineres usam `minHeight` em vez de `height`, de modo que textos ampliados expandem o componente em vez de serem cortados.
- **Alvos de 48dp** — também um requisito de acessibilidade motora (WCAG 2.5.5), não apenas de ergonomia.
- **Rótulos permanentes**, nunca apenas `placeholder`: o placeholder desaparece ao digitar e não é lido de forma confiável.
- **Teclado adequado por campo** (`number-pad`, `decimal-pad`, `email-address`), reduzindo a digitação necessária.
- **Sem dependência de gestos ocultos** — toda ação disponível por gesto tem um botão equivalente.
- **Movimento contido** — as transições usam a animação nativa da pilha, que o sistema suprime quando o usuário ativa "reduzir movimento"; não há animação decorativa em laço.

---

## 7. Instruções para execução e teste da navegação

```bash
cd EduPlataforma-Mobile/my-app
npm install
npx expo start
```

### Roteiro de teste da navegação

1. **Abas** — percorra as cinco abas e confirme que o rótulo da aba ativa muda de cor e o ícone acompanha.
2. **Profundidade** — em Cursos, toque em um curso → "Gerenciar módulos e aulas". Você está três níveis abaixo da raiz.
3. **Retorno** — volte pelos três caminhos: botão do cabeçalho, gesto de deslizar da borda (iOS) ou botão do Android, e o botão "Voltar" de um estado vazio.
4. **Estado preservado** — dentro de um curso, troque para a aba Financeiro e volte para Cursos: a tela de detalhe continua aberta.
5. **Atalho entre abas** — no Painel, toque em "Matricular aluno": o app muda de aba e já abre o formulário.
6. **Modal** — em Matrículas, marque uma matrícula como concluída e toque em "Emitir certificado". Feche arrastando para baixo e depois pelo botão "Fechar".
7. **Cabeçalho** — em Cursos, use o botão "Categorias" no canto superior direito.
8. **Feedback** — salve qualquer formulário e observe o aviso inferior; tente salvar um formulário vazio e observe o aviso vermelho com os campos destacados.
9. **Confirmação** — exclua um curso que tenha módulos e leia o texto do alerta antes de confirmar.

### Roteiro de teste de acessibilidade

1. **Leitor de tela** — ative o TalkBack (Android: Configurações → Acessibilidade) ou o VoiceOver (iOS: Ajustes → Acessibilidade). Navegue pela lista de cursos deslizando para a direita: cada cartão deve ser anunciado com título, descrição e o efeito de cada ação.
2. **Anúncio de mudança** — com o leitor ativo, salve um formulário: a mensagem de confirmação deve ser falada.
3. **Estados** — foque um chip de filtro: o leitor deve dizer "selecionado" ou "não selecionado". Foque um módulo recolhido: deve dizer "recolhido"/"expandido".
4. **Ampliação de fonte** — aumente o tamanho da fonte do sistema para o máximo e percorra as telas: nenhum texto deve ser cortado.
5. **Alvos de toque** — ative "Mostrar limites de layout" nas opções de desenvolvedor do Android e confirme que os botões ocupam ao menos 48dp de altura.
6. **Rotação e tablet** — gire o aparelho ou abra em um tablet: as métricas do Painel devem passar de uma para duas colunas.
