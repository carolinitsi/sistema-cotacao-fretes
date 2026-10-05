# Sistema de cotação de fretes

Sistema de cotação de fretes desenvolvido como teste técnico para a vaga de Front-end Pleno (Vue/Nuxt).

Stack: Nuxt 4, Vue 3, TypeScript estrito, Nuxt UI + Tailwind CSS 4, TanStack Vue Query, zod,
Vitest, MSW e Playwright.

## Requisitos

- Node.js 22 LTS (versão em [`.nvmrc`](.nvmrc); com nvm: `nvm use`)
- pnpm (versão fixada em `packageManager` no `package.json`; com Corepack: `corepack enable`)

## Instalação

```bash
pnpm install
```

O `postinstall` roda `nuxt prepare`, que gera os tipos e a config do ESLint em `.nuxt/`.

## Variáveis de ambiente

Copie o exemplo e ajuste se necessário:

```bash
cp .env.example .env
```

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `NUXT_PUBLIC_APP_NAME` | Nome exibido no título das páginas | `FretePro` |

Todas são opcionais: sem `.env` o app usa os valores padrão do `nuxt.config.ts`.

## Como rodar

```bash
pnpm dev        # http://localhost:3000
pnpm build      # build de produção
pnpm preview    # serve o build de produção
```

## Qualidade e testes

```bash
pnpm lint        # ESLint (@nuxt/eslint)
pnpm typecheck   # vue-tsc via nuxt typecheck (inclui os testes)
pnpm test        # Vitest: projetos unit e component
pnpm test:watch  # Vitest em modo watch
pnpm test:e2e    # Playwright (Chromium)
```

Na primeira execução do E2E, instale o navegador:

```bash
pnpm exec playwright install chromium
```

O `pnpm test:e2e` faz o build e sobe o app em `http://localhost:3100` automaticamente.

O CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) roda lint, typecheck, test e test:e2e
em todo push e pull request.

## Estrutura de pastas

```
app/
  components/ui/              componentes visuais genéricos
  components/features/quote/  componentes da funcionalidade de cotação
  composables/                acesso à API via Vue Query
  pages/                      rotas
  plugins/                    plugins do Nuxt (Vue Query)
  schemas/                    schemas zod (fonte da verdade da validação)
  utils/                      funções puras (formatadores, máscaras)
server/api/                   API mock (server routes do Nitro)
tests/
  unit/                       Vitest em ambiente Node (schemas, utils)
  component/                  Vitest em ambiente Nuxt (componentes)
  mocks/                      handlers e servidor do MSW
  e2e/                        Playwright
docs/                         registro de decisões
```

## Decisões técnicas

A preencher. O registro completo fica em [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Limitações conhecidas

A preencher.
