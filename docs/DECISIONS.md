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
- **Decisão:** schemas zod como fonte única da verdade, inferindo os tipos TypeScript a partir deles. Ficam em `shared/schemas` (ver 017).
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

## 009. Design tokens em três camadas

- **Contexto:** os tokens do Figma chegam como JSON (primitivos, semânticos e fundamentos) e precisam alimentar o Tailwind 4 e o Nuxt UI sem que os componentes dependam de hex ou px soltos.
- **Decisão:** `app/assets/css/tokens.css` expõe variáveis `--fp-*` em três camadas: primitivos (valores), semânticos (só `var()` para primitivos) e fundamentos (medidas, tipografia, sombra). Os valores derivados ficam numa seção separada. O `main.css` só referencia esses tokens no `@theme` e nas variáveis `--ui-*`, e o `app.config.ts` usa as utilities resultantes.
- **Alternativas:** colocar os valores direto no `@theme` (`--color-*`) e nas `--ui-*`; gerar o CSS com Style Dictionary.
- **Motivo:** cada camada tem um papel claro e o nome mapeia 1:1 com o Figma (`text.onDisabled` → `--fp-text-on-disabled`). Trocar um primitivo propaga para tudo, e os tokens do design não se confundem com os internos do Nuxt UI. Style Dictionary seria uma dependência a mais para cerca de 60 variáveis.

## 010. Variantes de acessibilidade sem alterar os tokens do design

- **Contexto:** alguns pares de texto do design ficam abaixo de 4,5:1: text/secondary sobre bg/page tem 4,43, text/selected sobre surface/selected tem 3,33 e feedback/error sobre surface/error tem 3,25. Além disso, o amarelo da marca tem só 1,73:1 contra branco e não serve como anel de foco.
- **Decisão:** criar variantes derivadas (`--fp-text-secondary-a11y`, `--fp-text-selected-a11y`, `--fp-text-error-a11y`) que mantêm matiz e croma em OKLCH e escurecem só o necessário para 4,5:1, além de `--fp-focus-ring` = `amber/700` (3,65:1). Os componentes usam as variantes, e os tokens originais continuam iguais ao Figma.
- **Alternativas:** corrigir os próprios tokens do design; aceitar o contraste baixo; escolher tons arbitrários de outra paleta.
- **Motivo:** o export continua fiel ao Figma e comparável a ele, a correção fica rastreável e reversível quando o design for revisado, e a mudança visual é mínima (ΔL ≤ 0,08).

## 011. Teste contra divergência entre JSON e CSS

- **Contexto:** os tokens foram copiados à mão do JSON para o CSS e o export ainda vai mudar após a validação no Figma original.
- **Decisão:** `tests/unit/design-tokens.test.ts` lê os três JSONs e o `tokens.css` e confere:
  - hex dos primitivos;
  - aliases dos semânticos;
  - medidas dos fundamentos;
  - família de `--font-sans`;
  - contraste dos pares de texto e foco.

  Também acusa uma variante a11y que deixou de ser necessária.
- **Alternativas:** gerar o CSS a partir do JSON num passo de build; conferência manual.
- **Motivo:** o teste roda em Node, em milissegundos, sem dependência nova nem etapa de build extra, e quebra o CI com uma mensagem que aponta exatamente o token divergente.

## 012. Escala de espaçamento padrão do Tailwind e cálculo OKLCH documentado

- **Contexto:** os espaçamentos do design (8/12/16/24px) coincidem com a escala padrão do Tailwind (`2`/`3`/`4`/`6`, base 4px). Além disso, a escala brand e as variantes a11y foram calculadas em OKLCH.
- **Decisão:** usar a escala padrão do Tailwind para espaçamento, sem utilities nomeadas. Os `--fp-space-*` ficam como referência documentada. O cálculo OKLCH fica descrito em `docs/design-tokens.md` e nos comentários de `tokens.css`, sem script versionado.
- **Alternativas:** utilities como `p-fp-12`; um script `scripts/derive-tokens.mjs` no repositório.
- **Motivo:** utilities próprias duplicariam valores que já existem. O cálculo roda uma vez por revisão do design, e o teste de contraste garante o resultado, então um script versionado seria só mais um arquivo para manter.

