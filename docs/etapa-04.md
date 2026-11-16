# Etapa 4 — Persistência Local de Dados

Versão da entrega: tag Git `etapa-04`.

Implementação em:
- `src/services/storage.js` — serviço de persistência assíncrona com AsyncStorage;
- `src/context/DadosContext.js` — integração do ciclo de vida, hidratação inicial, operações CRUD e sincronização de dados;
- `src/screens/PainelScreen.js` — indicador de status de persistência e restauração de dados;
- `test/persistencia.test.mjs` e `test/crud-context.test.mjs` — suíte de testes automatizados de persistência e integridade relacional.

---

## 1. Mecanismo de persistência utilizado

Para a implementação do armazenamento local no EduPlataforma Mobile, foi adotada a biblioteca:

**`@react-native-async-storage/async-storage` (versão 2.2.0)**

O AsyncStorage é um sistema assíncrono, não criptografado e global de armazenamento chave-valor (Key-Value) mantido oficialmente pela comunidade React Native e recomendado pela equipe do Expo.

### Camadas de armazenamento por plataforma

| Plataforma | Implementação de baixo nível |
|---|---|
| **Android** | Banco de dados relacional **SQLite** nativo |
| **iOS** | Armazenamento de arquivos serializados no sandbox do aplicativo (`Documents/`) ou SQLite |
| **Web / Expo Web** | `window.localStorage` / IndexedDB do navegador |

---

## 2. Justificativa da escolha

A seleção do AsyncStorage como mecanismo de persistência baseou-se nos seguintes critérios técnicos e arquiteturais:

1. **Compatibilidade nativa com Expo SDK 57**: O pacote possui suporte de primeira classe no Expo (`bundledNativeModules.json`), garantindo funcionamento transparente sem necessidade de compilação de código nativo ou ejeção do Expo Go.
2. **Aderência ao modelo de dados do domínio**: A aplicação web de origem consome endpoints REST que retornam recursos em JSON. No AsyncStorage, as coleções são persistidas como documentos JSON estruturados, preservando exatamente o mesmo contrato de dados e facilitando a futura sincronização com backend remoto.
3. **Desacoplamento e simplicidade operacional**: Bancos de dados relacionais completos (como SQLite puro com SQL raw) introduziriam overhead desnecessário de migrações DDL e mapeamento objeto-relacional para um aplicativo cujo volume de dados analíticos e transacionais cabe confortavelmente na memória e no cache local.
4. **Desempenho assíncrono**: As chamadas de I/O em disco são assíncronas e não bloqueiam a thread principal de renderização de interface (UI Thread), mantendo a taxa de quadros (60/120 FPS) constante.
5. **Multiplataforma**: A mesma camada de armazenamento funciona no Android, iOS, ambiente web e no runner de testes automatizados com mocks de memória.

---

## 3. Estrutura dos dados armazenados

Os dados são particionados em coleções independentes sob o namespace `@eduplataforma:`. Esse padrão evita colisões de chaves e permite atualizações pontuais por entidade.

### 3.1 Chaves de armazenamento (`CHAVES_STORAGE`)

| Chave | Entidade | Descrição |
|---|---|---|
| `@eduplataforma:categorias` | Categorias | Áreas temáticas do catálogo de cursos |
| `@eduplataforma:usuarios` | Pessoas | Administradores, professores e alunos |
| `@eduplataforma:cursos` | Cursos | Cursos cadastrados com carga horária, preço e status |
| `@eduplataforma:modulos` | Módulos | Divisões pedagógicas vinculadas a um curso |
| `@eduplataforma:aulas` | Aulas | Aulas vinculadas a um módulo |
| `@eduplataforma:matriculas` | Matrículas | Vínculos entre aluno e curso, progresso e certificado |
| `@eduplataforma:planos` | Planos | Modalidades de assinatura da plataforma |
| `@eduplataforma:assinaturas` | Assinaturas | Contratos de alunos em planos |
| `@eduplataforma:pagamentos` | Pagamentos | Lançamentos financeiros e status de cobrança |
| `@eduplataforma:inicializado` | Metadados | Flag ISO com timestamp da primeira carga de dados |

