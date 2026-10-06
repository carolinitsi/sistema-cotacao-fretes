import { z } from 'zod'
import type { QuoteRequest } from '#shared/schemas/quote'
import type { FreightCarrier, FreightOption } from '#shared/types/freight'
import type { MelhorEnvioConfig } from './config'
import { FREIGHT_ERROR_MESSAGES, FreightQuoteError } from './errors'

// Contrato de https://docs.melhorenvio.com.br/reference/calculo-de-fretes-por-produtos
const CALCULATE_PATH = '/api/v2/me/shipment/calculate'
const REQUEST_TIMEOUT_MS = 10_000

// A API devolve preços como string ("37.79").
const priceSchema = z.string().regex(/^\d+(\.\d+)?$/).transform(Number)

// Logo é só apresentação: URL ausente ou fora de http(s) vira null em vez de invalidar a cotação.
const companySchema = z.object({
  name: z.string(),
  picture: z.url({ protocol: /^https?$/ }).optional().catch(undefined)
})

const availableServiceSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  custom_price: priceSchema,
  custom_delivery_time: z.number().int().nonnegative(),
  custom_delivery_range: z.object({ min: z.number().int(), max: z.number().int() }).optional(),
  company: companySchema
})

// Serviço indisponível: não está na doc, mas a API real devolve { id, name, error, company? }.
const unavailableServiceSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  error: z.string().min(1),
  company: companySchema.optional()
})

export const melhorEnvioQuoteResponseSchema = z.array(z.union([unavailableServiceSchema, availableServiceSchema]))

export type MelhorEnvioQuoteResponse = z.input<typeof melhorEnvioQuoteResponseSchema>

// Uma encomenda = um produto. A API declara as medidas como inteiros;
// arredondar para cima nunca cota um pacote menor que o real.
export function buildMelhorEnvioPayload(request: QuoteRequest) {
  return {
    from: { postal_code: request.originCep },
    to: { postal_code: request.destinationCep },
    products: [{
      id: 'encomenda',
      width: Math.ceil(request.widthCm),
      height: Math.ceil(request.heightCm),
      length: Math.ceil(request.lengthCm),
      weight: request.weightKg,
      insurance_value: request.insuranceBrl ?? 0,
      quantity: 1
    }]
  }
}

function toCarrier(company: z.output<typeof companySchema> | undefined): FreightCarrier | null {
  return company ? { name: company.name, logoUrl: company.picture ?? null } : null
}

export function normalizeMelhorEnvioResponse(services: z.output<typeof melhorEnvioQuoteResponseSchema>): FreightOption[] {
  return services.map((service) => {
    const base = { id: service.id, service: service.name, carrier: toCarrier(service.company) }

    if ('error' in service) {
      return { ...base, disabled: true, disabledReason: service.error }
    }

    return {
      ...base,
      disabled: false,
      priceBrl: service.custom_price,
      deliveryDays: service.custom_delivery_time,
      deliveryRange: service.custom_delivery_range ?? null
    }
  })
}

export function parseMelhorEnvioResponse(body: unknown): FreightOption[] {
  const result = melhorEnvioQuoteResponseSchema.safeParse(body)

  if (!result.success) {
    console.error('[freight] Resposta do Melhor Envio fora do contrato:', z.treeifyError(result.error))
    throw new FreightQuoteError(502, FREIGHT_ERROR_MESSAGES.invalidResponse)
  }

  return normalizeMelhorEnvioResponse(result.data)
}

function upstreamError(status: number): FreightQuoteError {
  if (status === 422) {
    return new FreightQuoteError(422, FREIGHT_ERROR_MESSAGES.unprocessable)
  }

  if (status === 401 || status === 403) {
    console.error(`[freight] Melhor Envio recusou o token (${status}): verifique validade e escopo shipping-calculate.`)
  } else {
    console.error(`[freight] Melhor Envio respondeu ${status}.`)
  }

  return new FreightQuoteError(502, FREIGHT_ERROR_MESSAGES.unavailable)
}

export async function fetchMelhorEnvioQuote(
  request: QuoteRequest,
  config: MelhorEnvioConfig,
  options: { timeoutMs?: number } = {}
): Promise<FreightOption[]> {
  let response: Response

  try {
    response = await fetch(new URL(CALCULATE_PATH, config.baseUrl), {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.token}`,
        'User-Agent': config.userAgent
      },
      body: JSON.stringify(buildMelhorEnvioPayload(request)),
      signal: AbortSignal.timeout(options.timeoutMs ?? REQUEST_TIMEOUT_MS)
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new FreightQuoteError(504, FREIGHT_ERROR_MESSAGES.timeout, { cause: error })
    }

    console.error('[freight] Falha de rede ao chamar o Melhor Envio:', error)
    throw new FreightQuoteError(502, FREIGHT_ERROR_MESSAGES.unavailable, { cause: error })
  }

  if (!response.ok) {
    throw upstreamError(response.status)
  }

  let body: unknown

  try {
    body = await response.json()
  } catch (error) {
    throw new FreightQuoteError(502, FREIGHT_ERROR_MESSAGES.invalidResponse, { cause: error })
  }

  return parseMelhorEnvioResponse(body)
}
