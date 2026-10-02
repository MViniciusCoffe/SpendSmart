# Log de decisões de ferramenta

Registro das decisões de ferramenta do SpendSmart, com o motivo de cada uma. A ideia é que uma
pessoa — ou um agente — que chegue depois não precise redescobrir por tentativa e erro por que o
projeto está configurado assim.

Cada entrada tem quatro partes: a decisão, o motivo, a alternativa que foi descartada e a condição
para rever. Onde a decisão veio de um problema concreto, o erro original está citado.

Nomes de arquivo em inglês, conteúdo em português. A ausência de acentos neste arquivo **não é uma
convenção adotada** — é resíduo de geração automática que não foi revisado. Os demais documentos
devem seguir a mesma forma até que a correção seja feita de propósito.

---

## 1. ESLint 9, e não ESLint 10

**Decisão.** `eslint@^9.39.5` em vez da versão 10 mais recente.

**Por que.** O ESLint 10 foi instalado primeiro e quebrou em qualquer arquivo lintado, inclusive
em arquivo isolado:

```
TypeError: scopeManager.addGlobals is not a function
    at addDeclaredGlobals (eslint/lib/languages/js/source-code/source-code.js:221:15)
    at Linter.verifyAndFix (eslint/lib/linter/linter.js:1569:20)
```

O `eslint-config-next@16.3.6` traz `typescript-eslint@8.70.1`, e o gerenciador de escopo devolvido
pelo parser não implementa `addGlobals`, que o ESLint 10 passou a exigir. O detalhe que atrasa o
diagnóstico: o `peerDependencies` do `typescript-eslint@8.70.1` declara
`eslint: "^8.57.0 || ^9.0.0 || ^10.0.0"`, então o aviso de dependência conflitante **não aparece**.
A combinação está declarada como suportada e não funciona.

O erro é silencioso quando a execução passa por um filtro que não casa com nenhum arquivo: `eslint .`
pode terminar com código 0 e zero problemas sem nunca ter lido um arquivo. Para diagnosticar, é
preciso rodar em um arquivo nomeado e capturar stderr em arquivo — o PowerShell mistura a saída de
erro do node com a saída normal e esconde a mensagem.

**Alternativa rejeitada.** Manter o ESLint 10. Não há versão estável do `typescript-eslint` que
corrija isso; existem apenas alphas. Reinstalar a cada release é um custo recorrente não justificado
por um número de versão.

**Reavaliar quando.** `typescript-eslint` publicar uma versão estável com suporte funcional ao ESLint 10.
Verificar com `npx eslint <arquivo> ; echo $LASTEXITCODE` antes de subir, e não apenas pela faixa de
`peerDependencies`.

---

## 2. O Babel fica dentro do jest.config.js

**Decisão.** O preset fica no `transform` do `jest.config.js`. Não existe `babel.config.js` na raiz.

```js
transform: {
  "^.+\\.jsx?$": [
    "babel-jest",
    { presets: [["@babel/preset-env", { targets: { node: "current" } }]] },
  ],
},
```

**Por que.** Um `babel.config.js` na raiz é detectado pelo Next.js, que passa a usar Babel no lugar
do SWC em todo o desenvolvimento e em todo o build. Isso vale para quem roda `next dev`, mesmo sem
nunca executar um teste. Configurando o preset dentro do Jest, o Next continua no SWC e só o Jest
converte.

**Alternativa rejeitada.** `babel.config.js` na raiz, que é o que o
[plano de testes](test-plan.md) recomendava antes desta revisão. A recomendação foi corrigida.

**Reavaliar quando.** Nunca, enquanto o projeto usar Next.js com SWC.

---

## 3. `npm test` não sobe Docker

**Decisão.** `test` roda apenas `tests/unit`. A integração tem script próprio.

