# EduPlataforma Mobile

> Porte mobile da **[Plataforma de Cursos Online](https://github.com/FernaoFerreira/Plataforma-de-Cursos-Online)** — desenvolvido como trabalho da disciplina de **Tecnologia de Construção de Software**.

## 📖 Sobre o projeto

A **Plataforma de Cursos Online** (EduPlataforma) é um painel administrativo web para gestão de cursos EAD, construído como uma SPA em **React + Vite**, com React Router para navegação, Axios para consumo de API e JSON Server como backend simulado para os módulos de CRUD. Ele reúne em um único lugar o cadastro de cursos, categorias, módulos/aulas, usuários, matrículas e o controle financeiro da operação.

Este repositório contém o **EduPlataforma Mobile**, uma versão nativa para smartphones do mesmo domínio de problema, construída com **React Native/Expo**. O objetivo acadêmico é aplicar, em um app mobile, os mesmos conceitos de arquitetura, organização de telas e fluxo de dados do projeto web original, avaliando as diferenças de construção de software entre uma aplicação web tradicional e uma aplicação mobile nativa.

## 🎯 Problema que resolve

Instituições de ensino e produtores de curso que administram uma plataforma EAD normalmente dependem de acessar um painel web pelo computador para tarefas simples do dia a dia — checar quantas matrículas entraram, consultar um aluno, ver o resumo financeiro. O **EduPlataforma Mobile** resolve a falta de um canal rápido e portátil para esse acompanhamento, permitindo consultar e gerenciar as informações essenciais da plataforma (cursos, alunos, matrículas, indicadores) diretamente do celular, sem depender de estar em frente a um computador.

## ✅ Funcionalidades previstas

O escopo do app mobile acompanha o que já está implementado no projeto web original, adaptado à navegação mobile:

- **Dashboard** — métricas de cursos, usuários, matrículas e categorias.
- **Categorias** — CRUD completo.
- **Cursos** — CRUD completo, com seleção de categoria e professor.
- **Usuários** — CRUD completo.
- **Módulos e Aulas** — gestão em hierarquia por curso (curso → módulos → aulas).
- **Matrículas** — matrícula de alunos, marcação de conclusão e emissão de certificados.
- **Financeiro** — gestão de planos, assinaturas e pagamentos simples.
- Navegação nativa por abas/stack adaptada ao formato de tela pequena (em substituição às rotas do site).

> ⚠️ Este é o escopo funcional de referência (já validado no projeto web). O estado real de implementação de cada módulo **no app mobile** está descrito na seção de limitações abaixo.

## 🛠️ Tecnologias utilizadas

**App mobile (este repositório):**
- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/) (`expo start`, `expo-status-bar`)
- JavaScript/TypeScript
- React Navigation *(para as rotas entre telas, caso adotado)*

**Referência — projeto web original:**
- React + Vite (SPA)
- React Router (navegação entre telas)
- Axios (consumo de API)
- JSON Server (backend simulado para os módulos de CRUD)

> Ajuste esta lista conforme as dependências reais do `package.json` da pasta `my-app`, incluindo bibliotecas de navegação, ícones ou gerenciamento de estado que você tiver adicionado.

## ⚙️ Instruções para execução

Pré-requisitos: [Node.js](https://nodejs.org/) instalado e o app **Expo Go** no celular (Android/iOS), ou um emulador Android/iOS configurado.

```bash
# 1. Clonar o repositório
git clone https://github.com/FernaoFerreira/EduPlataforma-Mobile.git
cd EduPlataforma-Mobile/my-app

# 2. Instalar as dependências
npm install

# 3. Iniciar o projeto
npx expo start
```

Após o comando `npx expo start`, um QR code será exibido no terminal:
- **No celular:** escaneie o QR code com o app **Expo Go**.
- **No emulador:** pressione `a` (Android) ou `i` (iOS) no terminal com o Expo CLI em execução.

## 🚧 Limitações conhecidas

- Projeto em estágio inicial/acadêmico: o app mobile ainda não implementa todos os módulos listados acima — a cobertura completa (Dashboard, CRUDs, hierarquia de módulos/aulas, matrículas com certificados, financeiro) é a do projeto web de referência, servindo como meta de escopo para o port.
- Ainda não há integração direta com o backend (JSON Server) usado pelo projeto web; a persistência de dados no app depende do que já foi conectado até o momento.
- Sem autenticação/controle de permissões implementado.
- Sem persistência local (os dados não são salvos entre sessões do app).
- Cobertura de testes automatizados ainda não implementada.
- Compatibilidade testada primariamente via Expo Go; build nativo (APK/IPA) ainda não gerado.

## 📚 Documentação

- Repositório do projeto web de origem (referência de domínio e funcionalidades): [Plataforma-de-Cursos-Online](https://github.com/FernaoFerreira/Plataforma-de-Cursos-Online)
- Documentação oficial do Expo: [docs.expo.dev](https://docs.expo.dev/)
- Documentação oficial do React Native: [reactnative.dev/docs](https://reactnative.dev/docs/getting-started)

## 👤 Autor

Desenvolvido por **Fernão Queiroz Ferreira** — estudante de Ciência da Computação (PUC Goiás), como trabalho da disciplina de Tecnologia de Construção de Software.
