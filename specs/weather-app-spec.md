# Weather App - Especificacao de Produto

## 1. Objetivo e escopo

Aplicacao web responsiva para pesquisar uma cidade e consultar seu clima atual
e a previsao dos cinco dias do calendario local, sem autenticacao e sem chave
de API. A interface inicial sera em pt-BR e usara Celsius por padrao, com
alternancia para Fahrenheit.

### Incluido na primeira versao

- Busca de cidades por nome usando a geocodificacao da Open-Meteo.
- Selecao explicita de uma localidade entre os resultados.
- Clima atual: temperatura, condicao, sensacao termica quando disponivel e
  horario da medicao.
- Previsao diaria: hoje e os quatro dias seguintes, em ordem local.
- Alternancia de unidade entre Celsius e Fahrenheit durante a sessao.
- Estados de vazio, carregamento, erro, dados incompletos e nova consulta.
- Suporte a teclado, leitor de tela e telas pequenas.

### Fora de escopo

Autenticacao, contas, sincronizacao, favoritos, historico, geolocalizacao,
alertas, notificacoes, suporte offline, persistencia em servidor, aplicativos
nativos, outros idiomas e indicadores adicionais como chuva, umidade e vento;
atualizacao manual, cache de consultas concluidas, compartilhamento por URL,
analytics, telemetria, PWA, instalacao, execucao em segundo plano,
personalizacao de tema, fallback para outro provedor e otimizacao para
mecanismos de busca.

## 2. Usuarios e fluxo principal

1. O usuario informa uma cidade e envia a busca.
2. O sistema valida o termo, consulta a geocodificacao e exibe os resultados.
3. O usuario seleciona uma localidade identificada por nome, pais e regiao
   quando disponiveis.
4. O sistema consulta a previsao pelas coordenadas, timezone e identificador
   da selecao, e exibe clima atual e cinco dias no fuso horario local.
5. O usuario pode alternar a unidade ou iniciar outra busca sem recarregar a
   pagina.

O contexto ativo e a combinacao `localidade selecionada + consulta mais
recente + unidade atual`. Nenhum dado de uma localidade anterior pode ser
apresentado como pertencente a outra.

## 3. Requisitos funcionais

### FR-01 - Validar e pesquisar cidade

- O campo aceita texto livre, com espacos nas extremidades removidos antes do
  envio.
- O termo valido deve conter de 2 a 80 caracteres Unicode e pelo menos uma
  letra ou numero. Pontuacao interna, acentos, hifens e espacos sao aceitos.
- Termo vazio, menor que 2 caracteres ou sem letra/numero nao dispara rede; a
  acao de busca fica desabilitada e uma mensagem orienta a correcao.
- A busca e disparada somente por envio explicito ou tecla Enter. Digitar nao
  dispara requisicao e, portanto, nao ha debounce de busca nesta versao.
- O sistema limita a consulta a no maximo 10 resultados e nao renderiza
  entrada externa como HTML.

### FR-02 - Exibir e selecionar resultados

- Cada resultado valido exibe nome da cidade, pais e regiao/area administrativa
  quando retornados, alem de coordenadas apenas quando necessarias para
  identificar a selecao.
- Resultados sao apresentados em ordem recebida pela fonte e cada item e
  selecionavel por mouse, toque e teclado.
- Apos o envio, o foco permanece no controle que iniciou a busca; resultados
  novos sao anunciados por uma regiao `aria-live` e nao recebem foco automatico.
- Selecionar um resultado inicia uma unica consulta meteorologica para suas
  coordenadas, timezone e identificador interno da selecao.
- Resultado sem nome ou coordenadas numericas validas e descartado.

### FR-03 - Estados da busca

O estado da busca deve ser exatamente um de `idle`, `loading`, `success`,
`empty` ou `error`. A interface deve:

- mostrar carregamento durante a requisicao;
- mostrar estado vazio quando nao houver resultados;
- mostrar erro recuperavel para rede, timeout, limite ou resposta invalida;
- manter o termo pesquisado para permitir nova tentativa;
- cancelar a requisicao anterior com `AbortController`, quando possivel, e
  ignorar qualquer resposta cujo identificador seja diferente da consulta mais
  recente.
- oferecer a acao "Tentar novamente" para estados `error`, reutilizando o
  ultimo termo valido sem disparar uma segunda requisicao em paralelo.

### FR-04 - Consultar clima atual

Para a localidade selecionada, o sistema exibe temperatura atual, condicao
meteorologica derivada do codigo WMO e horario local da medicao. Esses tres
campos sao obrigatorios para o bloco ser considerado carregado com sucesso.
Sensacao termica e opcional: se ausente, e omitida. Se um campo obrigatorio
estiver ausente, invalido ou nao puder ser convertido, o bloco atual entra em
`incomplete` e exibe "Dados atuais indisponiveis"; a previsao valida pode
continuar sendo exibida separadamente. Nenhum valor e substituido por zero ou
por dado de outra consulta.

