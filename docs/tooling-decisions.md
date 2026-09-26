# Log de decisoes de ferramenta

Registro das decisoes de ferramenta do SpendSmart, com o motivo de cada uma. A ideia e que uma
pessoa — ou um agente — que chegue depois nao precise redescobrir por tentativa e erro por que o
projeto esta configurado assim.

Cada entrada tem quatro partes: a decisao, o motivo, a alternativa que foi descartada e a condicao
para rever. Onde a decisao veio de um problema concreto, o erro original esta citado.

Nomes de arquivo em ingles, conteudo em portugues, sem acentos — a mesma convencao de
[test-plan.md](test-plan.md) e do [README](../README.md).

---

## 1. ESLint 9, e nao ESLint 10

**Decisao.** `eslint@^9.39.5` em vez da versao 10 mais recente.

**Por que.** O ESLint 10 foi instalado primeiro e quebrou em qualquer arquivo lintado, inclusive
em arquivo isolado:

```
TypeError: scopeManager.addGlobals is not a function
    at addDeclaredGlobals (eslint/lib/languages/js/source-code/source-code.js:221:15)
    at Linter.verifyAndFix (eslint/lib/linter/linter.js:1569:20)
```

O `eslint-config-next@16.3.6` traz `typescript-eslint@8.70.1`, e o gerenciador de escopo devolvido
pelo parser nao implementa `addGlobals`, que o ESLint 10 passou a exigir. O detalhe que atrasa o
diagnostico: o `peerDependencies` do `typescript-eslint@8.70.1` declara
`eslint: "^8.57.0 || ^9.0.0 || ^10.0.0"`, entao o aviso de dependencia conflitante **nao aparece**.
A combinacao esta declarada como suportada e nao funciona.

O erro e silencioso quando a execucao passa por um filtro que nao casa com nenhum arquivo: `eslint .`
pode terminar com codigo 0 e zero problemas sem nunca ter lido um arquivo. Para diagnosticar, e
preciso rodar em um arquivo nomeado e capturar stderr em arquivo — o PowerShell mistura a saida de
erro do node com a saida normal e esconde a mensagem.

**Alternativa rejeitada.** Manter o ESLint 10. Nao ha versao estavel do `typescript-eslint` que
corrija isso; existem apenas alphas. Reinstalar a cada release e um custo recorrente nao justificado
por um numero de versao.

**Reavaliar quando.** `typescript-eslint` publicar uma estavel com suporte funcional ao ESLint 10.
Verificar com `npx eslint <arquivo> ; echo $LASTEXITCODE` antes de subir, e nao apenas pela faixa de
`peerDependencies`.

---

## 2. O Babel fica dentro do jest.config.js

**Decisao.** O preset fica no `transform` do `jest.config.js`. Nao existe `babel.config.js` na raiz.

```js
transform: {
  "^.+\\.jsx?$": [
    "babel-jest",
    { presets: [["@babel/preset-env", { targets: { node: "current" } }]] },
  ],
},
```

**Por que.** Um `babel.config.js` na raiz e detectado pelo Next.js, que passa a usar Babel no lugar
do SWC em todo o desenvolvimento e em todo o build. Isso vale para quem roda `next dev`, mesmo sem
nunca executar um teste. Configurando o preset dentro do Jest, o Next continua no SWC e so o Jest
converte.

**Alternativa rejeitada.** `babel.config.js` na raiz, que e o que o
[plano de testes](test-plan.md) recomendava antes desta revisao. A recomendacao foi corrigida.

**Reavaliar quando.** Nunca, enquanto o projeto usar Next.js com SWC.

---

## 3. `npm test` nao sobe Docker

**Decisao.** `test` roda apenas `tests/unit`. A integracao tem script proprio.

**Por que.** Se o teste padrao depender de um container, tres coisas quebram: quem acabou de clonar
o repositorio nao roda um teste sem instalar e abrir o Docker Desktop; o job de CI precisa subir
containers fora do mecanismo suportado, o que e mais lento e falha mais; e um teste de integracao
quebrado derruba tambem os testes de unidade, que nao tem relacao com ele. No GitHub Actions o
Postgres entra como _service container_, que e a forma suportada e dispensa daemon.

**Alternativa rejeitada.** Um unico `npm test` que sobe o compose.

**Reavaliar quando.** A integracao passar a ser rapida e obrigatoria para todo commit. Ate la,
`test:unit` no push e `test:integration` no job proprio.

---

## 4. `test:coverage` mede so a unidade

**Decisao.** `test:coverage` executa `jest --coverage tests/unit`.

**Por que.** O relatorio LCOV alimenta o SonarQube. Migration nao e codigo JavaScript, entao rodar
a integracao nao muda o numero de cobertura. Medir so a unidade mantem o passo de analise estatica
rapido e independente de Docker.

**Alternativa rejeitada.** Medir tudo, o que tornaria o artefato de cobertura dependente do job de
integracao.

