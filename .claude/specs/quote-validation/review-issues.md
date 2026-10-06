# Review Issues — quote-validation

## Executive Summary

| Reviewer | Critical | High | Medium | Low | Verdict |
|----------|----------|------|--------|-----|---------|
| Code     | 0        | 1    | 2      | 3   | ❌ → ✅ após correções |
| Security | 0        | 0    | 2      | 4   | ✅ |

## Code Review Issues

- **[HIGH] — corrigido (5b5b324).** `shared/schemas/quote.ts`: `hasMaxDecimals` com tolerância fixa (1e-9) recusava centavos válidos a partir de R$ 131.072,20; foram mais de 1,1 milhão de valores entre 0 e 1.000.000 na varredura. Correção: `Number(value.toFixed(decimals)) === value`, com testes de regressão (131072.2, 999999.99, 0.3).
- **[MEDIUM] — aceito como limitação (DECISIONS 018).** `MaskedInput.vue`: o cursor vai para o fim quando a máscara reescreve o texto.
- **[MEDIUM] — corrigido (b8e14a5).** `app/utils/masks.ts`: `decimalMask` transformava "1.250,5" colado em "1,2". Com vírgula no texto, o ponto agora é tratado como milhar.
- **[LOW] — adiado.** `decimalMask.format` arredonda valores com mais casas que o permitido: normalizar ao ler a URL.
- **[LOW] — adiado.** Lacunas de teste em bordas (NaN, string no lugar de número, prazo 0).
- **[LOW] — sem ação.** Prop `mask` não reativa; moeda nunca emite 0; dois `Intl.NumberFormat` de moeda com propósitos distintos.

## Security Review Issues

- **[MEDIUM] — corrigido (5b5b324).** `shared/schemas/quote.ts`: valores positivos ínfimos (`1e-12`) passavam por `gt(0)` e pela checagem de casas decimais (CWE-1284). A verificação exata agora os rejeita; há teste.
- **[MEDIUM] — registrado para a server route (spec).** O schema sem limite de tamanho e sem contrato de uso no servidor (CWE-400/20). O regex ancorado já rejeita CEP longo em tempo linear; a rota deve usar `readValidatedBody`, só o dado validado e limite de body.
- **[LOW] — sem ação.** `cepMask.format(undefined)` lança erro; o tipo garante `string` (o estado do formulário inicia com `''`).
- **[LOW] — adiado.** Os formatadores exibem `NaN`/`∞`: validar respostas da API com zod no composable.
- **[LOW] — sem ação.** `-0` aceito no seguro; serializa como `0`.
- **[LOW] — registrado na spec.** Query string chega como texto: converter na borda, sem `z.coerce`.
- **Informativo:** `pnpm audit --prod` acusa vulnerabilidades transitivas de `nuxt`, `@nuxt/ui` e `@tanstack/vue-query`. Não foram introduzidas nesta branch.

## Positive Observations

- Schema único com valores normalizados; a máscara fica só na apresentação.
- `min(1, { abort: true })` separa "Informe o CEP" de "CEP inválido".
- Máscaras são funções puras, com regex lineares (sem ReDoS) e entrada limitada por `slice`.
- `MaskedInput` corrige o DOM quando a máscara descarta um caractere, com teste.
- Sem `v-html`, `any` ou eco de input nas mensagens.

## Implementation Priorities

- **High:** nenhum pendente.
- **Medium:** contrato de validação na futura server route.
- **Low:** normalizar valores da URL; validar respostas da API; testes de borda; atualizar dependências.

## Scores

- **Security Score**: 8/10
- **Code Quality Score**: 8/10
