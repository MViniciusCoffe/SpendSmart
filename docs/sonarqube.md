# SonarQube

Analise estatica do SpendSmart no servidor SonarQube Community Build hospedado pelo LABENS (UFRN).
Cobre a parte extra da Tarefa 01 da disciplina de Testes de Software.

> **Estado atual: configurado e rodando.** O projeto `spendsmart` existe no LABENS, o
> `sonar-project.properties` esta na raiz do repositorio e `.github/workflows/sonar.yml` roda a
> analise a cada push em `main` e a cada pull request. Resultados em
> `http://labens.dct.ufrn.br/sonarqube/dashboard?id=spendsmart`.

---

## 1. Servidor

| Item                       | Valor                                      |
| -------------------------- | ------------------------------------------ |
| URL do servidor            | `http://labens.dct.ufrn.br/sonarqube`      |
| Versao                     | SonarQube Community Build 26.1.0.118079    |
| Project key                | `spendsmart`                               |
| Autenticacao               | GitHub OAuth (`Log in with GitHub`)        |
| Organizacao obrigatoria    | `EngSoft-BSI-Hub`                          |
| Grupo concedido apos login | `es2-users` (permite rodar o SonarScanner) |
| Funcao extra da disciplina | Nao compoe a nota da T1                    |

A versao foi lida do proprio servidor, em `api/system/status`, e nao do material da disciplina. O
guia distribuido cita `25.12.0.117093`, que era a versao vigente quando ele foi escrito.

`http://` e `https://` respondem igualmente; o scanner funciona nas duas.

---

## 2. Configurar acesso

Feito uma vez, na conta pessoal.

1. Confirmar que a conta GitHub e membro da organizacao `EngSoft-BSI-Hub`. Sem isso o primeiro login
   nao concede o grupo `es2-users` e o scanner e recusado. Nao ha contorno local.
2. `http://labens.dct.ufrn.br/sonarqube/` -> **Log in with GitHub**.
3. No primeiro login o usuario entra automaticamente no grupo `es2-users`.
4. **My Account -> Security -> Generate Tokens**, com escopo no projeto `spendsmart` e permissao de
   execucao de analise.
5. O token aparece **uma unica vez**. Depois disso so e possivel rotacionar.

### Por que projeto criado manualmente, e nao importado

O SonarQube oferece tres vias: _Import from DevOps Platforms_ (GitHub, GitLab, Azure DevOps,
Bitbucket), _Local Project_ e criacao por API. O projeto foi criado como **Local Project**.

A via de import exige que um administrador configure a integracao da plataforma no nivel **global**
da instancia. Uma instancia compartilhada de universidade raramente tem isso. Alem disso o projeto
importado fica _bound_ ao repositorio, o que traz dois problemas aqui:

- O `projectKey` seria gerado automaticamente no formato `organizacao_repositorio`, e nao seria o
  `spendsmart` limpo.
- Binding nao e o que a disciplina pede, e adiciona dependencia de permissao que nao existe.

### O projectKey e escolhido, mas nao e qualquer string

O `projectKey` e digitado na criacao e precisa ser unico **na instancia**. Como o LABENS e
compartilhado, `spendsmart` colide se outro aluno ja usou a mesma chave — e nesse caso o Sonar cria
`spendsmart_1` e a analise sobe num projeto que nao e o seu, sem erro visivel.

Regras de formatacao, validadas pelo `ComponentKeys.java`:

- Caracteres alfanumericos, `-`, `_`, `.` e `:`.
- Pelo menos um caractere nao numerico.
- Sem espaco, sem barra e sem acento. O `/` foi removido de proposito na 7.9.3.

O valor e conferido em **Projects -> `spendsmart` -> Administration -> General Settings**, que e a
unica fonte da verdade. O `sonar-project.properties` precisa bater com ele.

---

## 3. `sonar-project.properties`

O exemplo distribuido pela disciplina e para **Python** (Django + `coverage.xml`). Quatro chaves
mudam de nome e tres nao se aplicam:

| Chave                         | Exemplo Python                                   | Versao deste projeto                                     |
| ----------------------------- | ------------------------------------------------ | -------------------------------------------------------- |
| `sonar.language`              | `py`                                             | `js`                                                     |
| `sonar.sources`               | `.` (repositorio inteiro)                        | `services` — ver §4                                      |
| `sonar.test.inclusions`       | `**/test_**.py`                                  | `**/*.test.js`                                           |
| Relatorio de cobertura        | `sonar.python.coverage.reportPaths=coverage.xml` | `sonar.javascript.lcov.reportPaths=coverage/lcov.info`   |
| `sonar.sources.inclusions`    | `**/**.py`                                       | removida — filtro desnecessario com `sources` especifico |
| `sonar.python.coveragePlugin` | `cobertura`                                      | removida — nao se aplica a JavaScript                    |
| `sonar.scm.provider`          | `git`                                            | mantido                                                  |
| `sonar.sourceEncoding`        | `UTF-8`                                          | mantido                                                  |

