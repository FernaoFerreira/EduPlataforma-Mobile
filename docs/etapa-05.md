# Etapa 05 — Primeira Versão Funcional da Aplicação com Backend

## 1. Descrição do fluxo completo de negócio implementado

A aplicação EduPlataforma Mobile integra o frontend React Native/Expo com um
backend JSON Server, permitindo o fluxo CRUD completo de **Cursos** como
operação de negócio principal:

**Fluxo: Criar → Visualizar → Alterar → Excluir**

1. O administrador acessa a tela **Painel** e verifica o status de conexão com o
   servidor (Online/Offline).
2. Na aba **Cursos**, visualiza a lista de cursos carregados do backend (ou do
   cache local, se offline).
3. Toca em **"Novo curso"** para abrir o formulário de cadastro.
4. Preenche os campos obrigatórios (título, categoria, professor, carga
   horária, preço) e cadastra o curso.
5. O curso é salvo no backend via `POST /cursos` **e** no cache local
   (AsyncStorage) simultaneamente.
6. Volta à lista e toca no curso criado para ver os detalhes.
7. Edita o curso alterando título ou preço — a atualização é enviada ao backend
   via `PUT /cursos/:id` e ao AsyncStorage.
8. Exclui o curso — a remoção é propagada em cascata (módulos, aulas e
   matrículas vinculados) tanto no backend quanto localmente.

Outros fluxos disponíveis:
- **Categorias**: Criar → Listar → Editar → Remover.
- **Pessoas (Usuários)**: Cadastrar → Listar → Editar → Remover.
- **Matrículas**: Matricular aluno → Marcar conclusão → Emitir certificado.
- **Financeiro**: Alternar assinatura ativa/cancelada → Registrar pagamento.

## 2. Passo a passo para executar o fluxo

### Pré-requisitos

- Node.js ≥ 18
- Expo CLI (incluído como dependência)
- json-server (instalado como devDependency)

### Iniciar o backend

```bash
cd my-app
npx json-server --watch db.json --port 3000
```

O servidor ficará disponível em `http://localhost:3000` com endpoints REST para
todas as coleções.

### Iniciar o frontend

Em outro terminal:

```bash
cd my-app
npx expo start
```

Escolha a plataforma desejada (Android, iOS ou Web).

> **Nota para emulador Android**: o app já está configurado para acessar
> `http://10.0.2.2:3000` automaticamente, que é o endereço que redireciona para
> o `localhost` do host no emulador Android.

### Executar o fluxo de teste

1. Abra o app e observe o **Painel** — o cartão "Conexão e dados" deve exibir
   **Online** com etiqueta verde.
2. Navegue para **Cursos** e toque em **"Novo curso"**.
3. Preencha:
   - Título: "Teste de Integração"
   - Categoria: "Programação"
   - Professor: "Ana Ribeiro"
   - Carga horária: 20
   - Preço: 99,90
4. Toque em **"Cadastrar curso"**.
5. Verifique que o curso aparece na lista.
6. No terminal do json-server, verifique que o `db.json` foi atualizado com o
   novo curso.
7. Toque no curso criado → **Detalhes** → **Editar**.
8. Altere o preço para 149,90 e salve.
9. Na lista de cursos, exclua o curso criado.
10. Confirme que o curso e dados vinculados foram removidos do `db.json`.

### Teste offline

1. Pare o json-server (`Ctrl+C`).
2. No app, toque em **"Sincronizar com servidor"** — deve exibir mensagem de
   falha e o status muda para **Offline**.
3. Crie, edite ou exclua um curso — as operações funcionam localmente.
4. Feche e reabra o app — os dados locais permanecem.
5. Reinicie o json-server — na próxima verificação periódica (30s) ou ao tocar
   "Sincronizar", o status volta para **Online**.

## 3. Funcionalidades integradas nesta etapa

| Funcionalidade | Descrição |
|---|---|
| **Serviço de API** (`api.js`) | Cliente HTTP com `fetch`, timeout, CRUD genérico, detecção de plataforma |
| **Integração backend** | DadosContext tenta carregar do JSON Server na inicialização |
| **Fallback offline** | Se o backend estiver indisponível, usa AsyncStorage (Etapa 04) |
| **Escrita dual** | Operações de escrita são enviadas ao backend E salvas localmente |
| **Status de conexão** | Estado `online` verificado periodicamente (30s) e exibido no Painel |
| **Sincronização manual** | Botão "Sincronizar com servidor" no Painel |
| **Indicador de fonte** | Mostra se os dados vieram do "Servidor" ou "Armazenamento local" |
| **db.json** | Base de dados JSON Server com 9 coleções e dados idênticos ao seed |
| **db.original.json** | Cópia de segurança para restauração do banco |

## 4. Tratamento de entradas inválidas

