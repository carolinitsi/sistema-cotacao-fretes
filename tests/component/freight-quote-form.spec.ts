import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { type QueryClient, useQueryClient } from '@tanstack/vue-query'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { FreightQuoteResponse } from '#shared/types/freight'
import FreightQuoteForm from '~/components/features/quote/FreightQuoteForm.vue'

const quote: FreightQuoteResponse = {
  simulated: false,
  options: [
    {
      id: 1,
      service: 'PAC',
      carrier: { name: 'Correios', logoUrl: null },
      disabled: false,
      priceBrl: 35.5,
      deliveryDays: 10,
      deliveryRange: { min: 9, max: 10 }
    },
    {
      id: 2,
      service: '.Com',
      carrier: { name: 'Jadlog', logoUrl: null },
      disabled: true,
      disabledReason: 'Dimensões do objeto ultrapassam o limite da transportadora.'
    }
  ]
}

const validQuery = 'originCep=01310100&destinationCep=20040002&heightCm=2&widthCm=12&lengthCm=17&weightKg=0.3&insuranceBrl=0'

// A rota interna é simulada com registerEndpoint (ver use-freight-quote.spec.ts).
let unregister: (() => void) | undefined
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

// Monta o formulário dentro de um host para guardar o QueryClient e limpar o cache entre os testes.
async function mountForm(route = '/calcular-frete', options: { attachTo?: HTMLElement } = {}) {
  const Host = defineComponent({
    setup() {
      queryClient = useQueryClient()

      return () => h(FreightQuoteForm)
    }
  })

  return mountSuspended(Host, { route, ...options })
}

function field(wrapper: VueWrapper, label: string) {
  const labelElement = wrapper.findAll('label').find(element => element.text() === label)
  const id = labelElement?.attributes('for')
  if (!id) {
    throw new Error(`Campo "${label}" sem label associado`)
  }

  return wrapper.get<HTMLInputElement>(`[id="${id}"]`)
}

async function fillValidForm(wrapper: VueWrapper) {
  await field(wrapper, 'CEP de origem').setValue('01310100')
  await field(wrapper, 'CEP de destino').setValue('20040-002')
  await field(wrapper, 'Altura (cm)').setValue('2')
  await field(wrapper, 'Largura (cm)').setValue('12')
  await field(wrapper, 'Comprimento (cm)').setValue('17')
  await field(wrapper, 'Peso (kg)').setValue('0,30')
}

