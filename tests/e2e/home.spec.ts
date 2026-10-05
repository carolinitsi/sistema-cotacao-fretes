import { expect, test } from '@playwright/test'

test('abre a página inicial', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('Cotação de fretes')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cotação de fretes')
})