Todas as validações implementadas nas etapas anteriores continuam ativas:

- **Formulário de Curso**: título obrigatório (mín. 3 caracteres), categoria,
  professor, carga horária (> 0), preço (≥ 0).
- **Formulário de Categoria**: nome obrigatório, verificação de duplicata.
- **Formulário de Usuário**: nome obrigatório, e-mail válido (regex), detecção
  de e-mail duplicado.
- **Formulário de Matrícula**: curso e aluno obrigatórios.
- **Erros de rede**: capturados silenciosamente nas operações de escrita (o dado
  é mantido localmente mesmo que o envio ao backend falhe).

## 5. Mecanismos de feedback utilizados

| Feedback | Implementação |
|---|---|
| Toast de confirmação | `FeedbackContext` exibe barra animada (sucesso, erro, info) |
| Cartão de status | Painel mostra "Online"/"Offline" com etiqueta colorida |
| Fonte de dados | Texto indicando se dados vieram do servidor ou do local |
| Carregando | Tela de loading "Conectando ao servidor..." na inicialização |
| Confirmação destrutiva | `Alert.alert` com botões Cancelar/Restaurar antes de apagar dados |
| Sincronização | Mensagens "Sincronizando...", "Dados sincronizados" ou "Falha ao sincronizar" |

## 6. Principais decisões técnicas

### 6.1 Escolha do JSON Server

O JSON Server (v0.17.3) foi escolhido como backend por:
- Compatibilidade com o projeto web de referência (eduplataforma-react).
- API REST completa sem necessidade de programação de rotas.
- Persistência em arquivo JSON com hot-reload.
- Facilidade de instalação (`devDependency`).

### 6.2 Modelo de dados unificado

O `db.json` do projeto mobile utiliza os **mesmos nomes de campos e IDs** do
`seed.js`, evitando a necessidade de camada de mapeamento. Isso mantém a
consistência com a arquitetura existente.

### 6.3 Estratégia offline-first com escrita dual

- **Leitura**: tenta backend primeiro → fallback para AsyncStorage.
- **Escrita**: atualiza o estado React imediatamente, persiste no AsyncStorage,
  e envia ao backend de forma assíncrona (fire-and-forget).
- Erros de rede nas escritas são logados mas não bloqueiam a operação, mantendo
  a aplicação funcional mesmo offline.

### 6.4 Sem dependência de `Platform` nos testes

O serviço `api.js` detecta a plataforma via `require('react-native')` dinâmico
com fallback para `localhost`, permitindo que os testes automatizados executem
em Node.js puro sem necessidade do ambiente React Native.

### 6.5 Verificação periódica de conectividade

O DadosContext verifica a conexão com o backend a cada 30 segundos usando um
`GET` leve na raiz do JSON Server, atualizando o estado `online` que a UI
consome.

## 7. Instruções para execução e teste

### Executar testes automatizados

```bash
cd my-app
node test/runner.mjs
```

**26 testes** distribuídos em 3 suítes:

| Suíte | Testes | Escopo |
|---|---|---|
| Persistência Local (Etapa 04) | 10 | AsyncStorage, CRUD, cascata, ciclo de vida |
| Operações de Domínio | 4 | Contexto, consultas, regras de negócio |
| Serviço de API (Etapa 05) | 12 | db.json, integridade, CRUD HTTP, conexão |

### Executar integração completa

1. Terminal 1: `cd my-app && npx json-server --watch db.json --port 3000`
2. Terminal 2: `cd my-app && npx expo start`
3. Executar o fluxo descrito na seção 2.

### Restaurar base de dados

Se o `db.json` for corrompido ou estiver em estado indesejado:

```bash
cd my-app
cp db.original.json db.json
```

Ou use o script:

```bash
npm run server:reset
```

## 8. Estrutura dos arquivos criados ou modificados

### Arquivos criados (Etapa 05)

| Arquivo | Descrição |
|---|---|
| `my-app/db.json` | Base de dados do JSON Server (9 coleções) |
| `my-app/db.original.json` | Cópia de segurança do banco inicial |
| `my-app/src/services/api.js` | Cliente HTTP REST com CRUD genérico |
| `my-app/test/api.test.mjs` | 12 testes do serviço de API |
| `docs/etapa-05.md` | Esta documentação |

### Arquivos modificados (Etapa 05)

| Arquivo | Alteração |
|---|---|
| `my-app/src/context/DadosContext.js` | Integração com backend, estado online, sincronização |
| `my-app/src/screens/PainelScreen.js` | Cartão de status do backend, botão de sincronização |
| `my-app/package.json` | Scripts `server` e `server:reset`, devDependency `json-server` |
| `my-app/test/runner.mjs` | Inclusão do arquivo `api.test.mjs` |
| `README.md` | Atualização para Etapa 05 |
