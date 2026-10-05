# Registro de decisões

Decisões técnicas relevantes e seus trade-offs. Cada entrada segue o formato:

```md
## NNN. Título

- **Contexto:** o problema ou a necessidade.
- **Decisão:** o que foi escolhido.
- **Alternativas:** o que mais foi considerado.
- **Motivo:** por que esta opção venceu.
```

---

## 001. Nuxt UI como design system

- **Contexto:** o sistema precisa de formulários, tabelas e feedbacks acessíveis, com pouco tempo de desenvolvimento.
- **Decisão:** usar Nuxt UI (sobre Tailwind CSS 4), partindo do template oficial `ui`.
- **Alternativas:** componentes próprios com Tailwind; PrimeVue; Vuetify.
- **Motivo:** é o design system oficial do ecossistema Nuxt, já vem com acessibilidade (Reka UI), tema por tokens e integração com ícones e color mode, sem configuração extra.

## 002. TanStack Vue Query para dados e cache

- **Contexto:** as cotações vêm de uma API e precisam de estados de loading, erro, cache e refetch.
- **Decisão:** TanStack Vue Query, registrado em `app/plugins/vue-query.ts` com `staleTime` de 5 minutos, `retry: 1` e SSR por dehydrate/hydrate.
- **Alternativas:** `useFetch`/`useAsyncData` do Nuxt; Pinia com actions.
- **Motivo:** cache por chave, deduplicação, invalidação e estados prontos, com menos código manual. `useFetch` atende casos simples, mas não oferece invalidação e mutações no mesmo nível.

## 003. zod para validação

- **Contexto:** a mesma regra de validação deve valer no formulário e na API.
- **Decisão:** schemas zod em `app/schemas` como fonte única da verdade, inferindo os tipos TypeScript a partir deles.
- **Alternativas:** Valibot; Yup; validação manual.
- **Motivo:** é aceito diretamente pelo `UForm` do Nuxt UI, tem inferência de tipos e roda no cliente e no servidor.

## 004. Sem Pinia

- **Contexto:** é preciso decidir onde fica o estado da aplicação.
- **Decisão:** estado compartilhável de tela na URL (query string); estado de servidor no Vue Query.
- **Alternativas:** Pinia como store global.
- **Motivo:** com a URL e o cache do Vue Query não sobra estado global que justifique uma store. A URL ainda torna a cotação compartilhável e preservada no reload.

## 005. Sem Prettier

- **Contexto:** é preciso padronizar a formatação do código.
- **Decisão:** usar apenas o ESLint com as regras de estilo do `@nuxt/eslint` (ESLint Stylistic).
- **Alternativas:** Prettier junto com o ESLint.
- **Motivo:** uma ferramenta só, sem conflitos de regras entre formatador e linter, e a configuração padrão do ecossistema Nuxt.

## 006. Server routes do Nitro como API mock

- **Contexto:** o teste é de front-end, mas o fluxo de cotação precisa de uma API.
- **Decisão:** implementar a API mock em `server/api` com server routes do Nitro.
- **Alternativas:** backend em Laravel; json-server; apenas MSW no navegador.
- **Motivo:** roda no mesmo processo e no mesmo comando (`pnpm dev`), sem outra stack para instalar, e reaproveita os schemas zod para validar as requisições.

## 007. Testes em quatro camadas

- **Contexto:** é preciso confiança no comportamento sem testes lentos ou frágeis.
- **Decisão:** Vitest com dois projetos (`unit` em Node e `component` em ambiente Nuxt), MSW para integração e Playwright (só Chromium) para E2E contra o build de produção.
- **Alternativas:** um único projeto Vitest em ambiente Nuxt; Cypress para E2E.
- **Motivo:** testes puros rodam sem subir o Nuxt e ficam rápidos. O MSW falha em requisições sem handler (`onUnhandledFrame: 'error'`), evitando acesso à rede. O E2E na porta 3100 roda contra o build de produção e não colide com outros servidores locais.

## 008. Testes incluídos no typecheck

- **Contexto:** por padrão o `nuxt typecheck` só cobre `tests/nuxt`, deixando os outros testes sem verificação de tipos.
- **Decisão:** incluir `tests/` e as configs de teste via `typescript.tsConfig` e `typescript.nodeTsConfig` no `nuxt.config.ts`.
- **Alternativas:** rodar o typecheck dos testes em um script separado; renomear as pastas para o padrão do Nuxt.
- **Motivo:** um único comando cobre tudo e mantém a estrutura de pastas definida para o projeto.
