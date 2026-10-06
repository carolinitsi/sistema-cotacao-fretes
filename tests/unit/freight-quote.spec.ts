import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type FreightConfig, resolveFreightConfig } from '../../server/utils/freight/config'
import { FreightQuoteError } from '../../server/utils/freight/errors'
import { quoteFreight } from '../../server/utils/freight/quote'
import { MELHOR_ENVIO_CALCULATE_URL, MELHOR_ENVIO_TEST_CONFIG } from '../mocks/melhor-envio'
import { server } from '../mocks/server'

const validBody = {
  originCep: '01310100',
  destinationCep: '20040002',
  heightCm: 10,
  widthCm: 15,
  lengthCm: 20,
  weightKg: 1.5
}

const realConfig: FreightConfig = { mode: 'melhor-envio', melhorEnvio: MELHOR_ENVIO_TEST_CONFIG }

async function caught(promise: Promise<unknown>): Promise<FreightQuoteError> {
  const error = await promise.catch((reason: unknown) => reason)
  expect(error).toBeInstanceOf(FreightQuoteError)

  return error as FreightQuoteError
}

describe('quoteFreight', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('cota pela API real e marca a resposta como não simulada', async () => {
    const response = await quoteFreight(validBody, realConfig)

    expect(response.simulated).toBe(false)
    expect(response.options.map(option => option.service)).toEqual(['PAC', '.Package'])
  })

  it('rejeita entrada inválida com 400 e as mensagens do schema, sem chamar a API', async () => {
    const calls = vi.fn()
    server.use(http.post(MELHOR_ENVIO_CALCULATE_URL, () => {
      calls()

      return HttpResponse.json([])
    }))

    const error = await caught(quoteFreight({ ...validBody, originCep: '123', weightKg: 0 }, realConfig))

    expect(error.statusCode).toBe(400)
    expect(error.data?.issues).toEqual([
      { path: 'originCep', message: 'CEP inválido. Use o formato 00000-000.' },
      { path: 'weightKg', message: 'O peso deve ser maior que 0.' }
    ])
    expect(calls).not.toHaveBeenCalled()
  })

  it('não ecoa o valor recebido na resposta de erro', async () => {
    const error = await caught(quoteFreight({ ...validBody, originCep: '<script>' }, realConfig))

    expect(JSON.stringify(error.data)).not.toContain('<script>')
  })

  it('no modo mock devolve dados simulados no mesmo contrato, sem chamar a API', async () => {
    const response = await quoteFreight(validBody, { mode: 'mock' })

    expect(response.simulated).toBe(true)
    expect(response.options.length).toBeGreaterThan(0)
    expect(response.options).toContainEqual(expect.objectContaining({ disabled: false, priceBrl: expect.any(Number), deliveryDays: expect.any(Number) }))
    expect(response.options).toContainEqual(expect.objectContaining({ disabled: true, disabledReason: expect.any(String) }))
  })

  it('valida a entrada também no modo mock', async () => {
    const error = await caught(quoteFreight({}, { mode: 'mock' }))

    expect(error.statusCode).toBe(400)
  })
})

describe('resolveFreightConfig', () => {
  const runtime = {
    freightApiMode: 'melhor-envio',
    melhorEnvio: { baseUrl: '', token: 'abc', userAgent: 'FretePro (a@b.com)' }
  }

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('usa o Sandbox quando a URL base não é informada', () => {
    expect(resolveFreightConfig(runtime, false)).toEqual({
      mode: 'melhor-envio',
      melhorEnvio: { baseUrl: 'https://sandbox.melhorenvio.com.br', token: 'abc', userAgent: 'FretePro (a@b.com)' }
    })
  })

  it('aceita o mock em desenvolvimento', () => {
    expect(resolveFreightConfig({ ...runtime, freightApiMode: 'mock' }, true)).toEqual({ mode: 'mock' })
  })

  it('sem modo definido, usa o mock em desenvolvimento mesmo com token', () => {
    expect(resolveFreightConfig({ ...runtime, freightApiMode: '' }, true)).toEqual({ mode: 'mock' })
  })

  it('sem modo definido, usa o Melhor Envio fora de desenvolvimento', () => {
    expect(resolveFreightConfig({ ...runtime, freightApiMode: '' }, false)).toMatchObject({ mode: 'melhor-envio' })
  })

  it('em desenvolvimento, usa o Melhor Envio quando o modo é escolhido', () => {
    expect(resolveFreightConfig(runtime, true)).toMatchObject({ mode: 'melhor-envio' })
  })

  it.each([
    ['mock fora de desenvolvimento', { ...runtime, freightApiMode: 'mock' }],
    ['modo vazio fora de desenvolvimento e sem token', { freightApiMode: '', melhorEnvio: { ...runtime.melhorEnvio, token: '' } }],
    ['modo desconhecido', { ...runtime, freightApiMode: 'fake' }],
    ['sem token', { ...runtime, melhorEnvio: { ...runtime.melhorEnvio, token: '' } }],
    ['sem user agent', { ...runtime, melhorEnvio: { ...runtime.melhorEnvio, userAgent: '' } }]
  ])('responde 503 de cotação não configurada com %s, sem cair no mock', (_, config) => {
    const error = (() => {
      try {
        return resolveFreightConfig(config, false)
      } catch (thrown) {
        return thrown
      }
    })()

    expect(error).toBeInstanceOf(FreightQuoteError)
    expect(error).toMatchObject({ statusCode: 503, message: 'Cotação de frete não configurada.' })
  })
})