**Reavaliar quando.** Houver codigo JavaScript exercitado apenas por teste de integracao. Ate la,
aumentar a base sem aumentar a medicao so produz numero menor, nao informacao nova.

---

## 5. Sem `coverageThreshold`

**Decisao.** Nao ha piso de cobertura no `jest.config.js`.

**Por que.** Um piso que falha o build no primeiro dia entrega um CI vermelho, e um CI vermelho
comecado e desativado. A cobertura medida e publicada primeiro; o piso vem depois, com base no
numero real.

**Alternativa rejeitada.** Comecar com um piso arbitrario, tipo 80%. Ninguem sabe ainda o quanto do
`services/` e alcancavel por teste de unidade sem mockar demais.

**Reavaliar quando.** Apos a suite de unidade estar completa. Ate la, `docs/test-evidence.md`
reporta o numero e nao reprova ninguem.

---

## 6. Prettier com `endOfLine: "lf"`

**Decisao.** `"endOfLine": "lf"` em `.prettierrc`.

**Por que.** O repositorio e FNUE#!/usr/bin/env para
desenvolvido no Windows e o GitHub Actions roda em Linux. O Git normaliza para CRLF ao checar out
no Windows, mas o conteudo do commit e LF. Sem a opcao fixada, o Prettier formata diferente
dependendo da maquina: `prettier --check` passa na sua e falha no CI, e nenhum dos dois esta errado.

**Alternativa rejeitada.** `"auto"`, que segue o que o editor ja gravou. E exatamente o
comportamento que produz a divergencia.

**Pendencia.** O `.editorconfig` declara apenas `indent_style = space` e `indent_size = 2`. Faltam
`end_of_line`, `insert_final_newline`, `trim_trailing_whitespace` e `charset`, que sao as chaves que
alinhariam o editor com o Prettier. Um editor que respeita o `.editorconfig` pode gravar CRLF em um
arquivo que o Prettier exigiria em LF. A correcao esta pendente.

**Reavaliar quando.** Nunca. LF e o padrao correto para um repositorio com CI em Linux.

---

## 7. `.prettierignore` nao e `.gitignore`

**Decisao.** Os dois arquivos existem, com papeis distintos.

**Por que.** `.gitignore` responde "isto nao entra no commit". `.prettierignore` responde "isto nao e
formatado". Um arquivo pode estar versionado e ainda assim nao ser formatado, que e o caso do
`package-lock.json`: precisa ser commitado, mas nunca formatado, porque o npm o regenera e a
disputa seria eterna. O Prettier so ignora `node_modules` por padrao, entao sem o arquivo ele
verifica `package-lock.json` e a pasta `.next`.

**Alternativa rejeitada.** Depender do `.gitignore`. O Prettier nao o le.

**Reavaliar quando.** Nunca. A lista so cresce, conforme entram ferramentas.

---

## 8. Commitlint no `commit-msg`, lint-staged no `pre-commit`

**Decisao.** Os dois hooks do Husky, cada um com uma funcao.

```
.husky/pre-commit  ->  npx --no-install lint-staged
.husky/commit-msg  ->  npx --no-install commitlint --edit "$1"
```

**Por que.** Conventional Commit e validado no `commit-msg`, e nao no `pre-commit`. O `pre-commit`
dispara antes de o Git montar a mensagem, entao nao existe arquivo para o commitlint ler. Trocar os
dois nao produz erro visivel: o commitlint recebe caminho vazio e nao valida nada, e o lint-staged
recebe o arquivo de mensagem como padrao e nao formata nada. Os dois hooks passam a nao fazer nada sem
avisar.

**Alternativa rejeitada.** Colocar o commitlint no `pre-commit`, que foi a ideia inicial.

**Reavaliar quando.** Nunca. E a ordem que o Git define.

---

## 9. `no-alert` e `react-hooks/exhaustive-deps` rebaixadas para aviso

**Decisao.** Duas regras do `eslint-config-next` lowered de `error` para `warn`, cada uma com
comentario citando a issue que trata a causa.

**Por que.** O baseline apurado com o ESLint funcionando e de **1 erro e 21 avisos**:

| Regra                         | Ocorrencias | Issue                                          |
| ----------------------------- | ----------- | ---------------------------------------------- |
| `no-alert`                    | 12          | #13, trocar `alert` por toast                  |
| `@next/next/no-img-element`   | 8           | sem issue ainda                                |
| `react-hooks/exhaustive-deps` | 1           | #24, `withAuth` nao escuta `onAuthStateChange` |
| `react/display-name`          | 1 erro      | `components/utils/withAuth.js:6`               |

Os 21 avisos sao defeitos reais ja conhecidos e rastreados. Rebaixar e melhor do que desligar: o
aviso continua aparecendo na saida e no relatorio, entao o numero nao some. Desligar a regra
resolveria o alerta apagando o sinal.

