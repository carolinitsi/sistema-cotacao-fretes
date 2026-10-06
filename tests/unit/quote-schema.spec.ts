import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { quoteRequestSchema, type QuoteRequest } from '#shared/schemas/quote'

const valid: QuoteRequest = {
  originCep: '01310100',
  destinationCep: '20040002',
  heightCm: 10,
  widthCm: 12,
  lengthCm: 17,
  weightKg: 1.25
}

// Mensagens de erro agrupadas por campo.
function errorsFor(input: Record<string, unknown>): Record<string, string[] | undefined> {
  const result = quoteRequestSchema.safeParse({ ...valid, ...input })

  return result.success ? {} : z.flattenError(result.error).fieldErrors
}

describe('quoteRequestSchema', () => {
  it('aceita uma cotação válida sem seguro', () => {
    expect(quoteRequestSchema.safeParse(valid).success).toBe(true)
  })

  it('aceita origem igual ao destino', () => {
    expect(errorsFor({ destinationCep: valid.originCep })).toEqual({})
  })

  describe('CEP', () => {
    it('exige o CEP de origem e de destino', () => {
      expect(errorsFor({ originCep: '', destinationCep: undefined })).toEqual({
        originCep: ['Informe o CEP de origem.'],
        destinationCep: ['Informe o CEP de destino.']
      })
    })

    it.each(['123', '9876543', '013101000', '01310-100', 'abcdefgh'])('rejeita "%s"', (cep) => {
      expect(errorsFor({ originCep: cep }).originCep).toEqual(['CEP inválido. Use o formato 00000-000.'])
    })
  })

  describe('medidas e peso', () => {
    it.each([
      ['heightCm', 'A altura deve ser maior que 0.'],
      ['widthCm', 'A largura deve ser maior que 0.'],
      ['lengthCm', 'O comprimento deve ser maior que 0.'],
      ['weightKg', 'O peso deve ser maior que 0.']
    ])('rejeita %s igual a 0', (field, message) => {
      expect(errorsFor({ [field]: 0 })[field]).toEqual([message])
    })

    it.each([
      ['heightCm', 'Informe a altura.'],
      ['lengthCm', 'Informe o comprimento.'],
      ['weightKg', 'Informe o peso.']
    ])('exige %s', (field, message) => {
      expect(errorsFor({ [field]: undefined })[field]).toEqual([message])
    })

    it('rejeita valores negativos', () => {
      expect(errorsFor({ widthCm: -1 }).widthCm).toEqual(['A largura deve ser maior que 0.'])
    })

    it('rejeita valores positivos menores que a precisão permitida', () => {
      expect(errorsFor({ heightCm: 1e-12 }).heightCm).toEqual(['Use no máximo 1 casa decimal.'])
    })

    it('aplica os limites máximos', () => {
      expect(errorsFor({ heightCm: 200, weightKg: 1000 })).toEqual({})
      expect(errorsFor({ heightCm: 200.1, weightKg: 1000.001 })).toEqual({
        heightCm: ['A altura deve ser de no máximo 200 cm.'],
        weightKg: ['O peso deve ser de no máximo 1000 kg.']
      })
    })

    it('limita as casas decimais: 1 nas medidas e 3 no peso', () => {
      expect(errorsFor({ heightCm: 10.5, weightKg: 0.001 })).toEqual({})
      expect(errorsFor({ heightCm: 10.25, weightKg: 0.0005 })).toEqual({
        heightCm: ['Use no máximo 1 casa decimal.'],
        weightKg: ['Use no máximo 3 casas decimais.']
      })
    })
  })

  describe('seguro', () => {
    it('é opcional e aceita zero', () => {
      expect(errorsFor({ insuranceBrl: undefined })).toEqual({})
      expect(errorsFor({ insuranceBrl: 0 })).toEqual({})
    })

    it('rejeita valor negativo', () => {
      expect(errorsFor({ insuranceBrl: -10 }).insuranceBrl).toEqual(['O valor do seguro não pode ser negativo.'])
    })

    it('aceita centavos e rejeita frações menores', () => {
      expect(errorsFor({ insuranceBrl: 1234.56 })).toEqual({})
      expect(errorsFor({ insuranceBrl: 0.005 }).insuranceBrl).toEqual(['Use no máximo 2 casas decimais.'])
    })

    it.each([131072.2, 999999.99, 0.3])('aceita %s sem erro de ponto flutuante', (value) => {
      expect(errorsFor({ insuranceBrl: value })).toEqual({})
    })

    it('aplica o limite máximo', () => {
      expect(errorsFor({ insuranceBrl: 1_000_000 })).toEqual({})
      expect(errorsFor({ insuranceBrl: 1_000_000.01 }).insuranceBrl).toEqual(['O valor do seguro deve ser de no máximo R$ 1.000.000,00.'])
    })
  })
})