### FR-05 - Exibir previsao de cinco dias

- A lista contem exatamente cinco itens: a data local de hoje e as quatro
  datas locais seguintes, em ordem cronologica.
- Cada item exibe data, condicao WMO e temperaturas minima e maxima.
- A data de hoje e determinada pelo timezone retornado pela localidade, nao
  pelo fuso do navegador.
- Se qualquer dia necessario nao puder ser validado, a previsao entra em
  estado incompleto e nao reutiliza valores de outra data.
- A unidade exibida e a unidade ativa em todos os itens.

### FR-06 - Unidade de temperatura

- As unidades permitidas sao `celsius` e `fahrenheit`; a inicial e Celsius.
- O sistema solicita dados em Celsius e converte para Fahrenheit pela formula
  $F = C * 9 / 5 + 32$, arredondando cada valor exibido para o inteiro mais
  proximo.
- A unidade ativa e mostrada junto das temperaturas e a troca atualiza clima
  atual e previsao sem nova requisicao.
- A preferencia vale somente durante a sessao; persistencia entre acessos nao
  faz parte desta versao.

### FR-07 - Nova consulta e consistencia de contexto

- Nova busca pode ser iniciada sem recarregar a pagina.
- Ao selecionar outra cidade, o contexto anterior deixa de ser exibido como
  resultado atual; a nova consulta mostra carregamento ate ser concluida.
- Uma falha da nova consulta nao restaura silenciosamente a previsao da cidade
  anterior. O sistema exibe o erro associado a nova selecao.
- Trocar a unidade durante carregamento deve aplicar a unidade escolhida aos
  dados quando chegarem.

### FR-08 - Acessibilidade e seguranca de apresentacao

- Campo, botao, lista de resultados, item selecionavel e controle de unidade
  possuem nome acessivel e operacao completa por teclado.
- O foco visivel nunca e removido e, apos uma busca, permanece no controle que
  iniciou a busca; ele nao e movido automaticamente para os resultados.
- Carregamento, vazio, erro e sucesso sao comunicados por texto visivel e
  regiao `aria-live` sem anunciar repetidamente cada item da previsao.
- Dados da fonte sao tratados como texto; nenhum valor externo e interpretado
  como HTML, script ou atributo.

## 4. Contrato externo e regras de dados

### Geocodificacao

Usar `https://geocoding-api.open-meteo.com/v1/search` com `name`, `count=10`,
`language=pt` e `format=json`. O sistema exige em cada resultado aceito:
`name`, `latitude`, `longitude` e valores numericos finitos; `country` e
`admin1` sao opcionais.

### Previsao

Usar `https://api.open-meteo.com/v1/forecast` com `latitude`, `longitude`,
`timezone=auto`, `forecast_days=5`, `temperature_unit=celsius`,
`current=temperature_2m,apparent_temperature,weather_code,is_day` e
`daily=weather_code,temperature_2m_max,temperature_2m_min`.

O cliente deve validar status HTTP, JSON, arrays diarios de mesmo tamanho,
cinco datas consecutivas, temperaturas numericas finitas e timezone nao vazio.
Resposta invalida e erro de dominio, nunca sucesso parcial silencioso.

Codigos WMO sem mapeamento conhecido devem usar a condicao neutra
`Condicao indisponivel`, sem inventar descricao ou icone especifico.

O catalogo minimo de descricao pt-BR e: `0` ceu limpo; `1-3` parcialmente
nublado/nublado; `45,48` nevoeiro; `51-57` garoa; `61-67` chuva; `71-77`
neve; `80-82` pancadas de chuva; `85-86` pancadas de neve; `95,96,99`
tempestade. Os intervalos incluem somente os codigos WMO listados pela fonte;
qualquer outro codigo usa `Condicao indisponivel`.

## 5. Requisitos nao funcionais mensuraveis

### NFR-01 - Responsividade e compatibilidade

Sem rolagem horizontal em viewport de 320 px a 1920 px. Alvos oficiais:
ultimas duas versoes estaveis de Chrome, Edge, Firefox e Safari, em desktop e
mobile. Controles permanecem utilizaveis com zoom de 200%.

### NFR-02 - Acessibilidade

Conformidade alvo WCAG 2.2 nivel AA para os fluxos cobertos. Contraste, foco,
semantica, nomes acessiveis e anuncios de estado devem ser verificados com
testes automatizados e uma validacao manual por teclado.

### NFR-03 - Desempenho e requisicoes

