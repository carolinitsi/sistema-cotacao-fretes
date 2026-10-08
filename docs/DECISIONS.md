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
- **Atualização:** a rota de cotação passou a integrar o Melhor Envio, e o mock virou um modo explícito de desenvolvimento (ver 021 e 022).

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
- **Atualização:** "Resultados" é um estado de "Calcular frete" vindo da query, não uma rota; o breadcrumb também lê a query nesse caso (ver 028).

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

## 021. Cotação pelo Melhor Envio, sempre via rota interna

- **Contexto:** a cotação precisa de uma API real de frete. A do Melhor Envio exige token Bearer (OAuth2, 30 dias) e `User-Agent` com e-mail de contato. Esse token não pode chegar ao navegador. A decisão 006 previa só uma API mock em `server/api`.
- **Decisão:** o app chama apenas `POST /api/freight/quote`, e a rota chama `POST /api/v2/me/shipment/calculate` no server. A URL base padrão é a do Sandbox. Token, URL base e user agent ficam no `runtimeConfig` privado (`NUXT_MELHOR_ENVIO_*`). O payload usa `products` com um único item (a encomenda), e as medidas são arredondadas para cima, porque a API as declara como inteiros. Sem fluxo OAuth no app: o token é gerado fora dele e renovado manualmente. Sem token ou user agent, a rota responde 503 ("Cotação de frete não configurada"). O núcleo (`server/utils/freight/`) usa o `fetch` global e não depende do h3, e a rota é só o adaptador.
- **Alternativas:** chamar a API direto do navegador; implementar o fluxo OAuth com refresh token; payload por `volumes`; enviar as medidas com decimal.
- **Motivo:** o segredo fica só no server, e a UI depende de um contrato próprio, não do formato da API externa. O OAuth completo (callback, armazenamento e renovação de token) é desproporcional para um teste de front-end com uma única conta. Usamos `products` porque o exemplo e o schema da doc concordam nele (o schema de `volumes` tem campos com erro de digitação, `heigth`/`lenght`). O arredondamento para cima nunca cota um pacote menor que o real.

## 022. Mock de desenvolvimento explícito, nunca fallback

- **Contexto:** sem credenciais do Melhor Envio, ainda é preciso rodar e demonstrar o fluxo. Ao mesmo tempo, dado simulado não pode esconder erro real nem chegar à produção.
- **Decisão:** no modo mock, a rota devolve dados estáticos (`server/utils/freight/mock.ts`). Os dados ficam no formato bruto do Melhor Envio e passam pela mesma validação e normalização da integração real. A resposta traz `simulated: true`, e o server registra um aviso no log. Fora de `pnpm dev` (`import.meta.dev`), esse modo responde 503. Uma falha da API real nunca troca para o mock. Quando `NUXT_FREIGHT_API_MODE` não é definido, o modo é `mock` em `pnpm dev` e `melhor-envio` no build de produção. Para usar a API real em desenvolvimento, o modo `melhor-envio` precisa ser escolhido explicitamente.
- **Alternativas:** fallback automático para o mock quando a API falha; usar o MSW no navegador como mock de desenvolvimento; mock decidido pela ausência do token.
- **Motivo:** quem clona o projeto (inclusive na avaliação) roda `pnpm dev` e vê o fluxo funcionando, sem criar conta nem token. O padrão depende só do ambiente, nunca da presença do token ou de uma falha da API, e é visível (flag na resposta e aviso no log). Por isso não mascara erro nem configuração esquecida: em produção, sem token, a resposta continua sendo 503. Reaproveitar a normalização garante que o mock respeite o mesmo contrato. O MSW fica restrito aos testes (ver 024).

## 023. Contrato interno e normalização da resposta

