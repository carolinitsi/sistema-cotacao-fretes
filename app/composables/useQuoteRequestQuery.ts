import type { QuoteRequest } from '#shared/schemas/quote'

// QuoteRequest na query string (DECISIONS 004): a URL é a fonte do request cotado e do modo
// da página (resultados ou edição, DECISIONS 028).
export function useQuoteRequestQuery() {
  const route = useRoute()
  const router = useRouter()

  // Request válido da URL, inclusive no modo de edição: preenche o formulário.
  const request = computed(() => parseQuoteQuery(route.query))
  // Request exibido na tela de resultados: null no modo de edição.
  const quotedRequest = computed(() => getQuotedRequest(route.query))

  // push, não replace: voltar no navegador retorna à cotação anterior. A query nova não tem
  // a flag de edição, então a página passa para os resultados.
  async function setRequest(next: QuoteRequest): Promise<void> {
    await router.push({ query: quoteRequestToQuery(next) })
  }

  // Volta ao formulário com os dados da cotação atual.
  async function editRequest(): Promise<void> {
    if (request.value) {
      await router.push({ query: quoteRequestToEditQuery(request.value) })
    }
  }

  return { request, quotedRequest, setRequest, editRequest }
}
