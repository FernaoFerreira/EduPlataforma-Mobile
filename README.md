# EduPlataforma Mobile

Porte mobile da **[Plataforma de Cursos Online](https://github.com/FernaoFerreira/Plataforma-de-Cursos-Online)**, desenvolvido para a disciplina de **Tecnologia de Construção de Software**.

## Sobre o projeto

A Plataforma de Cursos Online é um painel administrativo web para gestão de cursos EAD, construído como uma SPA em React + Vite, com React Router, Axios e JSON Server como backend simulado. Ele reúne o cadastro de cursos, categorias, módulos e aulas, usuários, matrículas e o controle financeiro da operação.

Este repositório traz o **EduPlataforma Mobile**: o mesmo domínio reconstruído como aplicativo nativo em React Native/Expo. O objetivo acadêmico é comparar, na prática, a construção de uma aplicação web e a de uma aplicação mobile — o modelo de dados e as regras de negócio se aproveitam quase integralmente, mas a camada de interface e o paradigma de navegação são reescritos do zero.

## Problema que resolve

Quem administra uma plataforma EAD depende de um painel web no computador para tarefas curtas do dia a dia: conferir quantas matrículas entraram, consultar um aluno, ver o resumo financeiro, liberar um certificado. O EduPlataforma Mobile cobre essa lacuna ao levar as operações essenciais para o celular, com uma interface pensada para toque e uso com uma mão.

## Funcionalidades

| Módulo | Situação no app |
|---|---|
| Painel com métricas de cursos, pessoas, matrículas e receita | implementado |
| CRUD de categorias, com bloqueio de exclusão quando há cursos vinculados | implementado |
| CRUD de cursos, com seleção de categoria e professor e controle de publicação | implementado |
| CRUD de pessoas (administrador, professor, aluno) | implementado |
| Módulos e aulas em hierarquia por curso | implementado |
| Matrículas, marcação de conclusão e emissão de certificado | implementado |
| Planos, assinaturas e registro de pagamentos | implementado |
| Busca e filtros nas listagens | implementado |
| Persistência local de dados no dispositivo (AsyncStorage) | implementado (Etapa 4) |
| Integração remota com backend | pendente (ver limitações) |

## Tecnologias utilizadas

**Aplicativo mobile:**
- React Native e Expo SDK 57
- `@react-native-async-storage/async-storage` 2.2.0 (armazenamento persistente local)
- React Navigation 6 — `bottom-tabs` (abas) e `native-stack` (pilhas)
- React Context API para estado da aplicação e sincronização de dados
- Node.js Test Runner nativo (`node:test`) para testes automatizados
- JavaScript (sem bibliotecas de UI de terceiros: todos os componentes são próprios)

**Projeto web de origem, como referência:**
- React + Vite, React Router, Axios, JSON Server

## Estrutura do projeto

```
my-app/
├── App.js                      Ponto de entrada; monta os provedores e a navegação
├── src/
│   ├── theme/index.js          Tokens de cor, espaço, tipografia e alvo de toque
│   ├── data/seed.js            Dados iniciais em memória / semente de demonstração
│   ├── services/
│   │   └── storage.js          Serviço de persistência local com AsyncStorage
│   ├── context/
│   │   ├── DadosContext.js     Estado, operações CRUD e sincronização com armazenamento
│   │   └── FeedbackContext.js  Avisos de confirmação e erro
│   ├── components/             13 componentes reutilizáveis
│   ├── navigation/index.js     Abas + pilhas
│   └── screens/                13 telas
├── test/
│   ├── runner.mjs              Executor dos testes automatizados
│   ├── persistencia.test.mjs   Testes do serviço de armazenamento e ciclo de vida
│   └── crud-context.test.mjs   Testes das operações de domínio e integridade
docs/
├── etapa-02.md                 Protótipo de interface
├── etapa-03.md                 Navegação, UX e acessibilidade
└── etapa-04.md                 Persistência local de dados
```

A separação segue uma regra simples: `components/` não conhece as regras do domínio e recebe tudo por props; `screens/` compõe componentes e conversa com os contextos; `context/` concentra dados e feedback; `services/` isola o acesso a I/O e persistência no dispositivo; `theme/` centraliza os tokens — nenhuma cor ou medida é escrita direto nas telas.

## Execução

Pré-requisitos: Node.js 18 ou superior e o app **Expo Go** no celular, ou um emulador Android/iOS configurado.

```bash
git clone https://github.com/FernaoFerreira/EduPlataforma-Mobile.git
cd EduPlataforma-Mobile/my-app
npm install
npx expo start
```

Com o servidor no ar, escaneie o QR code com o Expo Go, ou pressione `a` (Android) / `i` (iOS) / `w` (Web) no terminal.

### Testes automatizados

Para executar os testes automatizados de persistência e integridade relacional:

```bash
cd my-app
node test/runner.mjs
```

## Limitações conhecidas

- **Persistência local ativa (Etapa 4):** os dados agora são armazenados no dispositivo utilizando AsyncStorage. Todas as operações de criação, edição, exclusão em cascata e regras de negócio persistem entre execuções do aplicativo. A sincronização com backend remoto (JSON Server) será abordada em etapa posterior.
- **Sem autenticação nem controle de permissões.** O app assume um usuário administrador já autenticado; o perfil cadastrado em Pessoas é apenas um atributo do registro, não restringe acesso.
- **Certificado sem arquivo.** A emissão registra o estado da matrícula e exibe o certificado na tela, mas ainda não gera PDF nem oferece compartilhamento.
- **Build nativo não gerado.** A execução foi verificada via Expo Go; não há APK nem IPA publicados.
- **Ícones textuais** nas abas, em vez de uma biblioteca de ícones, para manter o projeto sem dependências visuais extras.

## Documentação

- [`docs/etapa-02.md`](docs/etapa-02.md) — telas, componentes reutilizáveis, entrada de dados, adaptação a tamanhos de tela e decisões de interface
- [`docs/etapa-03.md`](docs/etapa-03.md) — estrutura de navegação, feedback visual, Lei de Fitts, acessibilidade e roteiros de teste
- [`docs/etapa-04.md`](docs/etapa-04.md) — persistência local, justificativa técnica, estrutura dos dados, operações CRUD, telas integradas e testes
- [Documentação do Expo](https://docs.expo.dev/) · [React Navigation](https://reactnavigation.org/docs/getting-started)

## Autor

Fernão Queiroz Ferreira — Ciência da Computação, PUC Goiás.
