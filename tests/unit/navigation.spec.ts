import { describe, expect, it } from 'vitest'
import { getBreadcrumbItems } from '~/utils/navigation'

describe('getBreadcrumbItems', () => {
  it('retorna a página atual para uma rota de primeiro nível', () => {
    expect(getBreadcrumbItems('/historico')).toEqual([{ label: 'Histórico', to: '/historico' }])
  })

  it('ignora barra final', () => {
    expect(getBreadcrumbItems('/calcular-frete/')).toEqual([{ label: 'Calcular frete', to: '/calcular-frete' }])
  })

  it('ignora segmentos sem label', () => {
    expect(getBreadcrumbItems('/historico/123')).toEqual([{ label: 'Histórico', to: '/historico' }])
  })

  describe('em Calcular frete', () => {
    const quoteQuery = {
      originCep: '01310100',
      destinationCep: '20040002',
      heightCm: '2',
      widthCm: '12',
      lengthCm: '17',
      weightKg: '0.3'
    }

    it('acrescenta "Resultados" quando a URL tem uma cotação', () => {
      expect(getBreadcrumbItems('/calcular-frete', quoteQuery)).toEqual([
        { label: 'Calcular frete', to: '/calcular-frete' },
        { label: 'Resultados', active: true }
      ])
    })

    it('mostra só "Calcular frete" no formulário: sem query, query inválida ou modo de edição', () => {
      const formOnly = [{ label: 'Calcular frete', to: '/calcular-frete' }]

      expect(getBreadcrumbItems('/calcular-frete')).toEqual(formOnly)
      expect(getBreadcrumbItems('/calcular-frete', { ...quoteQuery, heightCm: '0' })).toEqual(formOnly)
      expect(getBreadcrumbItems('/calcular-frete', { ...quoteQuery, edit: '1' })).toEqual(formOnly)
    })

    it('não acrescenta "Resultados" em outras rotas com a mesma query', () => {
      expect(getBreadcrumbItems('/historico', quoteQuery)).toEqual([{ label: 'Histórico', to: '/historico' }])
    })
  })

  it('retorna vazio para rotas fora do mapeamento', () => {
    expect(getBreadcrumbItems('/')).toEqual([])
    expect(getBreadcrumbItems('/styleguide')).toEqual([])
  })
})