- **Contexto:** a resposta do Melhor Envio traz preços como string, valores originais e customizados, pacotes e serviços adicionais. Além disso, na prática, devolve itens `{ id, name, error }` para serviços indisponíveis, o que não está na doc oficial.
- **Decisão:** `shared/types/freight.ts` define `FreightQuoteResponse { options, simulated }`, em que `FreightOption` é uma união discriminada por `disabled`. Um serviço disponível traz `priceBrl`, `deliveryDays` e `deliveryRange`, a partir de `custom_price`, `custom_delivery_time` e `custom_delivery_range`, conforme a recomendação da doc. Um serviço indisponível traz `disabledReason` com a mensagem da API e continua na lista. A resposta externa é validada com zod no server, e resposta fora do contrato vira 502. Os erros da API viram status e mensagens próprios: 422 → 422; 401/403, 5xx e rede → 502 (o 401 também gera um log de token inválido); tempo acima de 10 s → 504. Nenhuma mensagem da API externa é repassada, exceto o motivo de indisponibilidade.
- **Alternativas:** repassar a resposta bruta; descartar os serviços indisponíveis; validar só o que a doc descreve e tratar o item com `error` como resposta inválida.
- **Motivo:** a UI fica desacoplada do provedor e recebe números prontos para formatar. Mostrar os indisponíveis desabilitados, com o motivo, explica por que uma transportadora não aparece com preço. O item com `error` foi aceito no schema por ser o comportamento observado da API real; se o formato mudar, a validação acusa 502 em vez de exibir dado errado. Confirmado no Sandbox em 2026-10-06: pacotes acima do limite e CEP inexistente voltam com status 200, e cada serviço vem como `{ id, name, error, company }`, sem preço. Por exemplo: "Dimensões do objeto ultrapassam o limite da transportadora." e "Serviço indisponível no momento (-2).".

## 024. MSW para a API externa; registerEndpoint para a rota interna

- **Contexto:** os testes precisam cobrir a integração sem rede, e o MSW (decisão 007) intercepta o `fetch` global. No ambiente `nuxt` do Vitest, o `$fetch` de caminhos relativos vai para um app h3 interno do `@nuxt/test-utils`, não para o `fetch` global.
- **Decisão:** os handlers do Melhor Envio (`tests/mocks/melhor-envio.ts`) cobrem sucesso, serviço indisponível, lista vazia, 422, 401, 500, falha de rede, resposta fora do contrato, resposta que não é JSON e lentidão. O handler de sucesso é o padrão. Os testes do núcleo do server rodam no projeto `unit`, com o MSW interceptando a chamada externa. O composable é testado no projeto `component`, e a rota interna é simulada com `registerEndpoint`. O projeto `component` ganha `hookTimeout` de 60 s.
- **Alternativas:** subir o servidor Nitro nos testes (`@nuxt/test-utils/e2e`), mas o MSW no processo de teste não intercepta o processo do server; mockar o `$fetch` com `vi.mock`.
- **Motivo:** cada camada é testada na fronteira real que ela atravessa: o server até o Melhor Envio, o composable até a rota interna. O `registerEndpoint` é o mecanismo oficial do Nuxt para isso. O timeout maior é necessário porque o setup do Nuxt transforma o app inteiro no `beforeAll`, e a frio isso passa dos 10 s padrão, mesmo num teste vazio.

## 025. useFreightQuote com useQuery por parâmetros

- **Contexto:** a cotação é uma leitura determinada pelos dados do formulário, que ficarão na URL (decisão 004).
- **Decisão:** `useFreightQuote(request)` usa `useQuery` com a chave `['freight-quote', request]`, desabilitado enquanto `request` é `null`, e expõe os estados do Vue Query mais um `errorMessage` pronto para exibir. Só falhas transitórias (rede, 5xx) são repetidas, uma vez; erros 4xx não são repetidos. A leitura do erro do `$fetch` fica em `app/utils/freight-errors.ts`.
- **Alternativas:** `useMutation` disparado no envio; `useFetch` do Nuxt.
- **Motivo:** a mesma cotação reaproveita o cache e é refeita a partir da URL (reload, link compartilhado) sem código extra. Repetir um 422 só atrasaria a mensagem, porque o resultado não muda.

## 026. Formulário de cotação: estado de edição separado do request na URL

