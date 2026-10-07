<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { FreightOption } from '#shared/types/freight'

// Opções da cotação: tabela a partir de md e lista abaixo disso, com os mesmos dados.
// A versão oculta sai da árvore de acessibilidade (display: none).
const props = defineProps<{ options: FreightOption[] }>()

defineEmits<{ select: [option: FreightOption] }>()

const rows = computed(() => sortFreightOptions(props.options))

const columns: TableColumn<FreightOption>[] = [
  { id: 'carrier', header: 'Transportadora' },
  { accessorKey: 'service', header: 'Modalidade' },
  { id: 'delivery', header: 'Prazo estimado', meta: { class: { td: 'whitespace-normal' } } },
  { id: 'price', header: 'Valor estimado' },
  { id: 'actions', header: 'Ações', meta: { class: { th: 'text-end', td: 'text-end' } } }
]
</script>

<template>
  <div>
    <UTable
      :data="rows"
      :columns="columns"
      caption="Opções de frete"
      class="hidden md:block"
      :ui="{ thead: 'bg-elevated/50', th: 'text-label', td: 'py-2 text-body text-default' }"
    >
      <template #carrier-cell="{ row }">
        <FeaturesQuoteFreightCarrier :carrier="row.original.carrier" />
      </template>

      <template #delivery-cell="{ row }">
        <FeaturesQuoteFreightUnavailableReason
          v-if="row.original.disabled"
        />
        <template v-else>
          {{ formatDeliveryEstimate(row.original) }}
        </template>
      </template>

      <!-- Indisponível: célula vazia; o prazo já diz que a transportadora não atende. -->
      <template #price-cell="{ row }">
        <template v-if="!row.original.disabled">
          {{ formatCurrency(row.original.priceBrl) }}
        </template>
      </template>

      <template #actions-cell="{ row }">
        <UButton
          icon="i-lucide-arrow-right"
          color="neutral"
          variant="outline"
          :aria-label="`Selecionar ${getFreightOptionLabel(row.original)}`"
          :disabled="row.original.disabled"
          class="cursor-pointer disabled:cursor-not-allowed disabled:bg-disabled disabled:text-on-disabled"
          @click="$emit('select', row.original)"
        />
      </template>
    </UTable>

    <ul
      aria-label="Opções de frete"
      class="flex flex-col divide-y divide-default md:hidden"
    >
      <li
        v-for="option in rows"
        :key="option.id"
        class="flex items-center gap-3 p-4"
      >
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <FeaturesQuoteFreightCarrier :carrier="option.carrier" />
          <span class="text-caption text-muted">{{ option.service }}</span>

          <FeaturesQuoteFreightUnavailableReason
            v-if="option.disabled"
          />
          <span
            v-else
            class="text-body"
          >
            <span class="font-semibold">{{ formatCurrency(option.priceBrl) }}</span>
            <span aria-hidden="true"> · </span>
            <span class="text-muted">{{ formatDeliveryEstimate(option) }}</span>
          </span>
        </div>

        <UButton
          icon="i-lucide-arrow-right"
          color="neutral"
          variant="outline"
          :aria-label="`Selecionar ${getFreightOptionLabel(option)}`"
          :disabled="option.disabled"
          class="cursor-pointer disabled:cursor-not-allowed disabled:bg-disabled disabled:text-on-disabled"
          @click="$emit('select', option)"
        />
      </li>
    </ul>
  </div>
</template>
