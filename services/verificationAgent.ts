
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
        let missingCount = 0;
        EXPECTED_ROUTES.forEach(route => {
            if (typeof api[route.frontendMethod] === 'function') {
            } else {
                missingCount++;
            }
        });

        if (missingCount > 0) {
        } else {
        }

        // 2. Checklist Funcional (Live Private Room Flow)
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
            const inviteResponse = await api.sendInvitation(testStreamId, targetUserId);
            if (inviteResponse.success) {
            } else {
                throw new Error("Falha ao enviar convite via API.");
            }

            // 2. Verificar no Backend
            const dbInvite = db.invitations.find(i => i.roomId === testStreamId && i.inviteeId === targetUserId);
            if (dbInvite) {
            } else {
                throw new Error("Convite não foi persistido no banco de dados.");
            }

            // 3. Confirmar retorno na lista de privadas
            const privateStreams = await api.getLiveStreamers('private');
            const foundStream = privateStreams.find(s => s.id === testStreamId);
            
            if (foundStream) {
                
                // 4. Verificar Card/Cadeado (Validar flag isPrivate nos dados)
                if (foundStream.isPrivate) {
                } else {
                    throw new Error("A sala foi retornada, mas a flag isPrivate é falsa.");
                }
            } else {
                throw new Error("Sala privada criada não apareceu na listagem da API.");
            }

            // 5. Confirmar acesso
            const joinResponse = await api.joinRoom(testStreamId, CURRENT_USER_ID);
            if (joinResponse.success && joinResponse.canJoin) {
            } else {
                throw new Error("Acesso negado indevidamente.");
            }


        } catch (error) {
        } finally {
            // Cleanup
            db.streamers = db.streamers.filter(s => s.id !== testStreamId);
            db.invitations = db.invitations.filter(i => i.roomId !== testStreamId);
        }
    }
};
