import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import callInvitationService, { CallInvitation } from '../services/CallInvitationService';

interface LiveCallInvitationProps {
  streamId: string;
  isHost: boolean;
  onGuestJoined?: (guest: CallInvitation) => void;
  onGuestLeft?: () => void;
}

const CallButton = styled.button<{ $active?: boolean }>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${props => props.$active ? '#ff4444' : '#4CAF50'};
  border: 3px solid white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
  }

  svg {
    width: 24px;
    height: 24px;
    fill: white;
  }
`;

const InvitationModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const InvitationContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`;

const CallerInfo = styled.div`
  margin-bottom: 24px;
  
  h3 {
    margin: 0 0 8px 0;
    color: #333;
    font-size: 24px;
  }
  
  p {
    margin: 0;
    color: #666;
    font-size: 16px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
`;

const ActionButton = styled.button<{ $variant?: 'accept' | 'decline' | 'end' }>`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  ${props => {
    switch (props.$variant) {
      case 'accept':
        return `
          background: #4CAF50;
          color: white;
          &:hover { background: #45a049; }
        `;
      case 'decline':
        return `
          background: #f44336;
          color: white;
          &:hover { background: #da190b; }
        `;
      case 'end':
        return `
          background: #ff9800;
          color: white;
          &:hover { background: #e68900; }
        `;
      default:
        return `
          background: #2196F3;
          color: white;
          &:hover { background: #1976D2; }
        `;
    }
  }}
`;

const GuestVideo = styled.div`
  position: fixed;
  bottom: 100px;
  right: 20px;
  width: 200px;
  height: 150px;
  background: #000;
  border-radius: 8px;
  border: 2px solid white;
  overflow: hidden;
  z-index: 999;
  
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const GuestInfo = styled.div`
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
`;

const LiveCallInvitation: React.FC<LiveCallInvitationProps> = ({ 
  streamId, 
  isHost, 
  onGuestJoined, 
  onGuestLeft 
}) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [incomingInvitation, setIncomingInvitation] = useState<CallInvitation | null>(null);
  const [currentCall, setCurrentCall] = useState<CallInvitation | null>(null);
  const [guestUserId, setGuestUserId] = useState('');
  const [guestUserName, setGuestUserName] = useState('');
  const [isInCall, setIsInCall] = useState(false);

  useEffect(() => {
    // Configurar listeners do serviço de convites
    callInvitationService.addListener('callInvitation', handleCallInvitation);
    callInvitationService.addListener('connected', handleConnected);
    callInvitationService.addListener('disconnected', handleDisconnected);
    callInvitationService.addListener('error', handleError);

    // Verificar se já está em chamada
    const existingCall = callInvitationService.getCurrentCall();
    if (existingCall) {
      setCurrentCall(existingCall);
      setIsInCall(true);
    }

    return () => {
      callInvitationService.removeListener('callInvitation', handleCallInvitation);
      callInvitationService.removeListener('connected', handleConnected);
      callInvitationService.removeListener('disconnected', handleDisconnected);
      callInvitationService.removeListener('error', handleError);
    };
  }, []);

  const handleCallInvitation = (event: any) => {
    console.log('Evento de chamada recebido:', event);

    switch (event.type) {
      case 'invitation_received':
        setIncomingInvitation(event.invitation);
        setShowIncomingModal(true);
        break;
      case 'invitation_accepted':
        setCurrentCall(event.invitation);
        setIsInCall(true);
        setShowInviteModal(false);
        onGuestJoined?.(event.invitation);
        break;
      case 'invitation_declined':
        alert('O usuário recusou o convite para entrar na live');
        setShowInviteModal(false);
        break;
      case 'call_ended':
        setCurrentCall(null);
        setIsInCall(false);
        onGuestLeft?.();
        break;
    }
  };

  const handleConnected = (data: any) => {
    console.log('Conectado à chamada:', data);
  };

  const handleDisconnected = () => {
    console.log('Desconectado da chamada');
    setCurrentCall(null);
    setIsInCall(false);
    onGuestLeft?.();
  };

  const handleError = (error: any) => {
    console.error('Erro na chamada:', error);
    alert(`Erro na chamada: ${error.error}`);
  };

  const handleInviteClick = () => {
    if (isHost) {
      setShowInviteModal(true);
    }
  };

  const handleSendInvitation = async () => {
    if (!guestUserId.trim()) {
      alert('Digite o ID do usuário para convidar');
      return;
    }

    const result = await callInvitationService.inviteGuest(
      guestUserId.trim(),
      guestUserName.trim() || 'Convidado',
      streamId
    );

    if (result.success) {
      setShowInviteModal(false);
      setGuestUserId('');
      setGuestUserName('');
      alert('Convite enviado com sucesso!');
    } else {
      alert(`Erro ao enviar convite: ${result.error}`);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!incomingInvitation) return;

    const result = await callInvitationService.respondToInvitation(
      incomingInvitation.id,
      'accept'
    );

    if (result.success) {
      setShowIncomingModal(false);
      setIncomingInvitation(null);
      setIsInCall(true);
      setCurrentCall(incomingInvitation);
    } else {
      alert(`Erro ao aceitar convite: ${result.error}`);
    }
  };

  const handleDeclineInvitation = async () => {
    if (!incomingInvitation) return;

    const result = await callInvitationService.respondToInvitation(
      incomingInvitation.id,
      'decline'
    );

    if (result.success) {
      setShowIncomingModal(false);
      setIncomingInvitation(null);
    } else {
      alert(`Erro ao recusar convite: ${result.error}`);
    }
  };

  const handleEndCall = async () => {
    if (!currentCall) return;

    const result = await callInvitationService.endCall(currentCall.id);
    if (result.success) {
      setCurrentCall(null);
      setIsInCall(false);
    } else {
      alert(`Erro ao encerrar chamada: ${result.error}`);
    }
  };

  return (
    <>
      {/* Botão de chamada para o host */}
      {isHost && (
        <CallButton 
          onClick={handleInviteClick}
          $active={isInCall}
          title={isInCall ? "Encerrar chamada" : "Convidar para a live"}
        >
          {isInCall ? (
            <svg viewBox="0 0 24 24">
              <path d="M12,9C10.89,9 10,9.89 10,11V17L7,14V17H5V14L2,17V7L5,10V7H7V10L10,7V11C10,9.89 10.89,9 12,9M16.5,9C15.67,9 15,9.67 15,10.5C15,11.33 15.67,12 16.5,12C17.33,12 18,11.33 18,10.5C18,9.67 17.33,9 16.5,9M21,6.5L19,8.5L19,11.5L21,13.5L21,6.5Z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24">
              <path d="M15,12C17.21,12 19,10.21 19,8C19,5.79 17.21,4 15,4C12.79,4 11,5.79 11,8C11,10.21 12.79,12 15,12M15,14C12.33,14 4,15.34 4,18V20H20V18C20,15.34 17.67,14 15,14Z"/>
            </svg>
          )}
        </CallButton>
      )}

      {/* Botão para encerrar chamada quando está ativa */}
      {isInCall && currentCall && (
        <CallButton 
          onClick={handleEndCall}
          $active={true}
          style={{ bottom: '90px', right: '20px', background: '#ff9800' }}
          title="Encerrar chamada"
        >
          <svg viewBox="0 0 24 24">
            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
          </svg>
        </CallButton>
      )}

      {/* Modal para convidar usuário */}
      {showInviteModal && (
        <InvitationModal>
          <InvitationContent>
            <h3>Convidar para a Live</h3>
            <p>Digite o ID do usuário que você quer convidar para entrar na transmissão:</p>
            
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="ID do Usuário"
                value={guestUserId}
                onChange={(e) => setGuestUserId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  marginBottom: '12px'
                }}
              />
              <input
                type="text"
                placeholder="Nome do Usuário (opcional)"
                value={guestUserName}
                onChange={(e) => setGuestUserName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
              />
            </div>
            
            <ButtonGroup>
              <ActionButton onClick={() => setShowInviteModal(false)}>
                Cancelar
              </ActionButton>
              <ActionButton $variant="accept" onClick={handleSendInvitation}>
                Enviar Convite
              </ActionButton>
            </ButtonGroup>
          </InvitationContent>
        </InvitationModal>
      )}

      {/* Modal para convite recebido */}
      {showIncomingModal && incomingInvitation && (
        <InvitationModal>
          <InvitationContent>
            <CallerInfo>
              <h3>Chamada Recebida</h3>
              <p>{incomingInvitation.hostName} está te convidando para entrar na live "{incomingInvitation.streamTitle}"</p>
            </CallerInfo>
            
            <ButtonGroup>
              <ActionButton $variant="decline" onClick={handleDeclineInvitation}>
                Recusar
              </ActionButton>
              <ActionButton $variant="accept" onClick={handleAcceptInvitation}>
                Aceitar
              </ActionButton>
            </ButtonGroup>
          </InvitationContent>
        </InvitationModal>
      )}

      {/* Vídeo do convidado quando está em chamada */}
      {isInCall && currentCall && (
        <GuestVideo>
          <video 
            id={`guest-video-${currentCall.guestId}`}
            autoPlay 
            playsInline
            muted={false}
          />
          <GuestInfo>
            {currentCall.guestName || currentCall.guestId}
          </GuestInfo>
        </GuestVideo>
      )}
    </>
  );
};

export default LiveCallInvitation;