Conteudo efetivo, identico ao que esta no repositorio:

```properties
sonar.projectKey=spendsmart
sonar.projectName=SpendSmart
sonar.projectVersion=0.1.0

sonar.sources=services
sonar.tests=tests
sonar.test.inclusions=**/*.test.js

sonar.language=js
sonar.scm.provider=git
sonar.sourceEncoding=UTF-8

# Cobertura (lcov gerado pelo Jest)
sonar.javascript.lcov.reportPaths=coverage/lcov.info
```

### Por que nao ha `sonar.exclusions`

O exemplo do professor tem nove padroes: `**/tests/**`, `docs/**`, `sigarte/**`, `**/static/**`,
`**/templates/**`, `**/migrations/**`, `**/__pycache__/**`, `**/admin.py`, `**/__init__.*`,
`manage.py`. Sao especificos de um projeto Django.

Com `sonar.sources=services`, a pasta `services/` tem quatro arquivos `.js` e nada mais, entao as
nove exclusoes seriam inertes. Padroes que nao fazem nada sao piores do que a ausencia deles: sugerem
uma configuracao mais cuidadosa do que a real.

Dois pontos de comportamento que valem registrar:

- **O Sonar respeita o `.gitignore` automaticamente.** `node_modules/` e `coverage/` ja estao
  ignorados (`.gitignore:7`), entao nao precisam aparecer em `sonar.exclusions`. O comportamento pode
  ser desligado com `sonar.scm.exclusions.disabled=true`, o que nao e o caso aqui.
- **Exclusoes e inclusoes so reduzem o conjunto analisavel**, nunca aumentam. Sobrepostas entre as
  duas categorias dao precedencia a `sonar.exclusions`.

---

## 4. `sonar.sources=services`, e nao o repositorio inteiro

Esta e a decisao com consequencia no resultado, entao fica registrada em detalhe.

### A aritmetica

O `jest.config.js` mede apenas `services/`:

```js
collectCoverageFrom: ["services/**/*.js"]
```

O `lcov` gerado tem quatro arquivos e 348 linhas. Se `sonar.sources` fosse o repositorio inteiro,
o denominador cresceria sem o numerador acompanhar:

| Diretorio    | Arquivos | Linhas    | No LCOV |
| ------------ | -------- | --------- | ------- |
| `services`   | 4        | 348       | sim     |
| `pages`      | 12       | 1.834     | nao     |
| `components` | 3        | 112       | nao     |
| `infra`      | 3        | 82        | nao     |
| `supabase`   | 2        | 155       | nao     |
| **Total**    | **24**   | **2.531** | **4**   |

O painel mostraria cerca de **14% de cobertura**, nao 100%. Nao e bug: e a divisao de 348 por 2.531.
Pedir para medir 2.531 linhas e entregar prova de 348 produz um numero que nao descreve nem o codigo
nem os testes.

### O efeito colateral que precisa ser dito em voz alta

O painel exibe **0% de duplicacao**. Isso e verdadeiro dentro do escopo, e a duplicacao real do
projeto existe: cerca de 1.100 linhas repetidas entre `pages/gastosPage.js` e `pages/rendaPage.js`,
registradas em #6 e #22. Elas nao aparecem porque `pages/` esta fora de `sonar.sources`.

Resposta honesta se a duvida vier: _"A analise esta escopada em `services/`, que e o unico diretorio
com cobertura medida. A duplicacao entre as paginas existe e esta registrada em #6 e #22, fora do
escopo desta frente."_

### Ampliar o escopo

Ampliar e um commit isolado: acrescentar `pages` e `components` em `sonar.sources` e em
`collectCoverageFrom`. O efeito imediato e a cobertura do projeto cair para a faixa real, e a
duplicacao de `pages/` passar a ser medida como "nao coberta" — o que mistura "codigo nao testado"
com "codigo que ninguem pediu para testar ainda".

A entrada 19 do [tooling-decisions.md](tooling-decisions.md) registra essa aritmetica, e a issue #33
(e nao o Sonar) e o que mantem o front-end sem cobertura visivel.

---

## 5. Relatorio de cobertura

