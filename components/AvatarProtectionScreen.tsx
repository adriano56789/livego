import React, { useState } from 'react';
import type { User } from '../types';
import * as authService from '../services/authService';
import * as liveStreamService from '../services/liveStreamService';
import { useApiViewer } from './ApiContext';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ToggleSwitch from './ToggleSwitch';
import ShieldCheckIcon from './icons/ShieldCheckIcon';

interface AvatarProtectionScreenProps {
  user: User;
  onExit: () => void;
  onSave: (user: User) => void;
}

const AvatarProtectionScreen: React.FC<AvatarProtectionScreenProps> = ({ user, onExit, onSave }) => {
    const [isProtected, setIsProtected] = useState(user.is_avatar_protected || false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showApiResponse } = useApiViewer();

    const handleSave = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            if (isProtected) {
                if (!user.avatar_url) {
                    setError("Você precisa de uma foto de perfil para ativar a proteção.");
                    setIsSubmitting(false);
                    return;
                }

                // Step 1: Check if another user has protected this image.
                const { inUse, protectedBy } = await authService.checkAvatarInUse(user.avatar_url);
                showApiResponse('POST /api/avatar/protection/check', { inUse, protectedBy });

                if (inUse && protectedBy !== user.id) {
                    setError("Esta foto já está protegida por outro usuário.");
                    // Step 2: Log the block attempt
                    await liveStreamService.blockAvatarAttempt(user.id, user.avatar_url);
                    showApiResponse('POST /api/avatar/protection/block', { success: true });
                    setIsSubmitting(false);
                    // Revert the toggle as the action failed
                    setIsProtected(false);
                    return;
                }

                // If not in use, or already in use by the current user, proceed with activation.
                const response = await authService.activateAvatarProtection(user.id, user.avatar_url);
                showApiResponse(`POST /api/avatar/protection/activate`, response);
                if (!response.success) throw new Error("A API retornou uma falha na ativação.");

            } else {
                // Deactivating
                await authService.deactivateAvatarProtection(user.id);
                showApiResponse(`POST /api/avatar/protection/deactivate`, { success: true });
            }
            
            // On success for both activation and deactivation
            const updatedUser = await authService.getUserProfile(user.id);
            onSave(updatedUser);

        } catch (error) {
            console.error("Failed to save avatar protection setting:", error);
            const errorMessage = error instanceof Error ? error.message : "Não foi possível salvar a configuração.";
            setError(errorMessage);
            // Revert UI on failure
            setIsProtected(user.is_avatar_protected || false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
            <header className="p-4 flex items-center shrink-0 border-b border-gray-800 relative">
                <button onClick={onExit} className="p-2 -m-2 z-10"><ArrowLeftIcon className="w-6 h-6" /></button>
                <h1 className="font-semibold text-xl absolute left-1/2 -translate-x-1/2">Proteção de avatar</h1>
                <button onClick={handleSave} disabled={isSubmitting} className="font-semibold text-green-500 hover:text-green-400 disabled:opacity-50 ml-auto z-10">
                    {isSubmitting ? 'Salvando...' : 'Salvar'}
                </button>
            </header>

            <main className="flex-grow flex flex-col items-center justify-center p-6 text-center">
                <div className={`relative w-40 h-40 mb-8 rounded-full ${isProtected ? 'animate-protection-glow' : ''}`}>
                    <div className="w-full h-full rounded-full p-1.5 bg-gradient-to-br from-purple-400 to-pink-400">
                        <div className="bg-black w-full h-full rounded-full p-1">
                            <img src={user.avatar_url} alt={user.name} className="w-full h-full rounded-full object-cover"/>
                        </div>
                    </div>
                     {isProtected && (
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-sky-400 rounded-full flex items-center justify-center border-2 border-black">
                            <ShieldCheckIcon className="w-7 h-7 text-black"/>
                        </div>
                     )}
                </div>

                <h2 className="text-2xl font-bold">Proteja seu avatar</h2>
                <p className="text-gray-400 mt-2 max-w-sm">
                    Ative a proteção para evitar que outras pessoas usem sua foto de perfil, prevenindo golpes e perfis falsos.
                </p>
                
                {error && <p className="text-red-400 text-center text-sm mt-6">{error}</p>}
                
                <div className="w-full max-w-sm mt-8 p-4 bg-[#1c1c1c] rounded-lg flex justify-between items-center">
                    <span className="font-semibold">Ativar Proteção de Avatar</span>
                    <ToggleSwitch enabled={isProtected} onChange={setIsProtected} />
                </div>
            </main>
        </div>
    );
};

export default AvatarProtectionScreen;