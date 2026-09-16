# Weather App - Backlog de Tarefas

Este backlog deriva do plano técnico em `plans/weather-app-plan.md` e foi revisado para garantir critérios de aceite objetivos, verificáveis e rastreáveis aos requisitos da spec quando possível.

## Entrega 1 — Tipos e regras puras

### T-01 — Configurar a base do projeto e o shell da aplicação
- ID: T-01
- Título: Configurar a base do projeto e o shell da aplicação
- Descrição curta: Preparar a estrutura inicial do Vite + React + Tailwind e criar o shell base da aplicação.
- Critérios de aceite:
  - a aplicação inicia em ambiente local sem erros de compilação ou renderização (`pnpm build` e `pnpm dev` entram em execução normal);
  - os arquivos `src/App.tsx`, `src/main.tsx` e `src/index.css` existem com estrutura inicial reconhecível;
  - a configuração do Tailwind está presente em `tailwind.config.js` e `postcss.config.js`;
  - a tela base renderiza um container inicial com o tema dark glassmorphism e sem overflow horizontal em 320px.
- Dependências: Nenhuma.
- Arquivos prováveis: `src/App.tsx`, `src/main.tsx`, `src/index.css`, `tailwind.config.js`, `vite.config.ts`
- Tipo: Infra
- Rastreio: NFR-01, Stack do projeto

### T-02 — Definir tipos do domínio e estados de UI
- ID: T-02
- Título: Definir tipos do domínio e estados de UI
- Descrição curta: Modelar os contratos internos da aplicação para separar domínio, serviços e renderização.
- Critérios de aceite:
  - os tipos `City`, `CurrentWeather`, `ForecastDay`, `WeatherData`, `SearchState` e `WeatherState` existem e cobrem exatamente os campos definidos no plano;
  - `SearchStatus` inclui `idle | loading | success | empty | error` e `WeatherBlockStatus` inclui `idle | loading | success | incomplete | error`;
  - `unit` é representado como `celsius | fahrenheit` e a unidade inicial é `celsius`;
  - os tipos são importados por serviços e componentes sem duplicação de estrutura em múltiplos arquivos.
- Dependências: T-01
- Arquivos prováveis: `src/types/weather.ts`, `src/types/api.ts`
- Tipo: Data
- Rastreio: FR-04, FR-05, FR-06, FR-07, Data Model do plano

### T-03 — Implementar validador de termo de busca
- ID: T-03
- Título: Implementar validador de termo de busca
- Descrição curta: Validar entradas do usuário antes do disparo da busca.
- Critérios de aceite:
  - a função aceita `Sao Paulo`, `Rio`, `Londres` e rejeita `''`, `'A'`, `'!'` e `'   '`;
  - entradas com 2-80 caracteres Unicode com ao menos uma letra ou número passam;
  - entradas sem letra/número, com 1 caractere ou vazias retornam `false` ou equivalente de validação;
  - a função é pura e não executa rede, DOM ou efeitos colaterais;
  - os casos válidos e inválidos são cobertos por testes unitários (FR-01, AC-02).
- Dependências: T-02
- Arquivos prováveis: `src/utils/validation.ts`
- Tipo: Data
- Rastreio: FR-01, AC-01, AC-02

### T-04 — Implementar mapeamento WMO e textos de condição
- ID: T-04
- Título: Implementar mapeamento WMO e textos de condição
- Descrição curta: Converter códigos WMO em textos pt-BR finais para clima atual e previsão.
- Critérios de aceite:
  - os pares `0`, `1-3`, `45,48`, `51-57`, `61-67`, `71-77`, `80-82`, `85-86`, `95,96,99` são mapeados para as descrições esperadas em pt-BR;
  - qualquer código fora desses intervalos devolve `Condicao indisponivel`;
  - a função aceita apenas números e retorna string em pt-BR;
  - os testes unitários validam pelo menos 3 códigos válidos e 2 códigos desconhecidos.
- Dependências: T-02
- Arquivos prováveis: `src/utils/weatherCodes.ts`
- Tipo: Data
- Rastreio: FR-04, FR-05, Seção 4 da spec

