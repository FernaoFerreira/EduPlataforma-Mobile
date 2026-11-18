# Etapa 07 — Gerenciamento de Estado Global e Recursos do Dispositivo

## 1. Gerenciamento de Estado Global

### Estado Global Implementado
O estado global implementado na aplicação foi estruturado através do **`PreferenciasContext`** (`src/context/PreferenciasContext.js`), com persistência local no dispositivo via AsyncStorage sob a chave `@eduplataforma:preferencias`.

O estado compartilhado gerencia:
1. **`tema`** (`'claro'` | `'escuro'`):
   - Define a paleta de cores ativa da aplicação (Modo Claro vs Modo Escuro com alto contraste WCAG 2.1 AA).
   - Controla tokens semânticos (`papel`, `fundo`, `tinta`, `textoSecundario`, `borda`, `primaria`, `acento`, etc.).
   - Controla o estilo dinâmico da barra de status nativa (`StatusBar`).
2. **`coresTema`**:
   - Objeto de cores calculado dinamicamente via `obterCores(tema)`, exportado por `src/theme/index.js`.
3. **`exibirBibliografia`** (`boolean`):
   - Flag global que determina se os componentes e telas devem exibir a seção de consulta externa à Open Library API em detalhes de cursos.
4. **`alunoAtivoId`** (`string | null`):
   - Identificador do usuário com perfil de "Aluno" selecionado na sessão ativa, permitindo filtrar e destacar matrículas, emissão de certificados e progresso pedagógico entre múltiplas telas.
5. **`notificacoesHabilitadas`** (`boolean`):
   - Preferência do usuário sobre recebimento de avisos e notificações operacionais.

### Justificativa da Escolha do Estado Global
- **Escopo Transversal**: O tema visual (claro/escuro) e a seleção do aluno ativo não pertencem ao ciclo de vida de uma única tela. Eles afetam simultaneamente o contêiner raiz (`Tela.js`), superfícies de cartões (`Cartao.js`), barra de status (`StatusBar`), cabeçalhos e telas periféricas (`PainelScreen`, `CertificadoScreen`, `CursoDetalheScreen`).
- **Consistência e Eliminação de Redundância**: Centralizar as preferências evita duplicação de chamadas a `AsyncStorage.getItem` e impede inconsistências visuais em que uma tela renderiza com fundo claro enquanto outra renderiza com fundo escuro.
- **Controle de Funcionalidades Conectadas**: A preferência `exibirBibliografia` permite ao usuário desligar o consumo de dados de rede externa, impactando imediatamente o comportamento da `CursoDetalheScreen` sem necessidade de recarregar o app.

### Mecanismo de Gerenciamento Utilizado
- **React Context API** (`createContext`, `useContext`, `useState`, `useMemo`, `useCallback`):
  - Escolhido por ser nativo do ecossistema React, mantendo aderência estrita à regra de evitar dependências externas pesadas (como Redux, Zustand ou MobX) para o porte do projeto.
  - Provê inicialização assíncrona (`useEffect`) com carregamento de valores persistidos em `AsyncStorage` (`carregarPreferencias()`).
  - Atualização com persistência automática a cada mutação (`salvarPreferencias()`).
  - Hook customizado `usePreferencias()` com fallbacks seguros para execução em ambientes isolados ou testes unitários.

### Telas e Componentes Integrados ao Estado Global
1. **`App.js`**:
   - Envolve toda a árvore de navegação com `<PreferenciasProvider>`.
   - Adapta dinamicamente o `<StatusBar style={tema === 'escuro' ? 'light' : 'dark'} />`.
2. **`PainelScreen.js`**:
   - Seção interativa *"Preferências globais (Estado compartilhado)"*.
   - Botão para alternar entre Tema Claro e Modo Escuro.
   - Botão para ativar/desativar a consulta externa à Open Library nos cursos.
   - Seletor de *Aluno ativo na sessão*, sincronizando o perfil em uso com o restante do aplicativo.
3. **`Tela.js`**:
   - Consome `usePreferencias()` e aplica dinamicamente a cor de fundo do tema (`coresTema.fundo`).
