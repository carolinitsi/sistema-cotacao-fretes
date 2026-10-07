<script setup lang="ts">
useSeoMeta({ title: 'Ajuda' })

// Página ainda não implementada: estado vazio com o caminho para o fluxo disponível.
const actions = [{ label: 'Calcular frete', icon: 'i-lucide-truck', to: '/calcular-frete', color: 'neutral' as const, variant: 'outline' as const }]
</script>

<template>
  <div class="flex flex-col gap-4">
    <UPageHeader
      title="Ajuda"
      description="Dúvidas frequentes e suporte."
    />

    <UEmpty
      icon="i-lucide-circle-help"
      title="Em breve"
      description="As dúvidas frequentes e o contato com o suporte vão ficar aqui."
      :actions="actions"
    />
  </div>
</template>
