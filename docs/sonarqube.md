# SonarQube

Análise estática do SpendSmart no servidor SonarQube Community Build hospedado pelo LABENS (UFRN).
Cobre a parte extra da Tarefa 01 da disciplina de Testes de Software.

> **Estado atual: configurado e rodando.** O projeto `spendsmart` existe no LABENS, o
> `sonar-project.properties` está na raiz do repositório e `.github/workflows/sonar.yml` roda a
> análise a cada push em `main` e a cada pull request. Resultados em
> `http://labens.dct.ufrn.br/sonarqube/dashboard?id=spendsmart`.

---

## 1. Servidor

| Item                       | Valor                                      |
| :------------------------- | :----------------------------------------- |
| URL do servidor            | `http://labens.dct.ufrn.br/sonarqube`      |
| Versão                     | SonarQube Community Build 26.1.0.118079    |
| Project key                | `spendsmart`                               |
| Autenticação               | GitHub OAuth (`Log in with GitHub`)        |
| Organização obrigatória    | `EngSoft-BSI-Hub`                          |
| Grupo concedido após login | `es2-users` (permite rodar o SonarScanner) |
| Função extra da disciplina | Não compõe a nota da T1                    |

A versão foi lida do próprio servidor, em `api/system/status`, e não do material da disciplina. O
guia distribuído cita `25.12.0.117093`, que era a versão vigente quando ele foi escrito.

`http://` e `https://` respondem igualmente; o scanner funciona nas duas.

---

## 2. Configurar acesso

Feito uma vez, na conta pessoal.

1. Confirmar que a conta GitHub é membro da organização `EngSoft-BSI-Hub`. Sem isso o primeiro login
   não concede o grupo `es2-users` e o scanner é recusado. Não há contorno local.
2. `http://labens.dct.ufrn.br/sonarqube/` -> **Log in with GitHub**.
3. No primeiro login o usuário entra automaticamente no grupo `es2-users`.
4. **My Account -> Security -> Generate Tokens**, com escopo no projeto `spendsmart` e permissão de
   execução de análise.
5. O token aparece **uma única vez**. Depois disso só é possível rotacionar.

### Por que projeto criado manualmente, e não importado

O SonarQube oferece três vias: _Import from DevOps Platforms_ (GitHub, GitLab, Azure DevOps,
Bitbucket), _Local Project_ e criação por API. O projeto foi criado como **Local Project**.

A via de import exige que um administrador configure a integração da plataforma no nível **global**
da instância. Uma instância compartilhada de universidade raramente tem isso. Além disso, o projeto
importado fica _bound_ ao repositório, o que traz dois problemas aqui:

- O `projectKey` seria gerado automaticamente no formato `organizacao_repositorio`, e não seria o
  `spendsmart` limpo.
- Binding não é o que a disciplina pede, e adiciona dependência de permissão que não existe.

### O projectKey é escolhido, mas não é qualquer string

O `projectKey` é digitado na criação e precisa ser único **na instância**. Como o LABENS é
compartilhado, `spendsmart` colide se outro aluno já usou a mesma chave — e nesse caso o Sonar cria
`spendsmart_1` e a análise sobe num projeto que não é o seu, sem erro visível.

Regras de formatação, validadas pelo `ComponentKeys.java`:

- Caracteres alfanuméricos, `-`, `_`, `.` e `:`.
- Pelo menos um caractere não numérico.
- Sem espaço, sem barra e sem acento. O `/` foi removido de propósito na 7.9.3.

O valor é conferido em **Projects -> `spendsmart` -> Administration -> General Settings**, que é a
única fonte da verdade. O `sonar-project.properties` precisa bater com ele.

---

## 3. `sonar-project.properties`

O exemplo distribuído pela disciplina é para **Python** (Django + `coverage.xml`). Quatro chaves
mudam de nome e três não se aplicam:

