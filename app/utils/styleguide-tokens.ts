// Tokens de cor exibidos em /styleguide. Os valores vêm do CSS em tempo de
// execução (useCssVariables); aqui só os nomes e a origem.

export type TokenOrigin = 'design' | 'derivado'

export interface ColorToken {
  name: string
  origin: TokenOrigin
}

export interface ColorGroup {
  title: string
  tokens: ColorToken[]
}

const design = (...names: string[]): ColorToken[] => names.map(name => ({ name, origin: 'design' }))
const derived = (...names: string[]): ColorToken[] => names.map(name => ({ name, origin: 'derivado' }))

export const colorGroups: ColorGroup[] = [
  {
    title: 'Primitivos',
    tokens: design(
      '--fp-yellow-50', '--fp-yellow-500', '--fp-amber-700',
      '--fp-neutral-0', '--fp-neutral-50', '--fp-neutral-100', '--fp-neutral-200',
      '--fp-neutral-400', '--fp-neutral-500', '--fp-neutral-900',
      '--fp-red-50', '--fp-red-500'
    )
  },
  {
    title: 'Semânticos',
    tokens: design(
      '--fp-brand', '--fp-action-primary', '--fp-action-disabled', '--fp-bg-page',
      '--fp-surface-default', '--fp-surface-subtle', '--fp-surface-selected', '--fp-surface-error',
      '--fp-text-primary', '--fp-text-secondary', '--fp-text-selected', '--fp-text-on-disabled',
      '--fp-border-default', '--fp-feedback-error'
    )
  },
  {
    title: 'Acessibilidade e erro',
    tokens: derived(
      '--fp-text-secondary-a11y', '--fp-text-selected-a11y', '--fp-text-error-a11y',
      '--fp-focus-ring', '--fp-border-error', '--fp-icon-error-halo'
    )
  },
  {
    title: 'Escala brand',
    tokens: [
      ...design('--fp-brand-50'),
      ...derived('--fp-brand-100', '--fp-brand-200', '--fp-brand-300', '--fp-brand-400'),
      ...design('--fp-brand-500'),
      ...derived('--fp-brand-600'),
      ...design('--fp-brand-700'),
      ...derived('--fp-brand-800', '--fp-brand-900', '--fp-brand-950')
    ]
  }
]

export interface TypeStyle {
  name: string
  className: string
  spec: string
}

// className precisa ser literal para o Tailwind gerar a utility.
export const typeScale: TypeStyle[] = [
  { name: 'title', className: 'text-title', spec: '24 / 700 / 32' },
  { name: 'section', className: 'text-section', spec: '16 / 600 / 24' },
  { name: 'body', className: 'text-body', spec: '14 / 400 / 20' },
  { name: 'label', className: 'text-label', spec: '14 / 500 / 20' },
  { name: 'caption', className: 'text-caption', spec: '12 / 400 / 16' },
  { name: 'button', className: 'text-body font-button', spec: '14 / 600 / 20' }
]
