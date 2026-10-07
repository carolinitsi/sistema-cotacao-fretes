# Sistema de cotação de fretes

Sistema de cotação de fretes desenvolvido como teste técnico para a vaga de Front-end Pleno (Vue/Nuxt).

Stack: Nuxt 4, Vue 3, TypeScript estrito, Nuxt UI + Tailwind CSS 4, TanStack Vue Query, zod,
Vitest, MSW e Playwright.

## Requisitos

- Node.js 22.19 ou superior (ou 24.11+), versão em [`.nvmrc`](.nvmrc); com nvm: `nvm use`.
  Versões mais antigas (como Node 20) fazem o `nuxt prepare` falhar, por isso o `pnpm install` as recusa.
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
| `NUXT_FREIGHT_API_MODE` | `melhor-envio` (API real) ou `mock` (dados simulados, só em `pnpm dev`) | `mock` em `pnpm dev`, `melhor-envio` no build |
| `NUXT_MELHOR_ENVIO_BASE_URL` | URL base da API do Melhor Envio | Sandbox |
| `NUXT_MELHOR_ENVIO_TOKEN` | Access token com o escopo `shipping-calculate` | vazio |
| `NUXT_MELHOR_ENVIO_USER_AGENT` | `Nome (email de contato)`, exigido pela API | vazio |

Sem `.env`, o `pnpm dev` já funciona com dados simulados. No build de produção sem token, a cotação
responde 503 ("Cotação de frete não configurada"): o mock nunca é usado como fallback silencioso.

### Cotação de frete

A cotação passa sempre pela rota interna `POST /api/freight/quote`. Token e chamadas ao
Melhor Envio ficam só no server.

- **Sem credenciais:** é o padrão do `pnpm dev` (ou `NUXT_FREIGHT_API_MODE=mock`). A rota devolve dados
  estáticos com `simulated: true` e registra um aviso no log. Fora de `pnpm dev` esse modo responde 503.
- **Sandbox do Melhor Envio:** crie uma conta em https://sandbox.melhorenvio.com.br, cadastre um aplicativo
  em Integrações › Área Dev e gere um access token pelo fluxo OAuth2 com o escopo `shipping-calculate`
  ([doc](https://docs.melhorenvio.com.br/reference/solicitacao-do-token)). Depois use
  `NUXT_FREIGHT_API_MODE=melhor-envio`, `NUXT_MELHOR_ENVIO_TOKEN` e `NUXT_MELHOR_ENVIO_USER_AGENT`.
  O token vale 30 dias e é renovado manualmente.

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
  utils/                      funções puras (formatadores, máscaras)
shared/schemas/               schemas zod usados pelo app e pelo server (fonte da verdade da validação)
shared/types/                 contratos compartilhados entre app e server (resposta da cotação)
server/api/                   rotas internas (Nitro), ex.: /api/freight/quote
server/utils/freight/         integração Melhor Envio, mock de desenvolvimento e erros da cotação
tests/
  unit/                       Vitest em ambiente Node (schemas, utils)
  component/                  Vitest em ambiente Nuxt (componentes)
  mocks/                      handlers e servidor do MSW (respostas simuladas do Melhor Envio)
  e2e/                        Playwright
docs/                         registro de decisões
```

## Decisões técnicas

A preencher. O registro completo fica em [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Limitações conhecidas

A preencher.