**Por que.** Se o teste padrão depender de um container, três coisas quebram: quem acabou de clonar
o repositório não roda um teste sem instalar e abrir o Docker Desktop; o job de CI precisa subir
containers fora do mecanismo suportado, o que é mais lento e falha mais; e um teste de integração
quebrado derruba também os testes de unidade, que não têm relação com ele. No GitHub Actions o
Postgres entra como _service container_, que é a forma suportada e dispensa daemon.

**Alternativa rejeitada.** Um único `npm test` que sobe o compose.

**Reavaliar quando.** A integração passar a ser rápida e obrigatória para todo commit. Até lá,
`test:unit` no push e `test:integration` no job próprio.

---

## 4. `test:coverage` mede só a unidade

**Decisão.** `test:coverage` executa `jest --coverage tests/unit`.

**Por que.** O relatório LCOV alimenta o SonarQube. Migração não é código JavaScript, então rodar
a integração não muda o número de cobertura. Medir só a unidade mantém o passo de análise estática
rápido e independente de Docker.

**Alternativa rejeitada.** Medir tudo, o que tornaria o artefato de cobertura dependente do job de
integração.

**Reavaliar quando.** Houver código JavaScript exercitado apenas por teste de integração. Até lá,
aumentar a base sem aumentar a medição só produz número menor, não informação nova.

---

## 5. Sem `coverageThreshold`

**Decisão.** Não há piso de cobertura no `jest.config.js`.

**Por que.** Um piso que falha o build no primeiro dia entrega um CI vermelho, e um CI vermelho
é começado e desativado. A cobertura é medida e publicada primeiro; o piso vem depois, com base no
número real.

**Alternativa rejeitada.** Começar com um piso arbitrário, tipo 80%. Ninguém sabe ainda o quanto do
`services/` é alcançável por teste de unidade sem mockar demais.

**Reavaliar quando.** Após a suíte de unidade estar completa. Até lá, `docs/test-evidence.md`
reporta o número e não reprova ninguém.

---

## 6. Prettier com `endOfLine: "lf"`

**Decisão.** `"endOfLine": "lf"` em `.prettierrc`.

**Por que.** O repositório é desenvolvido no Windows e o GitHub Actions roda em Linux. O Git
normaliza para CRLF ao fazer checkout no Windows, mas o conteúdo do commit é LF. Sem a opção fixada, o
Prettier formata diferente dependendo da máquina: `prettier --check` passa na sua e falha no CI, e
nenhum dos dois está errado.

**Alternativa rejeitada.** `"auto"`, que segue o que o editor já gravou. É exatamente o
comportamento que produz a divergência.

**Alinhamento com o editor.** O `.editorconfig` declara `indent_style`, `indent_size`,
`end_of_line = lf`, `charset = utf-8`, `trim_trailing_whitespace` e `insert_final_newline`. As
quatro últimas foram adicionadas junto com o Prettier, em 2026-09: um editor que respeita o
`.editorconfig` gravava CRLF em um arquivo que o Prettier exige em LF, e a divergência reaparecia
antes de chegar ao commit.

**Reavaliar quando.** Nunca. LF é o padrão correto para um repositório com CI em Linux.

---

## 7. `.prettierignore` não é `.gitignore`

**Decisão.** Os dois arquivos existem, com papéis distintos.

**Por que.** `.gitignore` responde "isto não entra no commit". `.prettierignore` responde "isto não é
formatado". Um arquivo pode estar versionado e ainda assim não ser formatado, que é o caso do
`package-lock.json`: precisa ser commitado, mas nunca formatado, porque o npm o regenera e a
disputa seria eterna. O Prettier só ignora `node_modules` por padrão, então sem o arquivo ele
verifica `package-lock.json` e a pasta `.next`.

**Alternativa rejeitada.** Depender do `.gitignore`. O Prettier não o lê.

**Reavaliar quando.** Nunca. A lista só cresce, conforme entram ferramentas.

---

## 8. Commitlint no `commit-msg`, lint-staged no `pre-commit`

**Decisão.** Os dois hooks do Husky, cada um com uma função.

