# Review Issues — Current Changes (feat/quotation-form, `87f1f20..HEAD`)

## Executive Summary

| Reviewer | Critical | High | Medium | Low | Verdict |
|----------|----------|------|--------|-----|---------|
| Code     | 0        | 0    | 4      | 5   | ✅      |
| Security | 0        | 0    | 0      | 3   | ✅      |

Verificação: `pnpm lint`, `pnpm typecheck` e `pnpm test` (225 testes) passando. `pnpm test:e2e` e `pnpm build` não foram rodados na revisão.

## Code Review Issues

### [MEDIUM] `watch(request)` pode sobrescrever edições não enviadas
- **Arquivo:** `app/components/features/quote/FreightQuoteForm.vue` (~22-24), `app/composables/useQuoteRequestQuery.ts:8`
- **Descrição:** `request` é um `computed` que devolve um objeto novo a cada mudança de `route.query`. Uma navegação que gera uma query com o mesmo conteúdo (só hash, link para a mesma URL) dispara o watch e `Object.assign(state, createQuoteFormState(next))` descarta o que o usuário digitou. Isso contraria a R6 da spec (editar após o envio não pode ser afetado).
- **Código atual:**
  ```ts
  watch(request, (next) => {
    Object.assign(state, createQuoteFormState(next))
  })
  ```
- **Correção:** comparar por valor antes de resetar, por exemplo observando uma chave serializada (`computed(() => JSON.stringify(request.value))`) ou um `computed` que devolve `prev` quando os valores são iguais. Adicionar um teste de componente: editar um campo, navegar para a mesma query com hash e verificar que a edição foi mantida.

### [MEDIUM] Template do slot `#error` duplicado (3 cópias)
- **Arquivo:** `app/components/features/quote/FreightQuoteForm.vue` (~84-97, ~121-134, ~150-163)
- **Descrição:** o mesmo bloco de ícone e mensagem aparece três vezes. Uma mudança visual ou de a11y precisa ser feita em três lugares.
- **Código atual:**
  ```vue
  <template #error="{ error }">
    <span v-if="error" class="flex items-center gap-1">
      <UIcon name="i-lucide-circle-alert" class="size-icon shrink-0" aria-hidden="true" />
      {{ error }}
    </span>
  </template>
  ```
- **Correção:** extrair para um componente pequeno (ex.: `UiFieldError.vue` com a prop `error`) ou criar um wrapper de `UFormField` que já tenha o slot.

### [MEDIUM] Resultado anterior some durante o recálculo (ambiguidade da R10)
- **Arquivo:** `app/components/features/quote/FreightQuoteForm.vue` (~228, `v-else-if="data && !isFetching"`)
- **Descrição:** a R10 da spec diz "dados mantidos" durante o loading, mas o resultado fica oculto em qualquer busca. Se "dados" se refere ao resultado anterior, o código contradiz a spec. Se se refere aos campos, a redação é ambígua.
- **Correção:** esclarecer a redação da spec, ou manter o `data` anterior visível (`placeholderData: keepPreviousData` no `useFreightQuote`) enquanto a região `aria-live` anuncia "Calculando frete…". Registrar a escolha em `DECISIONS.md` se o comportamento mudar.

### [MEDIUM] Recuo do texto com número fixo em vez do token do controle
- **Arquivo:** `app/app.config.ts` (~65-72)
- **Descrição:** a caixa do ícone tem `aspect-square` e herda a altura de `h-control` (`--fp-size-control-height`), mas o recuo do texto é `ps-13` fixo. Se o token mudar, a caixa e o recuo ficam desalinhados.
- **Código atual:** `{ leading: true, size: 'md', class: 'ps-13' }`
- **Correção:** derivar o recuo do token (ex.: `ps-[calc(var(--fp-size-control-height)+0.75rem)]` ou uma classe nomeada no `main.css`) e documentar em `docs/design-tokens.md`.

### [LOW] Spread redundante em `createQuoteFormState`
- **Arquivo:** `app/utils/quote-form.ts` (~38)
- **Descrição:** `{ ...request, insuranceBrl: request.insuranceBrl }`: a linha explícita não acrescenta nada. Confirmar que é intencional o campo de seguro ficar vazio quando a URL não traz `insuranceBrl`, enquanto um formulário novo mostra `0,00`.
- **Correção:** `{ ...request }`.

### [LOW] `:disabled` redundante no botão de envio
- **Arquivo:** `app/components/features/quote/FreightQuoteForm.vue` (~178)
- **Descrição:** `UButton` com `:loading` já fica desabilitado. Desabilitar o botão em foco faz o foco cair no `body` durante a busca.
- **Correção:** remover `:disabled`, ou usar `aria-disabled` e manter a guarda de `isFetching` no `onSubmit`.

### [LOW] Loops imperativos com mutação nos utils de query
- **Arquivo:** `app/utils/quote-query.ts` (~12-19, ~39-43)
- **Correção (opcional):** `Object.fromEntries` com `map`/`flatMap`. O código atual é legível.

### [LOW] Tipo de retorno implícito e foco direto no DOM
- **Arquivo:** `app/components/features/quote/FreightQuoteForm.vue` (~40-62)
- **Descrição:** `onSubmit` sem `Promise<void>` declarado; `document.getElementById(id)?.focus()` acessa o DOM diretamente (funciona, só roda no cliente e está documentado). Apenas observação de estilo.

