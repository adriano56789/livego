import express from 'express';
import { User, Streamer } from '../models';
import { getUserIdFromToken } from '../middleware/auth';
import { getIO } from '../socket';

// Estender interface Request para incluir user
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

const router = express.Router();

interface CallInvitation {
    id: string;
    hostId: string;
    hostName: string;
    guestId: string;
    guestName: string;
    roomId: string;
    streamId: string;
    status: 'pending' | 'accepted' | 'declined' | 'ended';
    createdAt: Date;
    updatedAt: Date;
}

// Armazenamento temporário de convites (em produção, usar Redis ou MongoDB)
const activeInvitations = new Map<string, CallInvitation>();

/**
 * POST /api/call-invitation/invite
 * Host convida um usuário para entrar na live via vídeo
 */
router.post('/invite', async (req, res) => {
    try {
        const hostId = getUserIdFromToken(req);
        if (!hostId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { guestId, guestName, streamId } = req.body;

        if (!guestId || !streamId) {
            return res.status(400).json({ error: 'guestId e streamId são obrigatórios' });
        }

        // Verificar se o host tem uma stream ativa
        const stream = await Streamer.findOne({ 
            id: streamId, 
            hostId, 
            isLive: true,
            streamStatus: 'active'
        });

        if (!stream) {
            return res.status(404).json({ error: 'Stream não encontrada ou não está ativa' });
        }

        // Verificar se o guest existe e é um usuário válido
        const guest = await User.findOne({ id: guestId });
        if (!guest) {
            return res.status(404).json({ error: 'Usuário convidado não encontrado' });
        }
        
        // Validação: garantir que é um ID de usuário válido (formato alfanumérico)
        if (!/^[a-zA-Z0-9_]{4,30}$/.test(guestId)) {
            return res.status(400).json({ error: 'ID de usuário inválido' });
        }

        // Verificar se já existe um convite ativo
        const existingInvitation = Array.from(activeInvitations.values())
            .find(inv => inv.hostId === hostId && inv.guestId === guestId && 
                    inv.status === 'pending' && inv.roomId === stream.roomId);

        if (existingInvitation) {
            return res.status(400).json({ error: 'Já existe um convite ativo para este usuário' });
        }

        // Criar convite
        const invitationId = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const invitation: CallInvitation = {
            id: invitationId,
            hostId,
            hostName: (req.user?.name as string) || 'Host',
            guestId,
            guestName: guestName || (guest?.name as string) || 'Convidado',
            roomId: stream.roomId as string,
            streamId: stream.roomId as string,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        activeInvitations.set(invitationId, invitation);

        // Enviar notificação via WebSocket para o guest
        const io = getIO();
        io.to(guestId).emit('call_invitation', {
            type: 'invitation_received',
            invitation: {
                id: invitation.id,
                hostId: invitation.hostId,
                hostName: invitation.hostName,
                roomId: invitation.roomId,
                streamId: invitation.streamId,
                streamTitle: stream.name,
                // Incluir informações completas do guest
                guest: {
                    id: guest.id,
                    name: guest.name,
                    avatarUrl: guest.avatarUrl || '',
                    level: guest.level || 1,
                    diamonds: guest.diamonds || 0,
                    fans: guest.fans || 0,
                    following: guest.following || 0,
                    isVIP: guest.isVIP || false,
                    isAvatarProtected: guest.isAvatarProtected || false
                }
            }
        });

        // Notificar o host que o convite foi enviado
        io.to(hostId).emit('call_invitation', {
            type: 'invitation_sent',
            invitation: {
                id: invitation.id,
                guestId: invitation.guestId,
                guestName: invitation.guestName
            }
        });

        console.log(`📞 [Call Invitation] Host ${hostId} convidou ${guestId} para a stream ${streamId}`);

        res.json({
            success: true,
            invitationId: invitation.id
        });

    } catch (error: any) {
        console.error('❌ [Call Invitation] Erro ao enviar convite:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/call-invitation/respond
 * Guest responde ao convite (aceita ou recusa)
 */
router.post('/respond', async (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { invitationId, response } = req.body; // response: 'accept' ou 'decline'

        if (!invitationId || !response) {
            return res.status(400).json({ error: 'invitationId e response são obrigatórios' });
        }

        const invitation = activeInvitations.get(invitationId);
        if (!invitation) {
            return res.status(404).json({ error: 'Convite não encontrado' });
        }

        if (invitation.guestId !== userId) {
            return res.status(403).json({ error: 'Você não pode responder a este convite' });
        }

        if (invitation.status !== 'pending') {
            return res.status(400).json({ error: 'Convite já foi respondido' });
        }

        // Atualizar status do convite
        invitation.status = response === 'accept' ? 'accepted' : 'declined';
        invitation.updatedAt = new Date();
        activeInvitations.set(invitationId, invitation);

        const io = getIO();

        if (response === 'accept') {
            // Gerar token LiveKit para o guest com permissão de publicar
            const { AccessToken } = await import('livekit-server-sdk');
            const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'APILiveGoKey2024';
            const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'APILiveGoSecret2024xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

            const guestUser = await User.findOne({ id: userId });
            const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
                identity: userId,
                name: guestUser?.name || 'Convidado',
                ttl: '6h',
            });

            at.addGrant({
                roomJoin: true,
                room: invitation.roomId,
                canPublish: true, // Guest pode publicar vídeo/áudio
                canSubscribe: true,
                canPublishData: true,
            });

            const token = await at.toJwt();
            const LIVEKIT_WS_URL = process.env.LIVEKIT_WS_URL || 'ws://72.60.249.175:7880';

            // Notificar host da aceitação
            io.to(invitation.hostId).emit('call_invitation', {
                type: 'invitation_accepted',
                invitation: {
                    id: invitation.id,
                    guestId: invitation.guestId,
                    guestName: invitation.guestName,
                    token,
                    wsUrl: LIVEKIT_WS_URL
                }
            });

            // Enviar token para o guest
            io.to(userId).emit('call_invitation', {
                type: 'call_joined',
                invitation: {
                    id: invitation.id,
                    roomId: invitation.roomId,
                    token,
                    wsUrl: LIVEKIT_WS_URL
                }
            });

            console.log(`✅ [Call Invitation] ${userId} aceitou o convite para a stream ${invitation.streamId}`);

        } else {
            // Notificar host da recusa
            io.to(invitation.hostId).emit('call_invitation', {
                type: 'invitation_declined',
                invitation: {
                    id: invitation.id,
                    guestId: invitation.guestId,
                    guestName: invitation.guestName
                }
            });

            console.log(`❌ [Call Invitation] ${userId} recusou o convite para a stream ${invitation.streamId}`);
        }

        res.json({
            success: true,
            status: invitation.status
        });

    } catch (error: any) {
        console.error('❌ [Call Invitation] Erro ao responder convite:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/call-invitation/end
 * Host ou guest encerra a chamada
 */
router.post('/end', async (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { invitationId } = req.body;

        if (!invitationId) {
            return res.status(400).json({ error: 'invitationId é obrigatório' });
        }

        const invitation = activeInvitations.get(invitationId);
        if (!invitation) {
            return res.status(404).json({ error: 'Convite não encontrado' });
        }

        if (invitation.hostId !== userId && invitation.guestId !== userId) {
            return res.status(403).json({ error: 'Você não pode encerrar esta chamada' });
        }

        // Marcar chamada como encerrada
        invitation.status = 'ended';
        invitation.updatedAt = new Date();
        activeInvitations.set(invitationId, invitation);

        // Notificar ambos os participantes
        const io = getIO();
        io.to(invitation.hostId).emit('call_invitation', {
            type: 'call_ended',
            invitation: {
                id: invitation.id,
                endedBy: userId
            }
        });

        io.to(invitation.guestId).emit('call_invitation', {
            type: 'call_ended',
            invitation: {
                id: invitation.id,
                endedBy: userId
            }
        });

        console.log(`📞 [Call Invitation] Chamada ${invitationId} encerrada por ${userId}`);

        res.json({
            success: true
        });

    } catch (error: any) {
        console.error('❌ [Call Invitation] Erro ao encerrar chamada:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/call-invitation/active/:userId
 * Listar convites ativos de um usuário
 */
router.get('/active/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const userInvitations = Array.from(activeInvitations.values())
            .filter(inv => (inv.hostId === userId || inv.guestId === userId) && 
                          inv.status === 'pending');

        res.json({
            success: true,
            invitations: userInvitations
        });

    } catch (error: any) {
        console.error('❌ [Call Invitation] Erro ao listar convites:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
