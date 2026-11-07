## O que muda e por quê

<!-- O porquê, não só o quê. Issues: "Closes #N". -->

## Como foi verificado

<!-- Comandos rodados e o resultado. Nada de "funciona" sem dizer como foi visto. -->

## Checklist

- [ ] `npm test`, `npm run test:integration` e `npm run test:regression` passam
- [ ] `npm run lint:eslint:check`, `npm run lint:prettier:check` e `npm run check:agents` passam
- [ ] Commits em Conventional Commits (português), sem misturar migration, visual e infra
- [ ] Defeito corrigido ganhou teste em `tests/regression/`
- [ ] Mudou `src/services/`: testes unitários atualizados (cobertura 100%)
- [ ] Mudou `src/app/api/`: token validado antes da chave de serviço, sem `error.message` na resposta
- [ ] Documentação do assunto atualizada em `docs/` ou `README.md`

### Se tem migration

- [ ] Aplicada localmente (`npm run migrations:up`) e com o pg-mem passando
- [ ] Tabela nova com `REVOKE ALL ... FROM anon` e `GRANT` explícito
- [ ] Aplicada na Preview (`npm run migrations:push -- --target preview --apply`)
- [ ] Compatível com o código que ainda está em produção (o deploy roda depois da migration)
