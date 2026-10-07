import { QUOTE_LIMITS, quoteRequestSchema, type QuoteRequest } from '#shared/schemas/quote'
import { cepMask, currencyMask, decimalMask, onlyDigits } from '~/utils/masks'

// Estado de edição do formulário: campos numéricos vazios são `undefined`, o que o
// QuoteRequest não aceita. Só vira QuoteRequest depois de validado (mapFormToQuoteRequest).
export interface QuoteFormState {
  originCep: string
  destinationCep: string
  heightCm: number | undefined
  widthCm: number | undefined
  lengthCm: number | undefined
  weightKg: number | undefined
  insuranceBrl: number | undefined
}

// Dígitos inteiros a partir dos máximos de QUOTE_LIMITS (200 cm, 1000 kg, R$ 1.000.000).
export const quoteFormMasks = {
  cep: cepMask,
  dimension: decimalMask({ decimals: QUOTE_LIMITS.dimensionCm.decimals, maxIntegerDigits: 3 }),
  weight: decimalMask({ decimals: QUOTE_LIMITS.weightKg.decimals, maxIntegerDigits: 4 }),
  insurance: currencyMask({ maxIntegerDigits: 7 })
}

// Sem request: CEPs e medidas vazios, seguro em 0. Com request (vindo da URL): os valores dele.
export function createQuoteFormState(request?: QuoteRequest | null): QuoteFormState {
  if (!request) {
    return {
      originCep: '',
      destinationCep: '',
      heightCm: undefined,
      widthCm: undefined,
      lengthCm: undefined,
      weightKg: undefined,
      insuranceBrl: 0
    }
  }

  return { ...request, insuranceBrl: request.insuranceBrl }
}

// Form State → QuoteRequest. O schema decide o que é válido; null quando não é.
// O seguro vazio sai do objeto (não vira `insuranceBrl: undefined`), e o 0 é mantido.
export function mapFormToQuoteRequest(state: QuoteFormState): QuoteRequest | null {
  const result = quoteRequestSchema.safeParse({
    ...state,
    originCep: onlyDigits(state.originCep),
    destinationCep: onlyDigits(state.destinationCep)
  })

  if (!result.success) {
    return null
  }

  const { insuranceBrl, ...request } = result.data

  return insuranceBrl === undefined ? request : { ...request, insuranceBrl }
}
