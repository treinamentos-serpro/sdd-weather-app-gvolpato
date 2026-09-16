## Contexto

A empresa precisa de uma aplicação de previsão do tempo que permita aos usuários consultar as condições meteorológicas de uma cidade de forma rápida e compreensível. O produto deve atender tanto consultas pontuais sobre o clima atual quanto o planejamento dos próximos dias, com suporte a diferentes unidades de temperatura e uso em dispositivos móveis.

### Objetivo de negócio

Disponibilizar uma experiência simples e acessível para consulta de informações meteorológicas, reduzindo o esforço necessário para localizar uma cidade e interpretar sua previsão.

### Usuários e necessidades

- Usuários que desejam verificar rapidamente as condições atuais de uma cidade.
- Usuários que precisam planejar atividades com base na previsão dos próximos cinco dias.
- Usuários de diferentes regiões que preferem Celsius ou Fahrenheit.
- Usuários que acessam o serviço principalmente por smartphones e tablets.

## Requisitos Funcionais

### Busca de cidades

- O sistema deve permitir que o usuário pesquise uma cidade por nome.
- O sistema deve apresentar resultados compatíveis com o termo pesquisado para que o usuário selecione a cidade desejada.
- O sistema deve permitir distinguir cidades homônimas por informações complementares, como país e região, quando disponíveis.
- O sistema deve informar quando não houver resultados para a busca.
- O sistema deve informar o usuário quando a busca falhar por indisponibilidade do serviço ou outro erro técnico recuperável.

### Clima atual

- O sistema deve exibir o clima atual da cidade selecionada.
- O sistema deve exibir, no mínimo, temperatura, condição meteorológica e indicação de sensação térmica, quando esses dados estiverem disponíveis.
- O sistema deve exibir o horário ou a referência temporal da medição/atualização dos dados.
- O sistema deve indicar claramente a cidade e a unidade de temperatura em uso.
- O sistema deve apresentar estado de carregamento enquanto os dados são obtidos.
- O sistema deve apresentar uma mensagem compreensível quando os dados atuais não puderem ser carregados.

### Previsão de cinco dias

- O sistema deve exibir a previsão meteorológica para os cinco dias seguintes à consulta.
- Para cada dia, o sistema deve exibir a data, a condição meteorológica e as temperaturas mínima e máxima, quando disponíveis.
- A previsão deve estar associada à cidade selecionada e à unidade de temperatura ativa.
- O sistema deve informar quando a previsão estiver indisponível ou incompleta.

### Unidade de temperatura

- O sistema deve permitir alternar entre Celsius e Fahrenheit.
- O sistema deve atualizar o clima atual e a previsão de cinco dias após a troca de unidade.
- O sistema deve identificar visualmente a unidade atualmente selecionada.
- O sistema deve preservar a preferência de unidade durante a sessão e, se aprovado, entre acessos futuros no mesmo dispositivo.

### Navegação e acessibilidade

- O usuário deve conseguir iniciar uma nova busca sem precisar recarregar a aplicação.
- Os controles principais devem ser operáveis por teclado e compatíveis com tecnologias assistivas.
- O sistema deve comunicar estados de carregamento, ausência de resultados e erros de maneira perceptível.

## Requisitos Não-Funcionais

### Usabilidade e responsividade

- A interface deve ser responsiva e utilizável em smartphones, tablets e desktops.
- O conteúdo principal deve permanecer legível e os controles devem ser acionáveis em telas pequenas, sem rolagem horizontal.
- A aplicação deve priorizar uma consulta rápida, com hierarquia visual clara entre clima atual e previsão.

### Desempenho

- A busca e a consulta meteorológica devem fornecer feedback visual imediato enquanto aguardam resposta.
- A aplicação deve evitar requisições desnecessárias ao alternar entre estados já carregados, quando tecnicamente viável.
- O tempo máximo aceitável para exibir dados depende da fonte meteorológica e deve ser definido durante o planejamento técnico.

### Disponibilidade e resiliência

- Falhas na fonte de dados não devem deixar a interface sem explicação ou em estado indefinido.
- A aplicação deve tratar respostas incompletas, cidades não encontradas, indisponibilidade de rede e limites de requisição.
- O sistema deve evitar exibir dados de uma cidade anterior como se fossem referentes à nova cidade selecionada.

### Segurança e privacidade

- A aplicação não deve exigir dados pessoais para realizar uma consulta básica.
- Entradas de busca devem ser tratadas com segurança antes de serem enviadas à fonte de dados ou exibidas na interface.
- Chaves ou credenciais de serviços externos, caso existam, não devem ser expostas no cliente.

### Compatibilidade e acessibilidade

