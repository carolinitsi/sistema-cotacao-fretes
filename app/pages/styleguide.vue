<script setup lang="ts">
// Página interna para conferir os tokens contra o PNG do design. Fora do menu.
useSeoMeta({
  title: 'Styleguide',
  robots: 'noindex'
})

const tokenValues = useCssVariables(colorGroups.flatMap(group => group.tokens.map(token => token.name)))

const options = ['Econômico', 'Expresso', 'Agendado']
const selected = ref('Expresso')
</script>

<template>
  <UContainer class="flex flex-col gap-6 py-6">
    <header class="flex flex-col gap-2">
      <h1 class="text-title">
        Styleguide
      </h1>
      <p class="text-body text-muted">
        Tokens do Figma: proposta extraída de imagens. Validar no original.
      </p>
    </header>

    <section
      v-for="group in colorGroups"
      :key="group.title"
      class="flex flex-col gap-3"
    >
      <h2 class="text-section">
        {{ group.title }}
      </h2>
      <ul class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <li
          v-for="token in group.tokens"
          :key="token.name"
          class="flex flex-col gap-2"
        >
          <span
            class="h-12 rounded-control border border-default"
            :style="{ backgroundColor: `var(${token.name})` }"
            aria-hidden="true"
          />
          <span class="text-caption break-all">{{ token.name }}</span>
          <span class="text-caption text-muted">{{ tokenValues[token.name] ?? '—' }}</span>
          <UBadge
            :label="token.origin"
            :variant="token.origin === 'design' ? 'subtle' : 'outline'"
            color="neutral"
            class="self-start"
          />
        </li>
      </ul>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="text-section">
        Tipografia (Inter)
      </h2>
      <dl class="flex flex-col gap-3">
        <div
          v-for="style in typeScale"
          :key="style.name"
          class="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6"
        >
          <dt class="text-caption text-muted sm:w-40">
            {{ style.name }} · {{ style.spec }}
          </dt>
          <dd :class="style.className">
            Cotação de frete para São Paulo
          </dd>
        </div>
      </dl>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="text-section">
        Botões
      </h2>
      <p class="text-caption text-muted">
        Use Tab para ver o anel de foco.
      </p>
      <div class="flex flex-wrap gap-3">
        <UButton label="Calcular frete" />
        <UButton
          label="Calcular frete"
          disabled
        />
      </div>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="text-section">
        Campos
      </h2>
      <div class="grid gap-4 sm:grid-cols-3">
        <UFormField
          label="CEP de origem"
          name="origem"
        >
          <UInput
            placeholder="00000-000"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Valor do seguro"
          name="seguro"
          error="Informe um valor maior que zero."
        >
          <UInput
            model-value="0"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="CEP de destino"
          name="destino"
        >
          <UInput
            placeholder="00000-000"
            disabled
            class="w-full"
          />
        </UFormField>
      </div>
      <div class="flex items-center gap-2">
        <span class="flex size-8 items-center justify-center rounded-full bg-error-halo">
          <UIcon
            name="i-lucide-circle-alert"
            class="size-icon text-error-a11y"
          />
        </span>
        <span class="text-caption text-error-a11y">Ícone de erro com halo</span>
      </div>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="text-section">
        Card e item selecionado
      </h2>
      <UCard class="max-w-md">
        <template #header>
          <h3 class="text-section">
            Modalidade de entrega
          </h3>
        </template>
        <ul
          class="flex flex-col gap-2"
          aria-label="Modalidade de entrega"
        >
          <li
            v-for="option in options"
            :key="option"
          >
            <button
              type="button"
              class="flex h-control w-full items-center justify-between rounded-control border px-3 outline-focus focus-visible:outline-2 focus-visible:outline-offset-2"
              :class="option === selected
                ? 'border-selected-a11y bg-surface-selected text-label text-selected-a11y'
                : 'border-default bg-surface text-body'"
              :aria-pressed="option === selected"
              @click="selected = option"
            >
              {{ option }}
              <UIcon
                v-if="option === selected"
                name="i-lucide-check"
                class="size-icon"
              />
            </button>
          </li>
        </ul>
      </UCard>
    </section>
  </UContainer>
</template>
