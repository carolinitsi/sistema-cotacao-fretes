<script setup lang="ts">
import type { QuoteRequest } from '#shared/schemas/quote'

// Resumo dos dados cotados (vindos da URL) e o caminho de volta ao formulário.
const props = defineProps<{ request: QuoteRequest }>()

defineEmits<{ edit: [] }>()

const summary = computed(() => getQuoteSummary(props.request))

const titleId = useId()
</script>

<template>
  <UCard
    as="section"
    :aria-labelledby="titleId"
  >
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div class="flex flex-1 items-start gap-4">
        <span class="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-selected">
          <UIcon
            name="i-lucide-package"
            class="size-icon text-selected-a11y"
            aria-hidden="true"
          />
        </span>

        <div class="flex min-w-0 flex-col gap-1">
          <h2
            :id="titleId"
            class="text-label"
          >
            Dados do envio
          </h2>

          <!-- Uma dl por linha; os separadores ficam dentro dos dd, porque dl e seus grupos só aceitam dt e dd. -->
          <dl class="flex flex-wrap gap-x-1 text-caption text-muted">
            <div class="flex gap-1">
              <dt>CEP origem</dt>
              <dd class="flex items-center gap-1 font-semibold text-default">
                {{ summary.originCep }}
                <UIcon
                  name="i-lucide-arrow-right"
                  class="size-4 shrink-0 text-muted"
                  aria-hidden="true"
                />
              </dd>
            </div>
            <div class="flex gap-1">
              <dt>CEP destino</dt>
              <dd class="font-semibold text-default">
                {{ summary.destinationCep }}
              </dd>
            </div>
          </dl>

          <dl class="flex flex-wrap gap-x-1 text-caption text-muted">
            <div>
              <dt class="sr-only">
                Dimensões (altura × largura × comprimento)
              </dt>
              <dd>{{ summary.dimensions }} <span aria-hidden="true">·</span></dd>
            </div>
            <div>
              <dt class="sr-only">
                Peso
              </dt>
              <dd>{{ summary.weight }} <span aria-hidden="true">·</span></dd>
            </div>
            <div class="flex gap-1">
              <dt>Seguro:</dt>
              <dd>{{ summary.insurance }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <UButton
        label="Editar dados"
        icon="i-lucide-pencil-line"
        color="neutral"
        variant="outline"
        class="cursor-pointer justify-center"
        :ui="{ label: 'text-muted', leadingIcon: 'text-primary' }"
        @click="$emit('edit')"
      />
    </div>
  </UCard>
</template>
