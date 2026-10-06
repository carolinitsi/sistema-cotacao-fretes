# Design tokens

## Origem

Os tokens vieram de variáveis do Figma, exportadas em `docs/design/tokens/`:

- `primitives.tokens.json`: paletas `yellow`, `amber`, `neutral` e `red`.
- `semantic.tokens.json`: tokens `color.*`, que são aliases dos primitivos.
- `foundations.tokens.json`: `space`, `radius`, `border`, `type`, `size` e `shadow`.

Essas variáveis foram **extraídas de imagens (PNG) do design**, não do arquivo Figma original. Os valores são **aproximados** e ainda **precisam ser validados contra o arquivo original**. Cada token traz o status:

> proposta extraída de imagens. Validar no original

Os JSONs não devem ser editados à mão. Quando o design for validado, substitua o export e rode `pnpm test`: o teste `tests/unit/design-tokens.test.ts` acusa qualquer valor que tenha mudado e não foi copiado para o CSS.

## Arquitetura

```text
Figma JSON (docs/design/tokens)
   ↓
--fp-* (app/assets/css/tokens.css): primitivos → semânticos → fundamentos → derivados
   ↓
@theme do Tailwind + --ui-* do Nuxt UI (app/assets/css/main.css)
   ↓
ui.* no app.config.ts (UButton, UInput, UFormField, UCard)
   ↓
componentes
```

Regras de nome: o caminho do token vira kebab-case com o prefixo `--fp-`.

- `text.onDisabled` vira `--fp-text-on-disabled`.
- O grupo `color` dos semânticos é omitido.
- `type.*` vira `--fp-font-*`.

Os tamanhos estão em `rem` (16px = 1rem). O px original fica em comentário ao lado.

## Tokens

Origem `design` = vem do export do Figma. Origem `derivado` = calculado aqui, não existe no design.

### Primitivos

| Token | Valor | Origem | Uso |
| ----- | ----- | ------ | --- |
| `--fp-yellow-50` | `#FDF4DD` | design | base de surface/selected, brand-50 |
| `--fp-yellow-500` | `#FABB02` | design | brand, ação primária, brand-500 |
| `--fp-amber-700` | `#B97800` | design | text/selected, brand-700, anel de foco |
| `--fp-neutral-0` | `#FFFFFF` | design | superfície, texto sobre desabilitado |
| `--fp-neutral-50` | `#F5F7F9` | design | fundo da página |
| `--fp-neutral-100` | `#F1F5F9` | design | superfície sutil |
| `--fp-neutral-200` | `#E2E8F0` | design | borda padrão |
| `--fp-neutral-400` | `#B8C2CF` | design | ação desabilitada |
| `--fp-neutral-500` | `#64748B` | design | texto secundário |
| `--fp-neutral-900` | `#0F172A` | design | texto primário, cor da sombra |
| `--fp-red-50` | `#FFF3F4` | design | superfície de erro |
| `--fp-red-500` | `#FF3B45` | design | feedback de erro, borda de erro |

### Semânticos

| Token | Valor | Origem | Uso |
| ----- | ----- | ------ | --- |
| `--fp-brand` | `yellow-500` | design | cor da marca (`ui.colors.primary = 'brand'`) |
| `--fp-action-primary` | `yellow-500` | design | fundo do botão primário (`bg-primary`) |
| `--fp-action-disabled` | `neutral-400` | design | fundo do botão desabilitado (`bg-disabled`) |
| `--fp-bg-page` | `neutral-50` | design | fundo do `body` (`bg-page`, `--ui-bg-muted`) |
| `--fp-surface-default` | `neutral-0` | design | cards, inputs (`bg-surface`, `--ui-bg`) |
| `--fp-surface-subtle` | `neutral-100` | design | áreas sutis (`bg-surface-subtle`, `--ui-bg-elevated`) |
| `--fp-surface-selected` | `yellow-50` | design | item selecionado (`bg-surface-selected`) |
| `--fp-surface-error` | `red-50` | design | input em erro (`bg-surface-error`) |
| `--fp-text-primary` | `neutral-900` | design | texto (`--ui-text`, `--ui-text-highlighted`) |
| `--fp-text-secondary` | `neutral-500` | design | substituído por `--fp-text-secondary-a11y` |
| `--fp-text-selected` | `amber-700` | design | substituído por `--fp-text-selected-a11y` |
| `--fp-text-on-disabled` | `neutral-0` | design | texto do botão desabilitado (`text-on-disabled`) |
| `--fp-border-default` | `neutral-200` | design | bordas (`--ui-border*`) |
| `--fp-feedback-error` | `red-500` | design | cor de erro do Nuxt UI (`--ui-error`) |

### Fundamentos