### T-05 — Implementar conversão e formatação de temperatura
- ID: T-05
- Título: Implementar conversão e formatação de temperatura
- Descrição curta: Centralizar a conversão de Celsius para Fahrenheit e o arredondamento para inteiro.
- Critérios de aceite:
  - `convertCelsiusToFahrenheit(0) === 32`, `convertCelsiusToFahrenheit(25) === 77` e `convertCelsiusToFahrenheit(-10) === 14` (arredondado para inteiro mais próximo);
  - a função rejeita valores `NaN`, `Infinity` e `undefined`;
  - a apresentação usa a unidade ativa, mas o domínio continua em Celsius;
  - testes cobrem pelo menos 5 casos de conversão e 2 casos de entrada inválida.
- Dependências: T-02
- Arquivos prováveis: `src/utils/temperature.ts`
- Tipo: Data
- Rastreio: FR-06, regra de conversão da spec

### T-06 — Implementar validação de data, timezone e cinco dias consecutivos
- ID: T-06
- Título: Implementar validação de data, timezone e cinco dias consecutivos
- Descrição curta: Validar a resposta de previsão e garantir que o conjunto diário seja consistente.
- Critérios de aceite:
  - a função aceita `2026-09-16`, `2026-09-17`, `2026-09-18`, `2026-09-19`, `2026-09-20` e rejeita listas com 4 ou 6 entradas;
  - a função garante que as cinco datas são distintas e consecutivas por calendário;
  - `timezone` diferente de vazio é exigido antes da normalização;
  - um payload com `time: ["2026-09-16", "2026-09-17", "2026-09-18", "2026-09-19", "2026-09-20"]` entra em sucesso; valores fora do formato falham.
- Dependências: T-02
- Arquivos prováveis: `src/utils/dates.ts`
- Tipo: Data
- Rastreio: FR-05, NFR-06, contrato externo da previsão

## Entrega 2 — Services e adaptação de dados externos

### T-07 — Criar serviço de geocodificação com timeout e validação de resposta
- ID: T-07
- Título: Criar serviço de geocodificação com timeout e validação de resposta
- Descrição curta: Encapsular a consulta de cidades usando o endpoint correto e validar resultados antes de entrar na UI.
- Critérios de aceite:
  - a URL final inclui `name`, `count=10`, `language=pt` e `format=json` e não envia `Authorization` nem chave de API;
  - quando a resposta tem `results` vazio, o serviço retorna estado `empty`/resultado nulo de forma explícita;
  - resultados sem `name` ou sem coordenadas numéricas finitas são descartados;
  - `AbortController` e timeout de 10 segundos estão implementados; `fetch` abortado ou timeout gera erro de domínio em vez de crash.
- Dependências: T-02, T-03
- Arquivos prováveis: `src/services/geocodingService.ts`
- Tipo: Data
- Rastreio: FR-01, FR-02, FR-03, NFR-03, NFR-05

### T-08 — Criar serviço de previsão com timeout e validação do contrato
- ID: T-08
- Título: Criar serviço de previsão com timeout e validação do contrato
- Descrição curta: Encapsular a consulta do clima atual e da previsão, validando a resposta antes da normalização.
- Critérios de aceite:
  - a URL inclui `latitude`, `longitude`, `timezone=auto`, `forecast_days=5`, `temperature_unit=celsius`, `current=temperature_2m,apparent_temperature,weather_code,is_day` e `daily=weather_code,temperature_2m_max,temperature_2m_min`;
  - se `current.temperature_2m`, `current.weather_code` ou `current.time` faltarem, o serviço marca o bloco atual como inválido em vez de sucesso parcial;
  - se qualquer um dos 5 arrays diários tiver tamanho diferente ou dados inválidos, o serviço rejeita a resposta inteira;
  - a resposta parcial ou incompleta não é convertida em sucesso silencioso.
- Dependências: T-02, T-04, T-05, T-06
- Arquivos prováveis: `src/services/forecastService.ts`
- Tipo: Data
- Rastreio: FR-04, FR-05, NFR-04, contrato externo da previsão

## Entrega 3 — Hook e fluxo de busca

