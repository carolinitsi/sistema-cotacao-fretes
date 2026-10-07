# Spec — Formulário de cotação de frete

> Status: implementado (aguardando revisão). Decisões em DECISIONS 026 e 027.

## Objetivo
Tela `/calcular-frete` com o formulário de cotação (CEPs, dimensões, peso, seguro), validação pelo
`quoteRequestSchema` e cotação via `useFreightQuote` a partir da query string, que só é gravada
após submit válido. Exibe lista mínima do resultado.

## Decisões da entrevista
- Medidas e peso começam vazios (`undefined`), só com placeholder padrão; os valores 2/12/17/0,30 do design
  eram inconsistência. Seguro começa em `0` (exibido "0,00").
- O `QuoteRequest` vive na **query string** (DECISIONS 004 e 025): o submit válido grava a URL e o
  `useFreightQuote` lê o request derivado dela. Reload e link compartilhado refazem a cotação.
- Sucesso: lista mínima das opções (transportadora, serviço, preço, prazo; indisponíveis com motivo),
  aviso de cotação simulada e estado vazio. Tabela rica fica para outra tarefa.

## Infraestrutura reutilizada (não recriar)
- `quoteRequestSchema`, `QuoteRequest`, `QUOTE_LIMITS` (`#shared/schemas/quote`) — validação e mensagens.
- `FreightQuoteResponse`, `FreightOption` (`#shared/types/freight`).
- `useFreightQuote(request)` — `isFetching`, `isError`, `data`, `errorMessage`.
- `UiMaskedInput` + `cepMask`, `decimalMask`, `currencyMask` (`app/utils/masks.ts`).
- `formatCurrency`, `formatDeliveryTime` para o resultado.

## Arquitetura
```
QuoteFormState (reactive, edição; digitar não cota)
  → UForm :schema="quoteRequestSchema" (validação no submit)
  → mapFormToQuoteRequest()                     app/utils/quote-form.ts
  → quoteRequestToQuery() → router.push({ query })
                                                 ↓
route.query → parseQuoteQuery() → quoteRequestSchema.safeParse → QuoteRequest | null
  → useFreightQuote(request)  (null → não busca)
  → loading | erro (errorMessage) | resultado (lista mínima) | vazio
```

### Query string
- Chaves iguais às do schema: `originCep`, `destinationCep`, `heightCm`, `widthCm`, `lengthCm`,
  `weightKg`, `insuranceBrl`. Ex.: `?originCep=01310100&destinationCep=20040002&heightCm=10&widthCm=15&lengthCm=20&weightKg=1.5&insuranceBrl=0`.
- Serialização: CEP só dígitos; números com `String(n)` (ponto decimal); seguro `undefined` é omitido,
  `0` é gravado.
- Leitura na borda (spec quote-validation): texto → número só se for numérico (`''`, ausente ou não numérico
  → `undefined`), arrays de query → descartados; **sem `z.coerce` no schema**. Depois
  `quoteRequestSchema.safeParse`: inválido → `null` (não cota, nada é exibido como erro de API).
- O schema é a fonte da verdade nas duas pontas: URL manipulada com valor fora dos limites (ex.: `heightCm=500`)
  não chega à API.
- `router.push` (não `replace`): voltar no navegador retorna à cotação anterior.
- Mesmo request submetido de novo → URL igual → resposta do cache do Vue Query (`staleTime` 5 min), sem nova chamada.

### Sincronização URL → formulário
- Ao abrir a página com query válida, o formulário é preenchido com o request.
- Quando a query muda por navegação (voltar/avançar, link), o formulário é atualizado com o novo request
  (um `watch` sobre o request derivado da URL; único watcher, necessário para histórico).
- Query inválida ou parcial: formulário com os valores iniciais e nenhuma cotação.

