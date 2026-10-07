import { expect, test, type Page } from '@playwright/test'
import type { FreightQuoteResponse } from '../../shared/types/freight'

const quote: FreightQuoteResponse = {
  simulated: false,
  options: [{
    id: 1,
    service: 'PAC',
    carrier: { name: 'Correios', logoUrl: null },
    disabled: false,
    priceBrl: 35.5,
    deliveryDays: 10,
    deliveryRange: { min: 9, max: 10 }
  }]
}

// O E2E roda contra o build de produção, onde o mock de dev responde 503 (DECISIONS 022):
// a rota interna é interceptada no navegador.
async function mockQuoteRoute(page: Page) {
  const bodies: unknown[] = []

  await page.route('**/api/freight/quote', async (route) => {
    bodies.push(route.request().postDataJSON())
    await route.fulfill({ json: quote })
  })

  return bodies
}

async function fillForm(page: Page, values: { origin: string, height: string }) {
  await page.getByLabel('CEP de origem').fill(values.origin)
  await page.getByLabel('CEP de destino').fill('20040002')
  await page.getByLabel('Altura (cm)').fill(values.height)
  await page.getByLabel('Largura (cm)').fill('12')
  await page.getByLabel('Comprimento (cm)').fill('17')
  await page.getByLabel('Peso (kg)').fill('0,3')
}

test('cota após um envio válido e grava os dados na URL', async ({ page }) => {
  const bodies = await mockQuoteRoute(page)
  await page.goto('/calcular-frete')

  await fillForm(page, { origin: '01310100', height: '2' })
  expect(bodies).toHaveLength(0)

  await page.getByRole('button', { name: 'Calcular frete' }).click()

  await expect(page.getByRole('heading', { name: 'Opções de frete' })).toBeVisible()
  await expect(page.getByText('Correios')).toBeVisible()
  await expect(page).toHaveURL(/originCep=01310100/)
  expect(bodies).toEqual([{
    originCep: '01310100',
    destinationCep: '20040002',
    heightCm: 2,
    widthCm: 12,
    lengthCm: 17,
    weightKg: 0.3,
    insuranceBrl: 0
  }])
})

test('não cota com o formulário inválido e foca o primeiro erro', async ({ page }) => {
  const bodies = await mockQuoteRoute(page)
  await page.goto('/calcular-frete')

  await page.getByRole('button', { name: 'Calcular frete' }).click()

  await expect(page.getByText('Informe o CEP de origem.')).toBeVisible()
  await expect(page.getByLabel('CEP de origem')).toBeFocused()
  await expect(page.getByLabel('CEP de origem')).toHaveAttribute('aria-invalid', 'true')
  await expect(page).toHaveURL('/calcular-frete')
  expect(bodies).toHaveLength(0)
})

test('reabre a cotação pela URL e volta à anterior pelo histórico', async ({ page }) => {
  const bodies = await mockQuoteRoute(page)
  await page.goto('/calcular-frete?originCep=01310100&destinationCep=20040002&heightCm=2&widthCm=12&lengthCm=17&weightKg=0.3&insuranceBrl=0')

  await expect(page.getByLabel('CEP de origem')).toHaveValue('01310-100')
  await expect(page.getByText('Correios')).toBeVisible()

  await page.getByLabel('Altura (cm)').fill('5')
  await page.getByRole('button', { name: 'Calcular frete' }).click()
  await expect(page).toHaveURL(/heightCm=5/)

  await page.goBack()

  await expect(page).toHaveURL(/heightCm=2/)
  await expect(page.getByLabel('Altura (cm)')).toHaveValue('2')
  expect(bodies).toHaveLength(2)
})

test.describe('em tela pequena', () => {
  test.use({ viewport: { width: 375, height: 740 } })

  test('empilha os campos sem overflow horizontal', async ({ page }) => {
    await mockQuoteRoute(page)
    await page.goto('/calcular-frete')

    await page.getByRole('button', { name: 'Calcular frete' }).click()
    await expect(page.getByText('Informe o CEP de origem.')).toBeVisible()

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBe(0)

    const origin = await page.getByLabel('CEP de origem').boundingBox()
    const destination = await page.getByLabel('CEP de destino').boundingBox()
    expect(destination?.y).toBeGreaterThan((origin?.y ?? 0) + (origin?.height ?? 0))
  })
})