### T-09 — Orquestrar busca, resposta e seleção de cidade no hook principal
- ID: T-09
- Título: Orquestrar busca, resposta e seleção de cidade no hook principal
- Descrição curta: Definir o fluxo de controle da aplicação de busca e seleção.
- Critérios de aceite:
  - ao iniciar uma busca válida, `requestId` é incrementado, `status` vira `loading` e um `AbortController` é criado;
  - respostas antigas com `requestId` diferente são descartadas;
  - ao selecionar uma cidade, o contexto anterior é invalidado antes de iniciar a nova consulta;
  - `lastValidTerm` continua disponível para retries e a nova busca não inicia duas chamadas equivalentes em paralelo.
- Dependências: T-07, T-08
- Arquivos prováveis: `src/hooks/useWeatherSearch.ts`
- Tipo: Data
- Rastreio: FR-03, FR-07, AC-05, NFR-03

### T-10 — Implementar fallback e retry de busca com último termo válido
- ID: T-10
- Título: Implementar fallback e retry de busca com último termo válido
- Descrição curta: Reaproveitar o último termo válido em caso de falha de busca.
- Critérios de aceite:
  - se a última busca falhar, o `Retry` usa exatamente o mesmo termo válido anterior;
  - a função não dispara segunda requisição enquanto a de mesmo termo ainda está em andamento;
  - o input continua editável e a mensagem de erro é recuperável;
  - ao clicar em retry, o estado de carregamento reaparece sem restaurar dados de uma cidade anterior.
- Dependências: T-09
- Arquivos prováveis: `src/hooks/useWeatherSearch.ts`, `src/components/SearchForm.tsx`
- Tipo: UI
- Rastreio: FR-03, FR-07, AC-04

## Entrega 4 — Componentes de UI

### T-11 — Implementar o campo de busca e o botão de envio
- ID: T-11
- Título: Implementar o campo de busca e o botão de envio
- Descrição curta: Renderizar o formulário do usuário e bloquear ações inválidas.
- Critérios de aceite:
  - o campo usa `type="text"`, possui label acessível e o botão de submit fica desabilitado quando o termo é inválido;
  - `onSubmit` dispara requisição somente quando o termo validado atende 2-80 caracteres Unicode com ao menos uma letra ou número;
  - o input mantém o valor após falha e o foco continua no campo após a busca;
  - o comportamento é testado em navegador com `Enter` e clique do mouse.
- Dependências: T-03, T-09
- Arquivos prováveis: `src/components/SearchForm.tsx`
- Tipo: UI
- Rastreio: FR-01, FR-03, AC-01, AC-02, NFR-02

### T-12 — Exibir estado de carregamento, vazio e erro da busca
- ID: T-12
- Título: Exibir estado de carregamento, vazio e erro da busca
- Descrição curta: Exibir feedback de estado da busca em texto visível e live region.
- Critérios de aceite:
  - em `loading`, o texto "Buscando cidades..." ou equivalente aparece visivelmente e com `role="status"`;
  - em `empty`, a interface mostra texto sem resultados e mantém o termo pesquisado;
  - em `error`, a mensagem de erro corresponde exatamente ao mapeamento: rede/timeout, HTTP 429 e demais HTTP/JSON inválido;
  - o botão de retry aparece apenas em `error` e dispara uma nova chamada sem duplicar a requisição em andamento.
- Dependências: T-09, T-10, T-11
- Arquivos prováveis: `src/components/StatusMessage.tsx`
- Tipo: UI
- Rastreio: FR-03, AC-04, NFR-04

### T-13 — Listar resultados válidos de geocodificação
- ID: T-13
- Título: Listar resultados válidos de geocodificação
- Descrição curta: Exibir os resultados vindos da API em ordem recebida.
- Critérios de aceite:
  - a listagem mostra até 10 itens e nunca mais do que 10;
  - cada item exibe `name`, `country` e `admin1` quando disponíveis, sem conteúdo HTML externo;
  - itens sem `name` ou com latitude/longitude não finitos não entram na lista;
  - cada item é acionável por mouse, toque e teclado utilizando botão ou item com `role="option"`.
