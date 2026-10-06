// Contraste WCAG 2.x a partir da luminância relativa.
// https://www.w3.org/TR/WCAG22/#dfn-relative-luminance

const HEX_COLOR = /^#([0-9a-f]{6})$/i

/** Converte `#RRGGBB` em canais sRGB de 0 a 1. */
export function parseHex(hex: string): [number, number, number] {
  const match = HEX_COLOR.exec(hex)
  if (!match?.[1]) {
    throw new Error(`Cor inválida: "${hex}". Use o formato #RRGGBB.`)
  }
  const value = match[1]
  return [0, 2, 4].map(i => Number.parseInt(value.slice(i, i + 2), 16) / 255) as [number, number, number]
}

function toLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map(toLinear) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Razão de contraste entre duas cores, de 1 a 21. A ordem não importa. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}