| Token | Valor | Origem | Uso |
| ----- | ----- | ------ | --- |
| `--fp-space-8` / `-12` / `-16` / `-24` | 8 / 12 / 16 / 24px | design | escala padrão do Tailwind: `2` / `3` / `4` / `6` |
| `--fp-radius-control` | 6px | design | `rounded-control` (botão, input) |
| `--fp-radius-card` | 8px | design | `rounded-card` (UCard) |
| `--fp-border-width-default` | 1px | design | borda padrão (Tailwind `border` / `ring`) |
| `--fp-border-style-default` | `solid` | design | borda padrão |
| `--fp-font-family` | Inter | design | `--font-sans` (Inter + fallback do sistema) |
| `--fp-font-title-*` | 24 / 700 / 32 | design | `text-title` |
| `--fp-font-section-*` | 16 / 600 / 24 | design | `text-section` |
| `--fp-font-body-*` | 14 / 400 / 20 | design | `text-body` (input, botão) |
| `--fp-font-label-*` | 14 / 500 / 20 | design | `text-label` (label do UFormField) |
| `--fp-font-caption-*` | 12 / 400 / 16 | design | `text-caption` |
| `--fp-font-button-weight` | 600 | design | `font-button` |
| `--fp-size-icon` | 16px | design | `size-icon` |
| `--fp-size-control-height` | 40px | design | `h-control` (botão, input) |
| `--fp-shadow-none` | `none` | design | sem sombra |
| `--fp-shadow-subtle-*` | `0 2px 8px 0 #0F172A08` | design | partes da sombra (alpha 8/255 ≈ 3,1%) |
| `--fp-shadow-subtle` | composição acima | design | `shadow-subtle` (UCard) |

### Derivados

| Token | Valor | Origem | Uso |
| ----- | ----- | ------ | --- |
| `--fp-text-secondary-a11y` | `#617188` | derivado de `neutral-500` | `text-muted` (`--ui-text-muted`) |
| `--fp-text-selected-a11y` | `#9C6400` | derivado de `amber-700` | `text-selected-a11y` |
| `--fp-text-error-a11y` | `#E10B2C` | derivado de `red-500` | `text-error-a11y` (mensagem de erro) |
| `--fp-focus-ring` | `amber-700` | derivado (alias) | `outline-focus`, `ring-focus` |
| `--fp-border-error` | `red-500` | derivado (alias) | `ring-error-border` (input em erro) |
| `--fp-icon-error-halo` | `#FFD6D8` | derivado de `red-50` + `red-500` | `bg-error-halo` |
| `--fp-brand-50` | `yellow-50` | design | `brand-50` |
| `--fp-brand-100` | `#FCEABF` | derivado | `brand-100` |
| `--fp-brand-200` | `#FBDF9F` | derivado | `brand-200` |
| `--fp-brand-300` | `#FAD47D` | derivado | `brand-300` |
| `--fp-brand-400` | `#FAC855` | derivado | `brand-400` |
| `--fp-brand-500` | `yellow-500` | design | `brand-500` = `--ui-primary` |
| `--fp-brand-600` | `#DA9801` | derivado | `brand-600` |
| `--fp-brand-700` | `amber-700` | design | `brand-700` |
| `--fp-brand-800` | `#925E00` | derivado | `brand-800` |
| `--fp-brand-900` | `#6C4400` | derivado | `brand-900` |
| `--fp-brand-950` | `#5A3800` | derivado | `brand-950` |

**Como a escala brand foi calculada.** O Nuxt UI exige os tons de 50 a 950. Todo o cálculo é feito em OKLCH, com conversão sRGB↔OKLab de Björn Ottosson.

- **Âncoras do design:** 50 (`yellow/50`), 500 (`yellow/500`) e 700 (`amber/700`).
- **100–400:** interpolação linear de L, C e H entre as âncoras 50 e 500, em passos de 1/5.
- **600:** ponto médio entre 500 e 700.
- **800, 900 e 950:** extrapolação a partir de 700.
  - L cai com o mesmo ΔL por passo de 500→600, ou seja 0,1008. O 950 é meio passo.
  - H fica fixo no valor do 700.
  - C é proporcional a L.
- **Gamut:** quando um tom fica fora do sRGB, o croma é reduzido.
- **Resultado:** L decresce monotonicamente de 0,968 (50) a 0,372 (950).

O script do cálculo não é versionado (ver DECISIONS 012). O método e os valores estão aqui e nos comentários de `tokens.css`.

## Acessibilidade

Os contrastes seguem o WCAG 2.x, calculados com `app/utils/contrast.ts`. A referência é 4,5:1 para texto e 3:1 para componentes de interface.