- Dependências: T-09, T-11
- Arquivos prováveis: `src/components/SearchResults.tsx`
- Tipo: UI
- Rastreio: FR-02, AC-03, NFR-02

### T-14 — Exibir clima atual e status independente do bloco atual
- ID: T-14
- Título: Exibir clima atual e status independente do bloco atual
- Descrição curta: Renderizar clima atual de forma independente da previsão.
- Critérios de aceite:
  - o bloco atual entra em `success` somente quando `temperature_2m`, `weather_code` e `time` forem válidos e convertidos;
  - `apparent_temperature` é opcional e, se ausente, não dispara erro; se houver, é exibido apenas quando válido;
  - se qualquer campo obrigatório falhar, a UI mostra `Dados atuais indisponiveis` e mantém o bloco de previsão independente;
  - a hora exibida usa o timezone da cidade, não o timezone do navegador.
- Dependências: T-08, T-09
- Arquivos prováveis: `src/components/CurrentWeather.tsx`, `src/components/WeatherPanel.tsx`
- Tipo: UI
- Rastreio: FR-04, FR-07, NFR-06

### T-15 — Exibir previsão de cinco dias em ordem local
- ID: T-15
- Título: Exibir previsão de cinco dias em ordem local
- Descrição curta: Exibir a previsão de cinco dias no timezone da cidade consultada.
- Critérios de aceite:
  - a lista contém exatamente cinco itens; se houver 4 ou 6, o bloco entra em `incomplete`;
  - as datas são verificadas por ordem cronológica local e no formato `YYYY-MM-DD`;
  - a renderização usa `weatherCode` e `temperature_2m_min/max` ambos válidos; qualquer dado inválido impede sucesso parcial;
  - cada item exibe data, condição e faixa de temperatura em unidade ativa.
- Dependências: T-08, T-09, T-14
- Arquivos prováveis: `src/components/ForecastList.tsx`, `src/components/WeatherPanel.tsx`
- Tipo: UI
- Rastreio: FR-05, NFR-06

### T-16 — Implementar alternância de unidade em tempo de sessão
- ID: T-16
- Título: Implementar alternância de unidade em tempo de sessão
- Descrição curta: Adicionar o controle de unidade e converter somente na renderização.
- Critérios de aceite:
  - a unidade inicial é `celsius` e o estado é persistente apenas durante a sessão atual;
  - ao alternar para `fahrenheit`, ambos os blocos atualizam sem nova requisição;
  - a conversão usa a fórmula `F = C * 9 / 5 + 32` e os valores exibidos são arredondados para o inteiro mais próximo;
  - o controle é operável por mouse, teclado e leitor de tela.
- Dependências: T-14, T-15
- Arquivos prováveis: `src/components/UnitToggle.tsx`, `src/components/CurrentWeather.tsx`, `src/components/ForecastList.tsx`
- Tipo: UI
- Rastreio: FR-06, FR-07, NFR-01

### T-17 — Exibir atribuição da fonte e status final da tela
- ID: T-17
- Título: Exibir atribuição da fonte e status final da tela
- Descrição curta: Garantir que o estado final da tela e a atribuição do provedor estejam alinhados com a spec.
- Critérios de aceite:
  - o texto de atribuição da Open-Meteo aparece visivelmente em um link clicável;
  - o bloco de status final não mostra dados de uma consulta anterior após nova seleção ou falha;
  - o estado visual da tela permanece consistente após `loading`, `empty`, `error`, `success` e `incomplete`;
  - o texto da interface permanece em pt-BR e respeita o tema dark glassmorphism.
- Dependências: T-14, T-15, T-16
- Arquivos prováveis: `src/components/Attribution.tsx`, `src/components/WeatherPanel.tsx`
- Tipo: UI
- Rastreio: FR-08, NFR-05, NFR-06

## Entrega 5 — Integração e validação do fluxo principal

