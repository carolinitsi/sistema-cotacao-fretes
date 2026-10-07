<script setup lang="ts">
useSeoMeta({ title: 'Calcular frete' })
</script>

<template>
  <div class="flex flex-col gap-4">
    <UPageHeader
      title="Calcular frete"
      description="Receba cotações das principais transportadoras do país."
    />

    <FeaturesQuoteFreightQuoteForm />
  </div>
</template>
