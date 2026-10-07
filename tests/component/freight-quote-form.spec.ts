import { mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { QuoteRequest } from '#shared/schemas/quote'
import FreightQuoteForm from '~/components/features/quote/FreightQuoteForm.vue'

// O formulário só edita e emite o request válido; URL, cotação e resultados são da página
// (calcular-frete-page.spec.ts).
const request: QuoteRequest = {
  originCep: '01310100',
  destinationCep: '20040002',
  heightCm: 2,
  widthCm: 12,
  lengthCm: 17,
  weightKg: 0.3,
  insuranceBrl: 0
}

function mountForm(initialRequest: QuoteRequest | null = null, options: { attachTo?: HTMLElement } = {}) {
  return mountSuspended(FreightQuoteForm, { props: { initialRequest }, ...options })
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

describe('FreightQuoteForm', () => {
  it('renderiza as seções e o estado inicial', async () => {
    const wrapper = await mountForm()

    expect(wrapper.findAll('h2').map(heading => heading.text())).toEqual(['Endereços', 'Dimensões e peso', 'Seguro (opcional)'])
    expect(field(wrapper, 'CEP de origem').element.value).toBe('')
    expect(field(wrapper, 'CEP de origem').attributes('placeholder')).toBe('00000-000')
    expect(field(wrapper, 'Altura (cm)').element.value).toBe('')
    expect(field(wrapper, 'Peso (kg)').element.value).toBe('')
    expect(field(wrapper, 'Valor do seguro da carga (R$)').element.value).toBe('0,00')
    expect(wrapper.get('button[type="submit"]').text()).toBe('Calcular frete')
  })

  it('mostra os erros do schema e não emite o request quando o formulário é inválido', async () => {
    const wrapper = await mountForm()

    await field(wrapper, 'CEP de origem').setValue('123')
    await field(wrapper, 'Altura (cm)').setValue('0')
    await submit(wrapper)

    await vi.waitFor(() => expect(wrapper.text()).toContain('CEP inválido. Use o formato 00000-000.'))
    expect(wrapper.text()).toContain('Informe o CEP de destino.')
    expect(wrapper.text()).toContain('A altura deve ser maior que 0.')
    expect(wrapper.text()).toContain('Informe o peso.')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('liga a mensagem de erro ao campo e foca o primeiro inválido', async () => {
    const wrapper = await mountForm(null, { attachTo: document.body })

    await submit(wrapper)

    const origin = field(wrapper, 'CEP de origem')
    await vi.waitFor(() => expect(origin.attributes('aria-invalid')).toBe('true'))
    const errorId = origin.attributes('aria-describedby')
    expect(errorId).toBeTruthy()
    expect(wrapper.get(`[id="${errorId}"]`).text()).toBe('Informe o CEP de origem.')
    await vi.waitFor(() => expect(document.activeElement).toBe(origin.element))
    // Seguro 0 é válido.
    expect(field(wrapper, 'Valor do seguro da carga (R$)').attributes('aria-invalid')).toBe('false')

    wrapper.unmount()
  })

  it('emite o QuoteRequest normalizado no envio válido', async () => {
    const wrapper = await mountForm()

    await fillValidForm(wrapper)
    await flushPromises()
    expect(wrapper.emitted('submit')).toBeUndefined()

    await submit(wrapper)

    await vi.waitFor(() => expect(wrapper.emitted('submit')).toEqual([[request]]))
  })

  it('preenche o formulário com o request recebido', async () => {
    const wrapper = await mountForm(request)

    expect(field(wrapper, 'CEP de origem').element.value).toBe('01310-100')
    expect(field(wrapper, 'Altura (cm)').element.value).toBe('2')
    expect(field(wrapper, 'Peso (kg)').element.value).toBe('0,3')
    expect(field(wrapper, 'Valor do seguro da carga (R$)').element.value).toBe('0,00')
  })

  it('emite o request editado', async () => {
    const wrapper = await mountForm(request)

    await field(wrapper, 'Altura (cm)').setValue('5')
    await submit(wrapper)

    await vi.waitFor(() => expect(wrapper.emitted('submit')).toEqual([[{ ...request, heightCm: 5 }]]))
  })
})