### T-18 — Implementar integração do hook com a UI de busca e resultados
- ID: T-18
- Título: Implementar integração do hook com a UI de busca e resultados
- Descrição curta: Conectar estado do hook com formulário, mensagem e listagem para o fluxo principal de pesquisa.
- Critérios de aceite:
  - ao digitar e enviar um termo válido, a listagem de resultados é atualizada a partir do hook;
  - `loading`, `empty` e `error` são refletidos na UI em tempo real;
  - seleção de resultado dispara a consulta de clima sem quebrar o estado atual;
  - o estado visual continua consistente após retry e seleção subsequente.
- Dependências: T-09, T-10, T-11, T-12, T-13
- Arquivos prováveis: `src/App.tsx`, `src/hooks/useWeatherSearch.ts`, `src/components/SearchForm.tsx`, `src/components/SearchResults.tsx`
- Tipo: UI
- Rastreio: FR-02, FR-03, FR-07, AC-03, AC-04

### T-19 — Implementar integração do clima atual e previsão na tela principal
- ID: T-19
- Título: Implementar integração do clima atual e previsão na tela principal
- Descrição curta: Conectar os blocos de clima e previsão ao estado global da aplicação.
- Critérios de aceite:
  - ao selecionar uma cidade válida, o painel atualiza clima atual e previsão em sequência;
  - `currentStatus` e `forecastStatus` são exibidos independentemente;
  - nova seleção invalida dados antigos e limpa o estado anterior antes do carregamento;
  - a unidade ativa reflete corretamente em toda a tela sem nova requisição.
- Dependências: T-14, T-15, T-16, T-17
- Arquivos prováveis: `src/App.tsx`, `src/components/WeatherPanel.tsx`, `src/hooks/useWeatherSearch.ts`
- Tipo: UI
- Rastreio: FR-04, FR-05, FR-06, FR-07, NFR-06

## Entrega 6 — Testes

### T-20 — Implementar testes unitários da conversão de unidade
- ID: T-20
- Título: Implementar testes unitários da conversão de unidade
- Descrição curta: Validar a conversão de temperatura e o arredondamento usados na exibição em Fahrenheit.
- Critérios de aceite:
  - os testes cobrem ao menos 5 casos de conversão válidos, incluindo `0°C`, `25°C`, `-10°C`, valores positivos e negativos;
  - a conversão respeita a fórmula `F = C * 9 / 5 + 32` com arredondamento para o inteiro mais próximo;
  - entradas `NaN`, `Infinity` e `undefined` são rejeitadas e testadas;
  - o arquivo de teste fica isolado da UI e do DOM, focando somente a regra de negócio.
- Dependências: T-05
- Arquivos prováveis: `tests/unit/temperature.test.ts`
- Tipo: Test
- Rastreio: FR-06, regra de conversão da spec

### T-21 — Implementar testes do service com mock de fetch
- ID: T-21
- Título: Implementar testes do service com mock de fetch
- Descrição curta: Validar o comportamento dos serviços de geocodificação e previsão usando `fetch` mockado.
- Critérios de aceite:
  - testes cobrem sucesso, timeout, HTTP 429, HTTP 500 e JSON inválido para geocodificação e previsão;
  - o mock de `fetch` valida a URL final, query string e ausência de chave de API;
  - respostas incompletas, com campos ausentes ou coordenadas inválidas são rejeitadas;
  - `AbortController` e `requestId`/concorrência são verificados em cenários de resposta antiga vs. nova.
- Dependências: T-07, T-08
- Arquivos prováveis: `tests/unit/geocodingService.test.ts`, `tests/unit/forecastService.test.ts`
- Tipo: Test
- Rastreio: FR-03, FR-04, FR-05, NFR-03, NFR-04, NFR-05

### T-22 — Implementar testes de componentes nos estados loading, erro e vazio
- ID: T-22
- Título: Implementar testes de componentes nos estados loading, erro e vazio
- Descrição curta: Validar feedback visual e acessível nos estados mais críticos da busca.
- Critérios de aceite:
  - o componente renderiza `loading`, `empty` e `error` com mensagens visíveis e `role="status"`/`role="alert"` corretamente;
  - o botão de retry só aparece em estado de erro e dispara nova tentativa sem duplicar a consulta em andamento;
  - o estado vazio mantém o termo pesquisado editável e sem dados inválidos;
  - testes cobrem casos de sucesso, falha e ausência de resultados sem depender de implementação interna.
