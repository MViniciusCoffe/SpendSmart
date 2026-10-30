# Testes de mutação

Registro dos testes de mutação do SpendSmart: o que são, como estão configurados, como executar,
os resultados de cada rodada e os mutantes aceitos com a justificativa de cada um.

Issue: [#60](https://github.com/MViniciusCoffe/SpendSmart/issues/60). Milestone: [Testes de
Mutação](https://github.com/MViniciusCoffe/SpendSmart/milestone/1).

---

## 1. Por que testes de mutação

A cobertura de `src/services/` já era de 100% de linhas, ramos e funções (ver
[sonarqube.md](sonarqube.md)). Cobertura só prova que uma linha foi **executada** durante os testes,
não que algum teste **falharia** se essa linha estivesse errada.

O teste de mutação mede isso. A ferramenta gera cópias do código com um defeito pequeno cada
(**mutantes**) e roda os testes contra cada uma:

| Resultado          | Significado                                                               |
| :----------------- | :------------------------------------------------------------------------ |
| **Morto** (killed) | Algum teste falhou: a suíte detectou o defeito                            |
| **Sobrevivente**   | Todos os testes passaram com o defeito: a suíte não protege aquele trecho |
| **Sem cobertura**  | Nenhum teste executa a linha mutada                                       |
| **Timeout**        | O mutante travou a execução (conta como detectado)                        |

**Mutation score** = mutantes detectados / mutantes válidos. Exemplos de mutações geradas:
`<` → `<=`, `"user_id"` → `""`, `a || b` → `a && b`, `{ deleted_at: ... }` → `{}`, remover o `^` de
uma regex, trocar uma condição por `true`/`false`.

---

## 2. Ferramenta e configuração

| Item              | Valor                                                                                  |
| :---------------- | :------------------------------------------------------------------------------------- |
| Ferramenta        | [Stryker Mutator](https://stryker-mutator.io/) 10.1.1                                  |
| Pacotes           | `@stryker-mutator/core`, `@stryker-mutator/jest-runner` (devDependencies)              |
| Configuração      | [`stryker.conf.json`](../stryker.conf.json)                                            |
| Escopo mutado     | `src/services/**/*.js` (mesmo escopo da cobertura e do SonarQube)                      |
| Testes executados | Só o project `unit` do Jest, via [`jest.stryker.config.js`](../jest.stryker.config.js) |
| Análise           | `coverageAnalysis: "perTest"`: cada mutante roda só os testes que cobrem a linha       |
| Limiares          | `high: 90`, `low: 85`, `break: 85`: abaixo de 85% o comando falha (local e CI)         |
| Relatórios        | `reports/mutation/mutation.html` e `reports/mutation/mutation.json` (fora do git)      |

**Por que só o project `unit`.** As suítes de integração dependem de Postgres ou da stack local do
Supabase. Rodá-las centenas de vezes (uma por mutante) deixaria a execução lenta e instável, e os
serviços já são exercitados pela suíte unitária com o cliente Supabase mockado.

---

## 3. Como executar

```bash
npm install
npm run test:mutation
```

Não precisa de Docker nem de `.env.local`: os testes unitários mockam o Supabase. A execução leva
alguns minutos. Ao final:

- o terminal mostra a tabela de score por arquivo;
- `reports/mutation/mutation.html` abre no navegador com cada mutante, o diff e os testes que o
  cobrem;
- `reports/mutation/mutation.json` traz os mesmos dados em formato de máquina.

Se o score ficar abaixo de 85% (`break`), o comando termina com erro.

### 3.1 Integração contínua

O workflow [`mutation.yml`](../.github/workflows/mutation.yml) roda o Stryker no GitHub Actions:

- em todo pull request que altere `src/services/`, `tests/unit/`, `tests/helpers/` ou a configuração
  do Stryker;
- manualmente, pela aba **Actions → Testes de Mutação → Run workflow**.

O job falha se o score cair abaixo de 85%. O relatório HTML e JSON fica disponível como artefato
`relatorio-mutacao` em cada execução ([histórico de execuções](https://github.com/MViniciusCoffe/SpendSmart/actions/workflows/mutation.yml)),
o que permite conferir o score sem rodar nada localmente.

---

## 4. Resultados

### 4.1 Evolução do mutation score

| Rodada                 | Commit    | Testes unitários | Mortos | Sobreviventes |      Score |
| :--------------------- | :-------- | ---------------: | -----: | ------------: | ---------: |
| Linha de base          | `bf7cb75` |              188 |    480 |            68 | **87,59%** |
| Filtros e soft delete  | `8dcda35` |              198 |    506 |            42 | **92,34%** |
| Bordas, cache e logger | `ce6d12b` |              208 |    531 |            17 | **96,90%** |

Total de 548 mutantes em todas as rodadas, com 0 sem cobertura e 0 timeouts.

### 4.2 Score final por arquivo

| Arquivo                          |  Mortos | Sobreviventes |      Score |
| :------------------------------- | ------: | ------------: | ---------: |
| `services/authServices.js`       |      64 |             2 |     96,97% |
| `services/categoryService.js`    |      96 |             6 |     94,12% |
| `services/profileService.js`     |      47 |             2 |     95,92% |
| `services/transactionService.js` |      51 |             4 |     92,73% |
| `services/utils/baseService.js`  |      42 |             0 |    100,00% |
| `services/utils/logger.js`       |      23 |             0 |    100,00% |
| `services/utils/mappers.js`      |       6 |             0 |    100,00% |
| `services/utils/validators.js`   |     202 |             3 |     98,54% |
| **Total**                        | **531** |        **17** | **96,90%** |

---

## 5. O que os mutantes sobreviventes revelaram

### 5.1 Filtros de segurança não verificados (linha de base → 92,34%)

Com cobertura de 100%, os testes **não falhavam** quando o Stryker:

- trocava `.eq("user_id", session.user.id)` por `.eq("", ...)` em `updateTransaction`,
  `deleteTransaction`, `updateCategory` e `deleteCategory`;
- trocava `.is("deleted_at", null)` por `.is("", null)`;
- trocava `.update({ deleted_at: ... })` por `.update({})` no soft delete;
- trocava o nome da tabela (`.from("transactions")`, `.from("categories")`, `.from("profiles")`);
- esvaziava o objeto `{ email, password }` passado a `signUp` e `signInWithPassword`;
- invertia o padrão `includeDeleted = false` de `getCategories`.

**Causa:** o mock `criarBuilder` (`tests/helpers/supabase.js`) aceita qualquer argumento, e os
testes só verificavam o retorno, não **o que** era enviado ao Supabase. Na prática, remover o filtro
por usuário de uma escrita deixava a suíte verde, contrariando a regra de que o RLS é a última
barreira, não a única.

**Correção (`8dcda35`):** asserções sobre os argumentos do builder (`from`, `select`, `eq`, `is`,
`update`, `delete`) e do Supabase Auth. Nenhum código de produção mudou.

### 5.2 Bordas dos validadores, cache e logger (92,34% → 96,90%)

| Mutante sobrevivente                                       | Teste adicionado                                                     |
| :--------------------------------------------------------- | :------------------------------------------------------------------- |
| Regex de data, e-mail e cor sem `^` ou `$`                 | Valores com texto antes/depois (`"x2024-01-15"`, `"#FF0000x"`)       |
| Checagem do ano em `validarData` removida                  | `"0050-01-01"`: `new Date(50, 0, 1)` vira 1950                       |
| Mensagem `"Data inválida"` trocada por `""`                | `toThrow(new TypeError("Data inválida"))` compara a mensagem exata   |
| `limpo.length < 10` → `<= 10`                              | Telefone fixo com exatamente 10 dígitos é aceito                     |
| `idade < 13` → `<= 13`, `idade > 120` → `>= 120`           | Idades limite 13 e 120 são aceitas                                   |
| Expiração do cache (`now < _cacheExpiry`, `5 * 60 * 1000`) | `Date.now` controlado: cache vale até 5 min − 1 ms e expira em 5 min |
| Chamada a `logger.error` removida                          | `handleSupabaseError` verifica a chamada ao logger                   |
| `error?.code` → `error.code` no logger                     | `logger.error("ctx", null)` não lança exceção                        |

**Observação:** `toThrow(TypeError)` só confere o tipo do erro. Para matar mutantes de mensagem, o
teste precisa comparar a mensagem.

---

## 6. Mutantes aceitos (17)

Os 17 sobreviventes restantes foram analisados um a um e aceitos. Não são lacunas de teste.

### 6.1 Mutantes equivalentes (3)

Um mutante é **equivalente** quando se comporta igual ao original para qualquer entrada possível.
Nenhum teste consegue matá-lo.

| Arquivo e linha    | Mutação                                              | Por que é equivalente                                                                                                                                                                         |
| :----------------- | :--------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `validators.js:13` | `data.getMonth() !== mes - 1` → `false`              | Redundante com a checagem do dia: um dia inválido sempre desloca também o mês (`2024-02-30` vira 1º de março; `2024-03-00` vira 29 de fevereiro). Mês inválido (`13`, `00`) já desloca o ano. |
| `validators.js:14` | `data.getDate() !== dia` → `false`                   | Simétrico ao anterior: todo dia fora do mês muda o mês, que a outra checagem detecta.                                                                                                         |
| `validators.js:86` | `valor.toLowerCase().trim()` → `valor.toLowerCase()` | A regex ancorada (`^...$`) não aceita espaços, então um e-mail com espaços nas pontas é recusado antes do `trim()`. O `trim()` nunca tem o que remover.                                       |

Remover a redundância do código mataria esses mutantes, mas mudaria código de produção sem ganho de
comportamento. No caso do e-mail, mover o `trim()` para antes da regex **mudaria** o comportamento
(passaria a aceitar `" joao@email.com "`), o que é uma decisão de produto, não de teste.

### 6.2 Textos de log (14)

| Onde                                                                           | Mutação                                                                                                             |
| :----------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ |
| `categoryService.js` (6), `transactionService.js` (4), `profileService.js` (2) | Contexto passado a `withErrorHandling`/`handleSupabaseError` (`"getCategories"`, `"createTransaction"`, ...) → `""` |
| `authServices.js:11`, `authServices.js:82`                                     | Rótulo do `console.error` (`"[Supabase Register Error]"`, `"[Supabase Logout Error]"`) → `""`                       |

Essas strings só identificam a origem da mensagem no log de desenvolvimento (o `logger` não grava
nada em produção). Não afetam o retorno, a mensagem ao usuário nem os dados. Testá-las seria testar
a formatação do log, acoplando a suíte a texto sem valor de comportamento.

---

## 7. Conclusões

- **Cobertura de 100% não garantia uma suíte eficaz:** 68 defeitos injetados passavam despercebidos,
  incluindo a remoção do filtro por `user_id` em escritas e a troca do soft delete por um update
  vazio.
- **O ganho veio de asserções, não de mais código coberto:** 20 testes novos (188 → 208) e nenhuma
  linha de produção alterada levaram o score de 87,59% para 96,90%.
- **Os 17 sobreviventes restantes estão justificados** (3 equivalentes e 14 textos de log).

---

## 8. Referências

- [Stryker Mutator — documentação](https://stryker-mutator.io/docs/)
- [Plano de testes](test-plan.md)
- [SonarQube e cobertura](sonarqube.md)
