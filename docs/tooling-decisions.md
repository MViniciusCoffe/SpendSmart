# Log de decisoes de ferramenta

Registro das decisoes de ferramenta do SpendSmart, com o motivo de cada uma. A ideia e que uma
pessoa — ou um agente — que chegue depois nao precise redescobrir por tentativa e erro por que o
projeto esta configurado assim.

Cada entrada tem quatro partes: a decisao, o motivo, a alternativa que foi descartada e a condicao
para rever. Onde a decisao veio de um problema concreto, o erro original esta citado.

Nomes de arquivo em ingles, conteudo em portugues. A ausencia de acentos neste arquivo **nao e uma
convencao adotada** — e residuo de geracao automatica que nao foi revisado. Os demais documentos
devem seguir a mesma forma ate que a correcao seja feita de proposito.

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

**Por que.** O repositorio e desenvolvido no Windows e o GitHub Actions roda em Linux. O Git
normaliza para CRLF ao checar out no Windows, mas o conteudo do commit e LF. Sem a opcao fixada, o
Prettier formata diferente dependendo da maquina: `prettier --check` passa na sua e falha no CI, e
nenhum dos dois esta errado.

**Alternativa rejeitada.** `"auto"`, que segue o que o editor ja gravou. E exatamente o
comportamento que produz a divergencia.

**Alinhamento com o editor.** O `.editorconfig` declara `indent_style`, `indent_size`,
`end_of_line = lf`, `charset = utf-8`, `trim_trailing_whitespace` e `insert_final_newline`. As
quatro ultimas foram adicionadas junto com o Prettier, em 2026-09: um editor que respeita o
`.editorconfig` gravava CRLF em um arquivo que o Prettier exige em LF, e a divergencia reaparecia
antes de chegar ao commit.

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

## 12. CI em Node 24, e `engines` no `package.json`

**Decisao.** Todos os workflows usam `node-version: 24`, e o `package.json` declara
`"engines": { "node": ">=24.11.0" }`.

**Por que.** Sem `engines`, cada ambiente escolhe a propria versao de Node e eles divergem: o
`setup-node` dos workflows, a maquina de desenvolvimento, e a Vercel. O motivo da escolha nao foi
teorico — 366 pacotes do `package-lock.json` declaram `engines.node` e o CI estava rodando em Node
20, fora da faixa da maioria deles:

| Pacote                    | `engines.node`            | Consequencia em Node 20      |
| ------------------------- | ------------------------- | ---------------------------- |
| `@babel/core@8.0.6`       | `^22.18.0 \|\| >=24.11.0` | O preset que o Jest usa      |
| `@supabase/supabase-js@2` | `>=22.0.0`                | **Dependencia de producao**  |
| `lint-staged@17.5.1`      | `>=22.22.1`               | Roda no `pre-commit`         |
| `next@16.3.5`             | `>=20.9.0`                | O unico que aceitava Node 20 |

