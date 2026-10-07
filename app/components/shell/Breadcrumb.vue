<script setup lang="ts">
const route = useRoute()
const items = computed(() => getBreadcrumbItems(route.path, route.query))
</script>

<template>
  <UBreadcrumb
    v-if="items.length"
    :items="items"
    color="neutral"
  />
</template>