O estado de carregamento deve aparecer na mesma atualizacao de interface que
inicia a requisicao. Nenhuma interacao do usuario dispara mais de uma
requisicao equivalente em andamento. Nao ha meta de latencia do provedor:
timeouts de 10 segundos para cada chamada resultam em erro recuperavel.
Consultas concluidas nao sao armazenadas nem reutilizadas; selecionar
novamente uma cidade faz nova consulta.

### NFR-04 - Resiliencia

Erros HTTP, timeout, cancelamento, JSON invalido, campos ausentes e limite de
uso devem resultar em estado controlado. A aplicacao nao deve travar nem
mostrar dados de uma consulta obsoleta.

### NFR-05 - Privacidade e seguranca

Nao coletar dados pessoais, nao exigir conta e nao persistir consultas no
servidor. A primeira versao nao usa credenciais privadas. Termos de busca nao
devem ser enviados para outro destino alem do endpoint definido.

### NFR-06 - Idioma e tempo

Textos, mensagens e nomes de condicao sao pt-BR. Datas e horas usam `pt-BR`
e o timezone da localidade consultada. A referencia exibida deve deixar claro
que se trata do horario local da cidade.

O horario atual deve ser um timestamp ISO 8601 valido retornado no campo
`current.time`; a data diaria deve obedecer ao formato `YYYY-MM-DD`. As cinco
datas devem ser distintas e consecutivas por aritmetica de calendario, sem
comparar timestamps no fuso do navegador. A sessao termina ao recarregar ou
fechar a pagina; nesse caso cidade, unidade e resultados voltam aos valores
iniciais.

Chamadas diretas ao navegador sao permitidas somente se os endpoints
retornarem CORS valido. A interface deve exibir atribuicao visivel e link para
Open-Meteo. Nenhuma credencial, proxy ou provedor alternativo sera adicionado.

Mensagens de erro devem usar este mapeamento: rede/timeout = "Nao foi
possivel conectar ao servico."; HTTP 429 = "O servico esta temporariamente
indisponivel. Tente novamente."; demais HTTP ou JSON invalido = "Nao foi
possivel carregar os dados.". O bloco de erro sempre oferece "Tentar
novamente".

## 6. Criterios de aceite

### AC-01 - Busca valida

**Dado** um termo de 2 a 80 caracteres com letra ou numero, **quando** o
usuario envia a busca, **entao** uma requisicao e iniciada, o estado vira
`loading` e o indicador de carregamento e perceptivel.

### AC-02 - Busca invalida

**Dado** termo vazio, curto ou sem letra/numero, **quando** o usuario tenta
buscar, **entao** nenhuma requisicao e feita, a acao permanece desabilitada e
uma orientacao em pt-BR e exibida.

### AC-03 - Resultados

**Dado** resposta com resultados validos, **quando** ela e renderizada,
**entao** sao exibidos no maximo 10 itens com nome e desambiguacao disponivel,
sem HTML executavel, e cada item pode ser selecionado por teclado.

### AC-04 - Vazio e erro

**Dado** zero resultados ou falha/timeout/resposta invalida, **quando** a
resposta e processada, **entao** o estado e `empty` ou `error`, a mensagem e
compreensivel, o termo permanece editavel e nenhum resultado invalido aparece.

### AC-05 - Concorrencia

**Dado** duas consultas iniciadas em sequencia, **quando** a resposta antiga
chega depois da nova, **entao** ela e descartada e nao altera resultados,
localidade ativa, clima ou previsao.

### AC-06 - Clima e previsao

**Dado** selecao valida e resposta valida, **quando** os dados sao exibidos,
**entao** a cidade ativa e identificada, o clima atual e mostrado e a lista
contem exatamente cinco datas locais consecutivas com minima, maxima e
condicao.

### AC-07 - Dados incompletos

**Dado** campo obrigatorio ausente, data nao consecutiva ou valor nao
numerico, **quando** a validacao termina, **entao** o bloco afetado informa
indisponibilidade/incompletude e nao preenche o valor com dado de outra data.

### AC-08 - Unidades

**Dado** dados carregados em Celsius, **quando** o usuario alterna entre
Celsius e Fahrenheit, **entao** todos os valores visiveis mudam sem nova
requisicao, usam a formula definida, arredondamento consistente e simbolo
correto.

### AC-09 - Nova cidade

**Dado** uma cidade previamente exibida, **quando** outra cidade e selecionada,
**entao** a previsao anterior deixa de ser apresentada como atual, o novo
bloco mostra carregamento e o resultado final pertence somente a nova cidade.

### AC-10 - Acessibilidade

**Dado** usuario navegando apenas com teclado ou leitor de tela, **quando**
interage com busca, resultados, unidade e estados, **entao** os controles sao
operaveis, o foco e visivel, cada controle tem nome acessivel e os estados sao
anunciados uma vez de forma compreensivel.

O carregamento usa `role="status"`, erros usam `role="alert"` e resultados
nao movem o foco automaticamente.

### AC-11 - Integracao

