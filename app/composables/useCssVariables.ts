/**
 * Lê o valor computado de variáveis CSS do :root, já com os var() resolvidos.
 * Só no cliente; no SSR o mapa fica vazio.
 */
export function useCssVariables(names: string[]) {
  const values = ref<Record<string, string>>({})

  onMounted(() => {
    const style = getComputedStyle(document.documentElement)
    values.value = Object.fromEntries(
      names.map(name => [name, style.getPropertyValue(name).trim().toUpperCase()])
    )
  })

  return values
}
