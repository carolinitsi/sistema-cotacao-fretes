<script setup lang="ts">
import type { FreightCarrier } from '#shared/types/freight'

// Só o logotipo da transportadora, com o nome no alt. Sem logo, ou se a imagem falhar,
// o nome aparece como texto.
const props = defineProps<{ carrier: FreightCarrier | null }>()

const name = computed(() => props.carrier?.name ?? 'Transportadora não informada')

const logoFailed = ref(false)
</script>

<template>
  <img
    v-if="carrier?.logoUrl && !logoFailed"
    :src="carrier.logoUrl"
    :alt="name"
    loading="lazy"
    class="max-h-5 w-auto max-w-28 object-contain"
    @error="logoFailed = true"
  >
  <span
    v-else
    class="text-label"
  >{{ name }}</span>
</template>
