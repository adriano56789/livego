# Diagnóstico do Servidor de Live - LiveGo

Após analisar os arquivos do projeto, identifiquei os seguintes pontos que impedem a live de funcionar "de verdade":

## 1. Inconsistência de Protocolos e URLs
*   **Frontend (`webrtcService.ts`):** Usa `webrtc://` como protocolo base, mas o navegador não entende esse protocolo nativamente. Ele deve ser convertido para `https` ou `wss` dependendo de como o SRS está exposto.
*   **Frontend (`GoLiveScreen.tsx`):** Tenta usar `wss://72.60.249.175:8000/live`, o que é mais correto para produção, mas diverge do fallback do service.
*   **Backend (`liveRoutes.ts`):** Retorna `wss://livego.store:8000/live/ID`, mas o proxy interno tenta falar com `http://localhost:1985`.

## 2. Configuração do SRS (`srs.conf`)
*   O campo `candidate` está com um placeholder `[your_public_ip]`. Isso impede que o WebRTC estabeleça a conexão (ICE failure) fora da rede local.
*   A porta `8000` está configurada para UDP, mas o frontend tenta acessar via `wss` (TCP). O SRS precisa de um proxy reverso (Nginx) para suportar WSS na porta 8000 ou usar a porta 8080/rtc.

## 3. Variáveis de Ambiente
*   O arquivo `.env.production` na raiz aponta para `webrtc://72.60.249.175/live`, que é um formato que o SRS usa internamente, mas não o navegador.
*   O backend `.env` aponta para `localhost`, o que funciona dentro do Docker, mas as URLs de retorno para o cliente precisam ser o IP público ou domínio.

## 4. Docker Compose
*   O `srs-server` está tentando montar `./srs-config`, mas o arquivo na raiz chama-se `srs.conf`.
*   As variáveis de ambiente do TURN no `docker-compose.yml` (`adriano123`) divergem do `turnserver.conf` (`livego123secret`).

---
**Próximos Passos:**
1. Ajustar `srs.conf` com o IP público correto.
2. Padronizar as URLs de WebRTC para usar o proxy do backend ou acesso direto via WSS.
3. Corrigir o mapeamento de volumes no Docker.