- Dependências: T-11, T-12, T-13
- Arquivos prováveis: `tests/components/SearchForm.test.tsx`, `tests/components/SearchResults.test.tsx`
- Tipo: Test
- Rastreio: FR-03, AC-04, NFR-02, NFR-04

### T-23 — Implementar testes E2E do fluxo principal com viewport mobile
- ID: T-23
- Título: Implementar testes E2E do fluxo principal com viewport mobile
- Descrição curta: Validar o fluxo principal em navegador real, incluindo a experiência em mobile.
- Critérios de aceite:
  - um cenário E2E completo consegue buscar uma cidade, selecionar uma localidade e visualizar clima atual e previsão de 5 dias;
  - a troca de unidade é validada sem recarregar a página;
  - o mesmo fluxo é executado em viewport mobile (320px) e em desktop, sem overflow horizontal;
  - cenários de erro e vazio são validados visualmente com mensagem e estado consistente.
- Dependências: T-18, T-19, T-22
- Arquivos prováveis: `tests/e2e/weather-flow.spec.ts`, `playwright.config.ts`
- Tipo: Test
- Rastreio: FR-01 a FR-08, NFR-01, NFR-02, AC-01 a AC-05

### T-24 — Implementar testes do hook principal e do fluxo de clima
- ID: T-24
- Título: Implementar testes do hook principal e do fluxo de clima
- Descrição curta: Validar consistência de contexto e controle de concorrência.
- Critérios de aceite:
  - duas respostas em sequência, com a mais antiga chegando depois da nova, são descartadas corretamente;
  - ao selecionar uma nova cidade, o contexto antigo deixa de ser exibido e o status volta para `loading`;
  - o retry reusa o último termo válido e não dispara requisições em paralelo;
  - mudanças de unidade durante carregamento só alteram a renderização e não quebram o fluxo de dados.
- Dependências: T-09, T-14, T-15, T-16, T-19
- Arquivos prováveis: `tests/integration/useWeatherSearch.test.ts`, `tests/integration/weatherFlow.test.ts`
- Tipo: Test
- Rastreio: FR-03, FR-04, FR-05, FR-06, FR-07, AC-05

## Entrega 7 — Hardening e verificação final

### T-25 — Rodar verificação final do projeto
- ID: T-25
- Título: Rodar verificação final do projeto
- Descrição curta: Validar a integração final e a qualidade do app antes da entrega.
- Critérios de aceite:
  - `pnpm lint` executa sem erros relevantes;
  - `pnpm build` conclui com sucesso;
  - `pnpm test` executa a suíte relevante sem falhas;
  - o fluxo principal foi verificado manualmente ou via E2E sem regressão em busca, seleção, clima e unidade.
- Dependências: T-20, T-21, T-22, T-23, T-24
- Arquivos prováveis: `package.json`, `src/**`, `tests/**`
- Tipo: Infra
- Rastreio: Checklist do projeto + NFR-01 a NFR-06

## Ordenação final por implementação

1. T-01
2. T-02
3. T-03
4. T-04
5. T-05
6. T-06
7. T-07
8. T-08
9. T-09
10. T-10
11. T-11
12. T-12
13. T-13
14. T-14
15. T-15
16. T-16
17. T-17
18. T-18
19. T-19
20. T-20
21. T-21
22. T-22
23. T-23
24. T-24
25. T-25

## Observações finais

- A sequência foi ajustada para seguir a ordem de implementação recomendada: tipos → funções puras → services → hook → componentes → integração → testes → hardening.
- A estrutura agora inclui tarefas dedicadas explícitas para conversão, mock de `fetch`, componentes em estados de erro/vazio/loading e E2E com viewport mobile.
- Cada tarefa mantém dependências explícitas e critérios verificáveis, evitando misturar regra de negócio, acesso a dados e UI em um único item.

## Matriz de rastreabilidade dos requisitos funcionais

