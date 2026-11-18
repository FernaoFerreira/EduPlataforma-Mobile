# Etapa 06 — Integração com API ou Serviço Externo

## 1. Identificação da API e Justificativa da Escolha

### Serviço Escolhido
- **Serviço**: **Open Library Search API** (iniciativa da *Internet Archive*)
- **Natureza**: API REST pública, aberta e sem restrições de autenticação ou chaves privadas.
- **Base URL**: `https://openlibrary.org`

### Justificativa da Escolha
1. **Relevância e utilidade contextual**: O **EduPlataforma Mobile** é um aplicativo de gestão EAD. Para enriquecer o catálogo pedagógico dos cursos cadastrados (ex.: *React Native do zero*, *Banco de dados relacional*, *Fundamentos de interface*), alunos e instrutores necessitam de **bibliografia complementar e literatura de referência**. A Open Library fornece acesso a milhões de obras publicadas em todo o mundo.
2. **Integração orgânica ao fluxo existente**: Em vez de uma funcionalidade desconectada, a consulta externa foi acoplada diretamente à tela de detalhes do curso (`CursoDetalheScreen.js`), permitindo buscar, visualizar e acessar obras teóricas relacionadas ao tema do curso ou de sua categoria.
3. **Disponibilidade e facilidade de integração**: API estável, sem necessidade de chaves de API secretas no repositório, com resposta rápida em formato JSON e suporte a filtros por título, assunto e limite de registros.
4. **Respeito à arquitetura**: Implementada através de um serviço isolado em `src/services/livrosApi.js`, consumindo a API nativa `fetch` com controle de timeout e abort signal, sem adição de dependências pesadas de terceiros.

---

## 2. Endpoints e Métodos HTTP

### Consulta de Livros por Palavra-Chave / Tema
- **Endpoint**: `/search.json`
- **URL Completa**: `https://openlibrary.org/search.json?q={termo}&limit={limite}`
- **Método HTTP**: `GET`
- **Cabeçalhos da Requisição**:
  - `Accept: application/json`

---

## 3. Estrutura dos Dados Enviados e Recebidos

### Parâmetros da Requisição (Query String)
| Parâmetro | Tipo | Obrigatório | Descrição | Exemplo |
|---|---|---|---|---|
| `q` | string | Sim | Termo de pesquisa (título, assunto, autor) | `React Native` |
| `limit` | integer | Não | Quantidade máxima de resultados (padrão: 4 a 5) | `4` |

### Estrutura dos Dados Recebidos (Resposta Bruta da Open Library)
```json
{
  "numFound": 54,
  "start": 0,
  "numFoundExact": true,
  "docs": [
    {
      "key": "/works/OL19827672W",
      "title": "Fullstack React Native",
      "author_name": ["Houssein Djirdeh", "Anthony Accomazzo", "Sophia Shoemaker"],
      "first_publish_year": 2019,
      "edition_count": 3,
      "isbn": ["9781987527834"],
      "cover_i": 8234567
    }
  ]
}
```

### Estrutura dos Dados Formatados na Aplicação (`formatarLivro`)
```javascript
{
  id: "/works/OL19827672W",
  chave: "/works/OL19827672W",
  titulo: "Fullstack React Native",
  autores: ["Houssein Djirdeh", "Anthony Accomazzo", "Sophia Shoemaker"],
  autoresTexto: "Houssein Djirdeh, Anthony Accomazzo, Sophia Shoemaker",
  anoPublicacao: 2019,
  edicoes: 3,
  isbn: "9781987527834",
  capaUrl: "https://covers.openlibrary.org/b/id/8234567-M.jpg",
  linkUrl: "https://openlibrary.org/works/OL19827672W"
}
```

---

## 4. Descrição do Fluxo de Comunicação

```
┌────────────────────────┐
│  CursoDetalheScreen    │
└───────────┬────────────┘
            │ 1. Abre tela com o curso (ex: "React Native do zero")
            │ 2. Extrai termo sugerido ("React Native")
            ▼
┌────────────────────────┐       HTTP GET /search.json?q=React+Native&limit=4
│  livrosApi.js          │ ───────────────────────────────────────────────────► ┌──────────────────────┐
│  (buscarLivrosPorTermo)│                                                      │  Open Library API    │
└───────────▲────────────┘ ◄─────────────────────────────────────────────────── └──────────────────────┘
            │                   JSON com { numFound, docs: [...] }
            │ 3. Normaliza e trata os dados (formatarLivro)
            ▼
┌────────────────────────┐
│  CursoDetalheScreen    │
│  (Renderiza 1 dos 4    │
│   estados de UI)       │
└────────────────────────┘
```

1. O usuário acessa a tela de detalhes de qualquer curso no catálogo.
2. A aplicação pré-seleciona um termo de busca relevante baseado no título do curso (ou o usuário pode digitar qualquer outro tópico no campo de texto).
3. A requisição HTTP GET é enviada para a Open Library através da função `buscarLivrosPorTermo(termo, limite)`.
4. Os dados recebidos são normalizados por `formatarLivro()`, tratando autores ausentes, anos nulos e URLs da obra.
5. A interface reage dinamicamente, apresentando o estado correspondente ao usuário.
6. Ao tocar em qualquer obra encontrada, o aplicativo permite abrir a página oficial da obra na Open Library via `Linking.openURL`.