| Chave                         | Exemplo Python                                   | Versão deste projeto                                     |
| :---------------------------- | :----------------------------------------------- | :------------------------------------------------------- |
| `sonar.language`              | `py`                                             | `js`                                                     |
| `sonar.sources`               | `.` (repositório inteiro)                        | `services` — ver §4                                      |
| `sonar.test.inclusions`       | `**/test_**.py`                                  | `**/*.test.js`                                           |
| Relatório de cobertura        | `sonar.python.coverage.reportPaths=coverage.xml` | `sonar.javascript.lcov.reportPaths=coverage/lcov.info`   |
| `sonar.sources.inclusions`    | `**/**.py`                                       | removida — filtro desnecessário com `sources` específico |
| `sonar.python.coveragePlugin` | `cobertura`                                      | removida — não se aplica a JavaScript                    |
| `sonar.scm.provider`          | `git`                                            | mantido                                                  |
| `sonar.sourceEncoding`        | `UTF-8`                                          | mantido                                                  |

Conteúdo efetivo, idêntico ao que está no repositório:

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

### Por que não há `sonar.exclusions`

O exemplo do professor tem nove padrões: `**/tests/**`, `docs/**`, `sigarte/**`, `**/static/**`,
`**/templates/**`, `**/migrations/**`, `**/__pycache__/**`, `**/admin.py`, `**/__init__.*`,
`manage.py`. São específicos de um projeto Django.

Com `sonar.sources=services`, a pasta `services/` tem quatro arquivos `.js` e nada mais, então as
nove exclusões seriam inertes. Padrões que não fazem nada são piores do que a ausência deles: sugerem
uma configuração mais cuidadosa do que a real.

Dois pontos de comportamento que valem registrar:

- **O Sonar respeita o `.gitignore` automaticamente.** `node_modules/` e `coverage/` já estão
  ignorados (`.gitignore:7`), então não precisam aparecer em `sonar.exclusions`. O comportamento pode
  ser desligado com `sonar.scm.exclusions.disabled=true`, o que não é o caso aqui.
- **Exclusões e inclusões só reduzem o conjunto analisável**, nunca aumentam. Sobrepostas entre as
  duas categorias dão precedência a `sonar.exclusions`.

---

## 4. `sonar.sources=services`, e não o repositório inteiro

Esta é a decisão com consequência no resultado, então fica registrada em detalhe.

### A aritmética

O `jest.config.js` mede apenas `services/`:

```js
collectCoverageFrom: ["services/**/*.js"]
```

O `lcov` gerado tem quatro arquivos e 348 linhas. Se `sonar.sources` fosse o repositório inteiro,
o denominador cresceria sem o numerador acompanhar:

| Diretório    | Arquivos | Linhas    | No LCOV |
| :----------- | :------- | :-------- | :------ |
| `services`   | 4        | 348       | sim     |
| `pages`      | 12       | 1.834     | não     |
| `components` | 3        | 112       | não     |
| `infra`      | 3        | 82        | não     |
| `supabase`   | 2        | 155       | não     |
| **Total**    | **24**   | **2.531** | **4**   |

O painel mostraria cerca de **14% de cobertura**, não 100%. Não é bug: é a divisão de 348 por 2.531.
Pedir para medir 2.531 linhas e entregar prova de 348 produz um número que não descreve nem o código
nem os testes.

### O efeito colateral que precisa ser dito em voz alta

O painel exibe **0% de duplicação**. Isso é verdadeiro dentro do escopo, e a duplicação real do
projeto existe: cerca de 1.100 linhas repetidas entre `pages/gastosPage.js` e `pages/rendaPage.js`,
registradas em #6 e #22. Elas não aparecem porque `pages/` está fora de `sonar.sources`.

Resposta honesta se a dúvida vier: _"A análise está escopada em `services/`, que é o único diretório
com cobertura medida. A duplicação entre as páginas existe e está registrada em #6 e #22, fora do
escopo desta frente."_

### Ampliar o escopo

Ampliar é um commit isolado: acrescentar `pages` e `components` em `sonar.sources` e em
`collectCoverageFrom`. O efeito imediato é a cobertura do projeto cair para a faixa real, e a
duplicação de `pages/` passar a ser medida como "não coberta" — o que mistura "código não testado"
com "código que ninguém pediu para testar ainda".

A entrada 19 do [tooling-decisions.md](tooling-decisions.md) registra essa aritmética, e a issue #33
(e não o Sonar) é o que mantém o front-end sem cobertura visível.

---

## 5. Relatório de cobertura

O SonarQube **não executa testes**. É um analisador estático: lê código-fonte e lê arquivos de
relatório. `sonar.javascript.lcov.reportPaths` é literalmente um caminho para abrir e ler. Se o
arquivo não estiver lá, o scanner avisa e segue:

