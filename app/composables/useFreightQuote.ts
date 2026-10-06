import { useQuery } from '@tanstack/vue-query'
import type { QuoteRequest } from '#shared/schemas/quote'
import type { FreightQuoteResponse } from '#shared/types/freight'

// Cotação por parâmetros: a mesma request reaproveita o cache; sem request, não busca.
export function useFreightQuote(request: MaybeRefOrGetter<QuoteRequest | null | undefined>) {
  const query = useQuery({
    queryKey: computed(() => ['freight-quote', toValue(request) ?? null] as const),
    queryFn: ({ queryKey: [, body], signal }) => $fetch<FreightQuoteResponse>('/api/freight/quote', {
      method: 'POST',
      body: body ?? undefined,
      signal
    }),
    enabled: computed(() => toValue(request) != null),
    retry: (failureCount, error) => failureCount < 1 && isRetryableFreightError(error)
  })

  const errorMessage = computed(() => (query.error.value ? getFreightErrorMessage(query.error.value) : null))

  return { ...query, errorMessage }
}
