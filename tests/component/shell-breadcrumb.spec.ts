import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ShellBreadcrumb from '~/components/shell/Breadcrumb.vue'

describe('ShellBreadcrumb', () => {
  it('mostra a página atual como item corrente', async () => {
    const wrapper = await mountSuspended(ShellBreadcrumb, { route: '/configuracoes' })

    expect(wrapper.findAll('li').map(item => item.text()).filter(Boolean)).toEqual(['Configurações'])
    expect(wrapper.get('[aria-current="page"]').text()).toBe('Configurações')
  })

  it('não renderiza nada em rotas fora do mapeamento', async () => {
    const wrapper = await mountSuspended(ShellBreadcrumb, { route: '/styleguide' })

    expect(wrapper.find('nav').exists()).toBe(false)
  })
})
