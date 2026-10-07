<script setup lang="ts">
import type { FreightQuoteResponse } from '#shared/types/freight'

// Lista mínima das opções da cotação. A tabela com ordenação é outra tarefa.
defineProps<{ quote: FreightQuoteResponse }>()

const titleId = useId()
</script>

<template>
  <UCard
    as="section"
    :aria-labelledby="titleId"
  >
    <div class="flex flex-col gap-4">
      <h2
        :id="titleId"
        class="text-section"
      >
        Opções de frete
      </h2>

      <UAlert
        v-if="quote.simulated"
        color="neutral"
        variant="subtle"
        icon="i-lucide-flask-conical"
        title="Cotação simulada"
        description="Valores de exemplo do modo de desenvolvimento, não são preços reais."
      />

      <p
        v-if="!quote.options.length"
        class="text-body text-muted"
      >
        Nenhuma transportadora atende esse trecho com esses dados.
      </p>

      <ul
        v-else
        class="flex flex-col divide-y divide-default"
      >
        <li
          v-for="option in quote.options"
          :key="option.id"
          class="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <div class="flex flex-col">
            <span class="text-label">{{ option.carrier?.name ?? option.service }}</span>
            <span
              v-if="option.carrier"
              class="text-caption text-muted"
            >{{ option.service }}</span>
          </div>

          <p
            v-if="option.disabled"
            class="text-caption text-muted"
          >
            Indisponível: {{ option.disabledReason }}
          </p>
          <div
            v-else
            class="flex flex-col sm:items-end"
          >
            <span class="text-label">{{ formatCurrency(option.priceBrl) }}</span>
            <span class="text-caption text-muted">{{ formatDeliveryTime(option.deliveryDays) }}</span>
          </div>
        </li>
      </ul>
    </div>
  </UCard>
</template>
