import { describe, expect, it } from 'vitest'
import type { QuoteRequest } from '#shared/schemas/quote'
import { createQuoteFormState, mapFormToQuoteRequest, quoteFormMasks, type QuoteFormState } from '~/utils/quote-form'

const request: QuoteRequest = {
  originCep: '01310100',
  destinationCep: '20040002',
  heightCm: 10,
  widthCm: 15.5,
  lengthCm: 20,
  weightKg: 0.3,
  insuranceBrl: 150.75
}

const filled: QuoteFormState = { ...request, insuranceBrl: request.insuranceBrl }

describe('createQuoteFormState', () => {
  it('começa com CEPs e medidas vazios e seguro em 0', () => {
    expect(createQuoteFormState()).toEqual({
      originCep: '',
      destinationCep: '',
      heightCm: undefined,
      widthCm: undefined,
      lengthCm: undefined,
      weightKg: undefined,
      insuranceBrl: 0
    })
  })

  it('preenche com o request quando há um', () => {
    expect(createQuoteFormState(request)).toEqual(filled)
  })

  it('mantém o seguro vazio quando o request não tem seguro', () => {
    const { insuranceBrl: _, ...withoutInsurance } = request

    expect(createQuoteFormState(withoutInsurance).insuranceBrl).toBeUndefined()
  })
})

describe('mapFormToQuoteRequest', () => {
  it('converte o estado válido em QuoteRequest', () => {
    expect(mapFormToQuoteRequest(filled)).toEqual(request)
  })

  it('remove a máscara dos CEPs', () => {
    const mapped = mapFormToQuoteRequest({ ...filled, originCep: '01310-100', destinationCep: '20040-002' })

    expect(mapped).toMatchObject({ originCep: '01310100', destinationCep: '20040002' })
  })

  it('mantém o seguro 0', () => {
    expect(mapFormToQuoteRequest({ ...filled, insuranceBrl: 0 })).toHaveProperty('insuranceBrl', 0)
  })

  it('omite o seguro vazio em vez de enviar undefined', () => {
    expect(mapFormToQuoteRequest({ ...filled, insuranceBrl: undefined })).not.toHaveProperty('insuranceBrl')
  })

  it.each([
    ['CEP incompleto', { originCep: '0131' }],
    ['medida vazia', { heightCm: undefined }],
    ['medida zero', { widthCm: 0 }],
    ['peso zero', { weightKg: 0 }],
    ['seguro negativo', { insuranceBrl: -10 }]
  ])('devolve null com %s', (_, change) => {
    expect(mapFormToQuoteRequest({ ...filled, ...change })).toBeNull()
  })
})

describe('quoteFormMasks', () => {
  it('limita as casas decimais aos limites do schema', () => {
    expect(quoteFormMasks.dimension.mask('12,345')).toBe('12,3')
    expect(quoteFormMasks.weight.mask('0,3456')).toBe('0,345')
  })

  it('converte decimais pt-BR em número', () => {
    expect(quoteFormMasks.weight.parse('0,30')).toBe(0.3)
    expect(quoteFormMasks.insurance.parse('1.234,56')).toBe(1234.56)
  })

  it('exibe o seguro inicial como 0,00', () => {
    expect(quoteFormMasks.insurance.format(0)).toBe('0,00')
  })
})
