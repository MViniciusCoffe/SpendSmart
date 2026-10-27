# Registro de qualidade — 2026-10-13

> **Registro histórico.** Este documento descreve o projeto na data em que foi escrito e é mantido
> como evidência. Os caminhos citados (`pages/gastosPage.js`, `pages/register.js`, `services/`...)
> eram os da época: o front-end hoje está em `src/app/` (App Router) e os serviços em
> `src/services/`. O estado atual está no `README.md`.

## Objetivo

Elevar a confiabilidade do quality gate do SonarQube sem refatorar as páginas React nem alterar
as regras de negócio das telas.

## Mudanças

- A validação de datas foi centralizada em `services/utils/validators.js`.
  - `data` e `dataNascimento` compartilham a validação de formato e existência da data.
  - A regra específica de idade continua exclusiva de `dataNascimento`.
- `services/utils/utils.js` passou a ser uma fachada de compatibilidade.
  - As implementações duplicadas de sessão e tradução de erros foram removidas.
  - As validações antigas delegam para `validators.js`.
  - As implementações canônicas permanecem em `baseService.js` e `validators.js`.
- O cadastro passou a tratar respostas de erro não JSON da API `createProfile`.
  - Quando o corpo está vazio ou inválido, uma mensagem de domínio estável é exibida.
- Foram adicionados testes para a resposta não JSON de `createProfile`.
- A documentação da estrutura de utilitários foi atualizada.

## Escopo preservado

- Nenhum arquivo de `pages/` foi alterado.
- Nenhuma migration foi criada, editada ou executada.
- Nenhuma credencial ou variável de ambiente foi adicionada.
- A API pública dos imports legados de `services/utils/utils.js` foi preservada.

## Verificação

- Testes focados: 116 testes passando.
- A suíte completa será executada antes do commit.
- Prettier e ESLint serão executados nos arquivos alterados.