```
.husky/pre-commit  ->  npx --no-install lint-staged
.husky/commit-msg  ->  npx --no-install commitlint --edit "$1"
```

**Por que.** Conventional Commit é validado no `commit-msg`, e não no `pre-commit`. O `pre-commit`
dispara antes de o Git montar a mensagem, então não existe arquivo para o commitlint ler. Trocar os
dois não produz erro visível: o commitlint recebe caminho vazio e não valida nada, e o lint-staged
recebe o arquivo de mensagem como padrão e não formata nada. Os dois hooks passam a não fazer nada sem
avisar.

**Alternativa rejeitada.** Colocar o commitlint no `pre-commit`, que foi a ideia inicial.

**Reavaliar quando.** Nunca. É a ordem que o Git define.

---

## 9. `no-alert` e `react-hooks/exhaustive-deps` rebaixadas para aviso

**Decisão.** Duas regras do `eslint-config-next` rebaixadas de `error` para `warn`, cada uma com
comentário citando a issue que trata a causa.

**Por que.** O baseline apurado com o ESLint funcionando é de **1 erro e 21 avisos**:

| Regra                         | Ocorrências | Issue                                          |
| :---------------------------- | :---------- | :--------------------------------------------- |
| `no-alert`                    | 12          | #13, trocar `alert` por toast                  |
| `@next/next/no-img-element`   | 8           | sem issue ainda                                |
| `react-hooks/exhaustive-deps` | 1           | #24, `withAuth` não escuta `onAuthStateChange` |
| `react/display-name`          | 1 erro      | `components/utils/withAuth.js:6`               |

Os 21 avisos são defeitos reais já conhecidos e rastreados. Rebaixar é melhor do que desligar: o
aviso continua aparecendo na saída e no relatório, então o número não some. Desligar a regra
resolveria o alerta apagando o sinal.

O erro de `display-name` é o único que bloqueia `eslint .`, porque saída diferente de zero reprova
o job. Ele fica para decisão: a correção natural é nomear o componente interno do HOC, o que é uma
mudança de código, não de configuração.

**Alternativa rejeitada.** `eslint . --quiet`, que só mostraria erros. Esconderia os 21 avisos que
são a rastreabilidade de #13 e #24.

**Reavaliar quando.** #13 e #24 forem fechadas, e a regra volta a `error`.

---

## 10. `services/authServices.js` entra na cobertura, com teste

**Decisão.** O arquivo não é mais excluído de `collectCoverageFrom`. Ele passa a ser medido, e a
cobertura vem de um teste que mocka `global.fetch` e `supabase.auth.signUp`.

**Por que.** A primeira versão desta decisão excluía o arquivo da medição, com o argumento de que
`authServices.js:20` chama `fetch('/api/createProfile')` e não existe servidor durante um teste de
unidade. O raciocínio estava certo e a conclusão estava errada: o `fetch` é mockável do mesmo jeito
que o cliente Supabase. Excluir resolvia o sintoma do número em vez de resolver o problema, e deixava
uma lacuna de teste justamente onde há uma chamada de rede sem tratamento de erro.

Excluir da medição também tem um efeito colateral ruim: o arquivo desaparece do relatório, e
`sonar-project.properties` conta cobertura apenas a partir do LCOV. Arquivo ausente do LCOV conta
como zero no Sonar. Excluir é esconder.

**Alternativa rejeitada.** Deixar excluído e aceitar o número menor.

**Reavaliar quando.** O teste existir. Até lá, o arquivo aparece no relatório com 0%.

---

## 11. `cz` escreve a mensagem, `commitlint` valida

**Decisão.** `commitizen` com `cz-conventional-changelog`, invocado por `npm run commit`. O
`commit-msg` continua com commitlint.

**Por que.** São papéis complementares e não redundantes. O `cz` pergunta tipo, escopo e descrição e
monta a mensagem, o que remove o atrito de lembrar a convenção e também ensina, porque as opções do
prompt são a própria convenção. O commitlint continua necessário porque valida o que o `cz` não
cobre: mensagem escrita a mão, `git commit --amend`, e merge.