### [LOW] Resultado em cache aparece um tick depois na navegação SPA
- **Arquivo:** `app/components/features/quote/FreightQuoteForm.vue` (~11-14)
- **Descrição:** como o request só é passado após `onMounted` (DECISIONS 027), até um resultado em cache aparece um tick depois. É um trade-off já documentado; um comentário sobre navegação no cliente ajudaria.

### Lacunas de teste
- Reset do formulário pelo `watch(request)` com query de mesmo valor.
- Voltar e avançar no histórico no nível de componente (hoje coberto só no E2E).
- `FreightFormSection` sem descrição.

## Security Review Issues

### [LOW] Link compartilhado dispara chamada à transportadora e o endpoint não tem limite de taxa
- **Arquivo:** `app/components/features/quote/FreightQuoteForm.vue:13-16`, `app/composables/useQuoteRequestQuery.ts:7`
- **Categoria:** abuso de recursos / rate limiting (CWE-770)
- **Descrição:** abrir `/calcular-frete?...` com uma query válida faz o cliente chamar `POST /api/freight/quote` após montar. A DECISIONS 027 já impede chamadas do SSR, de robôs e de prévias de link. `server/api/freight/quote.post.ts` não tem limite de taxa.
- **Impacto:** esgotamento da cota do token do Melhor Envio. A UI nova não abre nada além do que um POST direto já permite.
- **Correção:** limite por IP (middleware do Nitro ou módulo de rate limit) retornando 429 e, opcionalmente, cache curto no servidor por chave do request. Fazer antes de ir para produção.

### [LOW] Texto de erro do servidor exibido ao usuário
- **Arquivo:** `FreightQuoteForm.vue:225`, `app/utils/freight-errors.ts:21`
- **Categoria:** exposição de informação (CWE-209)
- **Descrição:** `getFreightErrorMessage` mostra `error.data.message` como vem do servidor. A interpolação do Vue escapa o texto (sem XSS), mas a segurança depende de todo `createError` do servidor usar texto revisado.
- **Impacto:** um erro futuro que repasse detalhes internos ou da transportadora em `message` aparece na UI.
- **Correção:** manter as mensagens do servidor revisadas e, opcionalmente, usar uma lista de mensagens permitidas por `statusCode` no cliente.

### [LOW] Valores do request na URL e no histórico
- **Arquivo:** `app/utils/quote-query.ts:7-20`
- **Categoria:** exposição de dados (CWE-598)
- **Descrição:** CEPs, medidas e seguro vão na query string, por decisão (DECISIONS 004 e 026). Aparecem no histórico, em logs e no `Referer`. Sensibilidade baixa (sem PII nem credenciais).
- **Correção:** nenhuma necessária. Manter a política de referrer padrão `strict-origin-when-cross-origin` e evitar scripts de terceiros nesta página.

### Fora do diff (anterior a esta mudança)
- **Dependências:** `pnpm audit --prod` aponta 56 achados (4 critical, 30 high, 16 moderate, 6 low), a maioria transitivos de build/tooling (tar, simple-git, shell-quote). O `devalue` (GHSA-wf3x-273g-mvxv, <=5.9.2, via Nuxt) é usado no payload do SSR e merece atenção: atualizar o Nuxt ou adicionar um override do pnpm para >=5.9.3. A explorabilidade não foi verificada.
- **Limite de body:** `quote.post.ts:9` só checa o header `content-length`; requests chunked passam por fora. Impacto pequeno (zod valida um body com poucos campos).
- **Headers de segurança:** sem CSP, HSTS nem X-Frame-Options no `nuxt.config.ts`.

## Positive Observations

- Separação clara: lógica pura em `app/utils`, sincronização com a URL num composable, componentes sem `$fetch`. Sem `any`, sem Pinia, sem hex ou px nos componentes.
- Um único schema zod nas duas pontas (formulário via `UForm`, URL via `safeParse`, servidor), o que também cobre URLs editadas à mão.
- Parsing numérico estrito, sem `z.coerce` (rejeita `"1e2"`, `" "`, `Infinity`). Arrays e valores fora dos limites viram `null` e não cotam.
- SSR sem chamada à API (DECISIONS 027): robôs e prévias não consomem a cota.
- Retry só para falhas transitórias. Guarda contra envio duplo. Saída sempre escapada, sem `v-html`.
- A11y bem cuidada: campos com label, erro com ícone e texto, foco no primeiro campo inválido, `role="status"` e `role="alert"`, seção com `aria-labelledby`.
- Estados de loading, erro, vazio e simulado tratados. `router.push` preserva o botão voltar.
- DECISIONS 026/027 no formato exigido, spec em sincronia com a implementação, commits pequenos e convencionais.

## Implementation Priorities

- **High:** nenhum item no diff. Fora do escopo, antes do release: auditoria de dependências (principalmente `devalue`).
- **Medium:** comparar `request` por valor no `watch` (com teste); extrair o slot de erro; decidir a R10 (manter o resultado anterior ou ajustar a spec); derivar `ps-13` do token de altura do controle. Antes de produção: rate limit em `/api/freight/quote` e headers de segurança.
- **Low:** spread redundante, `:disabled` redundante, loops em `quote-query.ts`, tipo de retorno de `onSubmit`, revisão das mensagens de erro do servidor, lacunas de teste listadas.

## Scores

- **Security Score**: 8.5/10
- **Code Quality Score**: 8.5/10
