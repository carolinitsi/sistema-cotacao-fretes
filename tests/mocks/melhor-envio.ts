import { HttpResponse, delay, http } from 'msw'

// Respostas do Melhor Envio no formato da doc (calculo-de-fretes-por-produtos), só para os testes.
// Não contêm regra da aplicação: a normalização é o que os testes verificam.
export const MELHOR_ENVIO_TEST_CONFIG = {
  baseUrl: 'https://sandbox.melhorenvio.com.br',
  token: 'token-de-teste',
  userAgent: 'FretePro (testes@example.com)'
}

export const MELHOR_ENVIO_CALCULATE_URL = `${MELHOR_ENVIO_TEST_CONFIG.baseUrl}/api/v2/me/shipment/calculate`

const correios = { id: 1, name: 'Correios', picture: 'https://sandbox.melhorenvio.com.br/images/shipping-companies/correios.png' }
const jadlog = { id: 2, name: 'Jadlog', picture: 'https://sandbox.melhorenvio.com.br/images/shipping-companies/jadlog.png' }

export const melhorEnvioFixtures = {
  success: [
    {
      id: 1,
      name: 'PAC',
      price: '37.79',
      custom_price: '35.50',
      discount: '2.09',
      currency: 'R$',
      delivery_time: 9,
      delivery_range: { min: 8, max: 9 },
      custom_delivery_time: 10,
      custom_delivery_range: { min: 9, max: 10 },
      packages: [{ price: '37.79', format: 'box', dimensions: { height: 2, width: 11, length: 16 }, weight: '0.10', insurance_value: '50.00' }],
      additional_services: { receipt: true, own_hand: true, collect: false },
      company: correios
    },
    {
      id: 3,
      name: '.Package',
      price: '18.60',
      custom_price: '18.60',
      discount: '4.16',
      currency: 'R$',
      delivery_time: 6,
      delivery_range: { min: 5, max: 6 },
      custom_delivery_time: 6,
      custom_delivery_range: { min: 5, max: 6 },
      packages: [],
      additional_services: { receipt: true, own_hand: false, collect: false },
      company: jadlog
    }
  ],
  // Item com `error`: comportamento da API real, não descrito na doc.
  unavailable: { id: 17, name: 'Mini Envios', error: 'Serviço indisponível para o trecho informado.', company: correios },
  validationError: {
    message: 'The given data was invalid.',
    errors: { 'to.postal_code': ['O campo to.postal code é obrigatório.'] }
  },
  // Fora do contrato: preço numérico e prazo ausente.
  invalid: [{ id: 1, name: 'PAC', custom_price: 37.79, company: correios }]
}

const calculate = (resolver: Parameters<typeof http.post>[1]) => http.post(MELHOR_ENVIO_CALCULATE_URL, resolver)

export const melhorEnvioHandlers = {
  success: () => calculate(() => HttpResponse.json(melhorEnvioFixtures.success)),
  withUnavailable: () => calculate(() => HttpResponse.json([...melhorEnvioFixtures.success, melhorEnvioFixtures.unavailable])),
  empty: () => calculate(() => HttpResponse.json([])),
  validationError: () => calculate(() => HttpResponse.json(melhorEnvioFixtures.validationError, { status: 422 })),
  unauthorized: () => calculate(() => HttpResponse.json({ message: 'Unauthenticated.' }, { status: 401 })),
  serverError: () => calculate(() => HttpResponse.json({ message: 'Server Error' }, { status: 500 })),
  invalidResponse: () => calculate(() => HttpResponse.json(melhorEnvioFixtures.invalid)),
  notJson: () => calculate(() => new HttpResponse('<html>Bad gateway</html>', { headers: { 'Content-Type': 'text/html' } })),
  networkError: () => calculate(() => HttpResponse.error()),
  slow: (ms: number) => calculate(async () => {
    await delay(ms)

    return HttpResponse.json(melhorEnvioFixtures.success)
  })
}