**Alternativa rejeitada.** Só o commitlint, que recusa a mensagem mas não ajuda a escrevê-la.

**Reavaliar quando.** Nunca. Os dois se completam.

---

## 12. CI em Node 24, e `engines` no `package.json`

**Decisão.** Todos os workflows usam `node-version: 24`, e o `package.json` declara
`"engines": { "node": ">=24.11.0" }`.

**Por que.** Sem `engines`, cada ambiente escolhe a própria versão de Node e eles divergem: o
`setup-node` dos workflows, a máquina de desenvolvimento, e a Vercel. O motivo da escolha não foi
teórico — 366 pacotes do `package-lock.json` declaram `engines.node` e o CI estava rodando em Node
20, fora da faixa da maioria deles:

| Pacote                    | `engines.node`            | Consequência em Node 20      |
| :------------------------ | :------------------------ | :--------------------------- |
| `@babel/core@8.0.6`       | `^22.18.0 \|\| >=24.11.0` | O preset que o Jest usa      |
| `@supabase/supabase-js@2` | `>=22.0.0`                | **Dependência de produção**  |
| `lint-staged@17.5.1`      | `>=22.22.1`               | Roda no `pre-commit`         |
| `next@16.3.5`             | `>=20.9.0`                | O único que aceitava Node 20 |