async function submit(wrapper: VueWrapper) {
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

function currentQuery(wrapper: VueWrapper) {
  return wrapper.vm.$router.currentRoute.value.query
}

describe('FreightQuoteForm', () => {
  afterEach(() => {
    unregister?.()
    queryClient?.clear()
  })

  it('renderiza as seções e o estado inicial', async () => {
    const received = mockQuoteRoute(() => quote)
    const wrapper = await mountForm()

    expect(wrapper.findAll('h2').map(heading => heading.text())).toEqual(['Endereços', 'Dimensões e peso', 'Seguro (opcional)'])
    expect(field(wrapper, 'CEP de origem').element.value).toBe('')
    expect(field(wrapper, 'CEP de origem').attributes('placeholder')).toBe('00000-000')
    expect(field(wrapper, 'Altura (cm)').element.value).toBe('')
    expect(field(wrapper, 'Peso (kg)').element.value).toBe('')
    expect(field(wrapper, 'Valor do seguro da carga (R$)').element.value).toBe('0,00')
    expect(wrapper.get('button[type="submit"]').text()).toBe('Calcular frete')
    expect(received).toHaveLength(0)
  })

  it('mostra os erros do schema e não cota quando o formulário é inválido', async () => {
    const received = mockQuoteRoute(() => quote)
    const wrapper = await mountForm()

    await field(wrapper, 'CEP de origem').setValue('123')
    await field(wrapper, 'Altura (cm)').setValue('0')
    await submit(wrapper)

    await vi.waitFor(() => expect(wrapper.text()).toContain('CEP inválido. Use o formato 00000-000.'))
    expect(wrapper.text()).toContain('Informe o CEP de destino.')
    expect(wrapper.text()).toContain('A altura deve ser maior que 0.')
    expect(wrapper.text()).toContain('Informe o peso.')
    expect(received).toHaveLength(0)
    expect(currentQuery(wrapper)).toEqual({})
  })

  it('liga a mensagem de erro ao campo e foca o primeiro inválido', async () => {
    mockQuoteRoute(() => quote)
    const wrapper = await mountForm('/calcular-frete', { attachTo: document.body })

    await submit(wrapper)

    const origin = field(wrapper, 'CEP de origem')
    await vi.waitFor(() => expect(origin.attributes('aria-invalid')).toBe('true'))
    const errorId = origin.attributes('aria-describedby')
    expect(errorId).toBeTruthy()
    expect(wrapper.get(`[id="${errorId}"]`).text()).toBe('Informe o CEP de origem.')
    await vi.waitFor(() => expect(document.activeElement).toBe(origin.element))
    // Seguro 0 é válido.
    expect(field(wrapper, 'Valor do seguro da carga (R$)').attributes('aria-invalid')).toBe('false')
  })

  it('grava o QuoteRequest na URL e cota só no envio válido', async () => {
    const received = mockQuoteRoute(() => quote)
    const wrapper = await mountForm()

    await fillValidForm(wrapper)
    await flushPromises()
    expect(received).toHaveLength(0)

    await submit(wrapper)
    await vi.waitFor(() => expect(wrapper.text()).toContain('Opções de frete'))

    const request = {
      originCep: '01310100',
      destinationCep: '20040002',
      heightCm: 2,
      widthCm: 12,
      lengthCm: 17,
      weightKg: 0.3,
      insuranceBrl: 0
    }
    expect(received).toEqual([request])
    expect(currentQuery(wrapper)).toEqual({
      originCep: '01310100',
      destinationCep: '20040002',
      heightCm: '2',
      widthCm: '12',
      lengthCm: '17',
      weightKg: '0.3',
      insuranceBrl: '0'
    })
  })

  it('exibe as opções disponíveis e as indisponíveis com o motivo', async () => {
    mockQuoteRoute(() => quote)
    const wrapper = await mountForm(`/calcular-frete?${validQuery}`)

    await vi.waitFor(() => expect(wrapper.text()).toContain('Correios'))
    expect(wrapper.text()).toContain(formatCurrency(35.5))
    expect(wrapper.text()).toContain('10 dias úteis')
    expect(wrapper.text()).toContain('Indisponível: Dimensões do objeto ultrapassam o limite da transportadora.')
    expect(wrapper.get('[role="status"]').text()).toBe('2 opções de frete encontradas.')
  })

  it('não refaz a cotação enquanto o usuário edita depois do envio', async () => {
    const received = mockQuoteRoute(() => quote)
    const wrapper = await mountForm(`/calcular-frete?${validQuery}`)
    await vi.waitFor(() => expect(received).toHaveLength(1))

    await field(wrapper, 'Altura (cm)').setValue('5')
    await field(wrapper, 'CEP de destino').setValue('30130010')
    await flushPromises()

    expect(received).toHaveLength(1)
    expect(currentQuery(wrapper).heightCm).toBe('2')
  })

  it('preenche o formulário a partir da URL', async () => {
    mockQuoteRoute(() => quote)
    const wrapper = await mountForm(`/calcular-frete?${validQuery}`)

    expect(field(wrapper, 'CEP de origem').element.value).toBe('01310-100')
    expect(field(wrapper, 'Peso (kg)').element.value).toBe('0,3')
    expect(field(wrapper, 'Valor do seguro da carga (R$)').element.value).toBe('0,00')
  })

  it('não cota a partir de uma URL inválida', async () => {
    const received = mockQuoteRoute(() => quote)
    const wrapper = await mountForm(`/calcular-frete?${validQuery.replace('heightCm=2', 'heightCm=500')}`)
    await flushPromises()

    expect(received).toHaveLength(0)
    expect(field(wrapper, 'Altura (cm)').element.value).toBe('')
  })

  it('mostra o loading e ignora envios duplicados', async () => {
    let release!: () => void
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    const received = mockQuoteRoute(async () => {
      await pending

      return quote
    })
    const wrapper = await mountForm()

    await fillValidForm(wrapper)
    await submit(wrapper)

    const button = wrapper.get('button[type="submit"]')
    await vi.waitFor(() => expect(button.attributes('disabled')).toBeDefined())
    expect(wrapper.get('[role="status"]').text()).toBe('Calculando frete…')
    expect(field(wrapper, 'CEP de origem').element.value).toBe('01310-100')

    await submit(wrapper)
    release()

    await vi.waitFor(() => expect(wrapper.text()).toContain('Correios'))
    expect(received).toHaveLength(1)
    expect(button.attributes('disabled')).toBeUndefined()
  })

  it('mostra a mensagem de erro e tenta de novo no reenvio', async () => {
    const received = mockQuoteRoute(() => Response.json(
      { statusCode: 422, message: 'Não foi possível calcular o frete para os dados informados.' },
      { status: 422 }
    ))
    const wrapper = await mountForm(`/calcular-frete?${validQuery}`)

    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').exists()).toBe(true))
    expect(wrapper.get('[role="alert"]').text()).toContain('Não foi possível calcular o frete para os dados informados.')
    expect(received).toHaveLength(1)

    await submit(wrapper)

    await vi.waitFor(() => expect(received).toHaveLength(2))
  })

  it('avisa quando nenhuma transportadora atende e quando a cotação é simulada', async () => {
    mockQuoteRoute(() => ({ simulated: true, options: [] }))
    const wrapper = await mountForm(`/calcular-frete?${validQuery}`)

    await vi.waitFor(() => expect(wrapper.text()).toContain('Nenhuma transportadora atende esse trecho com esses dados.'))
    expect(wrapper.text()).toContain('Cotação simulada')
  })
})
