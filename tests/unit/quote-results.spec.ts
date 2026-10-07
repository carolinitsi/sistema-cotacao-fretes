import { describe, expect, it } from 'vitest'
import type { QuoteRequest } from '#shared/schemas/quote'
import type { AvailableFreightOption, FreightOption } from '#shared/types/freight'
import { formatCurrency } from '~/utils/currency'
import { formatDeliveryEstimate, getFreightOptionLabel, getQuoteSummary, sortFreightOptions } from '~/utils/quote-results'

function available(id: number, priceBrl: number, deliveryDays = 5): AvailableFreightOption {
  return {
    id,
    service: `Serviço ${id}`,
    carrier: { name: 'Correios', logoUrl: null },
    disabled: false,
    priceBrl,
    deliveryDays,
    deliveryRange: null
  }
}

function unavailable(id: number): FreightOption {
  return {
    id,
    service: `Serviço ${id}`,
    carrier: null,
    disabled: true,
    disabledReason: 'Transportadora não atende este trecho.'
  }
}

describe('sortFreightOptions', () => {
  it('ordena as disponíveis pelo preço e deixa as indisponíveis no fim, na ordem da API', () => {
    const options = [unavailable(1), available(2, 30), unavailable(3), available(4, 12.5), available(5, 20)]

    expect(sortFreightOptions(options).map(option => option.id)).toEqual([4, 5, 2, 1, 3])
  })

  it('desempata pelo menor prazo', () => {
    expect(sortFreightOptions([available(1, 10, 8), available(2, 10, 3)]).map(option => option.id)).toEqual([2, 1])
  })

  it('não altera a lista recebida', () => {
    const options = [available(1, 30), available(2, 10)]

    sortFreightOptions(options)

    expect(options.map(option => option.id)).toEqual([1, 2])
  })
})

describe('formatDeliveryEstimate', () => {
  it('mostra a faixa quando a API informa uma', () => {
    expect(formatDeliveryEstimate({ ...available(1, 10, 2), deliveryRange: { min: 1, max: 2 } })).toBe('1 a 2 dias úteis')
  })

  it('usa o prazo único sem faixa ou com faixa de um valor só', () => {
    expect(formatDeliveryEstimate(available(1, 10, 1))).toBe('1 dia útil')
    expect(formatDeliveryEstimate({ ...available(1, 10, 4), deliveryRange: { min: 4, max: 4 } })).toBe('4 dias úteis')
  })
})

describe('getQuoteSummary', () => {
  const request: QuoteRequest = {
    originCep: '01001000',
    destinationCep: '20040002',
    heightCm: 2,
    widthCm: 12.5,
    lengthCm: 17,
    weightKg: 0.3,
    insuranceBrl: 1234.5
  }

  it('formata os valores normalizados para exibição', () => {
    expect(getQuoteSummary(request)).toEqual({
      originCep: '01001-000',
      destinationCep: '20040-002',
      dimensions: '2 × 12,5 × 17 cm',
      weight: '0,3 kg',
      insurance: formatCurrency(1234.5)
    })
  })

  it('distingue seguro 0 de seguro não informado', () => {
    const { insuranceBrl: _, ...withoutInsurance } = request

    expect(getQuoteSummary({ ...request, insuranceBrl: 0 }).insurance).toBe(formatCurrency(0))
    expect(getQuoteSummary(withoutInsurance).insurance).toBe('Não informado')
  })

  it('não altera o request', () => {
    const copy = { ...request }

    getQuoteSummary(request)

    expect(request).toEqual(copy)
  })
})

describe('getFreightOptionLabel', () => {
  it('junta transportadora e modalidade', () => {
    expect(getFreightOptionLabel(available(1, 10))).toBe('Correios Serviço 1')
  })

  it('usa só a modalidade sem transportadora', () => {
    expect(getFreightOptionLabel(unavailable(2))).toBe('Serviço 2')
  })
})
