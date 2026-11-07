# Política de segurança

## Como reportar uma vulnerabilidade

**Não abra uma issue pública.** Use o reporte privado do GitHub:
[Security → Report a vulnerability](https://github.com/MViniciusCoffe/SpendSmart/security/advisories/new).
Só os mantenedores veem o relato, e a correção é discutida num advisory privado antes de ser
publicada.

Inclua, se possível: a rota ou o arquivo afetado, os passos para reproduzir e o impacto (o que um
atacante consegue ler ou alterar). Não acesse nem altere dados de outros usuários além do mínimo
necessário para demonstrar o problema.

## O que esperar

Este é um projeto acadêmico (disciplina de Testes de Software, BSI/UFRN), mantido por duas pessoas.
O objetivo é responder em até 7 dias e corrigir falhas que exponham dados de usuários com
prioridade sobre qualquer outra tarefa.

## Versões suportadas

Só a versão em produção (branch `main`, publicada na Vercel). Não há versões antigas mantidas.

## Escopo

| Dentro do escopo                                                            | Fora do escopo                                                |
| :-------------------------------------------------------------------------- | :------------------------------------------------------------ |
| Acesso a dados de outro usuário (falha de RLS, de filtro ou de rota de API) | Vulnerabilidades do Supabase ou da Vercel em si               |
| Uso indevido da chave de serviço pelas rotas de `src/app/api/`              | Ataques que exigem acesso físico ao dispositivo da vítima     |
| XSS, contorno da CSP, injeção                                               | Negação de serviço por volume de requisições                  |
| Segredo exposto no repositório ou no bundle do navegador                    | Relatórios automáticos de scanner sem demonstração de impacto |

As defesas do projeto estão descritas em [docs/code-conventions.md](docs/code-conventions.md)
(CSP, rotas de API) e [docs/database-schema.md](docs/database-schema.md) (RLS e privilégios).
