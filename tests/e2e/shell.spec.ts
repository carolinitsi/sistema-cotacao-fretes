import { expect, test, type Page } from '@playwright/test'

const routes = [
  { path: '/inicio', label: 'Início' },
  { path: '/calcular-frete', label: 'Calcular frete' },
  { path: '/historico', label: 'Histórico' },
  { path: '/configuracoes', label: 'Configurações' },
  { path: '/ajuda', label: 'Ajuda' },
  { path: '/perfil', label: 'Perfil' }
]

async function expectCurrentPage(page: Page, path: string, label: string) {
  await expect(page).toHaveURL(path)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(label)
  await expect(page.getByRole('main').locator('[aria-current="page"]')).toHaveText(label)
}

for (const { path, label } of routes) {
  test(`carrega a rota ${path}`, async ({ page }) => {
    await page.goto(path)

    await expect(page).toHaveTitle(`${label} · FretePro`)
    await expectCurrentPage(page, path, label)
  })
}

test('navega pela sidebar e marca o item ativo', async ({ page }) => {
  await page.goto('/inicio')
  const nav = page.getByRole('navigation', { name: 'Navegação principal' })

  for (const { path, label } of routes.slice(0, 4)) {
    await nav.getByRole('link', { name: label }).click()

    await expectCurrentPage(page, path, label)
    await expect(nav.locator('[aria-current="page"]')).toHaveText(label)
  }
})

test.describe('em tela pequena', () => {
  test.use({ viewport: { width: 375, height: 740 } })

  test('não tem overflow horizontal e navega pelo menu', async ({ page }) => {
    await page.goto('/calcular-frete')

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBe(0)
    await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeHidden()

    await page.getByRole('banner').getByRole('button', { name: 'Abrir barra lateral' }).click()
    await page.getByRole('dialog').getByRole('link', { name: 'Histórico' }).click()

    await expectCurrentPage(page, '/historico', 'Histórico')
    await expect(page.getByRole('dialog')).toBeHidden()
  })
})
