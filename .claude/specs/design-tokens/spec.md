# Spec — Design tokens do Figma

Status: proposta extraída de imagens. Validar no original.

## Objetivo
Transformar os tokens exportados do Figma (`docs/design/tokens/*.tokens.json`, somente leitura)
em CSS do projeto e integrá-los ao Tailwind 4 e ao Nuxt UI. Sem telas do produto.

## Decisões da entrevista
- Modo claro forçado (`colorMode.preference/fallback = 'light'`); só existe design claro.
- `--fp-text-secondary-a11y` garante 4,5:1 sobre todos os fundos neutros (surface/default, bg/page, surface/subtle).
- Espaçamento usa a escala padrão do Tailwind (8/12/16/24 = 2/3/4/6); decisão registrada.
- Cálculo OKLCH só documentado (sem script versionado).

## Fluxo
Figma JSON → `--fp-*` (tokens.css) → `@theme` / `--ui-*` (main.css) → `ui` (app.config.ts) → componentes.

## Requisitos
| # | Requisito | Aceite |
|---|-----------|--------|
| R1 | `tokens.css` com camadas primitivos / semânticos (via `var()`) / fundamentos / derivados | Nomes 1:1 (`text.onDisabled` → `--fp-text-on-disabled`) |
| R2 | Paleta `brand-50..950` em `@theme static`, âncoras 50/500/700, demais por OKLCH | Monotônica em L; comentários de origem |
| R3 | `--font-sans` Inter via @nuxt/fonts (já registrado pelo Nuxt UI) | Fonte carregada no `/styleguide` |
| R4 | Utilities: `rounded-control`, `rounded-card`, `shadow-subtle`, `text-title..caption`, `h-control`, cores semânticas | Referenciam `--fp-*` |
| R5 | Variantes a11y só onde < 4,5:1; focus ring ≥ 3:1 vs branco; borda e halo de erro | Teste de contraste passa |
| R6 | `ui.colors` primary=brand, neutral=slate, error=red; `--ui-*` mapeados para `--fp-*` | — |
| R7 | UButton/UInput/UFormField/UCard ajustados via `ui` | Altura 40, radius, pesos, texto escuro no botão |
| R8 | `tests/unit/design-tokens.test.ts`: drift JSON↔CSS + contraste | `pnpm test` verde |
| R9 | `/styleguide` (noindex, fora do menu) | Sem hex/px arbitrário |
| R10 | `docs/design-tokens.md`, DECISIONS (4 entradas + modo claro), CLAUDE.md | — |

## Fora de escopo
Layout, sidebar, topbar, telas; commits.
