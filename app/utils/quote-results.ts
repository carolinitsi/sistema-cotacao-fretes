import type { QuoteRequest } from '#shared/schemas/quote'
import type { AvailableFreightOption, FreightOption } from '#shared/types/freight'
import { formatCurrency } from '~/utils/currency'
import { formatCep, formatDeliveryTime, formatDimensions, formatWeight } from '~/utils/formatters'

// Apresentação da tela de resultados. O contrato (FreightQuoteResponse) e o request
// (valores normalizados) não mudam; aqui só se ordena e formata para exibir.

// Disponíveis do mais barato ao mais caro (empate: o mais rápido); indisponíveis no fim,
// na ordem da API.
export function sortFreightOptions(options: readonly FreightOption[]): FreightOption[] {
  const available = options.filter((option): option is AvailableFreightOption => !option.disabled)
  const unavailable = options.filter(option => option.disabled)

  available.sort((a, b) => a.priceBrl - b.priceBrl || a.deliveryDays - b.deliveryDays)

  return [...available, ...unavailable]
}

// Faixa quando a API informa uma ("1 a 2 dias úteis"); senão, o prazo único.
export function formatDeliveryEstimate(option: AvailableFreightOption): string {
  const range = option.deliveryRange

  if (!range || range.min >= range.max) {
    return formatDeliveryTime(option.deliveryDays)
  }

  return `${range.min} a ${formatDeliveryTime(range.max)}`
}

export interface QuoteSummary {
  originCep: string
  destinationCep: string
  dimensions: string
  weight: string
  insurance: string
}

// Seguro ausente na URL é "não informado"; o 0 é exibido como R$ 0,00.
export function getQuoteSummary(request: QuoteRequest): QuoteSummary {
  return {
    originCep: formatCep(request.originCep),
    destinationCep: formatCep(request.destinationCep),
    dimensions: formatDimensions(request),
    weight: formatWeight(request.weightKg),
    insurance: request.insuranceBrl === undefined ? 'Não informado' : formatCurrency(request.insuranceBrl)
  }
}

// Nome acessível de uma opção, para os botões da linha: "Correios PAC".
export function getFreightOptionLabel(option: FreightOption): string {
  return [option.carrier?.name, option.service].filter(Boolean).join(' ')
}
