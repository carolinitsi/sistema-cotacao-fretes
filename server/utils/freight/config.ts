import { FREIGHT_ERROR_MESSAGES, FreightQuoteError } from './errors'

export const MELHOR_ENVIO_SANDBOX_URL = 'https://sandbox.melhorenvio.com.br'

export interface MelhorEnvioConfig {
  baseUrl: string
  token: string
  userAgent: string
}

// Formato do runtimeConfig privado (ver nuxt.config.ts).
export interface FreightRuntimeConfig {
  freightApiMode: string
  melhorEnvio: MelhorEnvioConfig
}

export type FreightConfig
  = | { mode: 'mock' }
    | { mode: 'melhor-envio', melhorEnvio: MelhorEnvioConfig }

function notConfigured(reason: string): FreightQuoteError {
  console.error(`[freight] ${reason}`)

  return new FreightQuoteError(503, FREIGHT_ERROR_MESSAGES.notConfigured)
}

// Sem modo definido: mock em desenvolvimento (roda sem credenciais) e API real fora dele.
// A escolha é feita antes de qualquer chamada; uma falha da API real nunca vira mock,
// e configuração incompleta vira 503 explícito.
export function resolveFreightConfig(runtime: FreightRuntimeConfig, isDev: boolean): FreightConfig {
  const mode = runtime.freightApiMode || (isDev ? 'mock' : 'melhor-envio')

  if (mode === 'mock') {
    if (!isDev) {
      throw notConfigured('NUXT_FREIGHT_API_MODE=mock só é permitido em desenvolvimento.')
    }

    return { mode: 'mock' }
  }

  if (mode !== 'melhor-envio') {
    throw notConfigured(`NUXT_FREIGHT_API_MODE inválido: "${mode}". Use "melhor-envio" ou "mock".`)
  }

  const { baseUrl, token, userAgent } = runtime.melhorEnvio

  if (!token || !userAgent) {
    throw notConfigured('Defina NUXT_MELHOR_ENVIO_TOKEN e NUXT_MELHOR_ENVIO_USER_AGENT, ou use NUXT_FREIGHT_API_MODE=mock em desenvolvimento.')
  }

  return { mode: 'melhor-envio', melhorEnvio: { baseUrl: baseUrl || MELHOR_ENVIO_SANDBOX_URL, token, userAgent } }
}