4. **`Cartao.js`**:
   - Adapta as superfícies de cartões e estados vazios para as cores de superfície (`coresTema.papel`) e bordas (`coresTema.borda`).
5. **`CursoDetalheScreen.js`**:
   - Observa `exibirBibliografia`: se desativada globalmente, omite a requisição automática à API externa e apresenta cartão informativo indicando que o recurso foi ocultado pelas preferências do usuário, com atalho para reativá-lo.
6. **`CertificadoScreen.js`**:
   - Observa `alunoAtivoId`: caso a matrícula pertença ao aluno selecionado no Painel, exibe destaque visual com etiqueta semântica de confirmação.

---

## 2. Integração com Recursos Nativos do Dispositivo

### Recursos Nativos Escolhidos
A aplicação integra **três recursos nativos essenciais** do ecossistema móvel através do serviço unificado `src/services/dispositivo.js`:
1. **Compartilhamento Nativo do Sistema Operacional (`Share API`)**:
   - Permite compartilhar o certificado oficial de conclusão de curso e a ementa de cursos com outros aplicativos instalados no dispositivo (WhatsApp, E-mail, Telegram, Mensagens, Copiar para área de transferência).
2. **Gerenciamento de Permissões Nativas (`PermissionsAndroid` / Platform)**:
   - Solicitação e checagem de autorizações de gravação de arquivos/armazenamento e notificações no sistema operacional.
3. **Feedback Tátil / Háptico Nativo (`Vibration API`)**:
   - Emissão de vibração háptica curta de confirmação no motor de vibração do aparelho ao emitir certificados, sincronizar dados ou exportar documentos.
4. **Sistema de Arquivos Local (Exportação Persistente de Documentos)**:
   - Geração de registro digital de certificados com identificador único e hash de autenticidade SHA-256 salvo localmente.

### Justificativa da Escolha dos Recursos
- **Relevância Real ao Domínio EAD**: Em uma plataforma de capacitação, a emissão de um certificado é o momento culminante da jornada do aluno. O aluno precisa poder **enviar o comprovante para seu empregador ou redes sociais** via compartilhador nativo do celular e **guardar uma via do documento na memória do dispositivo**.
- **Acessibilidade e Feedback Sensorial**: O feedback háptico (vibração nativa) confirma ao usuário que operações críticas (como sincronização e exportação) foram executadas com sucesso, reforçando a Lei de Fitts e as heurísticas de usabilidade para dispositivos móveis.
- **Demonstração Completa de Permissões**: A exportação de arquivos para o dispositivo requer permissão de gravação, permitindo implementar e testar o fluxo de concessão, recusa e bloqueio permanente.

---

## 3. Gerenciamento de Permissões Implementado

O módulo `src/services/dispositivo.js` expõe as funções `verificarPermissao(tipo)` e `solicitarPermissao(tipo, justificativa)` com os seguintes tratamentos:

### Estados de Permissão Tratados
| Status | Condição | Ação do Sistema | Feedback ao Usuário |
|---|---|---|---|
| `granted` | Usuário concedeu acesso ou plataforma dispensa autorização em runtime | Prossegue com a gravação do arquivo e emissão de feedback háptico | Mensagem de sucesso via toast |
| `denied` | Usuário recusou o diálogo de permissão nativo | Operação de gravação é interrompida com segurança; nenhum dado é gravado | Mensagem clara explicando que a permissão é indispensável para salvar o arquivo |
| `never_ask_again` | Usuário marcou "Não perguntar novamente" no diálogo nativo | Operação é bloqueada | Alerta orientando o usuário a habilitar o acesso nas configurações do aparelho |
| `unavailable` | Recurso não suportado no hardware ou SO | Tratamento gracioso sem travamento da aplicação | Mensagem de indisponibilidade com fallback |

---

## 4. Tratamento de Falhas e Indisponibilidade

### Cenários Cobertos
1. **Cancelamento do Compartilhamento**:
   - Quando o usuário abre o menu nativo de compartilhamento e o fecha sem escolher nenhum aplicativo (`Share.dismissedAction`), o app captura o evento e exibe feedback suave (`"Compartilhamento cancelado."`) sem disparar exceção ou tratar como falha.