```text
INFO: No LCOV files were found using coverage/lcov.info
WARN: No coverage information will be saved because all LCOV files cannot be found.
```

Não há fallback nem inferência. O caminho feliz, no log da primeira análise:

```text
INFO: Sensor JavaScript/TypeScript Coverage [javascript]
INFO: Analysing [.../SpendSmart/coverage/lcov.info]
INFO: Sensor JavaScript/TypeScript Coverage [javascript] (done) | time=22ms
```

`Analysing` com caminho absoluto e **sem** `WARN` de "Could not resolve file paths" significa que o
arquivo foi localizado e todos os caminhos foram casados.

### Por que o workflow roda os testes antes do scan

`coverage/` está no `.gitignore` (`.gitignore:7`) e nunca foi versionado — `git log --all -- coverage`
retorna vazio. Um workflow que só faz checkout e chama o scanner **não tem o arquivo**, e o resultado
é uma análise bem-sucedida com 0% de cobertura.

Esse é o modo de falha mais ingrato possível: o job dá **verde**, o painel mostra o projeto, e só o
número principal vem zerado.

A correção é rodar `npm ci` e `npm run test:coverage` no mesmo job, antes do scan. É o que
`.github/workflows/sonar.yml` faz. O efeito colateral desejado: cada relatório corresponde ao código
exato que foi analisado, e um commit com teste quebrado interrompe o pipeline antes da análise.

`npm run test:coverage` já produz `coverage/lcov.info` via `coverageReporters` (`jest.config.js:16`),
e o mesmo comando roda no Ubuntu no workflow `test.yml`. Não há risco de formato.

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

### Quatro decisões do YAML

**`sonarqube-scan-action@v7`, não `@v6` nem `@v8`.** O LABENS roda a série 26. A `v6` foi reescrita
de Bash para JavaScript e mudou a forma de parsear `args`; a documentação da série 26.2 usa `v7`, que
acompanha o SonarScanner CLI 8.x. A `v8.2.1` existe, mas não há ganho conhecido para este caso.

**`checkout@v5`, não `@v6`.** A `v6` move as credenciais para `$RUNNER_TEMP` e exige runner
`>= 2.327.1`. O changelog é explícito: workflow não precisa mudar. Os jobs são Ubuntu, sem container
e sem `git push`, então não há ganho em subir. O `AGENTS.md` §8 proíbe introduzir mudança de tooling
sem justificativa.

**`fetch-depth: 0`.** Obrigatório. Sem ele o clone é raso, e o Sonar não consegue ler o histórico Git
para blame nem para calcular código novo. O log mostra `SCM Publisher 8/8 source files have been
analyzed`, que só é possível com histórico completo.

**`secrets.`, não `vars.`, para `SONAR_HOST_URL`.** O template do SonarSource usa `vars.` para o host e
`secrets.` para o token. No LABENS os dois foram gravados como **secret**, então
`${{ vars.SONAR_HOST_URL }}` resolveria para string vazia e o scanner falharia com erro de URL inválida
— sem que a mensagem aponte a causa. Os dois prefixos funcionam com o que está gravado, e o host não é
informação sensível. A distinção importa para o token, que precisa ficar mascarado nos logs.

### Push em branch diferente de `main` não dispara

O trigger `push` filtra `branches: [main]`. Um push na branch de trabalho **não** executa a análise;
ela sobe na abertura do pull request. Isso é intencional, e evita uma análise por push em rascunho.

### Pull request de fork não tem análise

Secrets não são expostos a pull requests de forks. O job falha por falta de token, que é o
comportamento correto — falha em vez de vazar. Não é um workflow quebrado.

---

## 7. Resultado da primeira análise

Commit `ab5e87e`, 8 arquivos indexados (4 de `services/` mais 4 arquivos de teste).

| Métrica          | Valor |
| :--------------- | :---- |
| Cobertura        | 100%  |
| Duplicação       | 0%    |
| Bugs             | 0     |
| Vulnerabilidades | 0     |
| Code smells      | 14    |

Os 14 code smells são de duas regras:

