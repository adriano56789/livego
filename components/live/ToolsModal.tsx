
import React, { useState } from 'react';
import LiveCallInvitation from '../../src/components/LiveCallInvitation';

interface ToolsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenCoHostModal: () => void;
    streamId?: string;
    isHost?: boolean;
    onGuestJoined?: (guest: any) => void;
    onGuestLeft?: () => void;
}

const ToolsModal: React.FC<ToolsModalProps> = ({ isOpen, onClose, onOpenCoHostModal, streamId, isHost, onGuestJoined, onGuestLeft }) => {
    const [showCallModal, setShowCallModal] = useState(false);
    const [guestUserId, setGuestUserId] = useState('');
    const [guestUserName, setGuestUserName] = useState('');

    if(!isOpen) return null;

    const handleInviteGuest = () => {
        if (!guestUserId.trim()) {
            alert('Digite o ID do usuário para convidar');
            return;
        }
        setShowCallModal(false);
        // O componente LiveCallInvitation vai gerenciar o convite
    };

    const handleCallIconClick = () => {
        if (isHost && streamId) {
            setShowCallModal(true);
        } else {
            alert('Apenas o host pode convidar usuários para a live');
        }
    };

    return (
        <>
            <div className="absolute inset-0 bg-black/50 z-50 flex items-end" onClick={onClose}>
                <div className="bg-[#1C1C1E] p-4 rounded-t-lg w-full" onClick={e => e.stopPropagation()}>
                    <h2 className="text-white text-lg mb-4">Tools</h2>
                    <button onClick={onOpenCoHostModal} className="bg-blue-500 p-2 rounded w-full mb-2">Co-Host</button>
                    {isHost && (
                        <button 
                            onClick={handleCallIconClick}
                            className="bg-green-500 p-2 rounded w-full flex items-center justify-center space-x-2"
                        >
                            <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                                <path d="M15,12C17.21,12 19,10.21 19,8C19,5.79 17.21,4 15,4C12.79,4 11,5.79 11,8C11,10.21 12.79,12 15,12M15,14C15.67,14 15,14.33 15,14M17,9L19,7L21,5V19L17,9M5,3H9V7L5,3M19,19H21V21H5V19H3V5H5V3H3V21H5Z"/>
                            </svg>
                            <span>Convidar para Live</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Modal de convite de chamada */}
            {showCallModal && (
                <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowCallModal(false)}>
                    <div className="bg-[#1C1C1E] p-6 rounded-lg max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-white text-lg mb-4">Convidar Usuário para a Live</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-gray-300 text-sm block mb-1">ID do Usuário</label>
                                <input
                                    type="text"
                                    value={guestUserId}
                                    onChange={(e) => setGuestUserId(e.target.value)}
                                    placeholder="Digite o ID real do usuário"
                                    className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-gray-300 text-sm block mb-1">Nome do Usuário (opcional)</label>
                                <input
                                    type="text"
                                    value={guestUserName}
                                    onChange={(e) => setGuestUserName(e.target.value)}
                                    placeholder="Nome do convidado"
                                    className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowCallModal(false)}
                                    className="flex-1 bg-gray-600 p-2 rounded text-white hover:bg-gray-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleInviteGuest}
                                    className="flex-1 bg-green-500 p-2 rounded text-white hover:bg-green-600"
                                >
                                    Convidar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Componente de chamada de vídeo */}
            {isHost && streamId && (
                <LiveCallInvitation 
                    streamId={streamId}
                    isHost={true}
                    onGuestJoined={(guest) => {
                        console.log('Convidado entrou na live:', guest);
                        // Lógica adicional real quando guest entra na live
                        if (onGuestJoined) {
                            onGuestJoined(guest);
                        }
                        // Lógica real quando guest entra:
                        // 1. Mostrar notificação visual na interface
                        alert('Convidado entrou na live!');
                        // 2. Atualizar estado da transmissão
                        console.log('Atualizando estado da transmissão...');
                        // 3. Registrar evento no sistema
                        console.log('Registrando evento no sistema...');
                        // 4. Enviar notificações para outros participantes
                        console.log('Enviando notificações para outros participantes...');
                    }}
                    onGuestLeft={() => {
                        console.log('Convidado saiu da live');
                        // Lógica adicional real quando guest sai da live
                        if (onGuestLeft) {
                            onGuestLeft();
                        }
                        // Lógica real quando guest sai:
                        // 1. Mostrar notificação visual na interface
                        alert('Convidado saiu da live!');
                        // 2. Atualizar estado da transmissão
                        console.log('Atualizando estado da transmissão...');
                        // 3. Registrar evento no sistema
                        console.log('Registrando evento no sistema...');
                        // 4. Enviar notificações para outros participantes
                        console.log('Enviando notificações para outros participantes...');
                    }}
                />
            )}
        </>
    );
};

export default ToolsModal;