### Arquivos
- `app/utils/quote-form.ts`: `QuoteFormState`, `createQuoteFormState(request?)`, `mapFormToQuoteRequest()`.
- `app/utils/quote-query.ts`: `quoteRequestToQuery()`, `parseQuoteQuery()` (funções puras).
- `app/composables/useQuoteRequestQuery.ts`: `request` (computed da rota) e `setRequest()` (push da query).
- `app/components/features/quote/FreightFormSection.vue`: ícone, título, descrição, slot. Sem regra de negócio.
- `app/components/features/quote/FreightQuoteForm.vue`: estado, UForm, submit, `useFreightQuote`, estados.
- `app/components/features/quote/FreightQuoteResult.vue`: lista mínima (se o design não trouxer outro formato).
- `app/pages/calcular-frete.vue`: monta o header + `FreightQuoteForm`.

## Requisitos
| # | Requisito | Aceite |
|---|-----------|--------|
| R1 | Seções | Endereços, Dimensões e peso, Seguro (opcional), com título/descrição do pedido |
| R2 | Estado inicial | Sem query: CEPs `''`; medidas e peso `undefined` com placeholder; seguro `0` ("0,00") |
| R3 | Validação | Mensagens do schema; erro com `aria-invalid` + `aria-describedby`; foco no 1º inválido |
| R4 | Submit inválido | Não altera a URL, não chama a API |
| R5 | Submit válido | URL recebe a query do `QuoteRequest` (CEP só dígitos, números, seguro 0 mantido) |
| R6 | Digitação | Editar após submit não altera a URL nem refaz a cotação; só um novo submit |
| R7 | Query → request | Query válida → `QuoteRequest` e cotação; inválida/parcial/fora dos limites → `null`, sem cotação |
| R8 | Reload/link | Abrir a URL com query válida preenche o formulário e cota |
| R9 | Histórico | Voltar/avançar atualiza formulário e resultado |
| R10 | Loading | Botão com loading e desabilitado; submit ignorado durante loading; dados mantidos; status anunciado (`aria-live`) |
| R11 | Erro | `errorMessage` em `UAlert` (role alert) |
| R12 | Sucesso | Lista mínima; aviso quando `simulated`; vazio quando `options: []` |
| R13 | Responsivo | Desktop: CEPs lado a lado, dimensões em linha; mobile: empilhado, sem overflow |
| R14 | Docs | DECISIONS: Form State × QuoteRequest; cotação só no submit; request na query string; FreightFormSection |
| R15 | Qualidade | lint, typecheck, test, build verdes |

## Tarefas
1. `feat(utils)`: `quote-form.ts` + `tests/unit/quote-form.spec.ts`.
2. `feat(utils)`: `quote-query.ts` + `tests/unit/quote-query.spec.ts` (ida e volta, texto vazio, não numérico,
   arrays, fora dos limites, seguro omitido × 0).
3. `feat(composables)`: `useQuoteRequestQuery`.
4. `feat(quote)`: `FreightFormSection.vue`.
5. `feat(quote)`: `FreightQuoteForm.vue` + resultado + página + `tests/component/freight-quote-form.spec.ts`
   (rota simulada com `registerEndpoint`, como em `use-freight-quote.spec.ts`).
6. `test(e2e)`: fluxo principal com `/api/freight/quote` interceptado por `page.route` (no build de produção
   o mock responde 503, DECISIONS 022).
7. `docs`: DECISIONS.

## Resolvido na implementação
- Layout pelas imagens: um card por seção, botão em card próprio alinhado à direita (largura total no mobile).
- Placeholders: `0` nas medidas e `0,000` no peso.
- Ícone do seguro: `i-lucide-banknote` (DECISIONS 020), não o "R$" da imagem.
- E2E com `/api/freight/quote` interceptado por `page.route`.
- Cotação só no cliente, após montar (DECISIONS 027): no SSR o `useQuery` buscaria sem esperar e o cliente repetiria a chamada.
- `UForm` com `:loading-auto="false"` para o foco no primeiro inválido funcionar.

## Fora de escopo
Tabela/ordenação de resultados, busca de endereço por CEP, nomes curtos/traduzidos nas chaves da query.
