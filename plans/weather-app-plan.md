# Weather App - Plano Tecnico

Este plano deriva exclusivamente de `specs/weather-app-spec.md`. Ele define
responsabilidades, contratos e decisoes de implementacao para a primeira
versao, sem implementar componentes ou servicos finais.

## Architecture

A aplicacao sera uma SPA React pequena, organizada em quatro camadas:

- **Apresentacao:** componentes responsaveis por formulario, resultados de
  geocodificacao, clima atual, previsao, unidade e estados acessiveis.
- **Orquestracao:** um hook ou controlador de tela coordena busca, selecao,
  previsao, unidade e identificadores de consulta. Ele nao conhece detalhes de
  renderizacao da API.
- **Domínio:** funcoes puras para validar termos, validar respostas, mapear
  codigos WMO, validar cinco datas consecutivas, converter temperaturas e
  formatar datas/horas.
- **Infraestrutura:** clientes HTTP separados para geocodificacao e previsao,
  com timeout, `AbortSignal`, verificacao de HTTP/JSON e adaptacao para os
  tipos de dominio.

O fluxo principal sera unidirecional: entrada do usuario -> orquestrador ->
servico -> validacao/adaptacao -> estado -> componentes. Nao sera usado
roteamento, backend, store global ou cache, pois nenhum e necessario para o
escopo.

## Tech Stack

- TypeScript strict, compilado por Vite.
- React e React DOM para a SPA.
- Tailwind CSS para o tema dark glassmorphism e responsividade.
- `fetch` nativo com `AbortController` e `AbortSignal`.
- Vitest + Testing Library para unidade e componentes.
- Playwright para fluxos E2E e viewports oficiais.
- Biome para lint e formatacao.
- Open-Meteo sem chave de API.

As dependencias existentes sao suficientes. Nao adicionar biblioteca de estado,
cliente HTTP, schema validator ou biblioteca de icones sem uma necessidade
concreta descoberta durante a implementacao.

## Project Structure

A estrutura proposta e:

```text
src/
  App.tsx
  main.tsx
  components/
    SearchForm.tsx
    SearchResults.tsx
    WeatherPanel.tsx
    CurrentWeather.tsx
    ForecastList.tsx
    UnitToggle.tsx
    StatusMessage.tsx
    Attribution.tsx
  hooks/
    useWeatherSearch.ts
  services/
    geocodingService.ts
    forecastService.ts
  types/
    weather.ts
    api.ts
  utils/
    validation.ts
    weatherCodes.ts
    temperature.ts
    dates.ts

tests/
  unit/
  components/
  e2e/
```

Os nomes sao uma orientacao de ownership, nao uma exigencia de criar todos os
arquivos de uma vez. Tipos compartilhados ficam em `types/`; acesso externo fica
em `services/`; regras puras ficam em `utils/` para serem testadas sem DOM.

## Data Model

O modelo de dominio deve separar resposta externa, dado normalizado e estado
visual. Os contratos abaixo sao a referencia; implementacao concreta pode usar
aliases e tipos auxiliares equivalentes.

