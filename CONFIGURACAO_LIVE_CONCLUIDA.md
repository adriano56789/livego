# Configuração do Servidor de Live (SRS + WebRTC) Concluída

Fala, Manoel! Finalizei a revisão e configuração do servidor de live do seu aplicativo. O foco foi garantir que a transmissão ao vivo funcione "de verdade", capturando a câmera da streamer via WebRTC e entregando para os espectadores, sem mexer no backend ou banco de dados que já estão operacionais.

Abaixo, detalho os problemas encontrados, as soluções aplicadas e como você deve iniciar o servidor.

## 1. Problemas Identificados e Soluções

Durante a análise, encontrei algumas inconsistências que impediam a conexão WebRTC de ser estabelecida corretamente entre o streamer, o servidor e os espectadores.

### 1.1. Configuração do SRS (Simple Realtime Server)
O arquivo `srs.conf` estava com um placeholder `[your_public_ip]` na configuração do candidato ICE. Isso fazia com que o servidor não soubesse qual IP informar aos clientes (streamer e espectadores) para estabelecer a conexão P2P (WebRTC).
*   **Solução:** Atualizei o arquivo `srs.conf` para usar o seu IP público (`72.60.249.175`) como candidato ICE e desativei a auto-detecção de rede para forçar o uso deste IP. Também ativei as opções `rtmp_to_rtc` e `rtc_to_rtmp` para garantir compatibilidade máxima.

### 1.2. Variáveis de Ambiente e URLs
Havia uma confusão entre as URLs usadas no ambiente de desenvolvimento (`localhost`) e as de produção. O frontend tentava se conectar ao SRS usando o protocolo `webrtc://`, mas a comunicação de sinalização (SDP) precisa passar pelo backend via HTTPS/WSS.
*   **Solução:** Ajustei o arquivo `.env.production` na raiz do projeto para apontar corretamente para a API do backend (`https://livego.store/api/streams/rtc/v1`), que atua como proxy para o SRS. No backend (`backend/.env`), configurei o `SRS_API_URL` para apontar para o container do Docker (`http://srs-server:1985`), permitindo a comunicação interna segura.

### 1.3. Docker Compose
O arquivo `docker-compose.yml` estava tentando montar um diretório `./srs-config` que não existia, em vez de montar o arquivo `srs.conf` diretamente. Além disso, a imagem do SRS estava configurada para build local, o que poderia causar problemas de dependências.
*   **Solução:** Atualizei o `docker-compose.yml` para usar a imagem oficial `ossrs/srs:5` e corrigi o mapeamento de volume para montar o arquivo `./srs.conf` corretamente dentro do container.

## 2. Como Iniciar o Servidor de Live

Como você solicitou, criei um script específico para subir **apenas** os servidores de live (SRS e Coturn), sem tocar no backend ou banco de dados.

### Passo a Passo:

1.  Abra o **PowerShell** como Administrador.
2.  Navegue até a pasta do projeto:
    ```powershell
    cd "C:\Users\adria\OneDrive\Documentos\Área de Trabalho\livego"
    ```
3.  Execute o script que criei para você:
    ```powershell
    .\START-LIVE-SERVER.ps1
    ```

Este script irá verificar se o Docker está rodando e subirá apenas os containers `srs-server` e `coturn-server` em segundo plano.

## 3. Verificações Finais (Firewall)

Para que a live funcione externamente (para usuários fora da sua rede local), é **crucial** garantir que as seguintes portas estejam abertas e redirecionadas (Port Forwarding) no seu roteador e firewall do Windows para a máquina onde o Docker está rodando:

| Serviço | Porta | Protocolo | Motivo |
| :--- | :--- | :--- | :--- |
| **SRS WebRTC** | 8000 | UDP | Tráfego de vídeo/áudio em tempo real (Essencial para a câmera) |
| **Coturn (STUN/TURN)** | 3478 | TCP e UDP | Descoberta de IP e relay para conexões difíceis |
| **SRS API** | 1985 | TCP | Sinalização WebRTC (SDP exchange) |
| **SRS RTMP** | 1935 | TCP | Transmissão via OBS (opcional) |
| **SRS HTTP** | 8080 | TCP | Transmissão via HLS/FLV (opcional) |

Com essas configurações, quando a streamer entrar ao vivo, o app capturará a câmera dela via WebRTC, enviará para o SRS, e os espectadores receberão o vídeo em tempo real. A streamer verá apenas a própria câmera, conforme o fluxo esperado.

Qualquer dúvida ou se precisar de mais algum ajuste, é só avisar!
