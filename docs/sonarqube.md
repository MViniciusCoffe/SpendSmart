# SonarQube

Guia de analise estatica do SpendSmart no servidor SonarQube Community Build hospedado pelo
LABENS (UFRN). Cobre a Tarefa 01 da disciplina de Testes de Software.

> **Estado atual: o projeto ainda nao foi criado no SonarQube.** O passo 3 deste guia precisa ser
> executado uma vez, manualmente, no painel do LABENS, antes de qualquer analise. O
> `sonar-project.properties` nao esta no repositorio ainda — ver §7.

---

## 1. Servidor

| Item | Valor |
| --- | --- |
| URL do servidor | `http://labens.dct.ufrn.br/sonarqube` |
| Versao | SonarQube Community Build v25.12.0.117093 |
| Autenticacao | GitHub OAuth (`Log in with GitHub`) |
| Organizacao obrigatoria | `EngSoft-BSI-Hub` |
| Grupo concedido apos login | `es2-users` (permite rodar o SonarScanner) |
| Funcao extra da disciplina | Nao compoe a nota da T1 |

---

## 2. Configurar acesso

1. Confirme que sua conta GitHub e membro da organizacao `EngSoft-BSI-Hub`.
2. Acesse `http://labens.dct.ufrn.br/sonarqube/` e clique em **Log in with GitHub**.
3. Autorize o acesso. No primeiro login voce entra automaticamente no grupo `es2-users`.
4. Crie o **token de projeto**: va em **My Account -> Security -> Generate Token**, com permissao
   de execucao de analise.
5. Salve o token. Ele so aparecera nessa tela — depois so sera possivel rotacionar.

---

## 3. Criar o projeto no painel

Este passo ainda nao foi executado. Uma vez, no navegador:

1. Menu **Projects -> Create a project**.
2. Nome: `SpendSmart`
3. Main branch: `main`
4. Deixe a configuracao de monorepo como negada — o repositorio e um unico modulo.

> O `projectKey` gerado pode ser `spendsmart` ou `MViniciusCoffe_SpendSmart`, dependendo do
> espaco de nomes escolhido no passo 3. O `sonar-project.properties` precisa bater com o valor
> que aparecer no painel. Confira em **Projects -> SpendSmart -> Administration -> General
> Settings** depois de criar.

---

## 4. `sonar-project.properties`

O exemplo distribuido pela disciplina e para **Python** (Django + `coverage.xml`). O SpendSmart e
**JavaScript**, entao tres linhas mudam:

| Chave | Exemplo Python | Versao deste projeto |
| --- | --- | --- |
| `sonar.language` | `py` | `js` |
| `sonar.sources.inclusions` | `**/**.py` | removida — desnecessaria em JS |
| `sonar.test.inclusions` | `**/test_**.py` | `**/*.test.js` |
| Relatorio de cobertura | `sonar.python.coverage.reportPaths=coverage.xml` | `sonar.javascript.lcov.reportPaths=coverage/lcov.info` |

Conteudo adapted, a ser gravado na raiz do repositorio:

```properties
sonar.projectKey=spendsmart
sonar.projectName=SpendSmart
sonar.projectVersion=0.1.0

sonar.sources=pages,components,services
sonar.tests=tests
sonar.test.inclusions=**/*.test.js

# Migrations, infra local e assets nao contem logica de negocio a medir.
sonar.exclusions=**/supabase/migrations/**,**/infra/**,**/public/**,**/node_modules/**,**/docs/**,**/.next/**

sonar.language=js
sonar.scm.provider=git
sonar.sourceEncoding=UTF-8

sonar.javascript.lcov.reportPaths=coverage/lcov.info
```

### Por que cada exclusao

- **`supabase/migrations/`** — SQL gerado, nao JavaScript. Medir cobertura aqui produz zero util.
- **`infra/`** — scripts de desenvolvimento (`run-services.js`, `wait-for-postgres.js`). Rodam
  apenas na sua maquina e nao fazem parte do produto.
- **`public/`** — assets estaticos. Nao ha JavaScript analisavel.
- **`docs/`** e **`.next/`** — documentacao e build.

### Por que `sonar.sources` lista tres diretorios em vez de `.`

A raiz contem `tests/`, que precisa ficar de fora de `sonar.sources` para nao contar como codigo
de producao. Listar os diretorios explicitamente evita ter de excluir cada subpasta.

---

## 5. Relatorio de cobertura

