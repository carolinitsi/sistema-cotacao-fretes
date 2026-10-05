import { describe, expect, it } from 'vitest'
import { formatCurrency } from '~/utils/currency'

describe('formatCurrency', () => {
  it('formata valores em reais no padrão brasileiro', () => {
    expect(formatCurrency(1234.5)).toBe('R$ 1.234,50')
  })
})
