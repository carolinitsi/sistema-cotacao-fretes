import { describe, expect, it } from 'vitest'
import { formatCep, formatDecimal, formatDeliveryTime, formatDimensions, formatWeight } from '~/utils/formatters'

describe('formatCep', () => {
  it('insere o hífen depois do quinto dígito', () => {
    expect(formatCep('01310100')).toBe('01310-100')
  })

  it('mantém CEP parcial sem hífen até o quinto dígito', () => {
    expect(formatCep('01310')).toBe('01310')
    expect(formatCep('013101')).toBe('01310-1')
  })
})

describe('formatDecimal', () => {
  it('usa vírgula decimal, separador de milhar e corta zeros à direita', () => {
    expect(formatDecimal(1234.5, 2)).toBe('1.234,5')
    expect(formatDecimal(12, 1)).toBe('12')
  })
})

describe('formatWeight', () => {
  it('formata em kg com até 3 casas', () => {
    expect(formatWeight(1.25)).toBe('1,25 kg')
    expect(formatWeight(0.001)).toBe('0,001 kg')
  })
})

describe('formatDimensions', () => {
  it('lista altura × largura × comprimento em cm', () => {
    expect(formatDimensions({ heightCm: 10, widthCm: 12.5, lengthCm: 17 })).toBe('10 × 12,5 × 17 cm')
  })
})

describe('formatDeliveryTime', () => {
  it('usa singular para 1 dia e plural para os demais', () => {
    expect(formatDeliveryTime(1)).toBe('1 dia útil')
    expect(formatDeliveryTime(3)).toBe('3 dias úteis')
  })
})