| Par | Contraste original | Variante | Contraste final | Motivo |
| --- | --- | --- | --- | --- |
| text/primary sobre surface/default | 17,85:1 | — | — | passa |
| text/primary sobre bg/page | 16,62:1 | — | — | passa |
| text/secondary sobre surface/default | 4,76:1 | `--fp-text-secondary-a11y` | 4,97:1 | variante única para todos os fundos |
| text/secondary sobre bg/page | **4,43:1** | `--fp-text-secondary-a11y` | 4,63:1 | abaixo de 4,5:1 |
| text/secondary sobre surface/subtle | **4,34:1** | `--fp-text-secondary-a11y` | 4,54:1 | abaixo de 4,5:1 |
| text/selected sobre surface/selected | **3,33:1** | `--fp-text-selected-a11y` | 4,52:1 | abaixo de 4,5:1 |
| feedback/error sobre surface/error | **3,25:1** | `--fp-text-error-a11y` | 4,52:1 (4,90:1 em branco) | abaixo de 4,5:1 |
| text/onDisabled sobre action/disabled | 1,80:1 | — | — | isento: controle desabilitado (WCAG 1.4.3) |
| botão: text/primary sobre action/primary | 10,35:1 | — | — | passa; texto branco daria 1,73:1 |

Como as variantes foram obtidas:

- **Método:** mantêm o matiz (H) e o croma (C) em OKLCH e reduzem só a luminosidade (L), em passos de 0,0005, até o primeiro valor que atinge 4,5:1 em todos os fundos do par. A cor muda o mínimo necessário.
- **Mudança de L:**
  - secondary: ΔL −0,009
  - selected: ΔL −0,075
  - error: ΔL −0,080
- **Tokens originais:** ficam intactos. Os componentes usam as variantes por meio de:
  - `--ui-text-muted`
  - `text-selected-a11y`
  - `text-error-a11y` (slot `error` do UFormField)

Componentes de interface (3:1):

- **Anel de foco (`--fp-focus-ring`):**
  - `yellow/500` tem só 1,73:1 contra branco.
  - `amber/700`, que já está no design, atinge 3,65:1 em branco, 3,40:1 em bg/page e 3,33:1 em surface/selected. Por isso é reaproveitado e nenhuma cor nova é criada.
  - É aplicado como `outline` de 3px no botão (com offset de 2px) e no input.
- **Borda de erro (`--fp-border-error = red/500`):** 3,52:1 em branco e 3,25:1 em surface/error.
- **Halo do ícone de erro:** decorativo, sem exigência de contraste. O ícone usa `text-error-a11y`.

O teste `tests/unit/design-tokens.test.ts` verifica todos esses pares. Ele também falha se uma variante a11y deixar de ser necessária.

## Escala de medidas

> **Hipótese, não confirmada pelo Figma:** as imagens parecem ter sido exportadas aproximadamente em 0,75x.

Se isso se confirmar, as medidas em px estimadas a partir do raster podem estar escaladas. Os valores dos JSONs foram usados como estão. Conferir no arquivo original antes de ajustar.

O espaçamento (8/12/16/24) coincide com a escala padrão do Tailwind (`2`/`3`/`4`/`6`, base 4px), então não ganhou utilities próprias (DECISIONS 012).

## Inconsistências conhecidas

1. **Ícone de pin no campo de seguro em estado de erro:** o ícone exibido nesse estado não corresponde ao campo. Validar com o design qual ícone (se algum) deve aparecer.
2. **Layout shift quando aparece a mensagem de erro:** o surgimento da mensagem desloca o conteúdo abaixo do campo. Definir com o design se o espaço da mensagem deve ser reservado.
3. **Estados ausentes no PNG:** não há foco, hover nem loading. O foco foi derivado (`--fp-focus-ring`). Hover e loading seguem o padrão do Nuxt UI até existir design.
4. **Amarelo divergente:** a amostragem de pixels do PNG dá aproximadamente `#FEC107`, mas a variável do Figma define `#FABB02`. O projeto usa o valor do JSON (`#FABB02`). A diferença pode vir de compressão ou perfil de cor do PNG.

Pontos observados na implementação, ainda sem design:

- O placeholder do input usa `--ui-text-dimmed` (slate-400 do Nuxt UI), que fica abaixo de 4,5:1. O design não define um token para ele.
- `text-primary` (amarelo sobre branco, 1,73:1) aparece nas variantes `link`, `ghost` e `outline` do Nuxt UI. Evitar essas variantes para texto até haver token.
- O design só tem modo claro, por isso o color mode está fixo em `light` (DECISIONS 013).

## Página de conferência

`/styleguide` (fora do menu, `noindex`) mostra os swatches com nome, hex e origem, a escala tipográfica e os estados dos componentes. Serve para comparar visualmente com o PNG original.