| Requisito | Tarefas que o implementam | Cobertura | Lacunas ou observações |
|---|---|---|---|
| FR-01 — Validar e pesquisar cidade | T-03, T-07, T-11, T-18, T-20, T-23 | Parcial | Faltam critérios explícitos para remover espaços nas extremidades antes do envio, garantir que digitar não dispara rede e exigir envio explícito/Enter. A mensagem orientando a correção do termo também não está atribuída a uma tarefa específica. |
| FR-02 — Exibir e selecionar resultados | T-07, T-09, T-13, T-18, T-21, T-22, T-23 | Parcial | A listagem e a seleção estão cobertas, mas faltam critérios explícitos para manter o foco no controle que iniciou a busca, anunciar resultados por `aria-live` sem mover foco e garantir uma única consulta meteorológica com coordenadas, timezone e identificador da seleção. |
| FR-03 — Estados da busca | T-07, T-09, T-10, T-12, T-18, T-21, T-22, T-24 | Completa | Os estados, loading, vazio, erro, cancelamento, descarte de respostas obsoletas e retry estão cobertos. Os testes de serviço e hook devem manter a distinção entre cancelamento esperado e erro recuperável. |
| FR-04 — Consultar clima atual | T-04, T-06, T-08, T-09, T-14, T-19, T-21, T-24 | Completa | Campos obrigatórios, condição WMO, horário local, sensação opcional, estado `incomplete` e independência da previsão estão cobertos. |
| FR-05 — Exibir previsão de cinco dias | T-04, T-06, T-08, T-09, T-15, T-19, T-21, T-24 | Completa | Cinco datas consecutivas, timezone local, temperaturas, unidade ativa e rejeição de dados incompletos estão cobertos. |
| FR-06 — Unidade de temperatura | T-05, T-14, T-15, T-16, T-19, T-20, T-23, T-24 | Completa | Unidades permitidas, Celsius no serviço, fórmula, arredondamento, sessão e troca sem nova requisição estão cobertos. |
| FR-07 — Nova consulta e consistência de contexto | T-09, T-10, T-14, T-16, T-17, T-18, T-19, T-24 | Completa | Invalidação do contexto anterior, loading, falha sem restauração silenciosa, retry e troca de unidade durante carregamento estão cobertos. |
| FR-08 — Acessibilidade e segurança de apresentação | T-11, T-12, T-13, T-16, T-17, T-22, T-23, T-25 | Parcial | Nomes acessíveis, teclado, estados visíveis e ausência de HTML externo aparecem no backlog, mas faltam critérios dedicados para foco visível, `aria-live` de sucesso sem repetição por item e validação manual completa por teclado. |

### Requisitos funcionais sem tarefa correspondente

Não há nenhum requisito funcional FR-01 a FR-08 totalmente sem tarefa correspondente. Entretanto, as seguintes partes da spec ainda precisam ser explicitadas em tarefas ou critérios de aceite para que a cobertura seja verificável:

- **FR-01:** trim do termo, ausência de debounce/requisição ao digitar, envio explícito e mensagem para entrada inválida.
- **FR-02:** preservação do foco após busca, anúncio dos novos resultados e consulta meteorológica única com timezone e identificador da seleção.
- **FR-08:** foco visível, anúncio de sucesso sem repetir cada item da previsão e validação manual de teclado.

Essas lacunas não bloqueiam a rastreabilidade dos requisitos, mas devem ser incorporadas antes da implementação das tarefas T-11, T-12, T-13, T-18 e T-25.

## Priorização e tamanho relativo

Prioridade: **P0** é necessária para o MVP funcional e para os critérios de
aceite principais; **P1** aumenta a confiabilidade, cobertura e qualidade da
entrega; **P2** é melhoria ou verificação final que pode ser feita depois do
fluxo principal estar demonstrável. Tamanho: **P** é uma alteração pequena e
isolada, **M** envolve uma unidade de trabalho com integração limitada e **G**
envolve múltiplos estados, contratos ou arquivos relevantes.

