import type { LocationQuery } from 'vue-router'
import { quoteRequestSchema, type QuoteRequest } from '#shared/schemas/quote'

const NUMBER_FIELDS = ['heightCm', 'widthCm', 'lengthCm', 'weightKg', 'insuranceBrl'] as const

const NUMERIC_TEXT = /^-?\d+(\.\d+)?$/

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
