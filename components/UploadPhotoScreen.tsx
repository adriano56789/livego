import React, { useState, useRef, useCallback } from 'react';
import type { User } from '../types';
import { uploadProfilePhoto } from '../services/authService';
import CheckIcon from './icons/CheckIcon';
import CrossIcon from './icons/CrossIcon';
import CameraIcon from './icons/CameraIcon';
import { useApiViewer } from './ApiContext';

interface UploadPhotoScreenProps {
  user: User;
  onPhotoUploaded: (user: User) => void;
}

const Guideline: React.FC<{ isCorrect: boolean, imageSrc: string, text: string }> = ({ isCorrect, imageSrc, text }) => (
  <div className={`w-full p-3 rounded-2xl ${isCorrect ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
    <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden mb-3">
      <img src={imageSrc} alt={text} className="w-full h-full object-cover" />
      <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}>
        {isCorrect ? <CheckIcon className="w-4 h-4 text-black" /> : <CrossIcon className="w-4 h-4 text-white" />}
      </div>
    </div>
    <p className="text-center text-sm font-medium text-gray-200">{text}</p>
  </div>
);


const UploadPhotoScreen: React.FC<UploadPhotoScreenProps> = ({ user, onPhotoUploaded }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showApiResponse } = useApiViewer();

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
              setError("O arquivo é muito grande. Use uma foto com menos de 5MB.");
              return;
            }
            setError(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleSubmit = useCallback(async () => {
        if (!previewUrl) {
            setError("Por favor, selecione uma foto primeiro.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const updatedUser = await uploadProfilePhoto(user.id, previewUrl);
            showApiResponse(`PATCH /api/usuarios/${user.id}/avatar`, updatedUser);
            onPhotoUploaded(updatedUser);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Falha no upload da foto. Tente novamente.";
            setError(errorMessage);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [previewUrl, user, onPhotoUploaded, showApiResponse]);

    const buttonText = isLoading ? 'Validando...' : (previewUrl ? 'Confirmar e Continuar' : 'Enviar foto');

    return (
        <div className="bg-black text-gray-300 min-h-screen flex flex-col p-4 sm:p-6 font-sans">
            <header className="text-center mb-6">
                <h1 className="text-3xl font-bold text-white">Envie uma foto de perfil</h1>
                <p className="text-gray-400 mt-2">Sua foto nos ajuda a manter a comunidade segura.</p>
            </header>

            <main className="flex-grow flex flex-col items-center justify-center">
                <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 items-center gap-6">
                    {/* Guideline DO */}
                    <div className="hidden md:block">
                        <Guideline 
                            isCorrect={true}
                            imageSrc="https://images.pexels.com/photos/837358/pexels-photo-837358.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1"
                            text="Rosto claro e bem iluminado."
                        />
                    </div>

                    {/* Upload Area */}
                    <div className="flex flex-col items-center">
                        <button 
                            onClick={handleUploadClick} 
                            className="w-56 h-56 rounded-full bg-[#1c1c1e] mb-6 flex flex-col items-center justify-center overflow-hidden border-2 border-dashed border-gray-600 hover:border-green-500 transition-colors relative group"
                        >
                            {previewUrl ? (
                                <img src={previewUrl} alt="Pré-visualização do avatar" className="w-full h-full object-cover" />
                            ) : (
                               <>
                                 <CameraIcon className="w-20 h-20 text-gray-500 mb-2 transition-transform group-hover:scale-110"/>
                                 <span className="text-base font-semibold text-gray-400">Toque para enviar</span>
                               </>
                            )}
                        </button>
                        <button
                            onClick={previewUrl ? handleSubmit : handleUploadClick}
                            disabled={isLoading}
                            className="w-full max-w-sm bg-gradient-to-r from-green-500 to-teal-400 text-black font-bold py-4 rounded-full text-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait flex justify-center items-center"
                            aria-live="polite"
                        >
                            {isLoading && (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {buttonText}
                        </button>
                         {error && <p className="text-red-400 text-center text-sm mt-4">{error}</p>}
                    </div>
                    
                    {/* Guideline DON'T */}
                    <div className="hidden md:block">
                        <Guideline 
                            isCorrect={false}
                            imageSrc="https://images.pexels.com/photos/1130624/pexels-photo-1130624.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&dpr=1"
                            text="Evite rostos cobertos ou fotos de grupo."
                        />
                    </div>
                </div>
            </main>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                aria-hidden="true"
            />
             <p className="text-xs text-gray-600 text-center mt-6">
                Para sua segurança, não inclua nenhuma informação pessoal em sua foto.
            </p>
        </div>
    );
};

export default UploadPhotoScreen;
