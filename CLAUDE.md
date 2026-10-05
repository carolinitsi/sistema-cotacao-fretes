# Sistema cotação de fretes

Sistema de cotação de fretes (teste técnico Front-end Pleno). Priorize clareza e simplicidade.
Não adicione dependências nem complexidade sem necessidade; se achar que falta algo, pergunte.

## Stack
Nuxt 4, Vue 3 (`<script setup>`), TypeScript estrito, Nuxt UI + Tailwind 4,
TanStack Vue Query, zod, Vitest, MSW, Playwright, pnpm.

## Comandos
- `pnpm dev` | `pnpm build`
- `pnpm lint` | `pnpm typecheck`
- `pnpm test` (unit e componente) | `pnpm test:e2e`
Antes de finalizar qualquer tarefa, rode lint, typecheck e test.

## Regras de código
- Sempre `<script setup lang="ts">`. Sem `any`; use `unknown` e estreite o tipo.
- Lógica de negócio e validação fora dos componentes: em `app/utils`, `app/schemas` e `app/composables`.
- Um schema zod é a fonte da verdade da validação (formulário e server usam o mesmo).
- Chamadas de API só via composables com Vue Query; componentes não chamam `$fetch` diretamente.
- Estado compartilhável de tela vive na URL (query string). Sem Pinia.
- Prefira componentes do Nuxt UI antes de criar os seus. Estilo via Tailwind e tokens do tema, sem CSS solto nem cores fixas.
- Tratar sempre os estados de loading, erro e vazio.

## Acessibilidade
- Inputs com label e `aria-describedby` nos erros; `aria-invalid` quando inválido.
- Navegação por teclado funcional e foco visível. Não depender só de cor para indicar erro.

## Testes
- Teste regras de negócio e comportamento, não detalhes de implementação nem a lib.
- Unit: schemas, máscaras, formatadores. Componente: formulário e tabela. Integração: MSW. E2E: fluxos principais.

## Git
- Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `ci:`).
- Commits pequenos e coerentes, um por mudança lógica. Nunca um commit gigante.
- Não faça push nem force-push sem eu pedir.

## Decisões
Toda decisão técnica relevante ou trade-off entra em `docs/DECISIONS.md` (contexto, decisão, alternativas, motivo).