| Regra                                  | Qtd. | Onde                                            |
| :------------------------------------- | :--- | :---------------------------------------------- |
| `S2223` — catch só relança             | 12   | `try { } catch (e) { throw e; }` em `services/` |
| `Number.parseFloat` sobre `parseFloat` | 2    | `transactionService.js:53` e `:91`              |

O padrão `try { } catch (e) { throw e; }` é proibido pelo `AGENTS.md` §4.3. Os 12 casos foram
verificados um a um: nenhum tem `finally` e nenhum tem lógica no `catch` além do `throw`, então
remover o `try/catch` é semanticamente idêntico. Limpar os 14 é um PR separado do de infraestrutura.

---

## 8. Ruído conhecido no log

Três mensagens aparecem a cada execução e nenhuma delas é do código do projeto.

| Mensagem                                                          | Origem                                                 | Efeito                                     |
| :---------------------------------------------------------------- | :----------------------------------------------------- | :----------------------------------------- |
| `ERROR [baseline-browser-mapping] data is over two months old`    | Transitivo do plugin SonarJS 11.7.1, no Node embarcado | Nenhum. Logado como ERROR e não interrompe |
| `Warning: Skipping GPG signature verification`                    | Container da `sonar-scanner-cli`                       | Nenhum                                     |
| `[DEP0040] DeprecationWarning: The punycode module is deprecated` | `eslint` -> `ajv@6` -> `uri-js` -> `punycode@2`        | Nenhum. Aviso no post-job                  |

O `punycode` vem do ESLint fixado na série 9 pela entrada 1 do
[tooling-decisions.md](tooling-decisions.md). Forçar a versão por `overrides` adicionaria dependência
sem justificativa e mascararia um aviso de terceiro.

O `baseline-browser-mapping` não pode ser corrigido deste repositório: o plugin do Sonar executa com o
Node que ele mesmo instala em `/home/runner/.sonar/js/node-runtime`.

---

## 9. Se o projeto virar público de verdade

O plano OSS do SonarQube Cloud é gratuito para repositórios públicos com licença open source, sem
limite de linhas, e inclui análise de branch e de pull request. Nestas condições o LABENS deixa de
ser necessário.

| Momento     | Servidor                     | Motivo                                               |
| :---------- | :--------------------------- | :--------------------------------------------------- |
| Tarefa 01   | LABENS, projeto `spendsmart` | Exigido pela disciplina. Configurado e rodando.      |
| Projeto OSS | SonarQube Cloud, plano OSS   | Gratuito, sem dependência de instância universitária |

A transição exige três coisas, e nenhuma delas é reutilizável do setup atual:

1. Um arquivo `LICENSE` no repositório. O plano OSS é para projeto público **com licença**; um repo
   público sem licença pode ser classificado como privado e cair no plano Free (até 50k LOC).
2. Criar a organização no SonarQube Cloud e escolher o plano OSS.
3. **Token novo e host novo.** Servidores diferentes têm tokens diferentes. O token do LABENS não
   funciona no Cloud, e vice-versa.

O `sonar-project.properties` é reaproveitado sem alteração; só `-Dsonar.host.url` muda, porque host
e token nunca entram no arquivo versionado.

---

## 10. Pendências

| Item                                                   | Estado     | Onde                         |
| :----------------------------------------------------- | :--------- | :--------------------------- |
| Projeto `spendsmart` criado no painel do LABENS        | Feito      | #19                          |
| `sonar-project.properties` na raiz, escopo `services/` | Feito      | #19                          |
| `SONAR_TOKEN` e `SONAR_HOST_URL` como secrets          | Feito      | #19                          |
| Workflow com testes antes do scan                      | Feito      | #19                          |
| Análise verde no painel                                | Feito      | #19                          |
| Evidência de cobertura anexada ao relatório da T1      | Pendente   | #17                          |
| Limpar os 14 code smells de `services/`                | Pendente   | issue própria, **não** a #19 |
| `LICENSE` no repositório                               | Não existe | —                            |

A limpeza dos 14 code smells não é parte do que a #19 pede — ela cobre a configuração da análise, que
está pronta. Por isso o PR fecha a #19 e **não** deve fechar a issue de limpeza: os 12 `S2223` são
proibidos pelo `AGENTS.md` §4.3 e os 2 `parseFloat` ficam em `transactionService.js:53,91`. Vale
uma issue separada, que é o que a coluna acima pressupõe.
