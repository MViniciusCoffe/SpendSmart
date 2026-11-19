# Convenções de código

Regras de código do SpendSmart e o motivo de cada uma. É o documento canônico do assunto: as regras
gerais (autenticação, dinheiro, `type`, soft delete) estão em
[Regras que não se negociam](../README.md#regras-que-não-se-negociam), o banco em
[database-schema.md](database-schema.md), as variáveis e migrations em
[environments.md](environments.md) e as convenções de teste em [test-plan.md](test-plan.md).

## Camadas

| Camada      | Diretório                                 | Responsabilidade                                                                |
| :---------- | :---------------------------------------- | :------------------------------------------------------------------------------ |
| Interface   | `src/app/`                                | React, validação de formulário, chamada ao service, redirecionamento            |
| API         | `src/app/api/`                            | Rotas públicas de monitoramento (`health`, `status`), só com a chave pública    |
| Negócio     | `src/services/`                           | Regra de negócio, validação, mapeamento para DTO, mensagem de erro em português |
| Cliente     | `src/lib/supabase.js`                     | Instância única do `createClient` usada pelo navegador                          |
| Componentes | `src/components/`                         | Design system, formulários, `Header`, `ConfirmDialog`, guarda `withAuth`        |
| Sessão      | `src/contexts/`                           | `AuthContext` é a fonte única do usuário logado                                 |
| Segurança   | `src/proxy.js`, `src/lib/security/csp.js` | CSP com nonce por requisição                                                    |

As páginas não chamam `supabase.auth` nem as rotas de `src/app/api/` direto para decisões de
negócio: passam pelos services (ou pelo `AuthContext`, que chama os services).

**Sem chave secreta na aplicação (#75).** Nenhum arquivo de `src/` lê a `SUPABASE_SERVICE_ROLE_KEY`
(regra no `scripts/check-agents.js`). Operação que precisa de privilégio vira função `SECURITY
DEFINER` no banco, com `search_path = ''` e `GRANT EXECUTE` só para quem pode chamar:

- **Cadastro:** `authService.registerUser` valida nome, data de nascimento e telefone e manda os três
  em `signUp({ options: { data } })`; o trigger `on_auth_user_created` cria o `profiles` na mesma
  transação. Conta sem `full_name` nos metadados é recusada (inclusive no Studio e na API admin dos
  testes, que passam `user_metadata: { full_name }`).
- **Exclusão:** `profileService.deleteAccount()` chama `supabase.rpc("delete_own_account")`, sem
  parâmetro: a conta apagada é sempre a do token.

## Services (`src/services/`)

Todo service usa `withSession` e `withErrorHandling` de `src/services/utils/baseService.js`:

```js
export const algumService = {
  async listar() {
    return withSession(async session => {
      return withErrorHandling(
        async () => {
          const { data, error } = await supabase
            .from("tabela")
            .select(TABELA_COLUMNS)
            .eq("user_id", session.user.id)
            .is("deleted_at", null)
          if (error) throw error
          return data.map(algumTypeMap)
        },
        "listar",
        { generica: "Não foi possível carregar." }
      )
    })
  }
}
```

- **Colunas explícitas, sempre.** Nem `select("*")` nem `.select()` sem argumento: o `.select()`
  vazio depois de `.insert()`/`.update()` também devolve todas as colunas. As listas ficam em
  `src/services/utils/mappers.js` (`CATEGORY_COLUMNS`, `TRANSACTION_COLUMNS`), ao lado do mapper que
  as lê, para a consulta e o mapeamento não divergirem.
- **Filtrar por `session.user.id`** em toda leitura e escrita, além do RLS. Nunca enviar `user_id`
  num `update`.
- **`.is("deleted_at", null)`** nas leituras; exclusão é `deleted_at = now()`.
- **Devolver DTO**, nunca a linha do banco: `categoryTypeMap`, `transactionTypeMap`,
  `profileTypeMap`.
- **Erros traduzidos** para português por `traduzirErroSupabase`/`handleSupabaseError`. Erros do Auth
  são traduzidos pelo `error.code`, não pela mensagem em inglês (ex.: `same_password` e
  `weak_password` em `profileService.updateProfile`, #11).
- **Falha de rede também é traduzida.** O `postgrest-js` devolve falha de transporte como
  `PostgrestError` com `code: ""` e mensagem `"FetchError: ..."`. Por isso o `withErrorHandling`
  decide pela presença da propriedade (`error.code !== undefined`), não pelo valor: um
  `if (error.code)` deixava o texto do fetch, em inglês, chegar à tela. Erro de validação é um
  `Error` sem `code` e sobe com a própria mensagem. Teste:
  `tests/regression/network-error-message.test.js`.
- **Validação pelos validadores existentes** (`src/services/utils/validators.js`): `titulo`, `valor`,
  `tipo`, `categoriaId`, `data`, `descricao`, `formaPagamento`, `nome`, `email`, `senha`, `telefone`,
  `dataNascimento`, `cor`. Criar um novo só quando nenhum servir. O que dá para recusar no cliente
  (senha curta) é recusado antes da ida ao servidor.

## Páginas (`src/app/`)

- **Metadados de página pública:** `generateMetadata(_props, parent)` devolvendo
  `pageMetadata({ title, description, path }, await parent)` (`src/lib/config/pageMetadata.js`).
  Não definir `openGraph` direto na página: o Next.js substitui o objeto do pai inteiro, inclusive a
  imagem gerada por `src/app/opengraph-image.js`/`twitter-image.js`.
- **Client Component não exporta `metadata`.** O título (e o `robots`) vai num `layout.js` da rota,
  com `title` simples: o layout raiz aplica o template `%s | SpendSmart`.
- **Páginas privadas** são envolvidas por `withAuth` (`export default withAuth(DashboardPage)`).
- **Login, cadastro e logout** passam pelo `AuthContext` (`useAuth()`), para o `Header` e o
  `withAuth` saberem na hora.
- **Feedback** por toast (`useToast`) e confirmação pelo `ConfirmDialog`; nunca `alert`/`confirm`.
- **Estilo** em CSS Modules com as variáveis de `src/styles/design-tokens.css`. Estilo inline só para
  valor de runtime (a cor de uma categoria).
- **Valores e datas** exibidos com `formatCurrency`/`formatDate` e lidos com `parseAmount`
  (`src/lib/utils/format.js`).
- **Campos do formulário** batem com os parâmetros do service (defeitos #10 e #21).
- **Acessibilidade (#82):** `aria-label` e textos para leitor de tela em português, como a página
  (`lang="pt-BR"`). Títulos sem salto de nível: depois do `h1` da página vem `h2`, mesmo que o texto
  seja pequeno (o tamanho vem da classe, não da tag). Formulário com `noValidate` e mensagem do app:
  erro de um campo fica junto dele, ligado por `aria-describedby`, com `aria-invalid` no campo.

## Headers de segurança e CSP (#24)

A CSP é montada por requisição em `src/lib/security/csp.js` e aplicada por `src/proxy.js` (o antigo
middleware do Next.js), com um nonce novo a cada resposta. Os headers fixos (`nosniff`,
`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, e `noindex` + `Cache-Control: private,
no-store` nas rotas privadas) ficam em `next.config.js`.

- **Nada de outra origem:** script, estilo ou fonte de CDN/Google Fonts é bloqueado. Um serviço novo
  chamado do navegador entra no `connect-src` de `csp.js`, com caso em
  `tests/regression/issue24-security-headers.test.js`.
- **Não remover o `await connection()` de `src/app/layout.js`.** Ele torna todas as páginas
  dinâmicas; numa página estática o Next.js não aplica o nonce e o navegador bloqueia o JS do app.
  Por isso `revalidate` (ISR) não tem efeito em nenhuma página.
- **`<Script>` de terceiros** só com `nonce={(await headers()).get("x-nonce")}`.
- **Estilos:** `<style>` exige o nonce; o atributo `style` é liberado por `style-src-attr`.

## Rotas de API (`src/app/api/` e `/health`)

Hoje existem três rotas públicas: `/api/health` (vida: sem I/O, 200 enquanto o processo estiver no
ar), `/api/status` (página de status) e `/health` (prontidão, em `src/app/health/route.js`). As rotas privilegiadas `createProfile` e
`deleteAccount` saíram na #75. Se uma rota com sessão voltar a existir:

- **Token primeiro.** Validar o token com o cliente público (`supabase.auth.getUser(token)`) antes de
  qualquer ação; sem token ou com token inválido, `401`.
- **`user_id` vem do token**, nunca do corpo.
- **Sem cliente admin.** Privilégio vai para uma função do banco (ver Camadas), não para a chave
  secreta.
- **Só mensagens próprias na resposta.** O erro do Postgres ou do Auth (`error.message`, nome de
  constraint) vai para o log do servidor, não para o cliente. Corpo inválido responde `400`.
- **Respostas em JSON** com o status certo: `400`, `401`, `405`, `500`, `503`.
- **`/api/status` é pública e usa só a chave pública:** banco pela RPC `health_check()`, Auth por
  `/auth/v1/health`. O `?fail=` (simulação de falha) fica desligado com `VERCEL_ENV=production`.
- **`/health` é a prontidão e o alvo do smoke test pós-deploy:** `200` só com banco e Auth
  respondendo, `503` se qualquer um falhar, estourar o prazo (3 s) ou faltar configuração. Corpo
  `{ status, checks: { database, auth }, version, timestamp }` com `"ok"`/`"fail"`, sem mensagem de
  erro, `Cache-Control: no-store`, sem `?fail=`. Fica fora do `src/proxy.js` (JSON não precisa de
  CSP). É pública de propósito: cada requisição só lê o catálogo do banco.
- **As checagens de banco e Auth ficam em `src/lib/health/checks.js`**, usadas pelo `/api/status` e
  pelo `/health`, para as duas rotas não divergirem. O `/api/status` responde `200` mesmo com o banco
  fora (#103); monitoramento por código HTTP usa o `/health`.

## Banco

Resumo; os detalhes estão em [database-schema.md](database-schema.md) e o fluxo em
[environments.md](environments.md#5-migrations).

- Schema só por migration `.sql` (`npm run migrations:new -- <nome>`); nunca editar uma migration já
  aplicada em Preview/Produção.
- Toda referência a `auth.users` (e aos papéis `anon`/`authenticated`) fica dentro da guarda
  `IF to_regclass('auth.users') IS NOT NULL`: o Postgres puro e o pg-mem não têm.
- **Tabela nova** traz `REVOKE ALL ... FROM anon` e `GRANT` explícito na própria migration: o padrão
  do schema `public` no Supabase CLI dá tudo ao `anon`.

## Verificação automática

`npm run check:agents` (`scripts/check-agents.js`) bloqueia: chave `sb_secret_` ou JWT no código,
`console.error` com dado sensível, `dangerouslySetInnerHTML`/`innerHTML`/`eval`, `alert`/`confirm`,
e `select("*")` ou `.select()` vazio em `src/services/`. Roda no `lint.yml`, mas não nos hooks: rodar
antes de commitar, junto com `npm test`, `npm run test:integration`, `npm run lint:eslint:check` e
`npm run lint:prettier:check`.
