# Diagnóstico Completo e Plano de Implementação – App LiveGo

**Autor**: Manus AI
**Data**: 17 de Março de 2026

## 1. Introdução

Este documento apresenta uma análise completa da aplicação **LiveGo**, detalhando a arquitetura existente, os fluxos de dados e as funcionalidades principais, conforme as diretrizes fornecidas. Com base neste diagnóstico, é proposto um plano de implementação estruturado para executar as melhorias e correções necessárias, garantindo que o sistema opere de forma robusta, síncrona e com os dados provenientes exclusivamente do banco de dados como fonte da verdade.

## 2. Diagnóstico da Arquitetura e Fluxos Atuais

A análise do código-fonte revelou uma arquitetura baseada em React (Vite) no front-end, Node.js (Express) no back-end, e MongoDB como banco de dados. A funcionalidade de streaming de vídeo é gerenciada por um servidor SRS (Simple Realtime Server), com WebRTC para comunicação em tempo real, e um servidor CoTURN para auxiliar na negociação de conexões (STUN/TURN).

### 2.1. Fluxo de Diamantes e Sincronização de Dados

O fluxo de envio de presentes, que é a base para a economia de diamantes do aplicativo, foi analisado em detalhe.

| Componente | Ação | Lógica e Observações |
| :--- | :--- | :--- |
| **Front-end** (`StreamRoom.tsx`) | O usuário clica para enviar um presente. | A função `handleSendGift` é chamada, realizando uma atualização otimista da UI (exibe o presente na tela) e enviando o evento via WebSocket. Em paralelo, chama a API `api.sendGift`. |
| **API Front-end** (`api.ts`) | A chamada `api.sendGift` é mapeada para a rota do back-end. | A rota acionada é `POST /api/streams/:streamId/gift`. |
| **Back-end** (`liveRoutes.ts`) | A rota `POST /api/streams/:id/gift` processa a transação. | A lógica é robusta: debita os diamantes do remetente, incrementa `enviados` do remetente, e incrementa `receptores` e `earnings` do destinatário. As atualizações são atômicas (`$inc`), o que previne condições de corrida. Uma `GiftTransaction` é registrada para auditoria. |
| **WebSocket** (`server.ts`) | O back-end emite eventos (`earnings_updated`). | O front-end (`App.tsx`) escuta esses eventos para atualizar o estado global do usuário (contexto React), como `currentUser.earnings`. |

**Diagnóstico Principal**: O ponto central de falha na sincronização não está no back-end, que manipula os dados corretamente, mas sim no **gerenciamento de estado do front-end**. A aplicação depende excessivamente de estado local (useState) e contexto React que nem sempre é inicializado ou atualizado a partir da API. A regra de "*todos os dados devem vir da API, nunca de estado temporário*" não é seguida estritamente, causando inconsistências entre o que o usuário vê e o que está no banco de dados.

### 2.2. Ranking, Modal Online e Contador de Moedas

Estes três componentes devem exibir dados consistentes e sincronizados.

- **Ranking (`ContributionRankingModal.tsx` e `metadataRoutes.ts`):** A API busca corretamente as transações de presentes (`GiftTransaction`) e as agrega por período (diário, semanal, mensal). O ranking "Ao Vivo" é derivado dos dados da sessão de stream atual. A lógica do back-end é sólida.
- **Modal Online (`OnlineUser.tsx` e `StreamRoom.tsx`):** A lista de usuários online é preenchida por uma busca inicial na API (`api.getOnlineUsers`) e depois mantida por eventos WebSocket (`user_joined_stream`, `user_left_stream`).
- **Contador de Moedas na Live (`StreamRoom.tsx`):** O contador (`liveSession.coins`) é atualizado em tempo real quando um presente é recebido via WebSocket. No entanto, a análise do arquivo `RESUMO-CORRECOES-CONTADOR-LIVE.md` e do código atual em `App.tsx` mostra que a inicialização desse contador (`startLiveSession`) ainda usa dados locais ou zerados, em vez de buscar o valor acumulado real do `Streamer` no banco de dados.

**Diagnóstico Principal**: A falta de sincronia decorre do mesmo problema de gerenciamento de estado. O ranking, o contador e o modal online dependem de diferentes pedaços de estado no front-end que não são atualizados a partir de uma única fonte da verdade (a API). Por exemplo, foi identificada uma inconsistência de tipo onde o estado `rankingData` em `App.tsx` é um objeto, mas o componente `StreamRoom` espera um array, o que pode causar falhas silenciosas na passagem de dados.

### 2.3. Módulos de Live Stream (Local e Exibição)

O sistema de streaming está dividido em duas partes principais, conforme solicitado.

- **Módulo de Obtenção Local (`GoLiveScreen.tsx` e `webrtcService.ts`):** O fluxo para iniciar uma transmissão (publicar) está bem configurado. Ele utiliza `navigator.mediaDevices.getUserMedia` para acessar a câmera, e o `webrtcService` negocia a conexão com o servidor SRS através do back-end, que atua como um proxy de sinalização. As configurações de STUN/TURN estão presentes e são carregadas a partir de variáveis de ambiente, o que é uma boa prática.
- **Módulo de Exibição ao Vivo (`StreamRoom.tsx` e `webrtcService.ts`):** O fluxo para assistir a uma transmissão (reproduzir) também está correto. O `webrtcService` inicia a reprodução (`startPlay`) a partir da URL do WebRTC, e o vídeo é renderizado no elemento `<video>`. A infraestrutura com SRS e CoTURN está funcional.