### 3.2 Esquema dos registros serializados em JSON

#### Categorias (`@eduplataforma:categorias`)
```json
[
  {
    "id": "cat-1",
    "nome": "Programação",
    "descricao": "Lógica, linguagens e engenharia de software"
  }
]
```

#### Usuários / Pessoas (`@eduplataforma:usuarios`)
```json
[
  {
    "id": "usr-1",
    "nome": "Ana Ribeiro",
    "email": "ana.ribeiro@exemplo.com",
    "perfil": "Professor"
  }
]
```

#### Cursos (`@eduplataforma:cursos`)
```json
[
  {
    "id": "cur-1",
    "titulo": "React Native do zero",
    "descricao": "Construção de aplicativos móveis multiplataforma com Expo.",
    "categoriaId": "cat-1",
    "professorId": "usr-1",
    "cargaHoraria": 40,
    "preco": 249.9,
    "publicado": true
  }
]
```

#### Módulos (`@eduplataforma:modulos`) e Aulas (`@eduplataforma:aulas`)
```json
// Módulos
[
  {
    "id": "mod-1",
    "cursoId": "cur-1",
    "titulo": "Preparando o ambiente",
    "ordem": 1
  }
]

// Aulas
[
  {
    "id": "aul-1",
    "moduloId": "mod-1",
    "titulo": "Instalando o Expo",
    "duracaoMin": 12,
    "ordem": 1
  }
]
```

#### Matrículas (`@eduplataforma:matriculas`)
```json
[
  {
    "id": "mat-1",
    "cursoId": "cur-1",
    "alunoId": "usr-3",
    "data": "2026-03-02",
    "concluida": true,
    "certificadoEmitido": true
  }
]
```

#### Assinaturas e Pagamentos (`@eduplataforma:assinaturas`, `@eduplataforma:pagamentos`)
```json
// Assinatura
{
  "id": "ass-1",
  "planoId": "pln-1",
  "alunoId": "usr-3",
  "ativa": true,
  "inicio": "2026-03-01"
}

// Pagamento
{
  "id": "pag-1",
  "assinaturaId": "ass-1",
  "valor": 49.9,
  "data": "2026-09-01",
  "status": "Pago"
}
```

---

## 4. Descrição das operações implementadas

O acesso a dados e as operações de mutação foram estruturados na fábrica genérica `criarCrud` e em métodos especializados dentro de `src/context/DadosContext.js`, orquestrados por `src/services/storage.js`:

### 4.1 Carga inicial e hidratação (`carregarTodosOsDados`)
- Na montagem do `DadosProvider`, a aplicação verifica se a chave `@eduplataforma:inicializado` existe.
- **Primeira execução (aplicativo recém-instalado):** persiste a massa inicial de dados de demonstração (`src/data/seed.js`) em lote no AsyncStorage e registra o timestamp de inicialização.
- **Execuções subsequentes:** lê as coleções existentes no AsyncStorage. Caso o usuário tenha excluído, adicionado ou alterado qualquer item, o estado persistido é restaurado integralmente.
- **Resiliência:** caso ocorra erro na desserialização de alguma chave, adota fallback automático para os dados padrão em memória, impedindo falhas na renderização.

### 4.2 Criação de dados (Create)
- Operação: `crud[Entidade].criar(dados)`.
- Gera um identificador único contendo prefixo, timestamp e contador sequencial (`novoId`).
- Atualiza o estado do React imediatamente para resposta instantânea da interface.
- Serializa e grava a coleção atualizada no AsyncStorage de maneira assíncrona (`salvarColecao`).

### 4.3 Leitura e recuperação (Read)
- Operação: consultas síncronas derivadas via hooks `useDados()`.
- Exemplos: `categoriaPorId`, `cursoPorId`, `usuarioPorId`, `cursosDaCategoria`, `modulosDoCurso`, `aulasDoModulo`, `matriculasDoCurso`, `receitaConfirmada`, `receitaPendente`.
- Todas as listagens, filtros de busca, seletores e somatórios de métricas refletem os dados lidos do armazenamento.

