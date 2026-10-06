import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { QuoteRequest } from '#shared/schemas/quote'
import { FreightQuoteError } from '../../server/utils/freight/errors'
import { fetchMelhorEnvioQuote } from '../../server/utils/freight/melhor-envio'
import { MELHOR_ENVIO_CALCULATE_URL, MELHOR_ENVIO_TEST_CONFIG, melhorEnvioFixtures, melhorEnvioHandlers } from '../mocks/melhor-envio'
import { server } from '../mocks/server'

const request: QuoteRequest = {
  originCep: '01310100',
  destinationCep: '20040002',
  heightCm: 10.2,
  widthCm: 15,
  lengthCm: 20.5,
  weightKg: 1.25,
  insuranceBrl: 150.5
}

async function quoteError(): Promise<FreightQuoteError> {
  const error = await fetchMelhorEnvioQuote(request, MELHOR_ENVIO_TEST_CONFIG, { timeoutMs: 50 }).catch((caught: unknown) => caught)
  expect(error).toBeInstanceOf(FreightQuoteError)

  return error as FreightQuoteError
}

describe('integração Melhor Envio', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('envia o payload e os headers documentados, com medidas arredondadas para cima', async () => {
    let captured: Request | undefined
    server.use(http.post(MELHOR_ENVIO_CALCULATE_URL, ({ request: incoming }) => {
      captured = incoming.clone()

      return HttpResponse.json([])
    }))

    await fetchMelhorEnvioQuote(request, MELHOR_ENVIO_TEST_CONFIG)

    expect(captured?.headers.get('authorization')).toBe('Bearer token-de-teste')
    expect(captured?.headers.get('user-agent')).toBe('FretePro (testes@example.com)')
    expect(captured?.headers.get('accept')).toBe('application/json')
    expect(await captured?.json()).toEqual({
      from: { postal_code: '01310100' },
      to: { postal_code: '20040002' },
      products: [{ id: 'encomenda', width: 15, height: 11, length: 21, weight: 1.25, insurance_value: 150.5, quantity: 1 }]
    })
  })

  it('envia seguro 0 quando não informado', async () => {
    let body: unknown
    server.use(http.post(MELHOR_ENVIO_CALCULATE_URL, async ({ request: incoming }) => {
      body = await incoming.json()

      return HttpResponse.json([])
    }))

    await fetchMelhorEnvioQuote({ ...request, insuranceBrl: undefined }, MELHOR_ENVIO_TEST_CONFIG)

    expect(body).toMatchObject({ products: [{ insurance_value: 0 }] })
  })

  it('normaliza os serviços usando os valores customizados', async () => {
    const options = await fetchMelhorEnvioQuote(request, MELHOR_ENVIO_TEST_CONFIG)

    expect(options).toEqual([
      {
        id: 1,
        service: 'PAC',
        carrier: { name: 'Correios', logoUrl: 'https://sandbox.melhorenvio.com.br/images/shipping-companies/correios.png' },
        disabled: false,
        priceBrl: 35.5,
        deliveryDays: 10,
        deliveryRange: { min: 9, max: 10 }
      },
      {
        id: 3,
        service: '.Package',
        carrier: { name: 'Jadlog', logoUrl: 'https://sandbox.melhorenvio.com.br/images/shipping-companies/jadlog.png' },
        disabled: false,
        priceBrl: 18.6,
        deliveryDays: 6,
        deliveryRange: { min: 5, max: 6 }
      }
    ])
  })

  it('mantém serviços indisponíveis como desabilitados, com a mensagem da API', async () => {
    server.use(melhorEnvioHandlers.withUnavailable())

    const options = await fetchMelhorEnvioQuote(request, MELHOR_ENVIO_TEST_CONFIG)

    expect(options).toHaveLength(3)
    expect(options.at(-1)).toEqual({
      id: 17,
      service: 'Mini Envios',
      carrier: { name: 'Correios', logoUrl: 'https://sandbox.melhorenvio.com.br/images/shipping-companies/correios.png' },
      disabled: true,
      disabledReason: 'Serviço indisponível para o trecho informado.'
    })
  })

  it('descarta logo fora de http(s) sem invalidar a cotação', async () => {
    server.use(http.post(MELHOR_ENVIO_CALCULATE_URL, () => HttpResponse.json([
      { ...melhorEnvioFixtures.success[0], company: { name: 'Correios', picture: 'javascript:alert(1)' } }
    ])))

    const [option] = await fetchMelhorEnvioQuote(request, MELHOR_ENVIO_TEST_CONFIG)

    expect(option?.carrier).toEqual({ name: 'Correios', logoUrl: null })
  })

  it('devolve lista vazia quando não há serviços', async () => {
    server.use(melhorEnvioHandlers.empty())

    expect(await fetchMelhorEnvioQuote(request, MELHOR_ENVIO_TEST_CONFIG)).toEqual([])
  })

  it('converte 422 da API em 422 com mensagem própria, sem repassar a da API', async () => {
    server.use(melhorEnvioHandlers.validationError())

    const error = await quoteError()

    expect(error.statusCode).toBe(422)
    expect(error.message).toBe('Não foi possível calcular o frete para os dados informados.')
  })

  it.each([
    ['token recusado (401)', melhorEnvioHandlers.unauthorized],
    ['erro interno (500)', melhorEnvioHandlers.serverError],
    ['falha de rede', melhorEnvioHandlers.networkError]
  ])('responde 502 de serviço indisponível em %s', async (_, handler) => {
    server.use(handler())

    const error = await quoteError()

    expect(error.statusCode).toBe(502)
    expect(error.message).toBe('Serviço de frete indisponível no momento. Tente novamente em instantes.')
  })

  it.each([
    ['fora do contrato', melhorEnvioHandlers.invalidResponse],
    ['que não é JSON', melhorEnvioHandlers.notJson]
  ])('responde 502 para resposta %s', async (_, handler) => {
    server.use(handler())

    const error = await quoteError()

    expect(error.statusCode).toBe(502)
    expect(error.message).toBe('Resposta inválida do serviço de frete.')
  })

  it('responde 504 quando a API passa do tempo limite', async () => {
    server.use(melhorEnvioHandlers.slow(500))

    const error = await quoteError()

    expect(error.statusCode).toBe(504)
  })
})
