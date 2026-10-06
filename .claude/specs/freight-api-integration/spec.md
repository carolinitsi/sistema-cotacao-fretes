# Spec — Integração da cotação de fretes (Melhor Envio)

## Objetivo
Camada de API da cotação: endpoint interno `/api/freight/quote`, integração server-side com o
Melhor Envio (Sandbox por padrão), mock explícito de desenvolvimento, composable com Vue Query e
MSW nos testes. Sem tela, formulário ou tabela.

## Contrato externo (confirmado na doc oficial)
- `POST {baseUrl}/api/v2/me/shipment/calculate`; Sandbox `https://sandbox.melhorenvio.com.br`, produção `https://melhorenvio.com.br`.
- Headers: `Authorization: Bearer <token>`, `Accept` e `Content-Type: application/json`, `User-Agent: App (email)` (obrigatório).
- Payload por produtos: `from.postal_code`, `to.postal_code`, `products[]` com `id`, `width`/`height`/`length`
  (inteiros, cm), `weight` (kg), `insurance_value` (R$), `quantity`.
- 200: array de serviços; `price`/`custom_price` são **strings**; usar `custom_price`, `custom_delivery_time`
  e `custom_delivery_range` (recomendação da doc). `company { id, name, picture }`.
- 422: `{ message, errors: { campo: string[] } }`.
- Autenticação OAuth2 (app na Área Dev, escopo `shipping-calculate`); access token de 30 dias.
- **Não documentado:** itens de serviço indisponível `{ id, name, error, company? }`. Comportamento observado
  na API real; tratado como parte do contrato e registrado em DECISIONS.

## Decisões da entrevista
- Sem credenciais agora: integração real pronta, lendo o token do runtime config do server; em dev, mock por env.
  Sem fluxo OAuth no app: o token é obtido fora do app e renovado manualmente (limitação registrada).
- Serviços indisponíveis **aparecem** na resposta, com `disabled: true` e a mensagem da API.
- Medidas com decimal são arredondadas para cima (`Math.ceil`) só no payload do Melhor Envio.
- Composable com `useQuery` por parâmetros (combina com a decisão 004, estado na URL).

## Arquitetura
```
useFreightQuote(request) → Vue Query → POST /api/freight/quote → quoteFreight()
                                                                   ├─ modo melhor-envio → fetch Sandbox/produção
                                                                   └─ modo mock (só dev) → dados estáticos
```
- `shared/types/freight.ts`: contrato interno (`FreightOption`, `FreightQuoteResponse`, `FreightQuoteErrorData`).
- `server/utils/freight/config.ts`: lê e valida o runtime config (modo, token, baseUrl, userAgent).
- `server/utils/freight/melhor-envio.ts`: payload, schema zod da resposta externa, normalização, chamada e mapeamento de erros.
- `server/utils/freight/mock.ts`: fixture no formato do Melhor Envio passada pela mesma normalização; `simulated: true`.
- `server/utils/freight/quote.ts`: `quoteFreight(body, config)` valida a entrada e escolhe o modo; lança `FreightQuoteError`.
- `server/api/freight/quote.post.ts`: adaptador fino do h3 (lê body, chama `quoteFreight`, converte erro em `createError`).
- `app/composables/useFreightQuote.ts` + `app/utils/freight-errors.ts` (mensagem amigável a partir do erro).

O núcleo (`server/utils/freight/*`) não usa auto-imports do Nitro e chama o `fetch` global, para rodar no projeto
`unit` do Vitest com o MSW interceptando o Melhor Envio. A rota é só o adaptador.

## Contrato interno
```ts
type FreightOption =
  | { id, service, carrier: { name, logoUrl } | null, disabled: false, priceBrl: number, deliveryDays: number, deliveryRange: { min, max } | null }
  | { id, service, carrier: { name, logoUrl } | null, disabled: true, disabledReason: string }
interface FreightQuoteResponse { options: FreightOption[], simulated: boolean }
```

## Configuração (runtime config, só server)
| Env | Padrão | Uso |
|-----|--------|-----|
| `NUXT_FREIGHT_API_MODE` | `melhor-envio` | `mock` só é aceito em dev |
| `NUXT_MELHOR_ENVIO_BASE_URL` | Sandbox | produção quando houver app homologado |
| `NUXT_MELHOR_ENVIO_TOKEN` | vazio | access token (escopo `shipping-calculate`) |
| `NUXT_MELHOR_ENVIO_USER_AGENT` | vazio | `FretePro (email@contato)`, exigido pela API |

## Requisitos
| # | Requisito | Aceite |
|---|-----------|--------|
| R1 | Entrada validada pelo `quoteRequestSchema` | Body inválido → 400 com `issues` (path + mensagem do schema), sem ecoar o input; não chama a API |
| R2 | Payload do Melhor Envio | CEPs, `products[0]` com medidas `ceil`, peso, `insurance_value` (seguro ou 0), `quantity: 1`; headers da doc |
| R3 | Normalização | `custom_price` "37.79" → 37.79; prazo e faixa custom; empresa e logo; itens com `error` → `disabled: true` |
| R4 | Lista vazia | `[]` da API → `options: []` (200) |
| R5 | Erro da API | 422 → 422 "Não foi possível calcular o frete para os dados informados."; 401/403 → 502 (log de token inválido); 429/5xx/rede → 502; timeout 10 s → 504 |
| R6 | Resposta inválida | Fora do schema → 502 "Resposta inválida do serviço de frete." |
| R7 | Não configurado | Modo real sem token ou user agent → 503 "Cotação de frete não configurada."; nunca cai no mock |
| R8 | Mock de dev | `NUXT_FREIGHT_API_MODE=mock` em dev → dados estáticos com `simulated: true` e aviso no log; fora de dev → 503 |
| R9 | Segredos | Token só em `runtimeConfig` privado; nada em `public`, nada no bundle do cliente |
| R10 | Composable | `useFreightQuote(request)`: desabilitado sem request; expõe estados do Vue Query e `errorMessage`; não repete erros 4xx |
| R11 | MSW | Handlers do Melhor Envio: sucesso, erro 422/401/500, resposta inválida, lista vazia, com indisponíveis |
| R12 | Docs | DECISIONS (021+), README (env), `.env.example` |
| R13 | Qualidade | `pnpm lint`, `typecheck`, `test` verdes |

## Tarefas
1. `feat(types)`: contrato interno em `shared/types/freight.ts`.
2. `feat(server)`: config + cliente Melhor Envio + normalização + handlers MSW + testes.
3. `feat(server)`: mock de dev + `quoteFreight` + testes de modo/erros.
4. `feat(api)`: rota `server/api/freight/quote.post.ts` + runtime config.
5. `feat(composables)`: `useFreightQuote` + `freight-errors` + testes.
6. `docs`: DECISIONS, README, `.env.example`.

## Fora de escopo
Formulário, tabela, filtros, ordenação, OAuth/refresh token, persistência de token, histórico.