```ts
type Unit = 'celsius' | 'fahrenheit'
type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error'
type WeatherBlockStatus = 'idle' | 'loading' | 'success' | 'incomplete' | 'error'

interface City {
  id: number // Identificador da cidade na geocodificacao.
  name: string // Nome retornado pela geocodificacao.
  country: string // Pais retornado pela geocodificacao.
  admin1?: string // Regiao ou area administrativa, quando disponivel.
  latitude: number // Latitude usada na consulta de previsao.
  longitude: number // Longitude usada na consulta de previsao.
  timezone: string // Fuso da cidade, usado para datas e horarios locais.
}

interface CurrentWeather {
  temperatureCelsius: number // current.temperature_2m, sempre recebido em Celsius.
  apparentTemperatureCelsius?: number // current.apparent_temperature, quando disponivel.
  weatherCode: number // current.weather_code, interpretado pelo catalogo WMO.
  condition: string // Descricao pt-BR derivada de weatherCode.
  measuredAt: string // current.time, timestamp ISO 8601 da medicao.
  isDay?: boolean // current.is_day, quando retornado pela API.
}

interface ForecastDay {
  date: string // daily.time, no formato YYYY-MM-DD e no fuso da cidade.
  weatherCode: number // daily.weather_code, interpretado pelo catalogo WMO.
  condition: string // Descricao pt-BR derivada de weatherCode.
  minCelsius: number // daily.temperature_2m_min, solicitado em Celsius.
  maxCelsius: number // daily.temperature_2m_max, solicitado em Celsius.
}

interface WeatherData {
  city: City // Cidade selecionada e contexto da consulta.
  current: CurrentWeather | null // Clima atual normalizado, se completo.
  forecast: ForecastDay[] // Cinco dias locais validados e consecutivos.
  currentStatus: WeatherBlockStatus // Estado independente do bloco atual.
  forecastStatus: WeatherBlockStatus // Estado independente da previsao.
}

type SearchResult = Omit<City, 'timezone'> & { timezone?: string }

type SearchState = {
  status: SearchStatus
  term: string
  results: SearchResult[]
  errorMessage?: string
  requestId: number
}

type WeatherState = {
  status: WeatherBlockStatus
  selectedLocation: City | null
  data: WeatherData | null
  errorMessage?: string
  requestId: number
}
```

Decisoes importantes:

- A unidade ativa fica no estado da tela e inicia como `celsius`; os dados
  normalizados permanecem sempre em Celsius.
- Um resultado de geocodificacao so entra no dominio se tiver nome e
  coordenadas numericas finitas. Pais e regiao sao opcionais para exibicao.
- O bloco atual pode ser `incomplete` independentemente da previsao. A
  previsao, por sua vez, so e sucesso com exatamente cinco dias validos.
- Nenhum campo ausente sera preenchido com zero, valor anterior ou valor de
  outra localidade.

## Data Flow

1. O usuario digita no formulario. O termo e aparado apenas no envio; a
   validacao exige 2-80 caracteres Unicode e ao menos uma letra ou numero.
2. Termo invalido nao chama a rede e mantem a busca desabilitada com orientacao
   em pt-BR.
3. Envio valido incrementa `requestId`, muda a busca para `loading`, cria
   `AbortController` e chama geocodificacao com limite de 10 resultados.
4. O cliente valida e normaliza a resposta. Resultado antigo, cancelado ou com
   `requestId` diferente e descartado.
5. O sucesso mostra no maximo dez resultados em ordem recebida. O foco permanece
   no controle que iniciou a busca; uma regiao `aria-live` anuncia o estado.
6. A selecao de uma localidade substitui imediatamente o contexto ativo,
   limpa a previsao anterior, incrementa outro identificador e inicia uma unica
   consulta de previsao.
7. O cliente solicita Celsius, timezone automatico, dados atuais e cinco dias.
   A resposta e validada antes de ser normalizada; a consulta obsoleta nao pode
   atualizar estado.
8. A apresentacao deriva a unidade ativa, arredonda cada temperatura exibida e
   atualiza todos os blocos sem nova requisicao.
9. Nova busca reutiliza o formulario e o termo continua editavel. Repetir uma
   tentativa usa o ultimo termo valido sem permitir duas requisicoes equivalentes
   em andamento.

A troca de unidade durante carregamento altera somente o estado de unidade; os
valores que chegarem serao formatados com a unidade vigente naquele momento.

## External APIs

### Geocodificacao

**URL:** `https://geocoding-api.open-meteo.com/v1/search`

**Parametros:**

- `name`: termo aparado;
- `count=10`;
- `language=pt`;
- `format=json`.

**Exemplo resumido de resposta:**

```json
{
  "results": [
    {
      "id": 3451190,
      "name": "Sao Paulo",
      "latitude": -23.55,
      "longitude": -46.63,
      "timezone": "America/Sao_Paulo",
      "country": "Brasil",
      "admin1": "Sao Paulo"
    }
  ],
  "generationtime_ms": 0.2
}
```

