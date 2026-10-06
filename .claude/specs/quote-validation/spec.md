# Spec — Validação, máscaras e formatação da cotação

## Objetivo
Base de validação, máscara e formatação dos campos do formulário de cotação (CEPs, medidas, peso,
seguro), pronta para o formulário e para a API mock. Sem montar o formulário nem a server route.

## Decisões da entrevista
- Schemas em `shared/schemas` (convenção do Nuxt 4 para código usado pelo app e pelo server), importados por `#shared/...`.
- O schema valida valores **normalizados** (CEP só dígitos, números); a máscara é só apresentação.
- `UInput` + máscaras próprias (funções puras), não `UInputNumber`: o design tem ícone à esquerda e
  mostra erros de "0" e negativo, que o `UInputNumber` corrigiria em silêncio ao sair do campo.
- Limites: medidas até 200 cm com 1 casa decimal; peso até 1000 kg com 3 casas; seguro até R$ 1.000.000,00 com 2 casas.
- Mensagem de CEP corrigida para "CEP inválido. Use o formato 00000-000."
- Origem igual ao destino é permitido.
- Para o formulário (próxima tarefa): botão "Calcular frete" sempre habilitado, validação no envio,
  desabilitado só durante o loading; ícone do seguro `i-lucide-banknote`.

## Arquitetura
- `shared/schemas/quote.ts`: `quoteRequestSchema`, `QuoteRequest`, `QUOTE_LIMITS`.
- `app/utils/formatters.ts`: `formatCep`, `formatDecimal`, `formatWeight`, `formatDimensions`, `formatDeliveryTime`.
- `app/utils/masks.ts`: `InputMask<T>` (`mask`, `parse`, `format`), `cepMask`, `decimalMask(opts)`, `currencyMask`.
- `app/components/ui/MaskedInput.vue`: wrapper do `UInput`; exibe o texto mascarado e emite o valor normalizado.

## Requisitos
| # | Requisito | Aceite |
|---|-----------|--------|
| R1 | CEP obrigatório com 8 dígitos | Vazio → "Informe o CEP de origem/destino."; outro tamanho → "CEP inválido. Use o formato 00000-000." |
| R2 | Altura, largura, comprimento obrigatórios, > 0, ≤ 200, 1 casa | Vazio → "Informe a altura."; 0 → "A altura deve ser maior que 0." |
| R3 | Peso obrigatório, > 0, ≤ 1000, 3 casas | 0 → "O peso deve ser maior que 0." |
| R4 | Seguro opcional, ≥ 0, ≤ 1.000.000, 2 casas | -10 → "O valor do seguro não pode ser negativo."; ausente é válido |
| R5 | Máscara de CEP | "01310100" → "01310-100"; letras ignoradas; máx. 8 dígitos |
| R6 | Máscara decimal pt-BR | "12,5" → 12.5; "." vira ","; sem sinal; respeita casas e dígitos inteiros |
| R7 | Máscara de moeda (preenche da direita) | "123456" → "1.234,56" → 1234.56; vazio → `undefined` |
| R8 | Formatadores | `1.25` kg → "1,25 kg"; 3 dias → "3 dias úteis"; 1 → "1 dia útil" |
| R9 | `MaskedInput` | Digitar mascara o texto e atualiza o v-model normalizado; mudança externa do v-model atualiza o texto; caractere inválido não aparece |
| R10 | Docs | DECISIONS (017+), CLAUDE.md e README apontando `shared/schemas` |
| R11 | Qualidade | `pnpm lint`, `typecheck`, `test` verdes |

## Tarefas
1. `chore`: alias `#shared` no projeto unit do Vitest; remover `app/schemas`; CLAUDE.md, README e DECISIONS.
2. `feat(schemas)`: `shared/schemas/quote.ts` + `tests/unit/quote-schema.spec.ts`.
3. `feat(utils)`: `formatters.ts` + `tests/unit/formatters.spec.ts`.
4. `feat(utils)`: `masks.ts` + `tests/unit/masks.spec.ts`.
5. `feat(ui)`: `MaskedInput.vue` + `tests/component/masked-input.spec.ts`.

## Fora de escopo
Formulário da página, server route `/api/quotes`, estado na URL, busca de endereço por CEP.
