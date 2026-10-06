import type { FreightQuoteErrorData } from '#shared/types/freight'

// Mensagens seguras para o usuário: não repassam detalhes da API externa.
export const FREIGHT_ERROR_MESSAGES = {
  invalidInput: 'Dados da cotação inválidos.',
  notConfigured: 'Cotação de frete não configurada.',
  unprocessable: 'Não foi possível calcular o frete para os dados informados.',
  unavailable: 'Serviço de frete indisponível no momento. Tente novamente em instantes.',
  timeout: 'O serviço de frete demorou para responder. Tente novamente.',
  invalidResponse: 'Resposta inválida do serviço de frete.'
} as const

// Erro de domínio da cotação; a rota converte em resposta HTTP com o mesmo status.
export class FreightQuoteError extends Error {
  readonly statusCode: number
  readonly data: FreightQuoteErrorData | undefined

  constructor(statusCode: number, message: string, options: { data?: FreightQuoteErrorData, cause?: unknown } = {}) {
    super(message, { cause: options.cause })
    this.name = 'FreightQuoteError'
    this.statusCode = statusCode
    this.data = options.data
  }
}
