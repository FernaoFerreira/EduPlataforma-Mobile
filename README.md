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
| Integração com backend JSON Server | implementado (Etapa 5) |
| Modo online/offline com escrita dual | implementado (Etapa 5) |
| Sincronização manual com servidor | implementado (Etapa 5) |
| Integração com API externa (Open Library API para consulta de bibliografia e referências) | implementado (Etapa 6) |
| Gerenciamento de estado global compartilhado (PreferenciasContext: tema claro/escuro, aluno ativo, controle de bibliografia) | implementado (Etapa 7) |
| Integração com recursos nativos do dispositivo (Share API, Permissions, Vibration API, exportação de arquivos) | implementado (Etapa 7) |

## Arquitetura

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 React Native / Expo                                    │
│  ┌───────────────────────┐                                                             │
│  │ PreferenciasContext   │ ──(tema claro/escuro, aluno ativo, bibliografia)──┐         │
│  │ (AsyncStorage)        │                                                   │         │
│  └───────────────────────┘                                                   │         │
│        │                                                                     │         │
│        ▼                                                                     ▼         │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐                    ┌─────────────┐ │
│  │  Screens   │→ │ DadosContext │→ │  api.js      │───→ JSON Server    │ dispositivo │ │
│  │  (13 telas)│  │  (estado +   │  │  (fetch HTTP)│     (porta 3000)   │ (Share API, │ │
│  └─────┬──────┘  │  CRUD)       │  └──────────────┘                    │ Permissions,│ │
│        │         │              │→ ┌──────────────┐                    │ Vibration)  │ │
│        │         │              │  │ storage.js   │                    └──────┬──────┘ │
│        │         └──────────────┘  │ (AsyncStorage)│                          │        │
│        │                           └──────────────┘                          │        │
│        ▼                                                                     ▼        │
│  ┌──────────────┐                                                     ┌─────────────┐ │
│  │ livrosApi.js │─────────────────────────────────→ Open Library API  │ Sistema Op. │ │
│  │ (fetch HTTP) │                                   (search.json)     │ (Android/iOS│ │
│  └──────────────┘                                                     └─────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Fluxo de dados:**
- **Leitura**: tenta backend → fallback AsyncStorage → seed (seed.js).
- **Escrita**: atualiza estado React imediatamente + persiste no AsyncStorage + envia ao backend (fire-and-forget).
- **Offline**: funciona normalmente com dados locais; operações são armazenadas localmente.
- **Serviço externo**: consulta de obras e referências bibliográficas na Open Library API com tratamento completo dos 4 estados (carregamento, sucesso, ausência de dados e erro).
- **Estado global**: gerenciamento transversal de preferências (tema claro/escuro, visibilidade de referências e aluno ativo da sessão) via `PreferenciasContext`.
- **Recursos nativos**: compartilhamento pelo menu nativo do sistema operacional (`Share.share`), feedback háptico (`Vibration.vibrate`), solicitação e checagem de permissões (`PermissionsAndroid`) e gravação local de comprovantes digitais.

## Tecnologias utilizadas

**Aplicativo mobile:**
- React Native e Expo SDK 57
- `@react-native-async-storage/async-storage` 2.2.0 (armazenamento persistente local)
- React Navigation 6 — `bottom-tabs` (abas) e `native-stack` (pilhas)
- React Context API para estado da aplicação e sincronização de dados
- Node.js Test Runner nativo (`node:test`) para testes automatizados
- JavaScript (sem bibliotecas de UI de terceiros: todos os componentes são próprios)

**Backend local:**
- JSON Server 0.17.3 — API REST completa a partir de arquivo `db.json`
- 9 endpoints: categorias, usuarios, cursos, modulos, aulas, matriculas, planos, assinaturas, pagamentos

**Serviço externo:**
- Open Library Search API (`https://openlibrary.org/search.json`) — consulta de livros e literatura complementar em tempo real

**Projeto web de origem, como referência:**
- React + Vite, React Router, Axios, JSON Server

## Estrutura do projeto

```
my-app/
├── App.js                      Ponto de entrada; monta os provedores e a navegação
├── db.json                     Base de dados do JSON Server (9 coleções)
├── db.original.json            Cópia de segurança do banco inicial
├── src/
│   ├── theme/index.js          Tokens de cor, espaço, tipografia e alvo de toque
│   ├── data/seed.js            Dados iniciais em memória / semente de demonstração
│   ├── services/
│   │   ├── api.js              Cliente HTTP REST para o JSON Server
│   │   ├── livrosApi.js        Cliente HTTP para a Open Library API (Etapa 6)
│   │   └── storage.js          Serviço de persistência local com AsyncStorage
│   ├── context/
│   │   ├── DadosContext.js     Estado, operações CRUD, integração backend + local
│   │   └── FeedbackContext.js  Avisos de confirmação e erro
│   ├── components/             13 componentes reutilizáveis
│   ├── navigation/index.js     Abas + pilhas
│   └── screens/                13 telas
├── test/
│   ├── runner.mjs              Executor dos testes automatizados
│   ├── persistencia.test.mjs   Testes do serviço de armazenamento e ciclo de vida
│   ├── crud-context.test.mjs   Testes das operações de domínio e integridade
│   ├── api.test.mjs            Testes do serviço de API e integridade do db.json
│   └── livrosApi.test.mjs      Testes da integração com a Open Library API (Etapa 6)
docs/
├── etapa-02.md                 Protótipo de interface
├── etapa-03.md                 Navegação, UX e acessibilidade
├── etapa-04.md                 Persistência local de dados
├── etapa-05.md                 Primeira versão funcional com backend
└── etapa-06.md                 Integração com API ou serviço externo
```

A separação segue uma regra simples: `components/` não conhece as regras do domínio e recebe tudo por props; `screens/` compõe componentes e conversa com os contextos; `context/` concentra dados e feedback; `services/` isola o acesso a I/O (API HTTP local, serviço externo e persistência local); `theme/` centraliza os tokens — nenhuma cor ou medida é escrita direto nas telas.

## Execução

Pré-requisitos: Node.js 18 ou superior e o app **Expo Go** no celular, ou um emulador Android/iOS configurado.

```bash
git clone https://github.com/FernaoFerreira/EduPlataforma-Mobile.git
cd EduPlataforma-Mobile/my-app
npm install
```

### Iniciar o backend

```bash
npx json-server --watch db.json --port 3000
```

### Iniciar o frontend (em outro terminal)

```bash
npx expo start
```

Com o servidor no ar, escaneie o QR code com o Expo Go, ou pressione `a` (Android) / `i` (iOS) / `w` (Web) no terminal.

### Testes automatizados

Para executar os 36 testes automatizados (persistência, domínio, API backend e serviço externo):

```bash
cd my-app
node test/runner.mjs
```

### Restaurar base de dados

```bash
cp db.original.json db.json
```

## Limitações conhecidas

- **Sincronização unidirecional:** quando o app reconecta ao servidor, os dados do backend sobrescrevem os locais. Dados criados offline que não foram enviados ao servidor podem ser perdidos ao sincronizar.
- **Sem autenticação nem controle de controle de papéis (RBAC):** O app assume um usuário administrador já autenticado; o perfil cadastrado em Pessoas é apenas um atributo do registro, não restringe acesso a telas.
- **Formato do certificado:** O compartilhamento e a exportação local utilizam texto formatado e comprovante digital JSON com hash SHA-256; a renderização vetorial de PDF requer backend ou biblioteca nativa adicional de renderização de PDF.
- **Build nativo não gerado:** A execução foi verificada via Expo Go; não há APK nem IPA publicados.
- **Ícones textuais** nas abas, em vez de uma biblioteca de ícones, para manter o projeto sem dependências visuais extras.

## Documentação

- [`docs/etapa-02.md`](docs/etapa-02.md) — telas, componentes reutilizáveis, entrada de dados, adaptação a tamanhos de tela e decisões de interface
- [`docs/etapa-03.md`](docs/etapa-03.md) — estrutura de navegação, feedback visual, Lei de Fitts, acessibilidade e roteiros de teste
- [`docs/etapa-04.md`](docs/etapa-04.md) — persistência local, justificativa técnica, estrutura dos dados, operações CRUD, telas integradas e testes
- [`docs/etapa-05.md`](docs/etapa-05.md) — integração com backend, fluxo de negócio, modo online/offline, decisões técnicas e testes
- [`docs/etapa-06.md`](docs/etapa-06.md) — integração com serviço externo (Open Library API), endpoints, 4 estados de UI e testes
- [`docs/etapa-07.md`](docs/etapa-07.md) — gerenciamento de estado global (PreferenciasContext), tema claro/escuro, recursos nativos (Share API, Permissions, Vibration) e testes
- [Documentação do Expo](https://docs.expo.dev/) · [React Navigation](https://reactnavigation.org/docs/getting-started)

## Autor

Fernão Queiroz Ferreira — Ciência da Computação, PUC Goiás.