O SonarQube le o relatorio em `lcov`. O Jest precisa gerar esse formato:

```bash
npm run test:coverage
```

Isso produz `coverage/lcov.info`, que e o caminho declarado em `sonar.javascript.lcov.reportPaths`.

**A suite atual nao executa.** `tests/categoria.test.js` e `tests/categoria.integration.test.js`
importam `axios` e `axios-mock-adapter`, que nao estao em `package.json`, e nao ha
`babel.config.js` para o `babel-jest` converter os `import`. A cobertura reportada hoje seria de
um arquivo morto. Ver issue
[#26](https://github.com/MViniciusCoffe/SpendSmart/issues/26).

---

## 6. Executar a analise

### Opcao A — Docker (recomendado, nao exige instalacao)

```bash
docker run --rm -e SONAR_HOST_URL="http://labens.dct.ufrn.br/sonarqube" \
           -v "${PWD}:/usr/src" sonarsource/sonar-scanner-cli -Dsonar.login=TOKEN_PROJETO
```

No PowerShell, substitua `${PWD}` por `(Get-Location).Path`:

```powershell
docker run --rm -e SONAR_HOST_URL="http://labens.dct.ufrn.br/sonarqube" `
           -v "$(Get-Location):/usr/src" sonarsource/sonar-scanner-cli -Dsonar.login=TOKEN_PROJETO
```

### Opcao B — SonarScanner local

1. Baixe o zip na pagina de downloads do SonarSource.
2. Extraia e adicione `<INSTALL_DIR>/bin` ao `PATH`.
3. Confirme: `sonar-scanner -h`.
4. Execute na raiz do repositorio:

```bash
sonar-scanner -Dsonar.host.url="http://labens.dct.ufrn.br/sonarqube" -Dsonar.token=TOKEN_PROJETO
```

Ou defina a variavel antes:

```bash
export SONAR_TOKEN=TOKEN_PROJETO
sonar-scanner -Dsonar.host.url="http://labens.dct.ufrn.br/sonarqube"
```

### Opcao C — GitHub Actions (o que a disciplina pede)

Configurar o workflow com um passo adicional usando o token como secret:

1. No repositorio: **Settings -> Secrets and variables -> Actions -> New repository secret**.
2. Nome: `SONAR_TOKEN`. Valor: o token do passo 2.
3. O passo do workflow:

```yaml
      - name: SonarQube Scan
        uses: sonarsource/sonarqube-scan-action@v6
        env:
          SONAR_HOST_URL: ${{ vars.SONAR_HOST_URL }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

> Use a **Actions secret** para o token, nunca uma variavel de ambiente do repositorio — variaveis
> ficam visiveis na interface, secrets ficam mascarados nos logs.

---

## 7. Pendencias

| Item | Estado | Issue |
| --- | --- | --- |
| Projeto criado no painel do LABENS | Nao feito | — |
| `sonar-project.properties` na raiz | Nao criado | #19 |
| Token como secret no repositorio | Nao feito | #19 |
| `sonar-project.properties` adaptado a JS (exemplo acima) | Pronta para aplicar | #19 |
| Workflow com passo do SonarQube | Nao feito | #19 |
| Suite de testes executando | Nao funciona | #26 |
| `babel.config.js` | Ausente | #26 |
| `lcov` gerado em `coverage/lcov.info` | Nao gerado | #17 |

A ordem importa: **#26 antes de #17 antes de #19**. Sem suite executando nao ha cobertura, e sem
cobertura a analise do Sonar so mede o vazio.

---

## 8. O que esperar do resultado

O SonarQube vai apontar, no primeiro carregamento:

1. **Zero ou cobertura insignificante** — consequencia de #26.
2. **Duplicacao** entre `pages/gastosPage.js` e `pages/rendaPage.js`, e entre os CSS Modules
   correspondentes. Sao cerca de 1.100 linhas repetidas em um codigo de 2.300.
3. **Nenhum teste de deteccao de codigo** nos fluxos de sessao, porque `supabase-js` e
   instancia em escopo de modulo e nao ha como injetar um duble sem mock do modulo.
4. **Relatorio de `sonar.sources` incompleto** enquanto `sonar-project.properties` nao existir.

Os itens 2 e 3 sao limitacoes conhecidas da base atual e estao registradas em #26 e #6. Nao sao
motivo para atrasar a entrega da T1 — o que a disciplina pede e a analise rodando e o resultado
apresentado, nao cobertura alta.