- **Contexto:** o formulário edita campos que podem estar vazios ou inválidos, mas o `QuoteRequest` só aceita valores válidos. A cotação não pode acontecer a cada tecla. Pelas decisões 004 e 025, o request cotado deve viver na URL.
- **Decisão:** o `FreightQuoteForm` edita um `QuoteFormState` próprio (`app/utils/quote-form.ts`), validado pelo `UForm` com o `quoteRequestSchema`. No envio válido, `mapFormToQuoteRequest` gera o `QuoteRequest`, e `useQuoteRequestQuery` grava a query string com `router.push`. O `useFreightQuote` recebe o request lido da URL por `parseQuoteQuery`, que converte o texto em número na borda e valida com o mesmo schema: query incompleta, inválida ou fora dos limites vira `null` e não cota. As chaves da query são as do schema, o seguro vazio fica fora da URL e o seguro `0` é gravado. Um `watch` sobre o request da URL atualiza o formulário ao voltar ou avançar no histórico. Reenviar o mesmo request não muda a URL e usa o cache; depois de um erro, o reenvio chama `refetch`. O `FreightFormSection` só desenha a seção (ícone, título, descrição e slot) e não conhece campos, validação nem API. Os campos de medida e peso começam vazios, com placeholder; os valores do design (2, 12, 17 e 0,30) eram inconsistência. O `UForm` usa `:loading-auto="false"`, porque o loading automático desabilita os campos durante o envio e impede o foco no primeiro campo inválido; o loading da tela é o `isFetching` da cotação.
- **Alternativas:** request em um `ref` local; passar o estado do formulário direto ao `useFreightQuote`; nomes curtos ou traduzidos na query.
- **Motivo:** o estado de edição pode ser inválido sem afetar a cotação, e só um envio válido muda o que é cotado. A URL torna a cotação compartilhável e preservada no reload e no histórico, e o schema protege as duas pontas, inclusive contra URL editada à mão. Chaves iguais às do schema dispensam um mapeamento extra.
- **Atualização:** o `watch(request)` foi substituído pela remontagem do formulário por `:key`, e a cotação, o loading e o erro saíram do formulário para a tela de resultados (ver 028).

## 027. Cotação só no cliente

- **Contexto:** abrir `/calcular-frete` com a query preenchida renderiza a página no servidor. Lá, o `useQuery` dispara a busca sem esperar por ela: o HTML sai em loading, a query pendente não é desidratada e o cliente busca de novo. Resultado: duas chamadas por acesso, e a do servidor chega à API externa.
- **Decisão:** o `FreightQuoteForm` só passa o request ao `useFreightQuote` depois de montar (`onMounted`). O servidor renderiza o formulário preenchido, sem cotação, e o cliente cota uma vez.
- **Alternativas:** prefetch no SSR com `onServerPrefetch` e `suspense()`, para entregar o resultado no HTML.
- **Motivo:** uma chamada por acesso. Robôs e prévias de link (que fazem só o SSR) não consomem a API de frete. O E2E consegue interceptar a rota no navegador. O prefetch deixaria o primeiro byte esperando a transportadora (até 10 s) e não desidrata erros, que seriam buscados de novo no cliente.
- **Atualização:** com a tela de resultados (ver 028), a cotação saiu do formulário. O `onMounted` agora fica no `FreightQuoteResults`, que só passa o request ao `useFreightQuote` depois de montar. O servidor renderiza o resumo em loading, sem cotação.

## 028. Tela de resultados como estado da página, decidido pela URL

- **Contexto:** depois de um envio válido, a página `/calcular-frete` deve trocar o formulário pela tela de resultados (resumo e tabela de opções), com breadcrumb "Calcular frete > Resultados" e um botão "Editar dados" que volta ao formulário preenchido. Reload, histórico e link compartilhado precisam reproduzir a tela.
- **Decisão:**
  - Formulário e resultados são estados da mesma página. Query válida → resultados. A mesma query com `edit=1` → formulário preenchido. O envio grava a query sem a flag (`router.push`). As funções ficam em `app/utils/quote-query.ts` (`getQuotedRequest`, `quoteRequestToEditQuery`), e o `useQuoteRequestQuery` expõe `quotedRequest` e `editRequest`.
  - O breadcrumb acrescenta "Resultados" (com `aria-current`) quando há `quotedRequest`. "Calcular frete" vira link para `/calcular-frete`, uma cotação nova, como o menu.
  - O `FreightQuoteForm` só edita e emite o request válido. A página o remonta por `:key` quando o request da URL muda de valor, no lugar do `watch`.
  - O `useFreightQuote` roda no `FreightQuoteResults`, montado só na tela de resultados. Editar não cota, e reabrir em `edit=1` também não. O resumo vem da URL e aparece já no loading, com skeleton nas linhas (fora da árvore de acessibilidade) e o status anunciado. O erro aparece ali, com "Tentar novamente" (`refetch`).
  - Após enviar ou editar, o foco vai para o título da página (o botão clicado some da tela).
  - Opções disponíveis ordenadas por preço (empate: menor prazo); indisponíveis no fim, com o botão desabilitado e o texto fixo do layout, "Transportadora não atende este trecho.", no lugar do prazo, e a célula de valor vazia. O `disabledReason` continua no contrato, mas não é exibido (muda o que a 023 previa na tela). Prazo com faixa: "1 a 2 dias úteis".
  - A coluna "Transportadora" mostra só o logotipo (até 20px de altura, `max-h-5`), com o nome no `alt`. Sem logo, ou se a imagem falhar, o nome aparece como texto.
  - `UTable` a partir de `md`, com o cabeçalho em `bg-elevated/50`; abaixo disso, lista (`ul`) com os mesmos dados.
  - Sem aviso de "Cotação simulada" na tela, a pedido do layout. O `simulated` continua na resposta, e o modo mock segue identificado pelo aviso no log do server e pelo 503 fora de `pnpm dev` (ver 022).
  - A coluna "Ações" segue o layout, mas ainda não há fluxo de contratação: o botão mostra um toast "em breve".