**Diagnóstico Principal**: A infraestrutura de streaming está funcional e corretamente implementada, tanto para publicação quanto para consumo. A análise não revelou falhas críticas na configuração do WebRTC, STUN/TURN ou SRS. O `docker-compose.yml` confirma a orquestração desses serviços.

### 2.4. Regras de Saque e Taxas

O fluxo de saque de ganhos foi validado e está em conformidade com os requisitos.

- **Cálculo e Taxa (`walletRoutes.ts`):** A rota `POST /api/wallet/withdraw/:userId` contém a lógica principal. Ela verifica o saldo, subtrai o valor do `earnings` do usuário, e calcula a taxa de 20% sobre o valor convertido em BRL.
- **Carteira de ADM (`walletRoutes.ts`):** A taxa de 20% é corretamente creditada na conta do administrador (identificada pelo e-mail `adrianomdk5@gmail.com`), incrementando o campo `platformEarnings`.
- **Método de Saque (`ConfigureWithdrawalMethodScreen.tsx`):** O usuário pode salvar seu e-mail ou chave PIX. A informação é salva no campo `withdrawal_method` do modelo `User` no banco de dados através da rota `POST /api/wallet/earnings/method/set/:id`.

**Diagnóstico Principal**: O fluxo de saque no back-end está correto e seguro. As regras de negócio (taxa de 20%, transferência para ADM) estão implementadas conforme especificado. O front-end reflete adequadamente as etapas, desde a configuração do método até a solicitação do saque.

## 3. Plano de Implementação

Com base no diagnóstico, o plano a seguir foca em refatorar o front-end para garantir a consistência dos dados, seguido pela implementação das novas funcionalidades e testes completos.

| Fase | Título | Descrição Detalhada das Ações |
| :--- | :--- | :--- |
| **4** | **Refatoração do Gerenciamento de Estado e Sincronização de Diamantes** | - **Objetivo**: Garantir que os contadores de diamantes `enviados` e `receptores` no perfil do usuário reflitam sempre os dados do banco de dados.<br>- **Ação 1**: Modificar os componentes de perfil (`ProfileScreen.tsx`, `BroadcasterProfileScreen.tsx`) para que, ao serem montados, sempre realizem uma chamada à API (`api.getUser`) para buscar os dados mais recentes do usuário, em vez de confiar no estado de `currentUser` do contexto.<br>- **Ação 2**: Implementar uma estratégia de invalidação de cache ou re-fetch. Após uma ação crítica (como enviar um presente), o estado do `currentUser` deve ser atualizado com a resposta da API `sendGift`, que já retorna `updatedSender` e `updatedReceiver`. |
| **5** | **Sincronização do Ranking, Modal Online e Contador de Moedas** | - **Objetivo**: Unificar a fonte de dados para os três componentes.<br>- **Ação 1**: Corrigir a inicialização do contador de moedas na live. A função `startLiveSession` em `App.tsx` será modificada para chamar a API `api.getLiveDetails(streamer.id)` e usar o campo `streamer.diamonds` retornado para iniciar o `liveSession.coins`.<br>- **Ação 2**: Resolver a inconsistência de tipo do `rankingData`. O estado em `App.tsx` será mantido como um array (`RankedUser[]`) e a lógica de busca será ajustada para popular este array com o ranking "Ao Vivo" quando o usuário entrar em uma stream.<br>- **Ação 3**: Garantir que o `OnlineUser.tsx` sempre busque a lista de usuários da API ao ser aberto, complementando a atualização via WebSocket. |
| **6** | **Validação e Teste do Módulo de Live Stream** | - **Objetivo**: Assegurar que a infraestrutura de streaming funcione em um ambiente real.<br>- **Ação 1**: Executar o ambiente localmente com `docker-compose up` para subir os serviços (SRS, CoTURN, MongoDB).<br>- **Ação 2**: Iniciar o back-end e o front-end. Realizar um teste de ponta a ponta: um usuário inicia uma transmissão (`GoLiveScreen`) e outro usuário assiste a essa transmissão (`StreamRoom`), validando que o vídeo aparece corretamente. |
| **7** | **Validação e Teste do Fluxo de Saque** | - **Objetivo**: Confirmar que as regras de saque e taxas estão funcionando perfeitamente.<br>- **Ação 1**: Como usuário, acumular `earnings` recebendo presentes.<br>- **Ação 2**: Acessar a tela de ganhos, configurar um método de saque (PIX).<br>- **Ação 3**: Realizar um saque. Validar no banco de dados que: 1) O `earnings` do usuário diminuiu. 2) O `platformEarnings` da conta ADM aumentou em 20% do valor do saque. |
| **8** | **Testes Finais e Entrega** | - **Objetivo**: Realizar uma bateria de testes de regressão e garantir que todas as alterações estão prontas para produção.<br>- **Ação 1**: Testar todos os fluxos principais novamente: login, envio de presente, visualização de ranking, início e visualização de live, e saque.<br>- **Ação 2**: Adicionar todas as alterações ao controle de versão (`git add .`), criar um commit descritivo (`git commit -m "Implementa sincronização de dados e validação de fluxos"`) e subir as alterações para o repositório (`git push`). |

## 4. Conclusão

A aplicação LiveGo possui uma base de back-end e infraestrutura sólidas. O principal desafio reside na disciplina de gerenciamento de estado do front-end. Ao aplicar rigorosamente o princípio de que a API é a única fonte da verdade e refatorar os componentes para buscar dados frescos, a maioria das inconsistências de sincronização será resolvida. O plano de implementação proposto aborda esses pontos de forma estruturada, garantindo que os requisitos sejam atendidos de maneira eficaz e com alta qualidade.