| Tarefa | Prioridade | Tamanho | Motivo resumido |
|---|---|---|---|
| T-01 | P0 | M | Base executável e shell inicial. |
| T-02 | P0 | M | Contratos necessários para todas as camadas. |
| T-03 | P0 | P | Regra pura e isolada de validação. |
| T-04 | P0 | P | Catálogo puro de códigos WMO. |
| T-05 | P0 | P | Conversão pura de temperatura. |
| T-06 | P0 | M | Validação de datas, timezone e invariantes da previsão. |
| T-07 | P0 | M | Primeiro acesso externo e estados de geocodificação. |
| T-08 | P0 | G | Contrato de previsão, normalização, timeout e dados incompletos. |
| T-09 | P0 | G | Orquestração, concorrência, seleção e estados do fluxo. |
| T-10 | P0 | M | Retry e recuperação do fluxo de busca. |
| T-11 | P0 | M | Entrada principal do usuário e acessibilidade básica. |
| T-12 | P0 | P | Feedback visual de loading, vazio e erro. |
| T-13 | P0 | M | Resultados selecionáveis e seguros para apresentação. |
| T-14 | P0 | M | Bloco de clima atual e status independente. |
| T-15 | P0 | M | Previsão de cinco dias e estado incompleto. |
| T-16 | P0 | M | Alternância de unidade exigida pelo produto. |
| T-17 | P0 | P | Atribuição Open-Meteo e limpeza de contexto visível. |
| T-18 | P0 | M | Integração visível da busca e seleção. |
| T-19 | P0 | M | Integração visível do clima e previsão. |
| T-20 | P1 | P | Regressão isolada da conversão de unidade. |
| T-21 | P1 | G | Testes de dois services, mocks de rede e falhas. |
| T-22 | P1 | M | Testes de componentes e estados críticos. |
| T-23 | P1 | G | Fluxo E2E completo, desktop, mobile, erro e vazio. |
| T-24 | P1 | G | Concorrência, retry e consistência do hook. |
| T-25 | P0 | M | Gate obrigatório de lint, build, testes e regressão. |

## Sequência de entrega em fatias verticais

As fatias abaixo priorizam um resultado que possa ser visto e exercitado ao
fim de cada etapa. A ordem interna respeita as dependências técnicas, mas
permite demonstrar valor antes de toda a cobertura de testes estar concluída.

### Fatia 0 — Shell navegável

**T-01 → T-02**

Entrega uma aplicação que inicia, renderiza o shell responsivo e já possui os
contratos de domínio para orientar o restante da implementação.

### Fatia 1 — Buscar e escolher uma cidade

**T-03 → T-07 → T-09 → T-11 → T-12 → T-13 → T-18**

Entrega o primeiro fluxo visível de produto: digitar uma cidade, enviar,
visualizar loading/vazio/erro, receber até 10 resultados e selecionar uma
localidade. Nesta fatia, T-09 e T-18 podem inicialmente expor apenas o estado
de busca; a consulta meteorológica fica desabilitada até a Fatia 2.

### Fatia 2 — Clima atual real

**T-04 → T-05 → T-06 → T-08 → T-14 → T-19**

Entrega o clima atual da cidade selecionada, com condição WMO, horário local,
tratamento de dados incompletos e dados em Celsius vindos do serviço.

### Fatia 3 — Previsão completa e unidade

**T-15 → T-16 → T-17**

Completa a experiência principal com cinco dias, alternância Celsius/Fahrenheit
sem nova requisição, atribuição da fonte e limpeza de contexto entre consultas.

### Fatia 4 — Recuperação e qualidade comportamental

**T-10 → T-20 → T-21 → T-22 → T-24**

Consolida retry, conversão, services, estados de componente e concorrência do
hook com testes focados.

### Fatia 5 — Validação de entrega

**T-23 → T-25**

Valida o fluxo completo no navegador, incluindo viewport mobile, erro, vazio,
troca de unidade, lint, build e suíte de testes.

### Ajuste recomendado no backlog

Para que a Fatia 1 seja realmente independente da previsão, a dependência de
T-09 em T-08 deve ser removida ou T-09 deve ser dividido em duas tarefas:
orquestração da busca de cidades e orquestração da consulta meteorológica. A
divisão mantém a regra de ordem do projeto e permite entregar a busca funcional
antes de implementar o contrato maior de previsão.
