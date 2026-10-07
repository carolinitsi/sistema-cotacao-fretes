import type { LocationQuery } from 'vue-router'
import { quoteRequestSchema, type QuoteRequest } from '#shared/schemas/quote'

const NUMBER_FIELDS = ['heightCm', 'widthCm', 'lengthCm', 'weightKg', 'insuranceBrl'] as const

const NUMERIC_TEXT = /^-?\d+(\.\d+)?$/

// Flag de edição: com ela, a página mostra o formulário preenchido em vez dos resultados.
const EDIT_KEY = 'edit'

// QuoteRequest → query string. Números com ponto decimal; seguro ausente fica fora da URL.
export function quoteRequestToQuery(request: QuoteRequest): Record<string, string> {
  const query: Record<string, string> = {
    originCep: request.originCep,
    destinationCep: request.destinationCep
  }

  for (const field of NUMBER_FIELDS) {
    const value = request[field]
    if (value !== undefined) {
      query[field] = String(value)
    }
  }

  return query
}

// Texto da URL → número. Texto vazio é campo não informado; o que não é número segue
// como está para o schema recusar (sem z.coerce, que aceitaria "1e2" ou " ").
function readNumber(value: unknown): unknown {
  if (value === '') {
    return undefined
  }

  return typeof value === 'string' && NUMERIC_TEXT.test(value) ? Number(value) : value
}

// Query string → QuoteRequest, validado pelo mesmo schema da API. Incompleto ou inválido → null.
export function parseQuoteQuery(query: LocationQuery): QuoteRequest | null {
  const input: Record<string, unknown> = {
    originCep: query.originCep,
    destinationCep: query.destinationCep
  }

  for (const field of NUMBER_FIELDS) {
    input[field] = readNumber(query[field])
  }

  const result = quoteRequestSchema.safeParse(input)

  return result.success ? result.data : null
}

// Modo de edição: os mesmos dados na URL, mais a flag. O envio grava a query sem ela.
export function quoteRequestToEditQuery(request: QuoteRequest): Record<string, string> {
  return { ...quoteRequestToQuery(request), [EDIT_KEY]: '1' }
}

export function isEditingQuote(query: LocationQuery): boolean {
  return query[EDIT_KEY] === '1'
}

// Request cotado: válido e fora do modo de edição. É o que a tela de resultados exibe.
export function getQuotedRequest(query: LocationQuery): QuoteRequest | null {
  return isEditingQuote(query) ? null : parseQuoteQuery(query)
}