### 4.4 Atualização de dados (Update)
- Operação: `crud[Entidade].atualizar(id, dados)`.
- Mapeia o array local substituindo os atributos do registro correspondente.
- Grava imediatamente a nova coleção no AsyncStorage.
- Utilizado na edição de cursos, categorias, pessoas e módulos.

### 4.5 Remoção de dados (Delete) e integridade referencial
- Operação simples: `crud[Entidade].remover(id)` remove o registro do array e persiste a coleção no AsyncStorage.
- **Validação de integridade referencial antes da exclusão:**
  - Categorias: bloqueadas de exclusão se houver cursos vinculados (`emUso > 0`), instruindo o usuário.
  - Pessoas: bloqueadas de exclusão se forem responsáveis por cursos ativos ou tiverem matrículas registradas.
- **Exclusão em cascata:**
  - `removerCurso(id)`: remove o curso em `cursos`, todos os módulos relacionados em `modulos`, todas as aulas desses módulos em `aulas`, e todas as matrículas do curso em `matriculas`. Todas as 4 coleções são atualizadas no estado e persistidas no AsyncStorage.
  - `removerModulo(id)`: remove o módulo e todas as suas aulas filhas em cascata no armazenamento.

### 4.6 Regras de negócio especializadas
- `alternarConclusao(matriculaId)`: inverte o status de conclusão e persiste. Desfazer uma conclusão invalida automaticamente o certificado emitido.
- `emitirCertificado(matriculaId)`: atualiza o atributo `certificadoEmitido: true` e grava a alteração no armazenamento.
- `alternarAssinatura(assinaturaId)`: altera entre `ativa: true` e `ativa: false` e persiste.
- `registrarPagamento(pagamentoId)`: atualiza status de pendente para `'Pago'` e grava no armazenamento.
- `restaurarPadroes()`: utilitário para restaurar as coleções locais para os valores originais do seed, persistindo no AsyncStorage.

---

## 5. Telas que utilizam os dados persistidos

Todas as **13 telas** da aplicação consomem os dados através do `DadosContext`, operando sobre o armazenamento persistente:

| # | Tela | Como consome a persistência |
|---|---|---|
| 1 | **Painel** (`PainelScreen.js`) | Métricas em tempo real de cursos, conclusões, pessoas e receita calculadas sobre os dados locais; exibe status da persistência e botão para restauração de dados. |
| 2 | **Cursos** (`CursosScreen.js`) | Listagem dinâmica dos cursos persistidos com busca em tempo real e filtros por categoria; exclusão em cascata com persistência. |
| 3 | **Curso — Detalhe** (`CursoDetalheScreen.js`) | Apresenta dados do curso persistido, professor responsável, módulos e matrículas associadas. |
| 4 | **Curso — Formulário** (`CursoFormScreen.js`) | Criação e edição persistente de cursos (título, descrição, carga horária, preço, professor, categoria, status de publicação). |
| 5 | **Módulos e Aulas** (`ModulosScreen.js`) | Criação, edição e exclusão de módulos e aulas no acordeão com persistência de hierarquia e ordenação. |
| 6 | **Categorias** (`CategoriasScreen.js`) | Listagem de categorias persistidas com contagem de cursos vinculados e exclusão controlada. |
| 7 | **Categoria — Formulário** (`CategoriaFormScreen.js`) | Criação e edição de categorias salvas no AsyncStorage com validação de duplicidade. |
| 8 | **Pessoas** (`UsuariosScreen.js`) | Listagem de administradores, professores e alunos persistidos com filtro por perfil e exclusão protegida. |
| 9 | **Pessoa — Formulário** (`UsuarioFormScreen.js`) | Cadastro e edição de usuários gravados no armazenamento local. |
| 10 | **Matrículas** (`MatriculasScreen.js`) | Listagem persistida com filtros de status (em andamento, concluídas, a certificar); alternância de conclusão salva no disco. |
| 11 | **Matrícula — Formulário** (`MatriculaFormScreen.js`) | Registro de novas matrículas vinculando aluno e curso persistidos no dispositivo. |
| 12 | **Certificado** (`CertificadoScreen.js`) | Visualização e confirmação de emissão do certificado, alterando estado persistido da matrícula. |
| 13 | **Financeiro** (`FinanceiroScreen.js`) | Resumo financeiro derivado, controle de status de assinaturas e registro de pagamentos persistidos. |

