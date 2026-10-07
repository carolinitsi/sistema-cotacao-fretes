# Spec — Tela de resultados da cotação

> Status: implementado (aguardando revisão). Decisão em DECISIONS 028.

## Objetivo
Na mesma página `/calcular-frete`, depois de um envio válido, trocar o formulário pela tela de resultados:
card de resumo dos dados do envio e tabela de opções de frete. O botão "Editar dados" volta ao formulário
preenchido. Tudo é reconstruído a partir da URL.

## Decisões da entrevista
- **Modo na URL:** query válida → resultados; `edit=1` junto da query → formulário preenchido. O envio grava
  a query sem a flag. Reload, voltar/avançar e link compartilhado reproduzem o modo.
- **Loading:** a tela de resultados aparece logo após o envio (o resumo vem da URL), com skeleton das linhas e
  status anunciado. Erro aparece ali, com "Tentar novamente" e "Editar dados".
- **Mobile:** tabela semântica a partir de `md`; abaixo disso, lista (`ul`/`li`) com os mesmos dados.
- **Ações:** botão de seta "Selecionar" por opção, sem fluxo de contratação: mostra um toast "em breve".
  Indisponíveis: botão desabilitado e o texto fixo "Transportadora não atende este trecho." no lugar do prazo.
- **Transportadora:** só o logotipo (nome no `alt`); sem logo ou com falha na imagem, o nome em texto.

## Infraestrutura reutilizada (não recriar)
- `useFreightQuote(request)` — `data`, `isFetching`, `isError`, `errorMessage`, `refetch`.
- `useQuoteRequestQuery` — estendido com o modo de edição (não há composable novo).
- `parseQuoteQuery`, `quoteRequestToQuery` (`app/utils/quote-query.ts`).
- `FreightQuoteForm` (mesmo formulário; vira só edição + emit do request válido).
- `formatCep`, `formatDimensions`, `formatWeight`, `formatDeliveryTime`, `formatCurrency`.
- `FreightQuoteResponse`/`FreightOption` como estão (sem segundo formato de resposta).

## Arquitetura
```
route.query ──► parseQuoteQuery ──► request (edição)          ─► FreightQuoteForm (:key = request serializado)
            └─► getQuotedRequest ─► quotedRequest (sem edit=1) ─► FreightQuoteResults
                                                                   ├─ useFreightQuote(quotedRequest, após montar)
                                                                   ├─ FreightQuoteSummary (resumo + Editar dados)
                                                                   └─ FreightOptionsTable (tabela md+ / lista mobile)
Breadcrumb: getBreadcrumbItems(path, query) → "Calcular frete > Resultados" quando há quotedRequest.
```

- `pages/calcular-frete.vue` escolhe a visão (`quotedRequest ? resultados : formulário`), troca título/descrição
  do header e move o foco para o `h1` após enviar ou editar (o botão clicado some da tela).
- O formulário é remontado por `:key` quando o request da URL muda (histórico), no lugar do `watch(request)`:
  menos estado, e query com o mesmo valor não descarta a edição (review-issues da etapa anterior).
- A cotação só roda com a tela de resultados montada (DECISIONS 027): editar não cota; reload em `edit=1` não cota.
- Apresentação em `app/utils/quote-results.ts`: ordenação (disponíveis por preço, indisponíveis no fim),
  prazo com faixa ("1 a 2 dias úteis") e resumo formatado do request.

## Requisitos
| # | Requisito | Aceite |
|---|-----------|--------|
| R1 | Visão por URL | Sem query/query inválida → formulário vazio; query válida → resultados; `edit=1` → formulário preenchido |
| R2 | Breadcrumb | Formulário: "Calcular frete"; resultados: "Calcular frete > Resultados", atual com `aria-current` |
| R3 | Header | Formulário: "Calcular frete"; resultados: "Cotações de frete / Confira as opções disponíveis para o seu envio." |
| R4 | Resumo | CEPs formatados, dimensões, peso, seguro (não informado quando ausente); valores normalizados intactos |
| R5 | Editar dados | push com `edit=1`; formulário com os dados; novo envio atualiza URL e resultados |
| R6 | Tabela | Transportadora (só o logo, nome no alt), modalidade, prazo, valor, ações; `th scope=col`, caption |
| R7 | Indisponível | "Transportadora não atende este trecho." no lugar do prazo, célula de valor vazia, botão desabilitado |
| R8 | Loading | Skeleton (oculto da árvore de a11y), status "Calculando frete…", nada de tabela vazia |
| R9 | Erro | `errorMessage` em `UAlert` com `role="alert"` e "Tentar novamente" |
| R10 | Vazio | Mensagem de nenhuma transportadora; sem aviso de cotação simulada (DECISIONS 028) |
| R11 | Responsivo | Lista abaixo de `md`, sem overflow horizontal em 375px |
| R12 | Requisições | Uma chamada por cotação; editar e reenviar o mesmo request usa o cache |
| R13 | Qualidade | lint, typecheck, test, build (e E2E) verdes |

## Fora de escopo
Fluxo de contratação/seleção do frete, ordenação interativa, filtros, paginação.
