import type { FreightQuoteIssue } from '#shared/types/freight'

const GENERIC_MESSAGE = 'Não foi possível calcular o frete. Tente novamente.'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

// Erro do $fetch (ofetch): `statusCode` e `data` com o corpo do createError da rota
// ({ statusCode, message, data }).
function errorBody(error: unknown): Record<string, unknown> | undefined {
  return isRecord(error) && isRecord(error.data) ? error.data : undefined
}

export function getFreightErrorStatus(error: unknown): number | undefined {
  return isRecord(error) && typeof error.statusCode === 'number' ? error.statusCode : undefined
}

export function getFreightErrorMessage(error: unknown): string {
  const message = errorBody(error)?.message

  return typeof message === 'string' && message ? message : GENERIC_MESSAGE
}

export function getFreightErrorIssues(error: unknown): FreightQuoteIssue[] {
  const data = errorBody(error)?.data
  const issues = isRecord(data) ? data.issues : undefined

  return Array.isArray(issues)
    ? issues.filter((issue): issue is FreightQuoteIssue => isRecord(issue) && typeof issue.path === 'string' && typeof issue.message === 'string')
    : []
}

// Repete só falhas transitórias (rede, 5xx); erro de dados (4xx) não muda com nova tentativa.
export function isRetryableFreightError(error: unknown): boolean {
  const status = getFreightErrorStatus(error)

  return status === undefined || status >= 500
}