- A aplicação deve funcionar nas versões recentes dos principais navegadores móveis e desktop suportados pela empresa.
- A interface deve seguir boas práticas de acessibilidade, incluindo contraste adequado, foco visível, textos alternativos quando aplicável e marcação semântica.

## Riscos

- A fonte de dados meteorológicos pode apresentar indisponibilidade, latência, limites de uso ou mudanças de contrato.
- Nomes de cidades podem ser ambíguos, levando o usuário a selecionar uma localidade incorreta.
- Dados meteorológicos podem estar desatualizados, incompletos ou variar em precisão conforme a região.
- Uma conexão móvel instável pode interromper a busca ou o carregamento da previsão.
- A conversão entre Celsius e Fahrenheit pode gerar arredondamentos inconsistentes ou confusos.
- O layout pode perder legibilidade em telas muito pequenas ou com configurações de acessibilidade ampliadas.
- A ausência de uma estratégia definida para cache pode aumentar latência, consumo de dados e volume de requisições.
- Dependência de geolocalização, caso venha a ser adicionada, introduziria requisitos de permissão e privacidade não previstos no briefing.

## Decisões

### Fonte de dados: Open-Meteo

Será utilizada a Open-Meteo como fonte de dados meteorológicos, sem necessidade de chave de API. Essa escolha reduz a complexidade de configuração e evita expor credenciais no cliente. Resolve a pergunta sobre qual fonte será utilizada e elimina, para a primeira versão, a necessidade de definir custos e gerenciamento de chaves de API.

### Período da previsão: hoje + quatro dias

Os cinco dias da previsão incluem o dia atual e os quatro dias subsequentes. Essa definição torna explícito o período exibido e resolve a pergunta sobre se o dia atual faz parte da previsão de cinco dias.

### Unidade padrão: Celsius

Celsius será a unidade exibida por padrão, mantendo a possibilidade de alternância para Fahrenheit conforme os requisitos funcionais. Essa escolha estabelece um comportamento inicial consistente e resolve a definição da unidade padrão; a decisão sobre persistir a preferência entre sessões permanece em aberto.

### Autenticação e persistência de servidor

A aplicação não exigirá autenticação e não manterá dados em um servidor. Isso reduz barreiras para a consulta básica e o escopo de privacidade e infraestrutura da primeira versão. Resolve a necessidade de conta para uso do produto e a possibilidade de persistência de dados no servidor; não impede uma eventual persistência local da preferência de unidade, caso ela seja aprovada.

### Idioma da interface: pt-BR

A interface será apresentada inicialmente em português do Brasil. Essa escolha orienta textos, mensagens, formatos e acessibilidade da primeira versão e resolve a pergunta sobre o suporte inicial a múltiplos idiomas.

## Perguntas em Aberto

- A busca deve aceitar apenas nomes de cidades ou também país, estado, código postal e coordenadas?
- Como o sistema deve tratar cidades com o mesmo nome? Quais informações de desambiguação serão exibidas?
- Quais dados devem ser exibidos além de temperatura e condição meteorológica, como precipitação, umidade, vento e sensação térmica?
- Com que frequência os dados devem ser atualizados e o usuário poderá atualizar manualmente?
- A preferência de unidade deve ser persistida entre sessões e, em caso afirmativo, somente no dispositivo ou também em uma conta?
- Haverá suporte a localização automática do usuário ou favoritos de cidades?
- Quais navegadores, versões de sistema operacional e tamanhos de tela serão oficialmente suportados?
- Quais metas de desempenho e disponibilidade serão usadas para validar a primeira versão?
- Como devem ser apresentadas as datas e os horários: no fuso da cidade consultada ou no fuso do usuário?
- Existe requisito de funcionamento parcial sem conexão, como exibir a última consulta armazenada?
- Quais métricas indicarão que a aplicação atende ao objetivo de negócio, como tempo até a primeira consulta ou taxa de buscas concluídas?

## Suposições

- A primeira versão será uma aplicação web responsiva, acessível por navegador, sem necessidade de instalação nativa.
- O usuário selecionará explicitamente uma cidade nos resultados da busca antes de visualizar a previsão.
- A fonte de dados fornecerá informações suficientes para o clima atual e uma previsão diária de cinco dias.
- Celsius e Fahrenheit serão as únicas unidades de temperatura necessárias na primeira versão.
- A consulta básica não exigirá autenticação nem cadastro.
- O idioma inicial da interface será português do Brasil.
- A aplicação dependerá de conexão com a internet para obter dados atualizados.
- Datas e horários serão apresentados de forma consistente e terão uma regra de fuso definida no detalhamento da especificação.
- Não haverá, nesta etapa, alertas meteorológicos, histórico, favoritos, geolocalização automática ou notificações push, salvo decisão posterior.
- Requisitos de desempenho, disponibilidade, retenção de dados e suporte de navegadores serão refinados antes da implementação.
