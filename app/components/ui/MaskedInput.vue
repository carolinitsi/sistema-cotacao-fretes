<script setup lang="ts" generic="T">
import type { InputMask } from '~/utils/masks'

// UInput com máscara: exibe o texto mascarado e expõe no v-model o valor normalizado
// (o que o schema valida). Atributos e props do UInput (icon, placeholder, inputmode...) passam direto.
const props = defineProps<{ mask: InputMask<T> }>()
const model = defineModel<T>({ required: true })

const text = ref(props.mask.format(model.value))
const input = useTemplateRef<{ inputRef: HTMLInputElement | null }>('input')

function onUpdate(raw: unknown) {
  const masked = props.mask.mask(String(raw ?? ''))

  text.value = masked
  model.value = props.mask.parse(masked)

  // Se a máscara descartou o que foi digitado, o texto reativo não muda e o Vue não
  // atualiza o DOM; corrige o elemento direto para o caractere inválido não aparecer.
  const element = input.value?.inputRef
  if (element && element.value !== masked) {
    element.value = masked
  }
}

// Mudança vinda de fora (reset do formulário, URL): reformata o texto.
watch(model, (value) => {
  if (!Object.is(props.mask.parse(text.value), value)) {
    text.value = props.mask.format(value)
  }
})
</script>

<template>
  <UInput
    ref="input"
    :model-value="text"
    @update:model-value="onUpdate"
  />
</template>