- **Alternativas:** rota aninhada `/calcular-frete/resultados`; modo de edição num `ref` local; ficar no formulário até a cotação terminar; tabela com scroll horizontal no mobile; omitir a coluna "Ações".
- **Motivo:**
  - Com o modo na URL, reload, voltar/avançar e link reproduzem a tela sem estado global (decisão 004). A cotação continua na mesma chave de cache, então reenviar o mesmo request não chama a API.
  - A rota aninhada criaria uma segunda página para o mesmo fluxo, e o `ref` local se perderia no reload e não chegaria ao breadcrumb, que fica no layout.
  - Mostrar os resultados já no envio deixa o loading igual no envio e no reload. A lista no mobile evita ler uma tabela de cinco colunas com scroll lateral em 375px.
  - O botão de seleção foi pedido para manter o layout. O toast deixa claro que a contratação ainda não existe.

## 029. Versão mínima do Node declarada e exigida na instalação

- **Contexto:** num clone limpo com Node 20, o `pnpm install` terminava com `ERR_PNPM_EXECUTOR_LIFECYCLE_SCRIPT_FAILED`: o `postinstall` (`nuxt prepare`) falhava, sem indicar que a causa era a versão do Node. O Nuxt 4.5 exige `^22.19.0 || ^24.11.0 || >=26.0.0`, mas o projeto não declarava `engines`, e o `.nvmrc` dizia só `22`.
- **Decisão:** `engines.node` no `package.json` com a mesma faixa do Nuxt, `engineStrict: true` no `pnpm-workspace.yaml` e `.nvmrc` com `22.22`. O README informa a versão mínima.
- **Alternativas:** só documentar no README; deixar o `postinstall` tolerar falhas (`nuxt prepare || true`).
- **Motivo:** com `engineStrict`, o pnpm recusa a instalação logo no início, com uma mensagem que aponta a versão esperada e a atual (`ERR_PNPM_UNSUPPORTED_ENGINE`). Só a documentação não evita o erro confuso, e tolerar a falha esconderia o problema até o `pnpm dev`. O `.nvmrc` mais preciso faz o `nvm use` instalar uma versão compatível.

## 030. Páginas ainda não implementadas com estado vazio

- **Contexto:** Início, Histórico, Configurações, Ajuda e Perfil só tinham título. Como `/` redireciona para `/inicio` (decisão 014), quem abria a raiz caía numa página sem conteúdo e sem caminho para o único fluxo pronto.
- **Decisão:** cada uma dessas páginas mostra um `UEmpty` abaixo do título. Em Início, um convite para cotar o primeiro frete, com o botão primário "Calcular frete". Nas demais, "Em breve", com um texto do que a página terá e "Calcular frete" como ação secundária (`neutral`/`outline`). A busca e as notificações da barra superior continuam sem função e entram nas limitações do README.
- **Alternativas:** redirecionar `/` para `/calcular-frete`; esconder do menu os itens sem conteúdo; montar um painel em Início com dados fictícios.
- **Motivo:** mantém a navegação da decisão 014 e o menu do layout, e nenhuma página termina sem saída. Mudar o redirecionamento contrariaria a 014 só para resolver a primeira impressão, e dados fictícios dariam a entender que há funcionalidades que não existem.
