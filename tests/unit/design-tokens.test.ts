import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contrastRatio } from '~/utils/contrast'

// Garante que tokens.css não se afaste do export do Figma e que os pares de
// texto e foco atinjam o contraste WCAG.

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
const readJson = (path: string): unknown => JSON.parse(read(path))

type Token = { path: string[], value: unknown, extensions: unknown }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function collectTokens(node: unknown, path: string[] = []): Token[] {
  if (!isRecord(node)) return []
  if ('$value' in node) return [{ path, value: node.$value, extensions: node.$extensions }]
  return Object.entries(node)
    .filter(([key]) => !key.startsWith('$'))
    .flatMap(([key, child]) => collectTokens(child, [...path, key]))
}

const kebab = (segment: string) => segment.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`)
const cssName = (path: string[]) => `--fp-${path.map(kebab).join('-')}`

// Variáveis --fp-* de tokens.css (comentários removidos antes).
const css = read('app/assets/css/tokens.css').replace(/\/\*[\s\S]*?\*\//g, '')
const vars = new Map([...css.matchAll(/(--fp-[\w-]+)\s*:\s*([^;]+);/g)].map(m => [m[1]!, m[2]!.trim()]))

function rawVar(name: string): string {
  const value = vars.get(name)
  if (value === undefined) throw new Error(`${name} não existe em app/assets/css/tokens.css`)
  return value
}

/** Segue as referências var(--fp-*) até o valor literal. */
function resolve(name: string): string {
  const value = rawVar(name)
  const ref = /^var\((--fp-[\w-]+)\)$/.exec(value)
  return ref?.[1] ? resolve(ref[1]) : value
}

function hexOf(value: unknown): string {
  if (!isRecord(value) || typeof value.hex !== 'string') throw new Error(`Cor sem hex: ${JSON.stringify(value)}`)
  const alpha = typeof value.alpha === 'number' ? value.alpha : 1
  const alphaHex = alpha < 1 ? Math.round(alpha * 255).toString(16).padStart(2, '0') : ''
  return `${value.hex}${alphaHex}`.toUpperCase()
}

/** Converte "0.375rem" ou "6px" para px. */
function toPx(value: string): number {
  const match = /^(-?[\d.]+)(px|rem)$/.exec(value)
  if (!match?.[1]) throw new Error(`Medida não reconhecida: "${value}"`)
  return Number(match[1]) * (match[2] === 'rem' ? 16 : 1)
}

describe('tokens.css x export do Figma', () => {
  it.each(collectTokens(readJson('docs/design/tokens/primitives.tokens.json')))(
    'primitivo $path tem o mesmo hex do JSON',
    ({ path, value }) => {
      const name = cssName(path)
      expect(rawVar(name).toUpperCase(), `${name} divergiu do primitives.tokens.json`).toBe(hexOf(value))
    }
  )

  it.each(collectTokens(readJson('docs/design/tokens/semantic.tokens.json')))(
    'semântico $path aponta para o primitivo do alias',
    ({ path, value, extensions }) => {
      const name = cssName(path.slice(1)) // remove o grupo "color"
      const alias = isRecord(extensions) && isRecord(extensions['com.figma.aliasData'])
        ? extensions['com.figma.aliasData'].targetVariableName
        : undefined
      expect(typeof alias, `${name} sem alias no JSON`).toBe('string')
      const target = cssName(String(alias).split('/'))
      expect(rawVar(name), `${name} deveria ser var(${target})`).toBe(`var(${target})`)
      expect(resolve(name).toUpperCase(), `${name} resolve para outro hex`).toBe(hexOf(value))
    }
  )

  it.each(collectTokens(readJson('docs/design/tokens/foundations.tokens.json')))(
    'fundamento $path tem o mesmo valor do JSON',
    ({ path, value }) => {
      const name = cssName(path[0] === 'type' ? ['font', ...path.slice(1)] : path)
      const actual = rawVar(name)
      if (typeof value === 'number' && !path.includes('weight')) {
        expect(toPx(actual), `${name} divergiu do foundations.tokens.json`).toBe(value)
      } else if (isRecord(value)) {
        expect(actual.toUpperCase(), `${name} divergiu do foundations.tokens.json`).toBe(hexOf(value))
      } else {
        expect(actual.replace(/'/g, ''), `${name} divergiu do foundations.tokens.json`).toBe(String(value))
      }
    }
  )

  it('--font-sans do Tailwind começa pela família do design', () => {
    const fontSans = /--font-sans:\s*([^;]+);/.exec(read('app/assets/css/main.css'))?.[1] ?? ''
    expect(fontSans.split(',')[0]?.trim()).toBe(rawVar('--fp-font-family'))
  })
})

const TEXT = 4.5
const NON_TEXT = 3

// fg: token do design; a11y: variante derivada que os componentes usam no lugar.
const textPairs = [
  { fg: '--fp-text-primary', bg: '--fp-surface-default' },
  { fg: '--fp-text-primary', bg: '--fp-bg-page' },
  { fg: '--fp-text-secondary', bg: '--fp-surface-default', a11y: '--fp-text-secondary-a11y' },
  { fg: '--fp-text-secondary', bg: '--fp-bg-page', a11y: '--fp-text-secondary-a11y' },
  { fg: '--fp-text-secondary', bg: '--fp-surface-subtle', a11y: '--fp-text-secondary-a11y' },
  { fg: '--fp-text-selected', bg: '--fp-surface-selected', a11y: '--fp-text-selected-a11y' },
  { fg: '--fp-feedback-error', bg: '--fp-surface-error', a11y: '--fp-text-error-a11y' },
  { fg: '--fp-feedback-error', bg: '--fp-surface-default', a11y: '--fp-text-error-a11y' }
  // text/onDisabled sobre action/disabled (1,80:1) é isento: botão desabilitado.
]

const nonTextPairs = [
  { fg: '--fp-focus-ring', bg: '--fp-surface-default' },
  { fg: '--fp-focus-ring', bg: '--fp-bg-page' },
  { fg: '--fp-focus-ring', bg: '--fp-surface-selected' },
  { fg: '--fp-border-error', bg: '--fp-surface-default' },
  { fg: '--fp-border-error', bg: '--fp-surface-error' }
]

const ratio = (fg: string, bg: string) => contrastRatio(resolve(fg), resolve(bg))
const report = (fg: string, bg: string, min: number) =>
  `${fg} sobre ${bg}: ${ratio(fg, bg).toFixed(2)}:1, mínimo ${min}:1`

describe('contraste dos tokens', () => {
  it.each(textPairs)('texto $fg sobre $bg atinge 4,5:1', ({ fg, bg, a11y }) => {
    const used = a11y ?? fg
    expect(ratio(used, bg), report(used, bg, TEXT)).toBeGreaterThanOrEqual(TEXT)
  })

  it.each(nonTextPairs)('$fg sobre $bg atinge 3:1', ({ fg, bg }) => {
    expect(ratio(fg, bg), report(fg, bg, NON_TEXT)).toBeGreaterThanOrEqual(NON_TEXT)
  })

  it('variantes a11y só existem onde o token original falha', () => {
    const variants = new Set(textPairs.flatMap(pair => (pair.a11y ? [pair.a11y] : [])))
    for (const variant of variants) {
      const failing = textPairs.filter(pair => pair.a11y === variant && ratio(pair.fg, pair.bg) < TEXT)
      expect(failing.length, `${variant} é desnecessária: o original já passa em todos os fundos`).toBeGreaterThan(0)
    }
  })
})
