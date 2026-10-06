import type { FreightOption } from '#shared/types/freight'
import { type MelhorEnvioQuoteResponse, parseMelhorEnvioResponse } from './melhor-envio'

// Mock de DESENVOLVIMENTO (NUXT_FREIGHT_API_MODE=mock), sem relação com o MSW dos testes.
// Valores do exemplo da doc do Melhor Envio, no formato bruto da API, passados pela mesma
// normalização da integração real: o contrato devolvido é idêntico.
const MOCK_RESPONSE: MelhorEnvioQuoteResponse = [
  {
    id: 1,
    name: 'PAC',
    custom_price: '37.79',
    custom_delivery_time: 9,
    custom_delivery_range: { min: 8, max: 9 },
    company: { name: 'Correios', picture: 'https://sandbox.melhorenvio.com.br/images/shipping-companies/correios.png' }
  },
  {
    id: 2,
    name: 'SEDEX',
    custom_price: '46.23',
    custom_delivery_time: 4,
    custom_delivery_range: { min: 3, max: 4 },
    company: { name: 'Correios', picture: 'https://sandbox.melhorenvio.com.br/images/shipping-companies/correios.png' }
  },
  {
    id: 3,
    name: '.Package',
    custom_price: '18.60',
    custom_delivery_time: 6,
    custom_delivery_range: { min: 5, max: 6 },
    company: { name: 'Jadlog', picture: 'https://sandbox.melhorenvio.com.br/images/shipping-companies/jadlog.png' }
  },
  {
    id: 4,
    name: '.Com',
    custom_price: '16.44',
    custom_delivery_time: 5,
    custom_delivery_range: { min: 4, max: 5 },
    company: { name: 'Jadlog', picture: 'https://sandbox.melhorenvio.com.br/images/shipping-companies/jadlog.png' }
  },
  {
    id: 17,
    name: 'Mini Envios',
    error: 'Serviço indisponível para as dimensões informadas.',
    company: { name: 'Correios', picture: 'https://sandbox.melhorenvio.com.br/images/shipping-companies/correios.png' }
  }
]

export function getMockFreightOptions(): FreightOption[] {
  return parseMelhorEnvioResponse(MOCK_RESPONSE)
}
