import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import DefaultLayout from '~/layouts/default.vue'

describe('layout default', () => {
  it('renderiza a página dentro do conteúdo principal, com o shell em volta', async () => {
    const wrapper = await mountSuspended(DefaultLayout, {
      route: '/historico',
      slots: { default: () => h('p', 'Conteúdo da página') }
    })

    const main = wrapper.get('main')
    expect(main.text()).toContain('Conteúdo da página')
    expect(main.get('[aria-current="page"]').text()).toBe('Histórico')
    expect(wrapper.find('header input[aria-label="Buscar"]').exists()).toBe(true)
    expect(wrapper.find('nav[aria-label="Navegação principal"]').exists()).toBe(true)
  })
})