## 013. Modo claro fixo

- **Contexto:** o Nuxt UI ativa o color mode (claro/escuro) por padrão, mas o design só define tokens para o modo claro.
- **Decisão:** `colorMode.preference` e `fallback` fixos em `light` no `nuxt.config.ts`. As variáveis `--ui-*` são sobrescritas só em `:root`.
- **Alternativas:** manter o modo escuro com os valores padrão do Nuxt UI; desligar o módulo com `ui.colorMode: false`.
- **Motivo:** evita uma tela escura que mistura tokens do design com cores do Nuxt UI, sem remover o módulo, que pode ser reaproveitado quando houver design escuro.

## 014. Navegação principal e breadcrumb

- **Contexto:** o layout fornecido apresenta "Calcular frete" antes de "Início" na navegação lateral e usa "Início > Calcular frete" no breadcrumb da tela de cálculo.
- **Decisão:** "Início" e "Calcular frete" são rotas de primeiro nível. A navegação lateral fica com "Início" antes de "Calcular frete", e `/` redireciona para `/inicio`. O breadcrumb reflete a hierarquia real das rotas, sem representar "Calcular frete" como subpágina de "Início". Os labels vêm de um mapeamento único em `app/utils/navigation.ts`, usado pelo menu e pelo breadcrumb.
- **Alternativas:** reproduzir literalmente a ordem e o breadcrumb do layout; manter "Calcular frete" como primeiro item com "Início > Calcular frete"; ajustar a navegação para refletir a hierarquia real das páginas.
- **Motivo:** a hierarquia de navegação deve ser consistente com a estrutura das rotas. O breadcrumb não deve sugerir uma relação pai/filho que não existe, e isso evita inconsistência entre a navegação lateral e a estrutura de informação da aplicação.

## 015. Application shell com os componentes Dashboard do Nuxt UI

- **Contexto:** o layout precisa de sidebar, topbar, breadcrumb e área de conteúdo, funcionando também em telas pequenas.
- **Decisão:** `app/layouts/default.vue` compõe `UDashboardGroup`, `UDashboardSidebar` e `UDashboardPanel`. Abaixo de `lg`, a sidebar vira um slideover aberto pelo botão da topbar (comportamento do próprio Nuxt UI). Os pedaços do shell ficam em `app/components/shell/`. O item ativo do menu usa `text-selected-a11y` sobre `surface-selected`, no lugar do `text-primary` padrão, que é amarelo sobre branco (1,73:1). O breadcrumb segue o layout: todos os itens em `text-body` regular e `text-muted` (4,97:1), separador de 16px. No design, os itens anteriores aparecem um pouco mais claros que o atual; não há token mais claro que passe 4,5:1, então o atual se distingue por não ser link e por `aria-current`, não pela cor.
- **Alternativas:** layout próprio com Tailwind e `UNavigationMenu`, com o drawer mobile implementado à mão.
- **Motivo:** segue a regra de preferir componentes do Nuxt UI. Foco, `aria-current`, fechamento do menu ao navegar e slideover acessível já vêm prontos, com menos código para manter.

## 016. Locale pt-BR no Nuxt UI

- **Contexto:** o shell usa textos gerados pelo Nuxt UI, como o rótulo do botão que abre a sidebar, e o locale padrão é inglês ("Open sidebar") numa página `lang="pt-BR"`.
- **Decisão:** passar `pt_br` (`@nuxt/ui/locale`) para o `UApp` em `app/app.vue`.
- **Alternativas:** sobrescrever o `aria-label` de cada componente.
- **Motivo:** leitores de tela anunciam os controles no idioma da página, e isso vale para todos os componentes de uma vez.

## 017. Schemas em `shared/`

