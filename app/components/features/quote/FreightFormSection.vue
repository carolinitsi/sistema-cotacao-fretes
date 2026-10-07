<script setup lang="ts">
// Bloco visual de uma seção do formulário: ícone, título, descrição e campos (slot).
// Não conhece campos, validação nem API.
defineProps<{
  icon: string
  title: string
  description?: string
}>()

const titleId = useId()
</script>

<template>
  <UCard
    as="section"
    :aria-labelledby="titleId"
  >
    <div class="flex flex-col gap-4">
      <header class="flex gap-3">
        <UIcon
          :name="icon"
          class="mt-1 size-icon shrink-0"
          aria-hidden="true"
        />
        <div class="flex flex-col gap-1">
          <h2
            :id="titleId"
            class="text-section"
          >
            {{ title }}
          </h2>
          <p
            v-if="description"
            class="text-caption text-muted"
          >
            {{ description }}
          </p>
        </div>
      </header>

      <slot />
    </div>
  </UCard>
</template>
