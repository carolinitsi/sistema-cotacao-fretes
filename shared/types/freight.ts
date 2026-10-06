// Contrato interno da cotação: o que /api/freight/quote devolve para o app.
// Não depende do formato do Melhor Envio; a normalização fica no server.

export interface FreightCarrier {
  name: string
  logoUrl: string | null
}

interface FreightOptionBase {
  id: number
  service: string
  carrier: FreightCarrier | null
}

export interface AvailableFreightOption extends FreightOptionBase {
  disabled: false
  priceBrl: number
  deliveryDays: number
  deliveryRange: { min: number, max: number } | null
}

// Serviço que a transportadora não atende para estes dados; a mensagem vem da API.
export interface UnavailableFreightOption extends FreightOptionBase {
  disabled: true
  disabledReason: string
}

export type FreightOption = AvailableFreightOption | UnavailableFreightOption

export interface FreightQuoteResponse {
  options: FreightOption[]
  // true quando os dados vêm do mock de desenvolvimento, para a UI avisar.
  simulated: boolean
}

export interface FreightQuoteIssue {
  path: string
  message: string
}

// Corpo de `data` nos erros da rota (h3 createError).
export interface FreightQuoteErrorData {
  issues?: FreightQuoteIssue[]
}