O SonarQube **nao executa testes**. E um analisador estatico: le codigo-fonte e le arquivos de
relatorio. `sonar.javascript.lcov.reportPaths` e literalmente um caminho para abrir e ler. Se o
arquivo nao estiver la, o scanner avisa e segue:

```text
INFO: No LCOV files were found using coverage/lcov.info
WARN: No coverage information will be saved because all LCOV files cannot be found.
```

Nao ha fallback nem inferencia. O caminho feliz, no log da primeira analise:

```text
INFO: Sensor JavaScript/TypeScript Coverage [javascript]
INFO: Analysing [.../SpendSmart/coverage/lcov.info]
INFO: Sensor JavaScript/TypeScript Coverage [javascript] (done) | time=22ms
```

`Analysing` com caminho absoluto e **sem** `WARN` de "Could not resolve file paths" significa que o
arquivo foi localizado e todos os caminhos foram casados.

### Por que o workflow roda os testes antes do scan

`coverage/` esta no `.gitignore` (`.gitignore:7`) e nunca foi versionado — `git log --all -- coverage`
retorna vazio. Um workflow que so faz checkout e chama o scanner **nao tem o arquivo**, e o resultado
e uma analise bem-sucedida com 0% de cobertura.

Esse e o modo de falha mais ingrata possivel: o job da **verde**, o painel mostra o projeto, e so o
numero principal vem zerado.

A correcao e rodar `npm ci` e `npm run test:coverage` no mesmo job, antes do scan. E o que
`.github/workflows/sonar.yml` faz. O efeito colateral desejado: cada relatorio corresponde ao codigo
exato que foi analisado, e um commit com teste quebrado interrompe o pipeline antes da analise.

`npm run test:coverage` ja produz `coverage/lcov.info` via `coverageReporters` (`jest.config.js:16`),
e o mesmo comando roda no Ubuntu no workflow `test.yml`. Nao ha risco de formato.

---

## 6. Workflow

`.github/workflows/sonar.yml`:

