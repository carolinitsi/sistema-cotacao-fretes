# Spec: setup inicial do projeto

## Objetivo
Criar a base do projeto (Nuxt 4 + Nuxt UI) com a infraestrutura de qualidade pronta:
lint, typecheck, testes (unit, componente, integração com MSW, E2E) e CI.
Sem telas, regras de negócio, tokens de design ou API real.

## Requisitos
- Roda a partir de um clone limpo: `pnpm install` + `pnpm dev`.
- `.nvmrc` e `packageManager` declarados.
- TypeScript estrito (`strict` + `noUncheckedIndexedAccess`).
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` e `pnpm test:e2e` passam.
- Vue Query registrado com suporte a SSR (dehydrate no servidor, hydrate no cliente).
- Vitest com projetos `unit` (node) e `component` (ambiente Nuxt).
- MSW com handlers base em `tests/mocks/`.
- Playwright só com Chromium e `webServer` automático.
- CI no GitHub Actions rodando lint, typecheck, test e test:e2e.
- Documentação: README, `docs/DECISIONS.md`, template de PR, `CLAUDE.md`.

## Fora do escopo
Telas, componentes de negócio, schemas reais, endpoints do Nitro, tema visual.

## Tarefas
| # | Tarefa | Commit |
|---|--------|--------|
| T1 | Scaffold Nuxt 4 + Nuxt UI (template `ui`) | `chore: scaffold nuxt project with nuxt ui template` |
| T2 | CLAUDE.md com convenções | `docs: add claude.md with project conventions` |
| T3 | Remover conteúdo demo do template | `chore: remove starter template demo content` |
| T4 | TS estrito, eslint, typecheck | `chore: configure eslint and strict typecheck` |
| T5 | Plugin Vue Query com SSR | `feat: add vue query plugin with ssr support` |
| T6 | Vitest (unit + component) e MSW | `test: set up vitest, msw and base structure` |
| T7 | Playwright + smoke test | `test: set up playwright with smoke test` |
| T8 | `.env.example`, runtimeConfig, pastas, scripts | `chore: add env example, folder structure and scripts` |
| T9 | Workflow de CI | `ci: add github actions workflow` |
| T10 | README, DECISIONS, template de PR | `docs: add readme, decisions log and pr template` |

## Critério de aceite
Verificação final com todos os comandos passando a partir de `pnpm install --frozen-lockfile`.
