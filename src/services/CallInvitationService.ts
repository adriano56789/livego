import { io, Socket } from 'socket.io-client';
import { getUserIdFromToken } from '../utils/auth';

export interface CallInvitation {
  id: string;
  hostId: string;
  hostName: string;
  guestId?: string;
  guestName?: string;
  roomId: string;
  streamId: string;
  streamTitle?: string;
  token?: string;
  wsUrl?: string;
}

export interface CallInvitationEvent {
  type: 'invitation_received' | 'invitation_sent' | 'invitation_accepted' | 'invitation_declined' | 'call_joined' | 'call_ended';
  invitation: CallInvitation;
}

class CallInvitationService {
  private socket: Socket | null = null;
  private currentCall: CallInvitation | null = null;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.socket = io('https://livego.store', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Entrar na sala do usuário para receber convites
    const userId = getUserIdFromToken();
    if (userId) {
      this.socket.emit('join_user_room', userId);
    }

    // Listener para convites de chamada
    this.socket.on('call_invitation', (event: CallInvitationEvent) => {
      this.handleCallInvitation(event);
    });

    // Listener para conexão
    this.socket.on('connect', () => {
      console.log('📞 Conectado ao serviço de convites');
      const userId = getUserIdFromToken();
      if (userId) {
        this.socket?.emit('join_user_room', userId);
      }
    });

    // Listener para desconexão
    this.socket.on('disconnect', () => {
      console.log('📞 Desconectado do serviço de convites');
    });
  }

  private handleCallInvitation(event: CallInvitationEvent) {
    console.log('📞 Evento de chamada:', event);

    // Atualizar estado atual da chamada
    switch (event.type) {
      case 'invitation_received':
        this.currentCall = event.invitation;
        break;
      case 'invitation_accepted':
        if (event.invitation.token) {
          this.currentCall = event.invitation;
          this.connectToLiveKit(event.invitation);
        }
        break;
      case 'call_ended':
        this.currentCall = null;
        this.disconnectFromLiveKit();
        break;
    }

    // Notificar listeners
    this.notifyListeners('callInvitation', event);
  }

  // Convidar usuário para entrar na live
  async inviteGuest(guestId: string, guestName: string, streamId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'Token não encontrado' };
      }

      const response = await fetch('https://livego.store/api/call-invitation/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          guestId,
          guestName,
          streamId
        })
      });

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Erro ao convidar usuário:', error);
      return { success: false, error: error.message };
    }
  }

  // Responder a um convite
  async respondToInvitation(invitationId: string, response: 'accept' | 'decline'): Promise<{ success: boolean; error?: string }> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'Token não encontrado' };
      }

      const apiResponse = await fetch('https://livego.store/api/call-invitation/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          invitationId,
          response
        })
      });

      const data = await apiResponse.json();
      return data;
    } catch (error: any) {
      console.error('Erro ao responder convite:', error);
      return { success: false, error: error.message };
    }
  }

  // Encerrar chamada
  async endCall(invitationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: 'Token não encontrado' };
      }

      const response = await fetch('https://livego.store/api/call-invitation/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          invitationId
        })
      });

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Erro ao encerrar chamada:', error);
      return { success: false, error: error.message };
    }
  }

  // Conectar ao LiveKit quando o convite é aceito
  private async connectToLiveKit(invitation: CallInvitation) {
    try {
      if (!invitation.token || !invitation.wsUrl) {
        console.error('Token ou WS URL não encontrados no convite');
        return;
      }

      // Importar e usar LiveKit
      const { Room } = await import('livekit-client');
      
      const room = new Room();
      
      await room.connect(invitation.wsUrl, invitation.token);
      
      console.log('📞 Conectado à sala LiveKit:', invitation.roomId);
      
      // Notificar que está conectado
      this.notifyListeners('connected', { room, invitation });
      
    } catch (error: any) {
      console.error('Erro ao conectar ao LiveKit:', error);
      this.notifyListeners('error', { error: error.message });
    }
  }

  // Desconectar do LiveKit
  private disconnectFromLiveKit() {
    // Implementar desconexão do LiveKit
    console.log('📞 Desconectado do LiveKit');
    this.notifyListeners('disconnected', {});
  }

  // Adicionar listener para eventos
  addListener(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  // Remover listener
  removeListener(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Notificar todos os listeners de um evento
  private notifyListeners(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Obter chamada atual
  getCurrentCall(): CallInvitation | null {
    return this.currentCall;
  }

  // Verificar se está em chamada
  isInCall(): boolean {
    return this.currentCall !== null;
  }

  // Limpar recursos
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentCall = null;
    this.listeners.clear();
  }
}

// Singleton
export const callInvitationService = new CallInvitationService();
export default callInvitationService;
