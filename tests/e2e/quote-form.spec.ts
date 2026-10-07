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

const validUrl = '/calcular-frete?originCep=01310100&destinationCep=20040002&heightCm=2&widthCm=12&lengthCm=17&weightKg=0.3&insuranceBrl=0'

test('troca o formulário pelos resultados após um envio válido', async ({ page }) => {
  const bodies = await mockQuoteRoute(page)
  await page.goto('/calcular-frete')

  await fillForm(page, { origin: '01310100', height: '2' })
  expect(bodies).toHaveLength(0)

  await page.getByRole('button', { name: 'Calcular frete' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Cotações de frete' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'breadcrumb' })).toContainText('Resultados')
  await expect(page.getByRole('row', { name: /Correios.*PAC/ })).toBeVisible()
  await expect(page.locator('form')).toHaveCount(0)
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

test('reabre os resultados pela URL, inclusive no reload', async ({ page }) => {
  const bodies = await mockQuoteRoute(page)
  await page.goto(validUrl)

  await expect(page.getByRole('row', { name: /Correios.*PAC/ })).toBeVisible()
  await expect(page.getByText('01310-100')).toBeVisible()

  await page.reload()

  await expect(page.getByRole('row', { name: /Correios.*PAC/ })).toBeVisible()
  // Uma chamada por carregamento da página (o cache do Vue Query vive na memória).
  expect(bodies).toHaveLength(2)
})

test('edita os dados, cota de novo e volta pelo histórico', async ({ page }) => {
  const bodies = await mockQuoteRoute(page)
  await page.goto(validUrl)
  await expect(page.getByRole('row', { name: /Correios.*PAC/ })).toBeVisible()

  await page.getByRole('button', { name: 'Editar dados' }).click()

  await expect(page).toHaveURL(/edit=1/)
  await expect(page.getByRole('heading', { level: 1, name: 'Calcular frete' }).locator('[tabindex="-1"]')).toBeFocused()
  await expect(page.getByLabel('CEP de origem')).toHaveValue('01310-100')
  await expect(page.getByLabel('Altura (cm)')).toHaveValue('2')

  await page.getByLabel('Altura (cm)').fill('5')
  await page.getByRole('button', { name: 'Calcular frete' }).click()

  await expect(page).toHaveURL(/heightCm=5/)
  await expect(page).not.toHaveURL(/edit=1/)
  await expect(page.getByText('5 × 12 × 17 cm')).toBeVisible()
  expect(bodies).toHaveLength(2)

  await page.goBack()
  await expect(page.getByLabel('Altura (cm)')).toHaveValue('2')

  await page.goBack()
  await expect(page.getByText('2 × 12 × 17 cm')).toBeVisible()
  // A cotação anterior vem do cache.
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

  test('mostra os resultados em lista, sem overflow horizontal', async ({ page }) => {
    await mockQuoteRoute(page)
    await page.goto(validUrl)

    await expect(page.getByRole('list', { name: 'Opções de frete' })).toBeVisible()
    await expect(page.getByRole('table')).toBeHidden()
    await expect(page.getByRole('button', { name: 'Selecionar Correios PAC' })).toBeVisible()

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBe(0)
  })
})