2. **Falha do Serviço de Compartilhamento do SO**:
   - Tratamento com bloco `try/catch` envolvendo chamadas a `Share.share`. Se o subsistema de compartilhamento falhar ou for bloqueado por política do dispositivo, retorna `{ sucesso: false, erro: ... }` e exibe mensagem amigável no toast.
3. **Ausência de Hardware de Vibração**:
   - Em simuladores, web ou dispositivos sem atuador háptico, a chamada `RN.Vibration.vibrate` é envolvida em bloco protegido. Se falhar ou for ignorada pelo hardware, a aplicação continua funcionando normalmente.
4. **Isolamento de Ambiente e Testes**:
   - As importações de módulos específicos de `react-native` utilizam detecção dinâmica (`require('react-native')` com try/catch).
   - O serviço disponibiliza `setDispositivoBackend()` para injeção de dependência em testes automatizados no Node.js puro, permitindo verificar 100% dos fluxos e regras de negócio sem necessidade de emulador ativo.

---

## 5. Instruções para Execução e Testes

### Execução dos Testes Automatizados
Todos os testes das etapas 04, 05, 06 e 07 são executados pelo Node.js Test Runner:

```bash
cd my-app
node test/runner.mjs
```

### Resultados dos Testes Automatizados
- **Suítes de teste**: 7 suítes
- **Testes executados**: 55 testes (54 aprovados, 1 ignorado para conexão live offline com API externa)
- **Regressão**: Nenhuma regressão detectada; todas as funcionalidades anteriores permanecem ativas e validadas.

### Procedimento para Testar o Gerenciamento de Estado Global no Dispositivo / Emulador
1. Abra o aplicativo com `npx expo start` ou `npm start`.
2. Acesse a aba **Painel**.
3. Na seção *"Preferências globais (Estado compartilhado)"*:
   - Toque no botão **Mudar para Tema Escuro**: observe que a barra de status se adapta para tom claro, o fundo da tela muda para `#0F172A` e as superfícies mudam para `#1E293B`.
   - Navegue por outras abas (Cursos, Pessoas, Matrículas, Financeiro) e confirme que o tema escuro persiste de forma homogênea em todas as telas.
   - Encerre o aplicativo e reabra: verifique que o tema configurado continua ativo (persistência no AsyncStorage).
   - No Painel, toque no seletor **Aluno ativo na sessão** e selecione um aluno (ex.: *Lucas Silva*).
   - Navegue até **Matrículas** e abra um certificado concluído: verifique que a tarja destacando o aluno ativo é exibida.
   - No Painel, toque em **Ocultar referências nos cursos**. Vá até a aba Cursos e abra um curso: confirme que a consulta externa à Open Library foi desativada e substituída pelo cartão de preferência, com botão para reativar.

### Procedimento para Testar os Recursos Nativos
1. **Compartilhamento de Certificado**:
   - Navegue até a aba **Matrículas**.
   - Abra uma matrícula concluída que já tenha certificado emitido (ou emita um novo certificado).
   - Toque em **Compartilhar certificado**:
     - O sistema abrirá a folha de compartilhamento nativa do Android/iOS.
     - Escolha um aplicativo (ex.: WhatsApp, Bloco de Notas ou E-mail) ou feche a folha.
     - Observe a mensagem de feedback emitida pelo aplicativo.
2. **Exportação Local com Permissão e Vibração**:
   - Na tela do certificado, toque em **Salvar no dispositivo**.
   - Se for a primeira vez no Android, o diálogo nativo solicitará a permissão de armazenamento.
   - **Caso Conceda**: o aparelho vibrará por 150ms e o certificado será registrado com comprovante digital e hash SHA-256.
   - **Caso Recuse**: o aplicativo exibirá a mensagem de erro informativa explicando que sem a permissão o arquivo não pôde ser salvo.
3. **Compartilhamento de Curso**:
   - Navegue até a aba **Cursos** e abra qualquer curso.
   - No final da tela, toque em **Compartilhar curso**: a folha nativa é aberta com a ementa, valor e link de matrícula formatados.
4. **Teste Háptico no Painel**:
   - No Painel, toque em **Testar feedback tátil (Vibração)**: o motor de vibração é acionado imediatamente com confirmação em toast.
