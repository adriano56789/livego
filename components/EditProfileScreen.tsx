
import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { User, Gender } from '../types';
import { generateNickname, updateUserProfile, uploadProfilePhoto } from '../services/authService';
import RefreshIcon from './icons/RefreshIcon';
import MaleIcon from './icons/MaleIcon';
import FemaleIcon from './icons/FemaleIcon';
import DatePickerModal from './DatePickerModal';
import { useApiViewer } from './ApiContext';
import CopyIcon from './icons/CopyIcon';
import CheckIcon from './icons/CheckIcon';
import CameraIcon from './icons/CameraIcon';


interface EditProfileScreenProps {
  user: User;
  onProfileComplete: (user: User) => void;
}

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="mb-6">
    <label className="block text-sm font-medium text-gray-300 mb-2">
      {label}
    </label>
    {children}
  </div>
);

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ user, onProfileComplete }) => {
  // Initialize state from the user prop (which now uses snake_case)
  const [nickname, setNickname] = useState(user.nickname || '');
  const [gender, setGender] = useState<Gender | null>(user.gender || 'male');
  const [birthday, setBirthday] = useState<string | null>(user.birthday || null);
  const [inviteCode, setInviteCode] = useState(user.invite_code || '');
  
  const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isGeneratingNickname, setIsGeneratingNickname] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showApiResponse } = useApiViewer();
  const [idCopied, setIdCopied] = useState(false);

  const handleCopyId = () => {
    navigator.clipboard.writeText(String(user.id));
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 2000);
  };
  
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

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
        setNewAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateNickname = useCallback(async () => {
    setIsGeneratingNickname(true);
    setError(null);
    try {
      const response = await generateNickname();
      setNickname(response.newNickname);
      showApiResponse('Utility: generateNickname', response);
    } catch (err) {
      setError('Falha ao gerar apelido.');
    } finally {
      setIsGeneratingNickname(false);
    }
  }, [showApiResponse]);
  
  useEffect(() => {
    if (!user.nickname) {
        handleGenerateNickname();
    } else {
        setNickname(user.nickname);
    }
  }, [user.nickname, handleGenerateNickname]);


  const handleSubmit = async () => {
    if (!nickname) {
      setError("O apelido não pode ficar em branco.");
      return;
    }
    if (!gender) {
      setError("Por favor, selecione seu gênero.");
      return;
    }
     if (!birthday) {
      setError("Por favor, selecione seu aniversário.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      let userForUpdate = user;

      // 1. Upload new photo if one was selected
      if (newAvatarUrl) {
          const updatedUserWithAvatar = await uploadProfilePhoto(user.id, newAvatarUrl);
          showApiResponse(`PATCH /api/usuarios/${user.id}/avatar`, updatedUserWithAvatar);
          userForUpdate = updatedUserWithAvatar;
      }

      // 2. Update the rest of the profile data
      const updatedProfileData = {
        nickname,
        gender,
        birthday: birthday || undefined,
        invite_code: inviteCode || undefined,
      };
      
      const finalUpdatedUser = await updateUserProfile(userForUpdate.id, updatedProfileData);
      showApiResponse(`PATCH /api/usuarios/${userForUpdate.id}`, finalUpdatedUser);
      onProfileComplete(finalUpdatedUser);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Falha ao atualizar o perfil. Tente novamente.';
      setError(errorMessage);
    } finally {
        setIsSubmitting(false);
    }
  };

  const formattedBirthday = birthday 
    ? new Date(birthday).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' })
    : 'Por favor, selecione';

  return (
    <div className="bg-[#0D0D0D] text-white min-h-screen flex flex-col font-sans">
      <header className="py-4 text-center shrink-0 flex flex-col items-center">
        <h1 className="text-lg font-semibold text-gray-400">Avatar</h1>
         <div className="relative mt-4">
            <button onClick={handleAvatarClick} className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden relative group">
                <img src={newAvatarUrl || user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <CameraIcon className="w-8 h-8 text-white" />
                </div>
            </button>
        </div>
      </header>
      
      <main className="flex-grow px-6 py-4 overflow-y-auto">
        <FormField label="Apelido">
          <div className="flex items-center bg-[#252525] rounded-full p-1.5">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="flex-grow bg-transparent text-white placeholder-gray-500 px-4 py-2 focus:outline-none"
              aria-label="Apelido"
            />
            <button
              onClick={handleGenerateNickname}
              disabled={isGeneratingNickname}
              className="bg-gray-700/50 w-10 h-10 rounded-full flex items-center justify-center shrink-0 hover:bg-gray-600 transition-colors disabled:opacity-50"
              aria-label="Gerar novo apelido"
            >
              {isGeneratingNickname ? (
                 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <RefreshIcon className="w-6 h-6 text-gray-300" />
              )}
            </button>
          </div>
        </FormField>
        
        <FormField label="ID do LiveGo">
          <div className="flex items-center justify-between bg-[#252525] h-[50px] rounded-2xl px-4">
            <span className="text-white font-medium">
              {user.id}
            </span>
            <button
              onClick={handleCopyId}
              className="p-2 -m-2 rounded-full hover:bg-gray-700/50 transition-colors"
              aria-label="Copiar ID"
            >
              {idCopied ? (
                <CheckIcon className="w-5 h-5 text-green-400" />
              ) : (
                <CopyIcon className="w-5 h-5 text-gray-300" />
              )}
            </button>
          </div>
        </FormField>

        <FormField label="Gênero">
           <div className="bg-[#252525] p-1 rounded-full flex items-center">
             <button
                 onClick={() => setGender('male')}
                 className={`w-1/2 flex items-center justify-center gap-2 py-3 rounded-full transition-all duration-300 ${
                     gender === 'male' ? 'bg-[#007aff]' : 'bg-transparent'
                 }`}
             >
                 <MaleIcon className="w-5 h-5 text-white" />
                 <span className="font-semibold text-white">
                     Homem
                 </span>
             </button>
             <button
                 onClick={() => setGender('female')}
                 className={`w-1/2 flex items-center justify-center gap-2 py-3 rounded-full transition-all duration-300 ${
                     gender === 'female' ? 'bg-[#ff2d55]' : 'bg-transparent'
                 }`}
             >
                 <FemaleIcon className="w-5 h-5 text-white" />
                 <span className="font-semibold text-white">
                     Mulher
                 </span>
             </button>
           </div>
        </FormField>

        <FormField label="Aniversário">
          <button
            onClick={() => setIsDatePickerOpen(true)}
            className="bg-[#252525] h-[50px] w-full px-4 rounded-2xl flex justify-between items-center text-left"
            aria-haspopup="dialog"
            aria-expanded={isDatePickerOpen}
          >
            <span className={birthday ? 'text-white' : 'text-gray-500'}>
              {formattedBirthday}
            </span>
            <span className="text-gray-500 text-lg">&gt;</span>
          </button>
        </FormField>
        
        <FormField label="Código de convite (opcional)">
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Digite o código do convite"
            className="bg-[#252525] h-[50px] w-full text-white placeholder-gray-500 px-4 py-2 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-500/50"
            aria-label="Código de convite (opcional)"
          />
        </FormField>

        {error && <p className="text-red-400 text-center text-sm my-4">{error}</p>}
      </main>

      <footer className="px-6 pb-8 pt-4 shrink-0">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || isGeneratingNickname}
          className="w-full bg-[#34C759] text-black font-semibold py-4 rounded-full text-lg transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-live="polite"
        >
          {isSubmitting ? 'Salvando...' : 'Continuar'}
        </button>
      </footer>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        aria-hidden="true"
      />
      
      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onSelectDate={(date) => {
            setBirthday(date);
            setIsDatePickerOpen(false);
        }}
        currentDate={birthday}
      />
    </div>
  );
};

export default EditProfileScreen;