- **Contexto:** o schema zod da cotação é usado pelo formulário (app) e pela API mock (server). A pasta prevista, `app/schemas`, pertence ao app Vue. No Nuxt 4, o server não deve importar código de `app/`.
- **Decisão:** os schemas ficam em `shared/schemas`, a convenção do Nuxt 4 para código comum ao app e ao server, e são importados explicitamente por `#shared/schemas/...`. O projeto `unit` do Vitest ganha o alias `#shared`. Máscaras e formatadores continuam em `app/utils`, porque só o app os usa.
- **Alternativas:** manter em `app/schemas` e importar no server pelo caminho da raiz; `shared/utils`, que tem auto-import.
- **Motivo:** segue a estrutura que o próprio Nuxt gera e verifica (o `tsconfig.shared.json` e a proteção de imports impedem `shared/` de depender de `app/` ou `server/`). O import explícito deixa claro de onde vem o schema, sem misturar schemas com utils auto-importadas.

## 018. Schema valida valores normalizados; máscara só no input

- **Contexto:** o formulário mostra CEP, medidas, peso e seguro com máscaras pt-BR ("01310-100", "12,5", "1.234,56"). O mesmo schema precisa validar o formulário, a API e a query string.
- **Decisão:** o `quoteRequestSchema` valida valores normalizados (CEP só com dígitos e números). As máscaras (`app/utils/masks.ts`) são objetos `InputMask` com `mask`, `parse` e `format`, e o `UiMaskedInput` (wrapper do `UInput`) exibe o texto mascarado e expõe no v-model o valor normalizado. A moeda é preenchida da direita para a esquerda, como em caixa eletrônico, então o sinal de menos não pode ser digitado. A regra de seguro negativo continua no schema para a API e para a URL. Limitação aceita: quando a máscara reescreve o texto (inclusão do hífen, reformatação da moeda), o cursor vai para o fim do campo, mesmo quando a edição foi no meio do texto. Os campos são curtos, e preservar a posição exigiria mapear o cursor entre o texto digitado e o mascarado para cada máscara.
- **Alternativas:** `UInputNumber` do Nuxt UI, que já formata pt-BR e moeda; schema validando o texto mascarado com `transform`; biblioteca de máscara (maska, vue-the-mask).
- **Motivo:** o `UInputNumber` não tem ícone à esquerda, que o design usa em todos os campos, e ajusta "0" e negativos para o `min` ao sair do campo, escondendo os erros que o design mostra. Validar o texto mascarado exigiria um schema para o formulário e outro para a API. As máscaras são funções puras de poucas linhas, testadas em Node, sem dependência nova.

## 019. Limites dos campos da cotação

- **Contexto:** o design só define os mínimos (medidas e peso maiores que 0, seguro não negativo).
- **Decisão:** medidas até 200 cm com 1 casa decimal; peso até 1000 kg com 3 casas (gramas); seguro até R$ 1.000.000,00 com 2 casas. Ficam em `QUOTE_LIMITS`, no schema. Origem igual ao destino é permitido. A mensagem de CEP do design ("O CEP inválido") foi corrigida para "CEP inválido. Use o formato 00000-000."
- **Alternativas:** sem máximo; limites de uma transportadora específica.
- **Motivo:** evita valores absurdos e erros de digitação (um zero a mais) sem restringir casos reais de encomenda. Entrega na mesma cidade é um caso comum. Os valores ficam num só lugar, fáceis de ajustar quando houver regra de negócio.

## 020. Botão "Calcular frete" sempre habilitado

- **Contexto:** no design, o botão aparece desabilitado enquanto há erros no formulário.
- **Decisão:** o botão fica habilitado e a validação roda no envio, com foco no primeiro campo inválido. Ele só fica desabilitado (com loading) enquanto a cotação é calculada. O ícone do seguro passa a ser `i-lucide-banknote`, porque o pin de mapa do design repete o ícone dos CEPs.
- **Alternativas:** seguir o design e desabilitar o botão até o formulário ficar válido.
- **Motivo:** um botão desabilitado não recebe foco nem explica por que não funciona. Quem usa teclado ou leitor de tela não descobre o que falta. Validar no envio mostra as mensagens de todos os campos de uma vez.
