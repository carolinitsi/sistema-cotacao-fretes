import { z } from 'zod'

// Limites definidos na spec; o design não define máximos.
export const QUOTE_LIMITS = {
  dimensionCm: { max: 200, decimals: 1 },
  weightKg: { max: 1000, decimals: 3 },
  insuranceBrl: { max: 1_000_000, decimals: 2 }
} as const

// Tolerância para erros de ponto flutuante (ex.: 0.3 * 10 = 2.9999999999999996).
function hasMaxDecimals(value: number, decimals: number): boolean {
  const scaled = value * 10 ** decimals

  return Math.abs(scaled - Math.round(scaled)) < 1e-9
}

function decimalsMessage(decimals: number): string {
  return decimals === 1 ? 'Use no máximo 1 casa decimal.' : `Use no máximo ${decimals} casas decimais.`
}

// CEP só com dígitos; a máscara 00000-000 é responsabilidade do input.
function cepSchema(label: string) {
  return z
    .string({ error: `Informe o CEP de ${label}.` })
    .min(1, { error: `Informe o CEP de ${label}.`, abort: true })
    .regex(/^\d{8}$/, 'CEP inválido. Use o formato 00000-000.')
}

// `subject` já com artigo: "A altura", "O comprimento".
function measureSchema(subject: string, unit: string, limits: { max: number, decimals: number }) {
  return z
    .number({ error: `Informe ${subject.toLowerCase()}.` })
    .gt(0, `${subject} deve ser maior que 0.`)
    .max(limits.max, `${subject} deve ser de no máximo ${limits.max} ${unit}.`)
    .refine(value => hasMaxDecimals(value, limits.decimals), decimalsMessage(limits.decimals))
}

export const quoteRequestSchema = z.object({
  originCep: cepSchema('origem'),
  destinationCep: cepSchema('destino'),
  heightCm: measureSchema('A altura', 'cm', QUOTE_LIMITS.dimensionCm),
  widthCm: measureSchema('A largura', 'cm', QUOTE_LIMITS.dimensionCm),
  lengthCm: measureSchema('O comprimento', 'cm', QUOTE_LIMITS.dimensionCm),
  weightKg: measureSchema('O peso', 'kg', QUOTE_LIMITS.weightKg),
  insuranceBrl: z
    .number({ error: 'Informe um valor de seguro válido.' })
    .min(0, 'O valor do seguro não pode ser negativo.')
    .max(QUOTE_LIMITS.insuranceBrl.max, 'O valor do seguro deve ser de no máximo R$ 1.000.000,00.')
    .refine(value => hasMaxDecimals(value, QUOTE_LIMITS.insuranceBrl.decimals), decimalsMessage(QUOTE_LIMITS.insuranceBrl.decimals))
    .optional()
})

export type QuoteRequest = z.infer<typeof quoteRequestSchema>