**Dado** qualquer chamada a Open-Meteo, **quando** e enviada, **entao** nao ha
login ou chave de API; quando a fonte falha, o erro e convertido em estado
seguro e compreensivel, sem expor detalhes internos ou credenciais.

## 6.1 Matriz de rastreabilidade

As historias abaixo agrupam os requisitos funcionais por fluxo de usuario. A
matriz liga cada historia aos criterios de aceite que a validam e aos
requisitos nao funcionais que devem ser considerados na implementacao e nos
testes.

| ID | User Story | Acceptance Criteria | NFRs relevantes |
| --- | --- | --- | --- |
| US-01 | Como usuario, quero pesquisar uma cidade por nome e receber feedback sobre a busca, para encontrar uma localidade valida. | AC-01, AC-02, AC-04, AC-11 | NFR-03, NFR-04, NFR-05, NFR-06 |
| US-02 | Como usuario, quero distinguir e selecionar uma cidade entre os resultados, para consultar a localidade correta. | AC-03, AC-10, AC-11 | NFR-01, NFR-02, NFR-04, NFR-05, NFR-06 |
| US-03 | Como usuario, quero ver o clima atual e a previsao de cinco dias da cidade selecionada, para entender as condicoes de hoje e planejar os proximos dias. | AC-06, AC-07, AC-11 | NFR-01, NFR-03, NFR-04, NFR-06 |
| US-04 | Como usuario, quero alternar entre Celsius e Fahrenheit, para visualizar as temperaturas na unidade que prefiro durante a sessao. | AC-08, AC-10 | NFR-01, NFR-02, NFR-03, NFR-06 |
| US-05 | Como usuario, quero iniciar uma nova busca e selecionar outra cidade sem recarregar a pagina, para trocar de contexto sem ver dados obsoletos. | AC-05, AC-09 | NFR-03, NFR-04, NFR-06 |
| US-06 | Como usuario, quero consultar o aplicativo por teclado ou leitor de tela, para realizar o fluxo completo com tecnologia assistiva. | AC-02, AC-03, AC-04, AC-10 | NFR-01, NFR-02, NFR-06 |
| US-07 | Como usuario, quero que falhas, respostas incompletas e limites do servico sejam tratados com mensagens claras, para saber como prosseguir sem perder o controle da consulta. | AC-04, AC-07, AC-11 | NFR-03, NFR-04, NFR-05, NFR-06 |

Rastreabilidade de cobertura: AC-01 a AC-11 aparecem na matriz; NFR-01 a
NFR-06 aparecem em pelo menos uma historia. Os itens que cruzam varias
historias devem ser testados no fluxo que os dispara e em testes de contrato ou
de unidade quando a regra for compartilhada.

## 7. Casos de borda obrigatorios

- Cidade homonima, resultado sem regiao ou com caracteres acentuados.
- Termo com espacos, hifen, pontuacao interna, emoji ou 81 caracteres.
- Zero resultados, muitos resultados, timeout, cancelamento e limite HTTP.
- Temperaturas negativas, zero, iguais entre minima e maxima e Fahrenheit
  arredondado perto de zero.
- Mudanca de unidade durante carregamento e alternancias repetidas.
- Virada de dia no timezone da cidade e resposta com datas fora de ordem.
- Campos ausentes, arrays com tamanhos diferentes, codigo WMO desconhecido e
  coordenadas invalidas.
- Viewport de 320 px, zoom de 200%, fonte ampliada e operacao sem mouse.

## 8. Premissas e riscos

### Premissas

- A Open-Meteo permanece acessivel sem autenticacao e fornece os campos do
  contrato acima.
- O navegador possui conexao para realizar a consulta; nao existe fallback
  offline.
- O plano tecnico definira a implementacao de estados, componentes e testes,
  sem alterar os comportamentos obrigatorios desta especificacao.

### Riscos e mitigacoes

- Indisponibilidade ou mudanca de contrato da fonte: validar esquema, timeout
  e mensagens de erro; registrar o contrato usado.
- Ambiguidade de cidade: exibir pais e regiao e exigir selecao explicita.
- Dados obsoletos por concorrencia: abortar chamadas e validar identificador
  da consulta antes de aplicar qualquer resposta.
- Interpretacao incorreta de datas: usar timezone retornado e validar cinco
  datas consecutivas.
- Falhas de acessibilidade em telas pequenas: testar viewport minimo, zoom,
  teclado, leitor de tela e contraste antes do aceite.

## 9. Definicao de pronto da especificacao

O produto atende esta especificacao quando todos os criterios AC-01 a AC-11
passam em testes automatizados ou manuais registrados, os casos de borda
obrigatorios possuem cobertura, e a matriz de navegadores de NFR-01 foi
validada para os fluxos de busca, selecao, previsao, unidade e erro.