---

## 5. Tratamento dos Quatro Estados de Comunicação

O componente `CursoDetalheScreen.js` implementa tratamento visual e acessível para todos os estados exigidos:

### 1. Estado de Carregamento (Loading)
- **Quando ocorre**: Durante a emissão da requisição HTTP e espera pela resposta.
- **Representação na interface**: Contêiner visual com `ActivityIndicator` animado na cor primária e texto explicativo:
  > *"Consultando acervo da Open Library para '{termo}'..."*
- **Acessibilidade**: Atributos `accessibilityRole="progressbar"` e `accessibilityLabel`.

### 2. Estado de Sucesso (Success)
- **Quando ocorre**: A resposta HTTP é 200 OK e a lista de documentos contém pelo menos uma obra.
- **Representação na interface**:
  - Mensagem informativa com contagem de obras encontradas (*"Exibindo 4 principais de 54 referências encontradas"*).
  - Cartões estilizados (`Cartao`) com faixa na cor primária, contendo título em destaque, lista de autores, ano da 1ª publicação, etiqueta com total de edições, ISBN e atalho para abrir o link oficial.
- **Acessibilidade**: Elementos com `accessibilityRole="button"`, labels descritivos e dica de ação.

### 3. Estado de Ausência de Dados (Empty Data)
- **Quando ocorre**: A consulta HTTP é concluída com sucesso, mas `docs` é um array vazio (`numFound: 0`).
- **Representação na interface**: Componente `EstadoVazio` com borda tracejada:
  > **Título**: *"Nenhuma obra encontrada"*
  > **Descrição**: *"A Open Library não retornou obras para o termo '{termo}'. Tente pesquisar por palavras-chave mais gerais."*
  > **Ação sugerida**: Botão para buscar pelo nome da categoria associada ao curso (ex: *"Buscar por 'Programação'"*).

### 4. Estado de Erro (Error)
- **Quando ocorre**: Falha de conexão de rede, erro HTTP (ex.: 500, 503, 404), servidor fora do ar ou estouro de timeout (10 segundos).
- **Representação na interface**:
  - Cartão com faixa vermelha de erro (`faixa={cores.erro}`).
  - Etiqueta com tom de erro (*"Falha de conexão externa"*).
  - Mensagem clara do motivo da falha (*"Falha na comunicação com o serviço externo da Open Library. Verifique sua conexão."*).
  - Botão de recuperação: *"Tentar novamente"*, permitindo nova tentativa sem sair da tela.

---

## 6. Instruções para Execução e Teste

### Testes Automatizados Unitários e de Integração

O projeto possui **36 testes automatizados** cobrindo todas as etapas, incluindo 10 testes dedicados especificamente à Etapa 06:

```bash
cd my-app
node test/runner.mjs
```

Os testes de `my-app/test/livrosApi.test.mjs` cobrem:
1. Configuração e integridade de URL base.
2. Normalização e fallbacks de dados de livros (`formatarLivro`).
3. Validação de termo de busca em branco.
4. **Estado de Sucesso**: Mock de resposta com múltiplos livros.
5. **Estado de Ausência de Dados**: Mock de retorno vazio (`docs: []`).
6. **Estado de Erro HTTP**: Mock de respostas com status não-OK (ex.: 503 Service Unavailable).
7. **Estado de Erro de Rede**: Simulação de queda de conexão.
8. **Estado de Erro de Timeout**: Simulação de cancelamento por timeout com `AbortController`.
9. **Comunicação Real (Live HTTP GET)**: Chamada de rede em tempo real à API da Open Library para validação fim a fim.

### Teste Manual na Aplicação Mobile

1. Inicie o backend local e o app Expo:
   ```bash
   cd my-app
   npm run server    # em um terminal (JSON Server na porta 3000)
   npx expo start    # em outro terminal
   ```
2. Abra o aplicativo no dispositivo ou emulador.
3. Na aba **Cursos**, selecione um curso (ex.: *"React Native do zero"*).
4. Na tela de detalhes, role até a seção **"Bibliografia e referências recomendadas"**.
5. Observe o estado de **Carregamento** transitando para **Sucesso**, listando as referências encontradas.
6. Teste uma pesquisa manual: digite um termo no campo de texto (ex.: *"TypeScript"*) e toque em **"Buscar referências"**.
7. Teste a **Ausência de dados**: digite um termo aleatório improvável (ex.: *"xyz987inexistente"*) e observe o componente de estado vazio com a opção de buscar por categoria.
8. Teste a **Simulação de Erro**: desative temporariamente a conexão com a internet (modo avião) e toque em **"Buscar referências"**; observe o cartão de erro e utilize o botão **"Tentar novamente"** após restabelecer a conexão.

---

## 7. Configuração do Serviço

- A Open Library é um serviço gratuito mantido pela comunidade e pelo Internet Archive.
- **Nenhuma chave secreta (API Key), token de autorização ou credencial privada é requerida**.
- As URLs e endpoints utilizam HTTPS padrão.
