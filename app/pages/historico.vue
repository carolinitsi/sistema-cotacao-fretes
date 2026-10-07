<script setup lang="ts">
useSeoMeta({ title: 'Histórico' })

// Página ainda não implementada: estado vazio com o caminho para o fluxo disponível.
const actions = [{ label: 'Calcular frete', icon: 'i-lucide-truck', to: '/calcular-frete', color: 'neutral' as const, variant: 'outline' as const }]
</script>

<template>
  <div class="flex flex-col gap-4">
    <UPageHeader
      title="Histórico"
      description="Cotações realizadas anteriormente."
    />

    <UEmpty
      icon="i-lucide-history"
      title="Em breve"
      description="O histórico das suas cotações vai aparecer aqui."
      :actions="actions"
    />
  </div>
</template>