---

## 6. Instruções para execução e teste

### 6.1 Pré-requisitos
- Node.js 18 ou superior instalado.
- Dispositivo físico com o aplicativo **Expo Go**, emulador Android/iOS configurado ou navegador para execução Web.

### 6.2 Execução da aplicação
Acesse a pasta da aplicação e inicie o servidor Metro do Expo:

```bash
cd my-app
npm start
```

Opções de visualização:
- Pressione `a` para abrir no emulador Android.
- Pressione `i` para abrir no simulador iOS.
- Pressione `w` para abrir no navegador web.
- Ou escaneie o QR Code exibido no terminal utilizando o app **Expo Go** no seu celular.

### 6.3 Execução da suíte de testes automatizados
Para executar a suíte completa de testes unitários e de integração de persistência:

```bash
cd my-app
npm test
```

A suíte executará 14 testes cobrindo:
- Inicialização de seed no AsyncStorage;
- Operações de CRUD (Criação, Leitura, Atualização, Exclusão);
- Remoções em cascata entre entidades dependentes;
- Regras de negócio (conclusão, certificação, pagamentos, assinaturas);
- Simulação de ciclo de vida completo (fechamento e reabertura do app);
- Restauração de dados e integridade relacional.

---

## 7. Procedimento para verificar a persistência após fechar e reabrir a aplicação

Para constatar que os dados persistem no dispositivo entre sessões, siga o roteiro passo a passo:

### Roteiro de verificação manual

1. **Abra o aplicativo:**
   - Observe a tela **Painel**. O cartão "Persistência local" exibe o status "Ativo" e os totais de itens salvos.

2. **Crie um novo registro:**
   - Acesse a aba **Cursos** e toque no botão flutuante **"Novo curso"**.
   - Preencha:
     - Título: `Curso de Teste de Persistência`
     - Categoria: `Programação`
     - Professor: `Ana Ribeiro`
     - Carga horária: `50`
     - Preço: `199`
     - Marque a opção `Publicar curso no catálogo`.
   - Toque em **"Cadastrar curso"**.
   - Observe o aviso de confirmação e verifique o novo curso listado na aba **Cursos** e contabilizado no **Painel**.

3. **Edite um registro existente:**
   - Na aba **Pessoas**, edite o aluno `Carla Menezes` alterando seu nome para `Carla Menezes (Persistida)`.
   - Salve a alteração.

4. **Remova um registro:**
   - Acesse a aba **Cursos** e abra **Categorias** (cabeçalho superior direito).
   - Toque em **"Nova categoria"**, crie a categoria `Temporária` e salve.
   - Na lista de categorias, exclua a categoria `Temporária` recém-criada.

5. **Execute operações de negócio:**
   - Na aba **Matrículas**, localize uma matrícula em andamento e toque no botão **"Concluir curso"**.
   - Toque em **"Emitir certificado"** e emita o certificado.

6. **Feche completamente o aplicativo (Reinício):**
   - No celular ou emulador, acesse o gerenciador de aplicativos recentes do sistema operacional e deslize o app para fechar / forçar encerramento.
   - Se estiver rodando no terminal com Expo (`npx expo start`), você pode pressionar `Ctrl + C` para parar o servidor e executá-lo novamente com `npm start`, ou pressionar `r` para recarregar o bundle JS.

7. **Reabra a aplicação:**
   - O aplicativo exibirá brevemente a tela de carregamento local e abrirá o **Painel**.
   - **Verificações:**
     - O `Curso de Teste de Persistência` continua listado em **Cursos** e computado nas métricas do **Painel**.
     - O nome `Carla Menezes (Persistida)` continua salvo na aba **Pessoas**.
     - A categoria `Temporária` excluída não reaparece.
     - A matrícula concluída permanece com status "Concluído" e "Certificado emitido".

8. **Restauração opcional:**
   - Caso queira redefinir o banco de dados local para os dados iniciais de demonstração, vá ao **Painel**, role até **Persistência local** e toque em **"Restaurar dados de exemplo"**, confirmando a ação no diálogo.