**Mapeamento:** para cada item, `id`, `name`, `country`, `admin1`, `latitude`,
`longitude` e `timezone` formam um `City`. `country` e `admin1` podem ser
omitidos quando a fonte nao os retornar, mas `name`, coordenadas finitas e
timezone necessario para a previsao devem ser validados antes da selecao.
Resultados sem nome ou coordenadas validas sao descartados; `results` ausente
ou vazio produz o estado `empty`. A resposta e limitada a dez itens e os
demais campos da fonte nao entram no modelo.

### Previsao

**URL:** `https://api.open-meteo.com/v1/forecast`

**Parametros:**

- `latitude`, `longitude` e `timezone=auto`;
- `forecast_days=5` e `temperature_unit=celsius`;
- `current=temperature_2m,apparent_temperature,weather_code,is_day`;
- `daily=weather_code,temperature_2m_max,temperature_2m_min`.

**Exemplo resumido de resposta:**

```json
{
  "timezone": "America/Sao_Paulo",
  "current": {
    "time": "2026-09-16T14:00",
    "temperature_2m": 22.4,
    "apparent_temperature": 22.1,
    "weather_code": 1,
    "is_day": 1
  },
  "daily": {
    "time": ["2026-09-16", "2026-09-17", "2026-09-18", "2026-09-19", "2026-09-20"],
    "weather_code": [1, 3, 61, 2, 0],
    "temperature_2m_max": [27.0, 25.0, 21.0, 24.0, 26.0],
    "temperature_2m_min": [17.0, 16.0, 15.0, 14.0, 16.0]
  }
}
```

**Mapeamento:** `timezone` confirma ou atualiza o fuso da `City`. Os campos
`current.temperature_2m`, `current.apparent_temperature`,
`current.weather_code`, `current.time` e `current.is_day` formam
`CurrentWeather`; `condition` e derivada do codigo WMO em pt-BR, e os valores
de temperatura permanecem em Celsius. Cada indice dos arrays `daily` forma um
`ForecastDay`: `time` vira `date`, `weather_code` vira `weatherCode`, e os
arrays minimo/maximo viram `minCelsius`/`maxCelsius`; `condition` tambem e
derivada do codigo. O conjunto normalizado forma `WeatherData` com a `City`, o
clima atual e exatamente cinco `ForecastDay`.

O contrato de infraestrutura valida status HTTP, JSON, timezone nao vazio,
timestamp ISO valido, arrays diarios de mesmo tamanho, cinco datas distintas e
consecutivas e temperaturas numericas finitas. A ordem recebida deve resultar
em ordem cronologica local validada, sem usar o timezone do navegador.

O mapeamento WMO sera uma funcao pura e fechada aos codigos listados na spec.
Codigos desconhecidos produzem `Condicao indisponivel`, sem icone ou descricao
inventada. Nenhuma resposta externa sera inserida como HTML.

## State Management

O estado sera local ao componente raiz ou encapsulado em `useWeatherSearch`.
Um unico controlador deve manter:

- termo atual e ultimo termo valido;
- `SearchState` e `WeatherState`;
- localidade selecionada;
- unidade ativa;
- `AbortController` da busca corrente e identificadores monotonicamente
  crescentes para busca e previsao.

Transicoes permitidas devem ser explicitas: `idle -> loading -> success | empty
| error` para busca; `idle -> loading -> success | incomplete | error` para o
bloco atual; e `idle -> loading -> success | incomplete | error` para a
previsao. Os dois blocos sao independentes: um pode ficar `incomplete` sem
impedir que o outro continue em `success`, e a nova selecao de cidade deve
invalidar visualmente o contexto anterior antes da resposta nova. Selecionar nova
cidade invalida visualmente dados antigos antes da requisicao nova. Nao
armazenar resultados concluidos, localStorage ou estado persistente.

A unidade nao altera o status de rede e nao aciona efeitos de requisicao. A
renderizacao calcula simbolo, conversao e arredondamento a partir dos valores
em Celsius.

## Error Handling

Todos os erros externos devem ser convertidos em um erro de dominio sem expor
detalhes internos:

- rede, timeout ou falha de conexao: `Nao foi possivel conectar ao servico.`;
- HTTP 429: `O servico esta temporariamente indisponivel. Tente novamente.`;
- demais HTTP, JSON invalido ou resposta fora do contrato: `Nao foi possivel
  carregar os dados.`.