O `npm ci` emitia cerca de 99 avisos `EBADENGINE` e completava assim mesmo: o aviso não impede a
instalação, então nada quebra e nada aponta a causa. O caso do `@supabase/supabase-js` é o mais
sério, porque é dependência de **produção** — o CI não falha por rodar Node 20, mas o primeiro
teste de integração que invocar o cliente real (issue
[#16](https://github.com/MViniciusCoffe/SpendSmart/issues/16)) falha por engine.

Declarar `engines` faz três coisas de uma vez: documenta o mínimo, faz o npm avisar quem instala
fora da faixa, e passa a ser a fonte que a Vercel respeita. O limite `>=24.11.0` é o piso do
`@babel/core@8` transcrito, não um número escolhido: Babel 8 exige `24.11`, não `24.0`.

**Alternativa rejeitada.** Node 22, que satisfaz a faixa do Babel. Fica mais próximo do fim de vida
e não traz vantagem aqui. Também rejeitado: não declarar `engines` e confiar no `setup-node` de
cada workflow — é o que permitia a divergência entre os ambientes.

**Reavaliar quando.** O Babel ou o Jest mudarem de requisito de engine. Se `engines` deixar de
cobrir a versão que a Vercel usa, o número tem de mudar nos três lugares juntos:
`package.json`, `test.yml` e `lint.yml`.

---

## 13. Os avisos de `npm ci` sobre Babel e glob são aceitáveis

**Decisão.** Não há `overrides` no `package.json`, não há `legacy-peer-deps`, e a saída do
`npm ci` é deixada como está. Os avisos não são limpos.

**Por que.** Há três grupos de aviso, e nenhum deles é problema do projeto. Registrar é o que
evita que alguém tente "resolver" da próxima vez.

### `ERESOLVE` — `@babel/core` 8 contra plugins do Babel 7 (cerca de 12 avisos)

O `babel-preset-current-node-syntax@1.2.0` chega como dependência do Jest 30 e declara
`peerDependencies: { "@babel/core": "^7.0.0-0" }`. O `package.json` declara
`"@babel/core": "^8.0.6"`, e o `@babel/preset-env` 8 usado no `jest.config.js:56` exige a 8. São
incompatíveis por declaração.

As duas versões **coexistem e funcionam**. O `npm` aninha a 7 onde o Jest precisa dela
(`node_modules/@jest/transform/node_modules/@babel/core@7.29.7`) e mantém a 8 na raiz, que é a que
o `preset-env` resolve. Os 65 testes passam com essa configuração, então não há defeito, é apenas
declaração conflitante.

A causa é externa: o Jest 30 ainda não suporta Babel 8, e o plugin de sintaxe ainda declara peer
dependente da 7. Corrigir aqui significaria forçar a 7 por `overrides`, o que rebaixaria o
`@babel/preset-env` da raiz e poderia mudar a transpilação dos testes — um risco real de regressão
em troca de silenciar log.

### `deprecated` — `inflight@1.0.6` e `glob` versões antigas

Todas as versões citadas são **transitivas** e nenhuma está no `package.json`. `inflight` vem pelo
Jest; as várias versões de `glob` vêm de dependências com faixas diferentes entre si. Um projeto com
942 pacotes e sete cópias de `glob` é o estado normal do ecossistema Jest, não um descuido. O
`package.json` já tem `glob@^13.0.6` na raiz, que é a versão atual.

### `deprecated` — `eslint@9.39.5` sem suporte

Este é o único aviso que **não** pode ser resolvido hoje. A série 9 está em manutenção e o `latest`
é `10.11.0`. O bloqueio é o mesmo descrito na seção 1 deste documento:
`typescript-eslint@8.70.1` não implementa `scopeManager.addGlobals`, exigido pelo ESLint 10. Como o
`peerDependencies` dele declara suporte a `^10.0.0`, **não há aviso de conflito que indique o
problema** — a combinação está declarada como suportada e quebra em tempo de execução.

**Alternativa rejeitada.** `overrides` forçando `@babel/core: 7.x` para eliminar os `ERESOLVE`.
Rejeitada porque mexe em transpilação funcionando para ganho puramente estético. Também
rejeitada: `legacy-peer-deps=true`, que desliga o aviso sem resolver a causa e torna qualquer
incompatibilidade futura silenciosa. Também rejeitada: subir o ESLint 10 com `overrides` no
`typescript-eslint`, que repete o mesmo problema em outra dependência.

**Reavaliar quando.** O Jest 30 declarar suporte a Babel 8, ou o `eslint-config-next` relaxar a
faixa de `typescript-eslint` para uma versão estável com suporte funcional ao ESLint 10. Até lá,
verificar se a suíte continua verde é o único critério. E o aviso não é vermelho: o `npm ci`
termina com código 0 e `found 0 vulnerabilities`.

---

## 14. A Vercel faz o deploy, o GitHub Actions só verifica

**Decisão.** Não há `vercel.json` no repositório. O deploy é configurado no painel da Vercel, e o
GitHub Actions não participa do deploy.

**Por que.** Vale registrar porque os dois nomes se confundem. A Vercel **não usa GitHub Actions**.
O que aparece no repositório GitHub depois de um push são _checks_ — o resultado do build da Vercel
reportado no GitHub — e não arquivos de workflow. Os dois arquivos em `.github/workflows/`,
`test.yml` e `lint.yml`, são do GitHub Actions e existem para verificar qualidade antes do deploy.

Não há `vercel.json` porque a configuração está no painel, e a configuração padrão da Vercel para
Next.js já detecta o framework e o build command. Um arquivo só seria necessário para algo que o
padrão não faz: `headers`, `rewrites`, `redirects`, ou uma função serverless. Nada disso existe no
projeto hoje.

A separação de ambientes é feita pelo nome da branch, de forma implícita: `main` vira Production, e
qualquer outra branch vira Preview com URL própria.

**Alternativa rejeitada.** `vercel.json` com o build command explícito, só para tornar o
deploy legível no repositório. Rejeitada porque duplica a configuração do painel em dois lugares,
que é o modo clássico de divergirem.

**Reavaliar quando.** Surgir necessidade de `headers`, `rewrites` ou `redirects`. Até lá, o painel
é a fonte e o repositório fica limpo. Se a configuração do painel passar a ser relevante para
alguém que só tem acesso ao repositório, aí então vale exportar um `vercel.json`.

O que a Vercel **não** resolve está documentado em
[environments.md](environments.md): Production, Preview e desenvolvimento local apontam para o
mesmo projeto Supabase provisório, e o mesmo `SUPABASE_SERVICE_ROLE_KEY` vale para os três.

---

## 15. Regra de conteúdo não vira regra de ferramenta

**Decisão.** Não há linter para Markdown. As regras de conteúdo dos documentos ficam escritas e
aplicadas por revisão.

**Por que.** A regra do projeto — não escrever comentário a menos que o comentário explique um
porquê, e não afirmar que algo funciona sem indicar como foi verificado — é julgamento de conteúdo.
Nenhuma ferramenta vai decidir se um comentário explica um porquê. O que dá para automatizar é a
mecânica do Markdown, com `markdownlint`, e isso não substitui revisão.

O Prettier já formata `*.md`, `*.css` e `*.json` pelo `lint-staged`. O ESLint é só JavaScript e JSX,
e não tem como ser diferente: é um analisador de código.

**Alternativa rejeitada.** `markdownlint`. Pode ser adicionado, mas é uma dependência a mais para
pouco ganho, e não verifica a regra que importa.

**Reavaliar quando.** A escrita dos documentos virar trabalho repetitivo o suficiente para o custo
de revisar justificar uma ferramenta.

---

## 16. O `cz` e o Conventional Commit são o mesmo padrão

**Decisão.** O `commitlint.config.js` estende apenas `@commitlint/config-conventional`.

**Por que.** Vale registrar porque a combinação é contraditória na aparência: o projeto fala em
convenção em português, e o padrão Conventional Commit define os tipos em inglês
(`feat`, `fix`, `refactor`, `test`, `chore`, `docs`). A mensagem fica em português, o tipo fica em
inglês. `docs: reescreve a documentação` é Conventional válido, mesmo com a descrição sem acento.

**Alternativa rejeitada.** Traduzir os tipos. Não existe tipo padronizado correspondente, e o
commitlint não conheceria os nomes.

**Reavaliar quando.** Nunca. É o padrão da disciplina.

---

## 17. Todo `jest.mock` usa factory, e o falso nasce dentro dela

**Decisão.** Não existe `jest.mock("caminho")` sem segundo argumento em `tests/`. E a factory não
referencia nenhuma variável declarada no arquivo de teste:

```js
jest.mock("../../infra/supabase", () => ({
  supabase: {
    from: jest.fn(),
    auth: { getSession: jest.fn() }
  }
}))

import { supabase } from "../../infra/supabase"
```

**Por que.** Duas razões, ambas verificadas com um sandbox fora do repositório.

**Razão 1 — sem factory o módulo real executa.** `infra/supabase.js:6` chama `createClient` no
momento do import. Sem factory, o Jest precisa inspecionar o módulo real para gerar o falso
automático, e inspecionar significa executar. O resultado é `supabaseUrl is required` e
`Tests: 0 total` — a suíte morre antes da primeira asserção.

**Razão 2 — a factory é hoisted, então não pode ler `const` do arquivo.** O
`babel-plugin-jest-hoist`, que vem com o `babel-jest`, sobe a chamada de `jest.mock` para o topo do
arquivo, acima dos imports e das declarações. Se a factory referenciar uma `const` do próprio
arquivo, ela ainda está na zona morta temporal quando roda, e o erro é
`ReferenceError: Cannot access 'mockSupabase' before initialization`.

O falso é construído dentro da factory justamente para não ter nada externo a resolver. Depois o
teste o reconfigura normalmente, com `.mockResolvedValue()`, porque `jest.fn()` é um objeto comum.

**Alternativa rejeitada.** Duas, ambas tentadas. `jest.mock` sem factory, que executa o módulo real.
E a factory que referencia um `const` externo — compila, e quebra em tempo de execução.

**Correção de registro.** Uma versão anterior deste documento afirmava que a variável precisa se
chamar `mock*` por exigência do plugin do Babel. Não é verdade nesta configuração: um teste com
`fakeSupabase` passou sem reclamar. O prefixo `mock` é convenção de leitura, herdada do `automock`
antigo. O que evita o erro é não referenciar variável externa.

**Reavaliar quando.** Nunca. É a forma correta de isolar um módulo com efeito de topo no import.

---

## 18. Gherkin e Cucumber ficam de fora

**Decisão.** Os testes de unidade são Jest direto. Não há `features/`, nem cucumber-js, nem step
definitions.

**Por que.** Gherkin não substitui o Jest — soma uma camada de tradução por cima dele. O
cucumber-js roda sobre o Mocha ou o Jest, então adicionar não remove nada do que já existe. Cada
caso passa a existir em dois artefatos que precisam concordar: o `.feature` e o step definition em
JavaScript onde a asserção realmente mora. Se alguém editar o feature e esquecer o JavaScript, o
teste passa errado — que é o pior defeito que uma suíte de teste pode ter.

O que o Gherkin resolve é comunicação, não execução: ele existe para o cliente, o produto ou o
docente lerem e validarem sem ler código. O ganho depende inteiramente de existir essa audiência.

`docs/test-plan.md` §4 já cobre a rastreabilidade US / CT / RF em tabela Markdown, que faz o mesmo
papel de um feature file e é mais barata de manter num projeto com uma única pessoa escrevendo.

**Alternativa rejeitada.** Gherkin em tudo. Rejeitada por duplicar a informação sem aumentar a
cobertura.

**Reavaliar quando.** A disciplina exigir casos em formato `.feature` como entregável. Nesse caso o
caminho barato é: manter os testes em Jest, e escrever os `.feature` **depois**, a partir dos testes
que já existirem, para IT-01 a IT-10 e para os critérios de aceitação. Não reescrever a unidade em
Gherkin, porque é exatamente onde o ganho vira prejuízo.

---

## 19. O SonarQube mede só `services/`, e os testes rodam antes do scan

**Decisão.** `sonar.sources=services`, sem `sonar.exclusions`, e `.github/workflows/sonar.yml` roda
`npm ci` e `npm run test:coverage` antes de chamar o `sonarqube-scan-action@v7`.

**Por que o escopo.** O `jest.config.js` mede apenas `services/` (`collectCoverageFrom`, entrada 4).
A entrada 4 já havia registrado por que medir só a unidade: o artefato de cobertura não pode depender
de um job que sobe Docker. A consequência no Sonar é aritmética, e ela precisa ficar escrita porque
o painel mostra 100% e isso sozinho não prova nada.

| Diretório    | Arquivos | Linhas | No LCOV |
| :----------- | :------- | :----- | :------ |
| `services`   | 4        | 348    | sim     |
| `pages`      | 12       | 1.834  | não     |
| `components` | 3        | 112    | não     |
| `infra`      | 3        | 82     | não     |
| `supabase`   | 2        | 155    | não     |

Com o repositório inteiro em `sonar.sources`, o painel mostraria 348 / 2.531, ou seja cerca de 14%.
Não é defeito de medição: é pedir para medir 2.531 linhas e entregar prova de 348. Um relatório que
só descreve o que foi testado é defensável; um relatório que mistura "código não testado" com "código
que ninguém pediu para testar ainda" produz um número que não descreve nem um nem outro.

O efeito colateral é o **0% de duplicação** no painel. A duplicação real existe, cerca de 1.100
linhas repetidas entre `pages/gastosPage.js` e `pages/rendaPage.js`, e está em #6 e #22. Ela não
aparece porque `pages/` está fora do escopo. Quem apresentar o resultado precisa dizer isso, senão o
0% é lido como "o projeto não tem duplicação".

**Por que rodar os testes antes do scan.** O SonarQube não executa teste nenhum: é analisador
estático, e `sonar.javascript.lcov.reportPaths` é um caminho para ele abrir e ler. Sem o arquivo, ele
avisa e segue:

```text
WARN: No coverage information will be saved because all LCOV files cannot be found.
```

`coverage/` está no `.gitignore` e nunca foi versionado (`git log --all -- coverage` retorna vazio).
Um workflow que só faz checkout e chama o scanner produz uma análise **verde** com 0% de cobertura — o
modo de falha mais ingrato possível, porque nada no log indica que o número principal não foi medido.

Rodar a cobertura no mesmo job tem dois efeitos colaterais desejados: cada relatório corresponde ao
código exato analisado, e um commit com teste quebrado interrompe o pipeline antes da análise. O
custo é de cerca de 40 segundos de CI, porque o `npm ci` domina.

**Por que sem `sonar.exclusions`.** O exemplo da disciplina tem nove padrões específicos de Django
(`sigarte`, `manage.py`, `__init__.*`). Com `sonar.sources=services`, os quatro arquivos `.js` da
pasta são tudo que existe no escopo, então as nove exclusões seriam inertes. Padrão que não faz nada
é pior que padrão ausente: sugere uma configuração mais cuidadosa do que a real. Vale registrar que
o Sonar já respeita o `.gitignore` sozinho, então `node_modules/` e `coverage/` vêm de graça.

**Alternativa rejeitada.** `sonar.sources` com o repositório inteiro. Numericamente correto e
descritivamente inútil.

**Reavaliar quando.** #33 for fechada. Ampliar o escopo é então um commit isolado em dois arquivos
(`sonar.sources` e `collectCoverageFrom`), porque a cobertura do projeto cai para a faixa real e a
duplicação de `pages/` passa a ser medida como não coberta.

---

## 20. `sonarqube-scan-action@v7`, `checkout@v5`, e o host como secret

**Decisão.** `sonarqube-scan-action@v7` e `actions/checkout@v5`, com `fetch-depth: 0` e
`SONAR_HOST_URL` lido de `secrets.`, não de `vars.`.

**Por que `@v7` e não `@v6`.** A `v6` foi reescrita de Bash para JavaScript e passou a parsear `args`
de forma diferente, o que quebra workflow que passa argumentos. O LABENS roda a série 26, e a
documentação da série 26.2 usa `v7`. A `v8.2.1` existe, mas não há ganho conhecido para um projeto
com quatro arquivos no escopo.

**Por que `checkout@v5` e não `@v6`.** A `v6` move as credenciais para `$RUNNER_TEMP` e passa a exigir
runner `>= 2.327.1`. O changelog é explícito de que não há mudança necessária no workflow. Os jobs
são Ubuntu, sem container e sem `git push`, então não há ganho em subir. Este é o caso concreto do
`AGENTS.md` §8: dependência nova sem justificativa.

**Por que `fetch-depth: 0`.** Sem clone completo o Sonar não lê o histórico Git, e sem ele não há blame
nem cálculo de código novo. O log da análise confirma: `SCM Publisher 8/8 source files have been
analyzed`.

**Por que `secrets.` e não `vars.` para o host.** O template do SonarSource usa `vars.` para
`SONAR_HOST_URL` e `secrets.` para `SONAR_TOKEN`. No LABENS os dois foram gravados como secret, então
`${{ vars.SONAR_HOST_URL }}` resolveria para string vazia e o scanner falharia com erro de URL
inválida — mensagem que não aponta a causa, e custa uma execução de CI para diagnosticar. Ambos os
prefixos funcionam com o que está gravado; host não é dado sensível. A distinção importa para o token,
que precisa permanecer mascarado nos logs.

**Alternativa rejeitada.** Gravar `SONAR_HOST_URL` como repository variable para seguir o template ao
pé da letra. Custa um passo extra no setup e não muda nada no resultado.

**Reavaliar quando.** O LABENS migrar de série, ou a análise passar a rodar em pipeline que use
`args` com aspas — nesse caso conferir a sintaxe da documentação da action vigente, porque mudou na
`v6` e pode mudar de novo.