```yaml
name: SonarQube

on:
  push:
    branches: [main]
  pull_request:

jobs:
  sonar:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v5
        with:
          fetch-depth: 0

      - name: Configurar Node.js
        uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: npm

      - name: Instalar dependencias
        run: npm ci

      - name: Gerar relatorio de cobertura
        run: npm run test:coverage

      - name: SonarQube Scan
        uses: sonarqube-scan-action@v7
        env:
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

### Quatro decisoes do YAML

**`sonarqube-scan-action@v7`, nao `@v6` nem `@v8`.** O LABENS roda a serie 26. A `v6` foi reescrita
de Bash para JavaScript e mudou a forma de parsear `args`; a documentacao da serie 26.2 usa `v7`, que
acompanha o SonarScanner CLI 8.x. A `v8.2.1` existe, mas nao ha ganho conhecido para este caso.

**`checkout@v5`, nao `@v6`.** A `v6` move as credenciais para `$RUNNER_TEMP` e exige runner
`>= 2.327.1`. O changelog e explicito: workflow nao precisa mudar. Os jobs sao Ubuntu, sem container
e sem `git push`, entao nao ha ganho em subir. O `AGENTS.md` §8 proibe introduzir mudanca de tooling
sem justificativa.

**`fetch-depth: 0`.** Obrigatorio. Sem ele o clone e raso, e o Sonar nao consegue ler o historico Git
para blame nem para calcular codigo novo. O log mostra `SCM Publisher 8/8 source files have been
analyzed`, que so e possivel com historico completo.

**`secrets.`, nao `vars.`, para `SONAR_HOST_URL`.** O template do SonarSource usa `vars.` para o host e
`secrets.` para o token. No LABENS os dois foram gravados como **secret**, entao
`${{ vars.SONAR_HOST_URL }}` resolveria para string vazia e o scanner falharia com erro de URL invalida
— sem que a mensagem aponte a causa. Os dois prefixos funcionam com o que esta gravado, e o host nao e
informacao sensible. A distincao importa para o token, que precisa ficar mascarado nos logs.

### Push em branch diferente de `main` nao dispara

O trigger `push` filtra `branches: [main]`. Um push na branch de trabalho **nao** executa a analise;
ela sobe na abertura do pull request. Isso e intencional, e evita uma analise por push em rascunho.

### Pull request de fork nao tem analise

Secrets nao sao expostos a pull requests de forks. O job falha por falta de token, que e o
comportamento correto — falha em vez de vazar. Nao e um workflow quebrado.

---

## 7. Resultado da primeira analise

Commit `ab5e87e`, 8 arquivos indexados (4 de `services/` mais 4 arquivos de teste).

| Metrica          | Valor |
| ---------------- | ----- |
| Cobertura        | 100%  |
| Duplicacao       | 0%    |
| Bugs             | 0     |
| Vulnerabilidades | 0     |
| Code smells      | 14    |

Os 14 code smells sao de duas regras:

| Regra                                  | Qtd. | Onde                                            |
| -------------------------------------- | ---- | ----------------------------------------------- |
| `S2223` — catch so relanca             | 12   | `try { } catch (e) { throw e; }` em `services/` |
| `Number.parseFloat` sobre `parseFloat` | 2    | `transactionService.js:53` e `:91`              |

O padrao `try { } catch (e) { throw e; }` e proibido pelo `AGENTS.md` §4.3. Os 12 casos foram
verificados um a um: nenhum tem `finally` e nenhum tem logica no `catch` alem do `throw`, entao
remover o `try/catch` e semanticamente identico. Limpar os 14 e um PR separado do de infraestrutura.

---

## 8. Ruido conhecido no log

Tres mensagens aparecem a cada execucao e nenhuma delas e do codigo do projeto.

| Mensagem                                                          | Origem                                                 | Efeito                                     |
| ----------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------ |
| `ERROR [baseline-browser-mapping] data is over two months old`    | Transitivo do plugin SonarJS 11.7.1, no Node embarcado | Nenhum. Logado como ERROR e nao interrompe |
| `Warning: Skipping GPG signature verification`                    | Container da `sonar-scanner-cli`                       | Nenhum                                     |
| `[DEP0040] DeprecationWarning: The punycode module is deprecated` | `eslint` -> `ajv@6` -> `uri-js` -> `punycode@2`        | Nenhum. Aviso no post-job                  |

O `punycode` vem do ESLint fixado na serie 9 pela entrada 1 do
[tooling-decisions.md](tooling-decisions.md). Forcar a versao por `overrides` adicionaria dependencia
sem justificativa e mascararia um aviso de terceiro.

O `baseline-browser-mapping` nao pode ser corrigido deste repositorio: o plugin do Sonar executa com o
Node que ele mesmo instala em `/home/runner/.sonar/js/node-runtime`.

---

## 9. Se o projeto virar publico de verdade

O plano OSS do SonarQube Cloud e gratuito para repositorios publicos com licenca open source, sem
limite de linhas, e inclui analise de branch e de pull request. Nestas condicoes o LABENS deixa de
ser necessario.

| Momento     | Servidor                     | Motivo                                               |
| ----------- | ---------------------------- | ---------------------------------------------------- |
| Tarefa 01   | LABENS, projeto `spendsmart` | Exigido pela disciplina. Configurado e rodando.      |
| Projeto OSS | SonarQube Cloud, plano OSS   | Gratuito, sem dependencia de instancia universitaria |

A transicao exige tres coisas, e nenhuma delas e reutilizavel do setup atual:

1. Um arquivo `LICENSE` no repositorio. O plano OSS e para projeto publico **com licenca**; um repo
   publico sem licenca pode ser classificado como privado e cair no plano Free (ate 50k LOC).
2. Criar a organizacao no SonarQube Cloud e escolher o plano OSS.
3. **Token novo e host novo.** Servidores diferentes tem tokens diferentes. O token do LABENS nao
   funciona no Cloud, e vice-versa.

O `sonar-project.properties` e reaproveitado sem alteracao; so `-Dsonar.host.url` muda, porque host
e token nunca entram no arquivo versionado.

---

## 10. Pendencias

| Item                                                   | Estado     | Onde                         |
| ------------------------------------------------------ | ---------- | ---------------------------- |
| Projeto `spendsmart` criado no painel do LABENS        | Feito      | #19                          |
| `sonar-project.properties` na raiz, escopo `services/` | Feito      | #19                          |
| `SONAR_TOKEN` e `SONAR_HOST_URL` como secrets          | Feito      | #19                          |
| Workflow com testes antes do scan                      | Feito      | #19                          |
| Analise verde no painel                                | Feito      | #19                          |
| Evidencia de cobertura anexada ao relatorio da T1      | Pendente   | #17                          |
| Limpar os 14 code smells de `services/`                | Pendente   | issue propria, **nao** a #19 |
| `LICENSE` no repositorio                               | Nao existe | —                            |

A limpeza dos 14 code smells nao e parte do que a #19 pede — ela cobre a configuracao da analise, que
esta pronta. Por isso o PR fecha a #19 e **nao** deve fechar a issue de limpeza: os 12 `S2223` sao
proibidos pelo `AGENTS.md` §4.3 e os 2 `parseFloat` ficam em `transactionService.js:53,91`. Vale
uma issue separada, que e o que a coluna acima pressupoe.
