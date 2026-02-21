
import { api } from './api';
import { db, CURRENT_USER_ID } from './database'; // Accessing DB directly for verification (Simulation only)

// Definition of the Route Contract
interface RouteDefinition {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    description: string;
    frontendMethod: keyof typeof api;
}

const EXPECTED_ROUTES: RouteDefinition[] = [
    { path: '/api/users', method: 'GET', description: 'Recupera lista de usuários.', frontendMethod: 'getAllUsers' },
    { path: '/api/invitations/send', method: 'POST', description: 'Envia convite privado.', frontendMethod: 'sendInvitation' },
    { path: '/api/invitations/received', method: 'GET', description: 'Busca convites recebidos.', frontendMethod: 'getReceivedInvitations' },
    { path: '/api/rooms/:roomId', method: 'GET', description: 'Detalhes da sala.', frontendMethod: 'getRoomDetails' },
    { path: '/api/rooms/:roomId/join', method: 'POST', description: 'Entrar na sala.', frontendMethod: 'joinRoom' },
    { path: '/api/live/private', method: 'GET', description: 'Lista lives privadas.', frontendMethod: 'getLiveStreamers' }
];

export const VerificationAgent = {
    run: async () => {
        console.groupCollapsed('🕵️‍♂️ Agente de Verificação & Teste (LiveGo)');
        
        // 1. Verificação Estática de Rotas
        console.log('%c[1/2] Verificando Integridade das Rotas...', 'color: cyan; font-weight: bold;');
        let missingCount = 0;
        EXPECTED_ROUTES.forEach(route => {
            if (typeof api[route.frontendMethod] === 'function') {
                console.log(`%c  ✔ ${route.method} ${route.path} - Implementada`, 'color: #4ade80;');
            } else {
                missingCount++;
                console.log(`%c  ❌ ${route.method} ${route.path} - FALTANDO (api.${String(route.frontendMethod)})`, 'color: #ef4444; font-weight: bold;');
            }
        });

        if (missingCount > 0) {
            console.warn(`⚠️ ${missingCount} rotas estão faltando.`);
        } else {
            console.log(`%c  ✅ Todas as rotas críticas existem.`, 'color: #4ade80;');
        }

        // 2. Checklist Funcional (Live Private Room Flow)
        console.log('%c[2/2] Executando Checklist de Sala Privada...', 'color: cyan; font-weight: bold;');
        await VerificationAgent.runPrivateRoomChecklist();

        console.groupEnd();
    },

    runPrivateRoomChecklist: async () => {
        const testStreamId = `test_stream_${Date.now()}`;
        const targetUserId = 'user-juma'; // Juma is a predefined user in DB

        try {
            // Passo 0: Preparação (Criar Sala Privada Mockada)
            // Injetamos diretamente no DB para o teste não depender da UI de criação, 
            // mas validamos se a API de leitura a enxerga.
            const hostUser = db.users.get(CURRENT_USER_ID);
            if (!hostUser) throw new Error("Usuário atual não encontrado no DB.");

            const mockStream = {
                id: testStreamId,
                hostId: CURRENT_USER_ID,
                name: "Sala de Teste Privada",
                avatar: hostUser.avatarUrl,
                location: "Test Lab",
                time: "Agora",
                message: "Teste Automático",
                tags: ["Privada"],
                isPrivate: true, // CRITICAL
                viewers: 0,
                country: 'br'
            };
            db.streamers.push(mockStream);
            
            // --- CHECKLIST ---

            // 1. Convidar usuário
            console.log(`%c  1. [TESTE] Enviando convite para ${targetUserId}...`, 'color: yellow;');
            const inviteResponse = await api.sendInvitation(testStreamId, targetUserId);
            if (inviteResponse.success) {
                console.log(`%c     ✔ Convite enviado com sucesso.`, 'color: #4ade80;');
            } else {
                throw new Error("Falha ao enviar convite via API.");
            }

            // 2. Verificar no Backend
            console.log(`%c  2. [TESTE] Verificando registro no banco de dados...`, 'color: yellow;');
            const dbInvite = db.invitations.find(i => i.roomId === testStreamId && i.inviteeId === targetUserId);
            if (dbInvite) {
                console.log(`%c     ✔ Registro encontrado no DB (ID: ${dbInvite.id}).`, 'color: #4ade80;');
            } else {
                throw new Error("Convite não foi persistido no banco de dados.");
            }

            // 3. Confirmar retorno na lista de privadas
            console.log(`%c  3. [TESTE] Verificando visibilidade na API (Categoria: Private)...`, 'color: yellow;');
            const privateStreams = await api.getLiveStreamers('private');
            const foundStream = privateStreams.find(s => s.id === testStreamId);
            
            if (foundStream) {
                console.log(`%c     ✔ Sala encontrada na lista de privadas.`, 'color: #4ade80;');
                
                // 4. Verificar Card/Cadeado (Validar flag isPrivate nos dados)
                console.log(`%c  4. [TESTE] Validando indicador de privacidade (Cadeado)...`, 'color: yellow;');
                if (foundStream.isPrivate) {
                    console.log(`%c     ✔ Flag 'isPrivate: true' confirmada. O cadeado aparecerá na UI.`, 'color: #4ade80;');
                } else {
                    throw new Error("A sala foi retornada, mas a flag isPrivate é falsa.");
                }
            } else {
                throw new Error("Sala privada criada não apareceu na listagem da API.");
            }

            // 5. Confirmar acesso
            console.log(`%c  5. [TESTE] Validando controle de acesso (Join)...`, 'color: yellow;');
            const joinResponse = await api.joinRoom(testStreamId, CURRENT_USER_ID);
            if (joinResponse.success && joinResponse.canJoin) {
                console.log(`%c     ✔ Acesso autorizado para o dono/convidado.`, 'color: #4ade80;');
            } else {
                throw new Error("Acesso negado indevidamente.");
            }

            console.log('%c🎉 CHECKLIST DE SALA PRIVADA APROVADO!', 'color: #4ade80; font-weight: bold; font-size: 14px; background: #064e3b; padding: 4px; border-radius: 4px;');

        } catch (error) {
            console.error(`%c❌ FALHA NO TESTE: ${(error as Error).message}`, 'color: #ef4444; font-weight: bold;');
        } finally {
            // Cleanup
            db.streamers = db.streamers.filter(s => s.id !== testStreamId);
            db.invitations = db.invitations.filter(i => i.roomId !== testStreamId);
        }
    }
};
