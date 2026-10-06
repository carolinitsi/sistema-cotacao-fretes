import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ShellTopbar from '~/components/shell/Topbar.vue'

describe('ShellTopbar', () => {
  it('exibe busca, notificações e as iniciais do usuário', async () => {
    const wrapper = await mountSuspended(ShellTopbar)

    expect(wrapper.find('input[type="search"][aria-label="Buscar"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Notificações"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('CM')
  })
})
