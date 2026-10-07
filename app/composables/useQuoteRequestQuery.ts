import type { QuoteRequest } from '#shared/schemas/quote'

// QuoteRequest na query string (DECISIONS 004): a URL é a fonte do request cotado.
export function useQuoteRequestQuery() {
  const route = useRoute()
  const router = useRouter()

  const request = computed(() => parseQuoteQuery(route.query))

  // push, não replace: voltar no navegador retorna à cotação anterior.
  // Retorna false quando a URL já era essa (mesmo request), e nada navegou.
  async function setRequest(next: QuoteRequest): Promise<boolean> {
    const failure = await router.push({ query: quoteRequestToQuery(next) })

    return !failure
  }

  return { request, setRequest }
}
