import { expect, test } from '@playwright/test'

test('a raiz redireciona para Início', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL('/inicio')
  await expect(page).toHaveTitle('Início · FretePro')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Início')
})
