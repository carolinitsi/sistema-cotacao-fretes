import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { type QueryClient, useQueryClient } from '@tanstack/vue-query'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import type { FreightQuoteResponse } from '#shared/types/freight'
import CalcularFretePage from '~/pages/calcular-frete.vue'

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
    },
    {
      id: 3,
      service: 'SEDEX',
      carrier: { name: 'Correios', logoUrl: 'https://example.com/correios.png' },
      disabled: false,
      priceBrl: 12.68,
      deliveryDays: 2,
      deliveryRange: { min: 1, max: 2 }
    }
  ]
}

const validQuery = 'originCep=01001000&destinationCep=20040002&heightCm=2&widthCm=12&lengthCm=17&weightKg=0.3&insuranceBrl=0'

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

// Monta a página dentro de um host para guardar o QueryClient e limpar o cache entre os testes.
async function mountPage(route = '/calcular-frete') {
  const Host = defineComponent({
    setup() {
      queryClient = useQueryClient()

      return () => h(CalcularFretePage)
    }
  })

  return mountSuspended(Host, { route, attachTo: document.body })
}

function field(wrapper: VueWrapper, label: string) {
  const labelElement = wrapper.findAll('label').find(element => element.text() === label)
  const id = labelElement?.attributes('for')
  if (!id) {
    throw new Error(`Campo "${label}" sem label associado`)
  }

  return wrapper.get<HTMLInputElement>(`[id="${id}"]`)
}

function button(wrapper: VueWrapper, name: string) {
  const found = wrapper.findAll('button').find(element => element.text() === name || element.attributes('aria-label') === name)
  if (!found) {
    throw new Error(`Botão "${name}" não encontrado`)
  }

  return found
}

function heading(wrapper: VueWrapper) {
  return wrapper.get('h1').text()
}

// Linhas da tabela (a lista do mobile repete os dados e fica oculta por CSS a partir de md).
function tableRows(wrapper: VueWrapper) {
  return wrapper.findAll('table tbody tr').map(row => row.findAll('td').map(cell => cell.text()))
}

function currentQuery(wrapper: VueWrapper) {
  return wrapper.vm.$router.currentRoute.value.query
}