O erro de `display-name` e o unico que bloqueia `eslint .`, porque saida diferente de zero reprova
o job. Ele fica para decisao: a correcao natural e nomear o componente interno do HOC, o que e uma
mudanca de codigo, nao de configuracao.

**Alternativa rejeitada.** `eslint . --quiet`, que so mostraria erros. Esconderia os 21 avisos que
sao a rastreabilidade de 13 e 24.

**Reavaliar quando.** #13 e #24 forem fechadas, e a regra volta a `error`.

---

## 10. `services/authServices.js` entra na cobertura, com teste

**Decisao.** O arquivo nao e mais excluido de `collectCoverageFrom`. Ele passa a ser medido, e a
cobertura vem de um teste que mocka `global.fetch` e `supabase.auth.signUp`.

**Por que.** A primeira versao desta decisao excluia o arquivo da medicao, com o argumento de que
`authServices.js:20` chama `fetch('/api/createProfile')` e nao existe servidor durante um teste de
unidade. O raciocinio estava certo e a conclusao estava errada: o `fetch` e mockavel do mesmo jeito
que o cliente Supabase. Excluir resolvia o sintoma do numero em vez de resolver o problema, e deixava
uma lacuna de teste justamente onde ha uma chamada de rede sem tratamento de erro.

Excluir da medicao tambem tem um efeito colateral ruim: o arquivo desaparece do relatorio, e
`sonar-project.properties` conta cobertura apenas a partir do LCOV. Arquivo ausente do LCOV conta
como zero no Sonar. Excluir e esconder.

**Alternativa rejeitada.** Deixar excluido e aceitar o numero menor.

**Reavaliar quando.** O teste existir. Ate la, o arquivo aparece no relatorio com 0%.

---

## 11. `cz` escreve a mensagem, `commitlint` valida

**Decisao.** `commitizen` com `cz-conventional-changelog`, invocado por `npm run commit`. O
`commit-msg` continua com commitlint.

**Por que.** Sao papeis complementares e nao redundantes. O `cz` pergunta tipo, escopo e descricao e
monta a mensagem, o que remove o atrito de lembrar a convencao e tambem ensina, porque as opcoes do
prompt sao a propria convencao. O commitlint continua necessario porque valida o que o `cz` nao
cobre: mensagem escrita a mao, `git commit --amend`, e merge.

**Alternativa rejeitada.** So o commitlint, que recusa a mensagem mas nao ajuda a escreve-la.

**Reavaliar quando.** Nunca. Os dois se completam.

---

## 12. CI em Node 24

**Decisao.** Todos os workflows usam Node 24.

**Por que.** `@babel/core@8.0.6` declara `engines: { node: "^22.18.0 || >=24.11.0" }`. O workflow
anterior fixava Node 20, que esta fora da faixa. Alem disso, Node 20 saiu de manutencao.

**Alternativa rejeitada.** Node 22, que satisfaz a faixa. Fica mais perto do fim de vida do Node 24 e
nao traz vantagem aqui.

**Reavaliar quando.** O Babel ou o Jest mudarem de requisito de engine.

---

## 13. Regra de conteudo nao vira regra de ferramenta

**Decisao.** Nao ha linter para Markdown. As regras de conteudo dos documentos ficam escritas e
aplicadas por revisao.

**Por que.** A regra do projeto — nao escrever comentario a menos que o comentario explique um
porque, e nao afirmar que algo funciona sem indicar como foi verificado — e julgamento de conteudo.
Nenhuma ferramenta vai decidir se um comentario explica um porque. O que da para automatizar e o
mecanico do Markdown, com `markdownlint`, e isso nao substitui revisao.

O Prettier ja formata `*.md`, `*.css` e `*.json` pelo `lint-staged`. O ESLint e so JavaScript e JSX,
e nao tem como ser diferente: e um analisador de codigo.

**Alternativa rejeitada.** `markdownlint`. Pode ser adicionado, mas e uma dependencia a mais para
pouco ganho, e nao verifica a regra que importa.

**Reavaliar quando.** A escrita dos documentos virar trabalho repetitivo o suficiente para o custo
de revisar justificar uma ferramenta.

---

## 14. O `cz` e o Conventional Commit sao o mesmo padrao

**Decisao.** O `commitlint.config.js` estende apenas `@commitlint/config-conventional`.

**Por que.** Vale registrar porque a combinacao e contraditoria na aparencia: o projeto fala em
convencao em portugues, e o padrao Conventional Commit define os tipos em ingles
(`feat`, `fix`, `refactor`, `test`, `chore`, `docs`). A mensagem fica em portugues, o tipo fica em
ingles. `docs: reescreve a documentacao` e Conventional valido, mesmo com a descricao sem acento.

**Alternativa rejeitada.** Traduzir os tipos. Nao existe tipo padronizado correspondente, e o
commitlint nao conheceria os nomes.

**Reavaliar quando.** Nunca. E o padrao da disciplina.
