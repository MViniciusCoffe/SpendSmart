# Manual de execução

Como instalar, configurar e executar o SpendSmart localmente, e como rodar cada suíte de testes.
Escrito para quem nunca abriu o projeto: siga as seções em ordem.

Issue: [#61](https://github.com/MViniciusCoffe/SpendSmart/issues/61).

---

## 1. Pré-requisitos

| Ferramenta       | Versão mínima   | Para que serve                        | Como verificar       |
| :--------------- | :-------------- | :------------------------------------ | :------------------- |
| **Node.js**      | `>=24.11.0`     | Next.js, Jest, Stryker                | `node --version`     |
| **npm**          | Vem com Node.js | Dependências e scripts                | `npm --version`      |
| **Git**          | Qualquer        | Clonar o repositório                  | `git --version`      |
| **Docker**       | 24+             | Containers da stack local do Supabase | `docker --version`   |
| **Supabase CLI** | 1.x             | Postgres + Auth + RLS + Studio locais | `supabase --version` |

Docker e Supabase CLI só são necessários para **subir a aplicação** e para os testes de **RLS**. Os
testes de unidade, integração (pg-mem), regressão, cobertura e mutação rodam só com Node.js.

### 1.1 Instalando o Docker

**Docker Desktop (macOS / Windows / Linux com GUI):**

```bash
# macOS (Homebrew)
brew install --cask docker

# Windows (Chocolatey)
choco install docker-desktop

# Windows (Scoop)
scoop install docker

# Linux (.deb/.rpm)
# Baixe em https://docs.docker.com/desktop/install/linux/
```

**Docker Engine (Linux servidor, sem GUI):**

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
# Reinicie a sessão ou: newgrp docker

# Fedora/RHEL/CentOS
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER

# Arch Linux
sudo pacman -Syu
sudo pacman -S docker docker-compose
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

**Via script oficial (qualquer Linux):**

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Reinicie a sessão
```

> **Verifique a instalação:**
>
> ```bash
> docker --version
> docker compose version
> # Exemplo: Docker version 27.0.0, build xxx
> # Exemplo: Docker Compose version v2.29.0
> ```

> **Importante:** O usuário precisa estar no grupo `docker` para rodar sem `sudo`. Após instalar, **reinicie o terminal/sessão** ou rode `newgrp docker`.

---

### 1.2 Instalando o Supabase CLI

**macOS (Homebrew):**

```bash
brew install supabase/tap/supabase
```

**Linux (binário standalone):**

```bash
curl -fsSL https://supabase.com/install.sh | sh
# ou baixe o .tar.gz de https://github.com/supabase/cli/releases
```

**Windows (Scoop):**

```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Windows (Chocolatey):**

```bash
choco install supabase
```

**Via npm (qualquer SO com Node.js):**

```bash
npm install -g supabase
# ou use npx supabase (sem instalação global)
```

> **Verifique a instalação:**
>
> ```bash
> supabase --version
> # Exemplo: supabase version 1.187.0
> ```

---

## 2. Instalação

```bash
git clone https://github.com/MViniciusCoffe/SpendSmart.git
cd SpendSmart
npm install
```

O `npm install` também ativa os hooks do Husky (`pre-commit` com Prettier + ESLint e `commit-msg`
com commitlint).

---

## 3. Configuração do ambiente

```bash
supabase start                    # sobe Postgres, Auth, Kong e Studio em containers
npm run infra:status              # mostra URL e chaves da stack local
cp .env.local.example .env.local  # cria o arquivo de variáveis
```

Preencha o `.env.local` com a saída do `npm run infra:status`:

| Variável                               | Valor                                           | Sensível?                         |
| :------------------------------------- | :---------------------------------------------- | :-------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | `http://127.0.0.1:54321`                        | Não                               |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave `anon`/`publishable` do `supabase status` | Não (vai para o navegador)        |
| `SUPABASE_SERVICE_ROLE_KEY`            | Chave `service_role` do `supabase status`       | **Sim**. Nunca com `NEXT_PUBLIC_` |

> **Prioridade do Next.js:** `.env.local` > `.env.development` > `.env`. Se o `.env.local` existe,
> o `.env.development` é ignorado. Arquivos `.env*` reais nunca são commitados; só os `.example`.

As migrations de `supabase/migrations/` são aplicadas automaticamente no `supabase start`. Para
recriar o banco do zero: `npm run infra:reset`.

---

## 4. Executar a aplicação

```bash
npm run dev
```

O `npm run dev` (`scripts/dev.js`):

1. sobe o Supabase local (`supabase start`) se ele ainda não estiver rodando;
2. aguarda o health check do gateway (porta 54321), com limite de 2 minutos;
3. só então inicia o Next.js;
4. ao receber `Ctrl+C`, encerra o Next.js e o Supabase juntos.

| Endereço                           | O que é                                  |
| :--------------------------------- | :--------------------------------------- |
| <http://localhost:3000>            | Aplicação                                |
| <http://localhost:3000/api/health> | Health check da aplicação (JSON)         |
| <http://localhost:54323>           | Supabase Studio (tabelas, usuários, SQL) |

**Primeiro uso:** acesse `/register`, crie uma conta (senha com 6+ caracteres) e você será levado ao
dashboard. Cadastre categorias em **Categorias** antes de registrar receitas e despesas.

Para encerrar só o Supabase: `npm run infra:down`.

### 4.1 Fluxo alternativo: só Postgres (sem Auth e sem RLS)

Serve apenas para validar constraints e índices. Sem Supabase Auth não é possível fazer login.

```bash
cp .env.development.example .env.development
npm run services:up                # Postgres em Docker (infra/compose.yaml)
npm run services:wait:database
npm run migrations:up
npm run next:dev
```

---

## 5. Executar os testes

| Suíte                     | Comando                             | Precisa de                      | O que verifica                                               |
| :------------------------ | :---------------------------------- | :------------------------------ | :----------------------------------------------------------- |
| Unidade                   | `npm test`                          | Só Node.js                      | `src/services/` com o Supabase mockado                       |
| Cobertura                 | `npm run test:coverage`             | Só Node.js                      | Unidade + relatório em `coverage/` (`lcov`, usado no Sonar)  |
| Integração (pg-mem)       | `npm run test:integration`          | Só Node.js                      | Constraints, FKs, unicidade e migrations em banco em memória |
| Integração Supabase (RLS) | `npm run test:integration:supabase` | `supabase start` + `.env.local` | Isolamento real entre dois usuários                          |
| Todas                     | `npm run test:all`                  | `supabase start` + `.env.local` | Unidade, pg-mem, regressão e RLS                             |
| Mutação                   | `npm run test:mutation`             | Só Node.js                      | Eficácia da suíte unitária (Stryker), mínimo de 85%          |

- **Cobertura:** abra `coverage/lcov-report/index.html` no navegador. Meta da disciplina: 70%;
  resultado atual: 100% em `src/services/`.
- **Mutação:** leva alguns minutos. Abra `reports/mutation/mutation.html` no navegador. Resultados e
  mutantes aceitos em [mutation-testing.md](mutation-testing.md).
- **RLS:** sem o Supabase local, os testes de `tests/integration/supabase/` não têm contra o que
  rodar. Não teste isolamento contra Postgres puro: dá falso positivo.

---

## 6. Qualidade de código

| Verificação         | Comando                       |
| :------------------ | :---------------------------- |
| ESLint              | `npm run lint:eslint:check`   |
| ESLint (corrigir)   | `npm run lint:eslint:fix`     |
| Prettier            | `npm run lint:prettier:check` |
| Prettier (formatar) | `npm run lint:prettier:write` |
| Regras do projeto   | `npm run check:agents`        |
| Commit interativo   | `npm run commit`              |

Antes de abrir um PR, rode: `npm test`, `npm run test:integration`, `npm run lint:eslint:check` e
`npm run lint:prettier:check`.

---

## 7. Integração contínua e SonarQube

Os workflows de `.github/workflows/` rodam no GitHub Actions, sem configuração local:

| Workflow       | Quando roda                              | O que faz                                            |
| :------------- | :--------------------------------------- | :--------------------------------------------------- |
| `test.yml`     | Push e PR                                | `npm run test:coverage` + `npm run test:integration` |
| `lint.yml`     | Push e PR                                | ESLint + Prettier                                    |
| `sonar.yml`    | Push na `main` e PR                      | Cobertura + análise no SonarQube do LABENS           |
| `mutation.yml` | PR que altera services/testes, ou manual | Stryker com mínimo de 85%; relatório como artefato   |

Painel do SonarQube: <https://labens.dct.ufrn.br/sonarqube/dashboard?id=spendsmart>. Detalhes em
[sonarqube.md](sonarqube.md).

---

## 8. Problemas comuns

| Sintoma                                        | Causa provável                               | Solução                                                                 |
| :--------------------------------------------- | :------------------------------------------- | :---------------------------------------------------------------------- |
| `supabaseUrl is required` ao abrir a aplicação | `.env.local` ausente ou vazio                | Seção 3: copie o `.example` e preencha com `npm run infra:status`       |
| `permission denied ... docker.sock`            | Usuário fora do grupo `docker`               | `sudo usermod -aG docker $USER` e reinicie a sessão                     |
| `npm run dev` falha após 2 minutos             | Containers do Supabase não ficaram saudáveis | `npm run infra:down`, depois `npm run dev` de novo; confira o Docker    |
| Porta 54321/54322/54323 em uso                 | Outra instância do Supabase rodando          | `supabase stop --all` ou pare o projeto que ocupa a porta               |
| Login funciona mas não há dados                | Banco local recém-criado                     | Esperado: o banco local começa vazio. Cadastre categorias e lançamentos |
| `test:integration:supabase` falha na conexão   | Supabase local parado                        | `supabase start` antes de rodar                                         |