async function submit(wrapper: VueWrapper) {
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

describe('página Calcular frete', () => {
  afterEach(() => {
    unregister?.()
    queryClient?.clear()
    document.body.innerHTML = ''
  })

  it('mostra o formulário sem cotação na URL', async () => {
    const received = mockQuoteRoute(() => quote)
    const wrapper = await mountPage()

    expect(heading(wrapper)).toBe('Calcular frete')
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('table').exists()).toBe(false)
    expect(received).toHaveLength(0)
  })

  it('troca o formulário pelos resultados após um envio válido', async () => {
    const received = mockQuoteRoute(() => quote)
    const wrapper = await mountPage()

    await field(wrapper, 'CEP de origem').setValue('01001000')
    await field(wrapper, 'CEP de destino').setValue('20040002')
    await field(wrapper, 'Altura (cm)').setValue('2')
    await field(wrapper, 'Largura (cm)').setValue('12')
    await field(wrapper, 'Comprimento (cm)').setValue('17')
    await field(wrapper, 'Peso (kg)').setValue('0,3')
    await submit(wrapper)

    await vi.waitFor(() => expect(wrapper.find('table').exists()).toBe(true))
    expect(heading(wrapper)).toBe('Cotações de frete')
    expect(wrapper.find('form').exists()).toBe(false)
    expect(currentQuery(wrapper)).toEqual({
      originCep: '01001000',
      destinationCep: '20040002',
      heightCm: '2',
      widthCm: '12',
      lengthCm: '17',
      weightKg: '0.3',
      insuranceBrl: '0'
    })
    expect(received).toHaveLength(1)
    // O botão de envio sumiu: o foco vai para o título da tela nova.
    expect(document.activeElement?.textContent).toBe('Cotações de frete')
  })

  it('reconstrói os resultados a partir da URL, com o resumo formatado', async () => {
    const received = mockQuoteRoute(() => quote)
    const wrapper = await mountPage(`/calcular-frete?${validQuery}`)

    await vi.waitFor(() => expect(wrapper.find('table').exists()).toBe(true))
    const summary = wrapper.get('section').text()
    expect(summary).toContain('Dados do envio')
    expect(summary).toContain('CEP origem01001-000')
    expect(summary).toContain('CEP destino20040-002')
    expect(summary).toContain('2 × 12 × 17 cm')
    expect(summary).toContain('0,3 kg')
    expect(summary).toContain(`Seguro:${formatCurrency(0)}`)
    expect(received).toEqual([{
      originCep: '01001000',
      destinationCep: '20040002',
      heightCm: 2,
      widthCm: 12,
      lengthCm: 17,
      weightKg: 0.3,
      insuranceBrl: 0
    }])
  })

  it('lista as opções por preço, com as indisponíveis no fim', async () => {
    mockQuoteRoute(() => quote)
    const wrapper = await mountPage(`/calcular-frete?${validQuery}`)

    await vi.waitFor(() => expect(wrapper.find('table').exists()).toBe(true))
    expect(wrapper.findAll('table th').map(cell => cell.text())).toEqual(['Transportadora', 'Modalidade', 'Prazo estimado', 'Valor estimado', 'Ações'])
    expect(wrapper.findAll('table th').every(cell => cell.attributes('scope') === 'col')).toBe(true)
    expect(tableRows(wrapper)).toEqual([
      ['', 'SEDEX', '1 a 2 dias úteis', formatCurrency(12.68), ''],
      ['Correios', 'PAC', '9 a 10 dias úteis', formatCurrency(35.5), ''],
      ['Jadlog', '.Com', 'Transportadora não atende este trecho.', '', '']
    ])
    // Com logo, a coluna mostra só a imagem, com o nome no alt; sem logo, o nome em texto.
    const logo = wrapper.get('table tbody tr td img')
    expect(logo.attributes('alt')).toBe('Correios')
    expect(logo.attributes('src')).toBe('https://example.com/correios.png')
    expect(wrapper.text()).not.toContain('Dimensões do objeto ultrapassam o limite da transportadora.')
    expect(button(wrapper, 'Selecionar Correios SEDEX').attributes('disabled')).toBeUndefined()
    expect(wrapper.findAll('button[aria-label="Selecionar Jadlog .Com"]').every(item => item.attributes('disabled') !== undefined)).toBe(true)
    expect(wrapper.get('[role="status"]').text()).toBe('3 opções de frete encontradas.')
  })

  it('avisa que a seleção do frete ainda não está disponível', async () => {
    mockQuoteRoute(() => quote)
    let toasts!: ReturnType<typeof useToast>['toasts']
    const Host = defineComponent({
      setup() {
        queryClient = useQueryClient()
        toasts = useToast().toasts

        return () => h(CalcularFretePage)
      }
    })
    const wrapper = await mountSuspended(Host, { route: `/calcular-frete?${validQuery}` })

    await vi.waitFor(() => expect(wrapper.find('table').exists()).toBe(true))
    await button(wrapper, 'Selecionar Correios SEDEX').trigger('click')

    expect(toasts.value.at(-1)).toMatchObject({
      title: 'Seleção de frete em breve',
      description: 'A contratação de Correios SEDEX ainda não está disponível.'
    })
  })

  it('volta ao formulário preenchido em "Editar dados" e cota de novo após o envio', async () => {
    const received = mockQuoteRoute(() => quote)
    const wrapper = await mountPage(`/calcular-frete?${validQuery}`)
    await vi.waitFor(() => expect(received).toHaveLength(1))

    await button(wrapper, 'Editar dados').trigger('click')

    await vi.waitFor(() => expect(currentQuery(wrapper).edit).toBe('1'))
    await vi.waitFor(() => expect(wrapper.find('form').exists()).toBe(true))
    expect(heading(wrapper)).toBe('Calcular frete')
    expect(document.activeElement?.textContent).toBe('Calcular frete')
    expect(field(wrapper, 'CEP de origem').element.value).toBe('01001-000')
    expect(field(wrapper, 'Peso (kg)').element.value).toBe('0,3')
    expect(received).toHaveLength(1)

    await field(wrapper, 'Altura (cm)').setValue('5')
    await submit(wrapper)

    await vi.waitFor(() => expect(received).toHaveLength(2))
    expect(received[1]).toMatchObject({ heightCm: 5 })
    expect(currentQuery(wrapper)).toMatchObject({ heightCm: '5' })
    expect(currentQuery(wrapper)).not.toHaveProperty('edit')
    await vi.waitFor(() => expect(wrapper.find('table').exists()).toBe(true))
    expect(wrapper.get('section').text()).toContain('5 × 12 × 17 cm')
  })

  it('reenviar sem alterar usa o cache, sem nova chamada', async () => {
    const received = mockQuoteRoute(() => quote)
    const wrapper = await mountPage(`/calcular-frete?${validQuery}`)
    await vi.waitFor(() => expect(wrapper.find('table').exists()).toBe(true))

    await button(wrapper, 'Editar dados').trigger('click')
    await vi.waitFor(() => expect(wrapper.find('form').exists()).toBe(true))
    await submit(wrapper)

    await vi.waitFor(() => expect(wrapper.find('table').exists()).toBe(true))
    expect(received).toHaveLength(1)
  })

  it('abre o modo de edição pela URL sem cotar', async () => {
    const received = mockQuoteRoute(() => quote)
    const wrapper = await mountPage(`/calcular-frete?${validQuery}&edit=1`)
    await flushPromises()

    expect(field(wrapper, 'CEP de origem').element.value).toBe('01001-000')
    expect(received).toHaveLength(0)
  })

  it('mostra o loading sem tabela vazia', async () => {
    let release!: () => void
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    mockQuoteRoute(async () => {
      await pending

      return quote
    })
    const wrapper = await mountPage(`/calcular-frete?${validQuery}`)

    await vi.waitFor(() => expect(wrapper.get('[role="status"]').text()).toBe('Calculando frete…'))
    expect(wrapper.find('table').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Nenhuma transportadora')
    // O resumo vem da URL e já aparece.
    expect(wrapper.text()).toContain('01001-000')

    release()
    await vi.waitFor(() => expect(wrapper.find('table').exists()).toBe(true))
  })

  it('mostra a mensagem de erro e tenta de novo', async () => {
    const received = mockQuoteRoute(() => Response.json(
      { statusCode: 422, message: 'Não foi possível calcular o frete para os dados informados.' },
      { status: 422 }
    ))
    const wrapper = await mountPage(`/calcular-frete?${validQuery}`)

    // O alerta do erro, não os skeletons do loading (o USkeleton também usa role="alert").
    await vi.waitFor(() => expect(wrapper.find('[role="alert"]').text()).toContain('Não foi possível calcular o frete para os dados informados.'))
    expect(wrapper.find('table').exists()).toBe(false)
    expect(received).toHaveLength(1)

    await button(wrapper, 'Tentar novamente').trigger('click')

    await vi.waitFor(() => expect(received).toHaveLength(2))
  })

  it('avisa quando nenhuma transportadora atende, sem aviso de cotação simulada', async () => {
    mockQuoteRoute(() => ({ simulated: true, options: [] }))
    const wrapper = await mountPage(`/calcular-frete?${validQuery}`)

    await vi.waitFor(() => expect(wrapper.text()).toContain('Nenhuma transportadora atende esse trecho com esses dados.'))
    expect(wrapper.text()).not.toContain('Cotação simulada')
    expect(wrapper.find('table').exists()).toBe(false)
  })
})
