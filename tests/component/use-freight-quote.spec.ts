import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { type QueryClient, useQueryClient } from '@tanstack/vue-query'
import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import type { QuoteRequest } from '#shared/schemas/quote'
import type { FreightQuoteResponse } from '#shared/types/freight'

const request: QuoteRequest = {
  originCep: '01310100',
  destinationCep: '20040002',
  heightCm: 10,
  widthCm: 15,
  lengthCm: 20,
  weightKg: 1.5
}

const quote: FreightQuoteResponse = {
  simulated: false,
  options: [{
    id: 1,
    service: 'PAC',
    carrier: { name: 'Correios', logoUrl: null },
    disabled: false,
    priceBrl: 35.5,
    deliveryDays: 10,
    deliveryRange: { min: 9, max: 10 }
  }]
}

// No ambiente nuxt, o $fetch de caminhos relativos vai para um app h3 do @nuxt/test-utils,
// não para o fetch global: a rota interna é simulada com registerEndpoint, não com o MSW.
let unregister: (() => void) | undefined
// O app Nuxt (e o QueryClient) é o mesmo em todos os testes do arquivo.
let queryClient: QueryClient | undefined

function mockQuoteRoute(respond: (body: unknown) => unknown) {
  const received: unknown[] = []

  unregister = registerEndpoint('/api/freight/quote', {
    method: 'POST',
    handler: async (event) => {
      const body: unknown = await event.web?.request?.json()
      received.push(body)

      return respond(body)
    }
  })

  return received
}

async function mountQuote(initial: QuoteRequest | null) {
  const input = ref<QuoteRequest | null>(initial)
  let state!: ReturnType<typeof useFreightQuote>

  const Host = defineComponent({
    setup() {
      queryClient = useQueryClient()
      state = useFreightQuote(input)

      return () => h('div')
    }
  })

  await mountSuspended(Host)

  return { input, state }
}

async function settle(state: ReturnType<typeof useFreightQuote>) {
  await flushPromises()
  await vi.waitFor(() => expect(state.isFetching.value).toBe(false))
}

describe('useFreightQuote', () => {
  afterEach(() => {
    unregister?.()
    queryClient?.clear()
  })

  it('não busca enquanto não há dados de cotação', async () => {
    const received = mockQuoteRoute(() => quote)

    const { state } = await mountQuote(null)
    await flushPromises()

    expect(received).toHaveLength(0)
    expect(state.data.value).toBeUndefined()
  })

  it('envia os dados da cotação e expõe as opções', async () => {
    const received = mockQuoteRoute(() => quote)

    const { state } = await mountQuote(request)
    await settle(state)

    expect(received).toEqual([request])
    expect(state.isSuccess.value).toBe(true)
    expect(state.data.value).toEqual(quote)
    expect(state.errorMessage.value).toBeNull()
  })

  it('busca de novo quando os dados mudam', async () => {
    const received = mockQuoteRoute(() => quote)

    const { input, state } = await mountQuote(request)
    await settle(state)
    input.value = { ...request, originCep: '30130010' }
    await settle(state)

    expect(received).toEqual([request, { ...request, originCep: '30130010' }])
  })

  it('expõe a mensagem de erro da rota sem repetir erros de dados', async () => {
    const received = mockQuoteRoute(() => Response.json(
      { statusCode: 422, message: 'Não foi possível calcular o frete para os dados informados.' },
      { status: 422 }
    ))

    const { state } = await mountQuote(request)
    await settle(state)

    expect(state.isError.value).toBe(true)
    expect(state.errorMessage.value).toBe('Não foi possível calcular o frete para os dados informados.')
    expect(received).toHaveLength(1)
  })

  it('repete uma vez falhas transitórias antes de expor o erro', async () => {
    const received = mockQuoteRoute(() => Response.json(
      { statusCode: 502, message: 'Serviço de frete indisponível no momento. Tente novamente em instantes.' },
      { status: 502 }
    ))

    const { state } = await mountQuote(request)
    await vi.waitFor(() => expect(state.isError.value).toBe(true), { timeout: 4000 })

    expect(state.errorMessage.value).toBe('Serviço de frete indisponível no momento. Tente novamente em instantes.')
    expect(received).toHaveLength(2)
  })
})