Timeouts de 10 segundos usam `AbortController`. Cancelamentos intencionais nao
aparecem como erro se a consulta ja tiver sido substituida. Ainda assim, toda
resposta deve conferir seu identificador antes de qualquer mutacao de estado.

Erro de geocodificacao produz estado `error` recuperavel e preserva o termo.
Erro de previsao substitui o contexto meteorologico da nova selecao por erro,
sem restaurar silenciosamente a cidade anterior. Resposta parcial nao vira
sucesso parcial: o bloco atual pode ser `incomplete`, enquanto a previsao valida
continua visivel, conforme a spec.

A UI usa `role="status"` para carregamento, `role="alert"` para erros e texto
visivel para vazio, sucesso e dados incompletos. O foco nao e movido
automaticamente e a acao de tentativa novamente reutiliza o ultimo termo sem
paralelismo.

## Testing Strategy

A estrategia segue os criterios AC-01 a AC-11 e cobre tambem os casos de borda:

- **Unidade:** validacao de termo; normalizacao e descarte de resultados;
  mapeamento WMO; conversao Fahrenheit e arredondamento; validacao de ISO,
  timezone, arrays e cinco datas consecutivas; formatacao pt-BR.
- **Servicos:** `fetch` mockado para sucesso, HTTP 429, outros HTTP, timeout,
  JSON invalido, campos ausentes, coordenadas invalidas e abortamento. Verificar
  query string completa e ausencia de chave.
- **Componentes:** formulario e teclado, botao desabilitado, live region,
  selecao de resultados, estados `loading/empty/error`, `role` esperado,
  unidade sem nova requisicao e dados incompletos independentes entre blocos.
- **Integracao do controlador:** duas respostas fora de ordem, nova cidade sem
  vazamento do contexto anterior, retry sem duplicacao, troca de unidade durante
  carregamento e preservacao do termo.
- **E2E Playwright:** fluxo de busca-selecao-previsao, nova consulta, falhas
  simuladas e operacao por teclado em 320 px e zoom ampliado. Validar ausencia
  de rolagem horizontal e foco visivel.
- **Manual:** contraste, leitor de tela, teclado completo e matriz das ultimas
  duas versoes estaveis de Chrome, Edge, Firefox e Safari onde o ambiente
  permitir.

Checklist de confirmacao antes do aceite: `pnpm lint`, `pnpm build` e `pnpm
test`. O fluxo E2E com `pnpm test:e2e` deve ser executado como validacao
complementar quando houver a alteracao de UI ou do fluxo principal, mas nao como
substituto do checklist minimo definido nas instrucoes do projeto.

## Risks & Trade-offs

- **Dependencia de contrato externo:** Open-Meteo pode ficar indisponivel ou
  alterar campos. Mitigacao: adaptadores pequenos, validacao rigorosa,
  timeout e testes de contrato mockados. Nao adicionar fallback, conforme o
  escopo.
- **Ambiguidade de localidade:** um nome pode retornar cidades homonimas.
  Mitigacao: selecao explicita e exibicao de pais/regiao quando disponiveis.
- **Concorrencia:** respostas antigas podem chegar depois das novas.
  Mitigacao: abortamento best-effort mais `requestId` verificado antes de cada
  aplicacao de resposta.
- **Datas e virada de dia:** o timezone do navegador pode produzir uma data
  errada. Mitigacao: usar datas retornadas pelo provedor, timezone da localidade
  e validacao por aritmetica de calendario.
- **Acessibilidade em estados dinamicos:** live regions podem anunciar demais
  ou mover foco indevidamente. Mitigacao: anunciar apenas transicoes de estado,
  manter foco no originador e testar teclado/leitor de tela.
- **Simplicidade versus reutilizacao:** estado local e funcoes puras reduzem
  dependencias e complexidade, mas nao oferecem cache ou compartilhamento entre
  paginas. Esse trade-off e intencional porque cache, persistencia e rotas
  estao fora do escopo.
- **Dados atuais parcialmente validos:** separar os status atual e previsao
  permite exibir uma previsao valida sem mascarar um campo atual ausente, ao
  custo de uma UI com estados independentes.
