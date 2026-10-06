import { describe, expect, it } from 'vitest'
import { getFreightErrorIssues, getFreightErrorMessage, isRetryableFreightError } from '~/utils/freight-errors'

// Formato do erro do $fetch quando a rota responde com createError.
function fetchError(statusCode: number, data: unknown) {
  return Object.assign(new Error('fetch failed'), { statusCode, data })
}

describe('freight-errors', () => {
  it('usa a mensagem enviada pela rota', () => {
    const error = fetchError(422, { statusCode: 422, message: 'Não foi possível calcular o frete para os dados informados.' })

    expect(getFreightErrorMessage(error)).toBe('Não foi possível calcular o frete para os dados informados.')
  })

  it('usa uma mensagem genérica quando o erro não tem corpo', () => {
    expect(getFreightErrorMessage(new TypeError('Failed to fetch'))).toBe('Não foi possível calcular o frete. Tente novamente.')
  })

  it('extrai os erros de campo do 400', () => {
    const error = fetchError(400, {
      message: 'Dados da cotação inválidos.',
      data: { issues: [{ path: 'originCep', message: 'CEP inválido. Use o formato 00000-000.' }, { path: 1 }] }
    })

    expect(getFreightErrorIssues(error)).toEqual([{ path: 'originCep', message: 'CEP inválido. Use o formato 00000-000.' }])
  })

  it.each([
    [fetchError(502, {}), true],
    [fetchError(504, {}), true],
    [new TypeError('Failed to fetch'), true],
    [fetchError(400, {}), false],
    [fetchError(422, {}), false]
  ])('repete só falhas transitórias (%#)', (error, expected) => {
    expect(isRetryableFreightError(error)).toBe(expected)
  })
})