O `npm ci` emitia cerca de 99 avisos `EBADENGINE` e completava assim mesmo: o aviso nao impede a
instalacao, entao nada quebra e nada aponta a causa. O caso do `@supabase/supabase-js` e o mais
serio, porque e dependencia de **producao** — o CI nao falha por rodar Node 20, mas o primeiro
teste de integracao que invocar o cliente real (issue
[#16](https://github.com/MViniciusCoffe/SpendSmart/issues/16)) falha por engine.

Declarar `engines` faz tres coisas de uma vez: documenta o minimo, faz o npm avisar quem instala
fora da faixa, e passa a ser a fonte que a Vercel respeita. O limite `>=24.11.0` e o piso do
`@babel/core@8` transcrito, nao um numero escolhido: Babel 8 exige `24.11`, nao `24.0`.

**Alternativa rejeitada.** Node 22, que satisfaz a faixa do Babel. Fica mais proximo do fim de vida
e nao traz vantagem aqui. Tambem rejeitado: nao declarar `engines` e confiar no `setup-node` de
cada workflow — e o que permitia a divergencia entre os ambientes.

**Reavaliar quando.** O Babel ou o Jest mudarem de requisito de engine. Se `engines` deixar de
cobrir a versao que a Vercel usa, o numero tem de mudar nos tres lugares juntos:
`package.json`, `test.yml` e `lint.yml`.

---

## 13. Os avisos de `npm ci` sobre Babel e glob sao aceitaveis

**Decisao.** Nao ha `overrides` no `package.json`, nao ha `legacy-peer-deps`, e a saida do
`npm ci` e deixada como esta. Os avisos nao sao limpos.

**Por que.** Ha tres grupos de aviso, e nenhum deles e problema do projeto. Registrar e o que
evita que alguem tente "resolver" da proxima vez.

### `ERESOLVE` — `@babel/core` 8 contra plugins do Babel 7 (cerca de 12 avisos)

O `babel-preset-current-node-syntax@1.2.0` chega como dependencia do Jest 30 e declara
`peerDependencies: { "@babel/core": "^7.0.0-0" }`. O `package.json` declara
`"@babel/core": "^8.0.6"`, e o `@babel/preset-env` 8 usado no `jest.config.js:56` exige a 8. Sao
incompativeis por declaracao.

As duas versoes **coexistem e funcionam**. O `npm` aninha a 7 onde o Jest precisa dela
(`node_modules/@jest/transform/node_modules/@babel/core@7.29.7`) e mantem a 8 na raiz, que e a que
o `preset-env` resolve. Os 65 testes passam com essa configuracao, entao nao ha defeito, e apenas
declaracao conflitante.

A causa e externa: o Jest 30 ainda nao suporta Babel 8, e o plugin de sintaxe ainda declara peer
dependente da 7. Corrigir aqui significaria forcar a 7 por `overrides`, o que rebaixaria o
`@babel/preset-env` da raiz e poderia mudar a transpilacao dos testes — um risco real de regressao
em troca de silenciar log.

### `deprecated` — `inflight@1.0.6` e `glob` versoes antigas

Todas as versoes citadas sao **transitivas** e nenhuma esta no `package.json`. `inflight` vem pelo
Jest; as varias versoes de `glob` vem de dependencias com faixas diferentes entre si. Um projeto com
942 pacotes e sete copias de `glob` e o estado normal do ecossistema Jest, nao um descuido. O
`package.json` ja tem `glob@^13.0.6` na raiz, que e a versao atual.

### `deprecated` — `eslint@9.39.5` sem suporte

Este e o unico aviso que **nao** pode ser resolvido hoje. A serie 9 esta em manutencao e o `latest`
e `10.11.0`. O bloqueio e o mesmo descrito na secao 1 deste documento:
`typescript-eslint@8.70.1` nao implementa `scopeManager.addGlobals`, exigido pelo ESLint 10. Como o
`peerDependencies` dele declara suporte a `^10.0.0`, **nao ha aviso de conflito que indique o
problema** — a combinacao esta declarada como suportada e quebra em tempo de execucao.

**Alternativa rejeitada.** `overrides` forcando `@babel/core: 7.x` para eliminar os `ERESOLVE`.
Rejeitada porque mexe em transpilacao funcionando para ganho puramente estetico. Tambem
rejeitada: `legacy-peer-deps=true`, que desliga o aviso sem resolver a causa e Tourna qualquer
incompatibilidade futura silenciosa. Tambem rejeitada: subir o ESLint 10 com `overrides` no
`typescript-eslint`, que repete o mesmo problema em outra dependencia.

**Reavaliar quando.** O Jest 30 declarar suporte a Babel 8, ou o `eslint-config-next` relaxar a
faixa de `typescript-eslint` para uma versao estavel com suporte funcional ao ESLint 10. Ate la,
verificar se a suite continua verde e o unico criterio. E o aviso nao e vermelho: o `npm ci`
termina com codigo 0 e `found 0 vulnerabilities`.

---

## 14. A Vercel faz o deploy, o GitHub Actions so verifica

**Decisao.** Nao ha `vercel.json` no repositorio. O deploy e configurado no painel da Vercel, e o
GitHub Actions nao participa do deploy.

**Por que.** Vale registrar porque os dois nomes se confundem. A Vercel **nao usa GitHub Actions**.
O que aparece no repositorio GitHub depois de um push sao _checks_ — o resultado do build da Vercel
reportado no GitHub — e nao arquivos de workflow. Os dois arquivos em `.github/workflows/`,
`test.yml` e `lint.yml`, sao do GitHub Actions e existem para verificar qualidade antes do deploy.

Nao ha `vercel.json` porque a configuracao esta no painel, e a configuracao padrao da Vercel para
Next.js ja detecta o framework e o build command. Um arquivo so seria necessario para algo que o
padrao nao faz: `headers`, `rewrites`, `redirects`, ou uma funcao serverless. Nada disso existe no
projeto hoje.

A separacao de ambientes e feita pelo nome da branch, de forma implicita: `main` vira Production, e
qualquer outra branch vira Preview com URL propria.

**Alternativa rejeitada.** `vercel.json` com o build command explicito, so para tornar o
deploy legivel no repositorio. Rejeitada porque duplica a configuracao do painel em dois lugares,
que e o modo classico de divergirem.

**Reavaliar quando.** Surgir necessidade de `headers`, `rewrites` ou `redirects`. Ate la, o painel
e a fonte e o repositorio fica limpo. Se a configuracao do painel passar a ser relevante para
alguem que so tem acesso ao repositorio, ai entao vale exportar um `vercel.json`.

O que a Vercel **nao** resolve esta documentado em
[environments.md](environments.md): Production, Preview e desenvolvimento local apontam para o
mesmo projeto Supabase provisorio, e o mesmo `SUPABASE_SERVICE_ROLE_KEY` vale para os tres.

---

## 15. Regra de conteudo nao vira regra de ferramenta

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

## 16. O `cz` e o Conventional Commit sao o mesmo padrao

**Decisao.** O `commitlint.config.js` estende apenas `@commitlint/config-conventional`.

**Por que.** Vale registrar porque a combinacao e contraditoria na aparencia: o projeto fala em
convencao em portugues, e o padrao Conventional Commit define os tipos em ingles
(`feat`, `fix`, `refactor`, `test`, `chore`, `docs`). A mensagem fica em portugues, o tipo fica em
ingles. `docs: reescreve a documentacao` e Conventional valido, mesmo com a descricao sem acento.

**Alternativa rejeitada.** Traduzir os tipos. Nao existe tipo padronizado correspondente, e o
commitlint nao conheceria os nomes.

**Reavaliar quando.** Nunca. E o padrao da disciplina.

---

## 17. Todo `jest.mock` usa factory, e o falso nasce dentro dela

**Decisao.** Nao existe `jest.mock("caminho")` sem segundo argumento em `tests/`. E a factory nao
referencia nenhuma variavel declarada no arquivo de teste:

```js
jest.mock("../../infra/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: { getSession: jest.fn() }
  }
}))

import { supabase } from "../../infra/supabase"
```

**Por que.** Duas razoes, ambas verificadas com um sandbox fora do repositorio.

**Razao 1 — sem factory o modulo real executa.** `infra/supabase.js:6` chama `createClient` no
momento do import. Sem factory o Jest precisa inspecionar o modulo real para gerar o falso
automatico, e inspecionar significa executar. O resultado e `supabaseUrl is required` e
`Tests: 0 total` — a suite morre antes da primeira asercao.

**Razao 2 — a factory e hoisted, entao nao pode ler `const` do arquivo.** O
`babel-plugin-jest-hoist`, que vem com o `babel-jest`, sobe a chamada de `jest.mock` para o topo do
arquivo, acima dos imports e das declaracoes. Se a factory referenciar uma `const` do proprio
arquivo, ela ainda esta na zona morta temporal quando roda, e o erro e
`ReferenceError: Cannot access 'mockSupabase' before initialization`.

O falso e construido dentro da factory justamente para nao ter nada externo a resolver. Depois o
teste o reconfigura normalmente, com `.mockResolvedValue()`, porque `jest.fn()` e um objeto comum.

**Alternativa rejeitada.** Duas, ambas tentadas. `jest.mock` sem factory, que executa o modulo real.
E a factory que referencia um `const` externo — compila, e quebra em tempo de execucao.

**Correcao de registro.** Uma versao anterior deste documento afirmava que a variavel precisa se
chamar `mock*` por exigencia do plugin do Babel. Nao e verdade nesta configuracao: um teste com
`fakeSupabase` passou sem reclamar. O prefixo `mock` e convencao de leitura, herdada do `automock`
antigo. O que evita o erro e nao referenciar variavel externa.

**Reavaliar quando.** Nunca. E a forma correta de isolar um modulo com efeito de topo no import.

---

## 18. Gherkin e Cucumber ficam de fora

**Decisao.** Os testes de unidade sao Jest direto. Nao ha `features/`, nem cucumber-js, nem step
definitions.

**Por que.** Gherkin nao substitui o Jest — soma uma camada de traducao por cima dele. O
cucumber-js roda sobre o Mocha ou o Jest, entao adicionar nao remove nada do que ja existe. Cada
caso passa a existir em dois artefatos que precisam concordar: o `.feature` e o step definition em
JavaScript onde a asercao realmente mora. Se alguem editar o feature e esquecer o JavaScript, o
teste passa errado — que e o pior defeito que uma suite de teste pode ter.

O que o Gherkin resolve e comunicacao, nao execucao: ele existe para o cliente, o produto ou o
docente lerem e validarem sem ler codigo. O ganho depende inteiramente de existir essa audiencia.

`docs/test-plan.md` §4 ja cobre a rastreabilidade US / CT / RF em tabela Markdown, que faz o mesmo
papel de um feature file e e mais barata de manter num projeto com uma unica pessoa escrevendo.

**Alternativa rejeitada.** Gherkin em tudo. Rejeitada por duplicar a informacao sem aumentar a
cobertura.

**Reavaliar quando.** A disciplina exigir casos em formato `.feature` como entregavel. Nesse caso o
caminho barato e: manter os testes em Jest, e escrever os `.feature` **depois**, a partir dos testes
que ja existirem, para IT-01 a IT-10 e para os criterios de aceitacao. Nao reescrever a unidade em
Gherkin, porque e exatamente onde o ganho vira.prejuizo.

---

## 19. O SonarQube mede so `services/`, e os testes rodam antes do scan

**Decisao.** `sonar.sources=services`, sem `sonar.exclusions`, e `.github/workflows/sonar.yml` roda
`npm ci` e `npm run test:coverage` antes de chamar o `sonarqube-scan-action@v7`.

**Por que o escopo.** O `jest.config.js` mede apenas `services/` (`collectCoverageFrom`, entrada 4).
A entrada 4 ja havia registrado por que medir so a unidade: o artefato de cobertura nao pode depender
de um job que sobe Docker. A consequencia no Sonar e aritmetica, e ela precisa ficar escrita porque
o painel mostra 100% e isso sozinho nao prova nada.

| Diretorio    | Arquivos | Linhas | No LCOV |
| ------------ | -------- | ------ | ------- |
| `services`   | 4        | 348    | sim     |
| `pages`      | 12       | 1.834  | nao     |
| `components` | 3        | 112    | nao     |
| `infra`      | 3        | 82     | nao     |
| `supabase`   | 2        | 155    | nao     |

Com o repositorio inteiro em `sonar.sources`, o painel mostraria 348 / 2.531, ou seja cerca de 14%.
Nao e defeito de medicao: e pedir para medir 2.531 linhas e entregar prova de 348. Um relatorio que
so descreve o que foi testado e defensavel; um relatorio que mistura "codigo nao testado" com "codigo
que ninguem pediu para testar ainda" produz um numero que nao descreve nem um nem outro.

O efeito colateral e o **0% de duplicacao** no painel. A duplicacao real existe, cerca de 1.100
linhas repetidas entre `pages/gastosPage.js` e `pages/rendaPage.js`, e esta em #6 e #22. Ela nao
aparece porque `pages/` esta fora do escopo. Quem apresentar o resultado precisa dizer isso, senao o
0% e lido como "o projeto nao tem duplicacao".

**Por que rodar os testes antes do scan.** O SonarQube nao executa teste nenhum: e analisador
estatico, e `sonar.javascript.lcov.reportPaths` e um caminho para ele abrir e ler. Sem o arquivo, ele
avisa e segue:

```text
WARN: No coverage information will be saved because all LCOV files cannot be found.
```

`coverage/` esta no `.gitignore` e nunca foi versionado (`git log --all -- coverage` retorna vazio).
Um workflow que so faz checkout e chama o scanner produz uma analise **verde** com 0% de cobertura — o
modo de falha mais ingrata possivel, porque nada no log indica que o numero principal nao foi medido.

Rodar a cobertura no mesmo job tem dois efeitos colaterais desejados: cada relatorio corresponde ao
codigo exato analisado, e um commit com teste quebrado interrompe o pipeline antes da analise. O
custo e de cerca de 40 segundos de CI, porque o `npm ci` domina.

**Por que sem `sonar.exclusions`.** O exemplo da disciplina tem nove padroes especificos de Django
(`sigarte`, `manage.py`, `__init__.*`). Com `sonar.sources=services`, os quatro arquivos `.js` da
pasta sao tudo que existe no escopo, entao as nove exclusoes seriam inertes. Padrao que nao faz nada
e pior que padrao ausente: sugere uma configuracao mais cuidadosa do que a real. Vale registrar que
o Sonar ja respeita o `.gitignore` sozinho, entao `node_modules/` e `coverage/` vem de graca.

**Alternativa rejeitada.** `sonar.sources` com o repositorio inteiro. Numericamente correto e
descritivamente inutil.

**Reavaliar quando.** #33 for fechada. Ampliar o escopo e entao um commit isolado em dois arquivos
(`sonar.sources` e `collectCoverageFrom`), porque a cobertura do projeto cai para a faixa real e a
duplicacao de `pages/` passa a ser medida como nao coberta.

---

## 20. `sonarqube-scan-action@v7`, `checkout@v5`, e o host como secret

**Decisao.** `sonarqube-scan-action@v7` e `actions/checkout@v5`, com `fetch-depth: 0` e
`SONAR_HOST_URL` lido de `secrets.`, nao de `vars.`.

**Por que `@v7` e nao `@v6`.** A `v6` foi reescrita de Bash para JavaScript e passou a parsear `args`
de forma diferente, o que quebra workflow que passa argumentos. O LABENS roda a serie 26, e a
documentacao da serie 26.2 usa `v7`. A `v8.2.1` existe, mas nao ha ganho conhecido para um projeto
com quatro arquivos no escopo.

**Por que `checkout@v5` e nao `@v6`.** A `v6` move as credenciais para `$RUNNER_TEMP` e passa a exigir
runner `>= 2.327.1`. O changelog e explicito de que nao ha mudanca necessaria no workflow. Os jobs
sao Ubuntu, sem container e sem `git push`, entao nao ha ganho em subir. Este e o caso concreto do
`AGENTS.md` §8: dependencia nova sem justificativa.

**Por que `fetch-depth: 0`.** Sem clone completo o Sonar nao le o historico Git, e sem ele nao ha blame
nem calculo de codigo novo. O log da analise confirma: `SCM Publisher 8/8 source files have been
analyzed`.

**Por que `secrets.` e nao `vars.` para o host.** O template do SonarSource usa `vars.` para
`SONAR_HOST_URL` e `secrets.` para `SONAR_TOKEN`. No LABENS os dois foram gravados como secret, entao
`${{ vars.SONAR_HOST_URL }}` resolveria para string vazia e o scanner falharia com erro de URL
invalida — mensagem que nao aponta a causa, e custa uma execucao de CI para diagnosticar. Ambos os
prefixos funcionam com o que esta gravado; host nao e dado sensivel. A distincao importa para o token,
que precisa permanecer mascarado nos logs.

**Alternativa rejeitada.** Gravar `SONAR_HOST_URL` como repository variable para seguir o template ao
pe da letra. Custa um passo extra no setup e nao muda nada no resultado.

**Reavaliar quando.** O LABENS migrar de serie, ou a analise passar a rodar em pipeline que use
`args` com aspas — nesse caso conferir a sintaxe da documentacao da action vigente, porque mudou na
`v6` e pode mudar de novo.
