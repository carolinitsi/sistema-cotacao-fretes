import { quoteRequestSchema } from '#shared/schemas/quote'
import type { FreightQuoteResponse } from '#shared/types/freight'
import type { FreightConfig } from './config'
import { FREIGHT_ERROR_MESSAGES, FreightQuoteError } from './errors'
import { fetchMelhorEnvioQuote } from './melhor-envio'
import { getMockFreightOptions } from './mock'

// Núcleo da rota /api/freight/quote, sem dependência do h3 para rodar nos testes unitários.
export async function quoteFreight(body: unknown, config: FreightConfig): Promise<FreightQuoteResponse> {
  const result = quoteRequestSchema.safeParse(body)

  // Devolve só caminho e mensagem do schema, nunca o valor recebido.
  if (!result.success) {
    const issues = result.error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message }))
    throw new FreightQuoteError(400, FREIGHT_ERROR_MESSAGES.invalidInput, { data: { issues } })
  }

  if (config.mode === 'mock') {
    console.warn('[freight] Usando dados simulados (modo mock). Para a API real, use NUXT_FREIGHT_API_MODE=melhor-envio.')

    return { options: getMockFreightOptions(), simulated: true }
  }

  return { options: await fetchMelhorEnvioQuote(result.data, config.melhorEnvio), simulated: false }
}
