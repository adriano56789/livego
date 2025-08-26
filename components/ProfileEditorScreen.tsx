
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { User, Gender, SelectableOption } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import PlusIcon from './icons/PlusIcon';
import CrossIcon from './icons/CrossIcon';
import { updateUserProfile, addProfilePhoto, deleteProfilePhoto } from '../services/authService';
import * as profileService from '../services/profileService';
import { useApiViewer } from './ApiContext';
import SelectionModal from './SelectionModal';
import DatePickerModal from './DatePickerModal';
import PhotoViewerModal from './PhotoViewerModal';

interface ProfileEditorScreenProps {
  user: User;
  onExit: () => void;
  onSave: (user: User) => void;
}

const EditableInputRow: React.FC<{ label: string; value: string; onChange: (value: string) => void; placeholder?: string, type?: string, maxLength?: number }> = ({ label, value, onChange, placeholder, type = 'text', maxLength }) => (
    <div className="w-full flex justify-between items-center py-4 text-left">
        <span className="text-gray-400">{label}</span>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || 'Não preenchido'}
            maxLength={maxLength}
            className="bg-transparent text-right text-white font-medium focus:outline-none w-48 truncate"
        />
    </div>
);

const EditableRow: React.FC<{ label: string; value: string | React.ReactNode; onClick?: () => void; }> = ({ label, value, onClick }) => (
  <button onClick={onClick} className="w-full flex justify-between items-center py-4 text-left disabled:opacity-50" disabled={!onClick}>
    <span className="text-gray-400">{label}</span>
    <div className="flex items-center gap-2">
      <div className="text-white font-medium truncate max-w-[200px] text-right">{value}</div>
      <ChevronRightIcon className="w-5 h-5 text-gray-500" />
    </div>
  </button>
);

const ProfileEditorScreen: React.FC<ProfileEditorScreenProps> = ({ user, onExit, onSave }) => {
    const [editedUser, setEditedUser] = useState<User>(user);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showApiResponse } = useApiViewer();

    // Photo management state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Data for modals
    const [genders, setGenders] = useState<SelectableOption[]>([]);
    const [countries, setCountries] = useState<SelectableOption[]>([]);
    const [emotionalStates, setEmotionalStates] = useState<SelectableOption[]>([]);
    const [professions, setProfessions] = useState<SelectableOption[]>([]);
    const [languages, setLanguages] = useState<SelectableOption[]>([]);

    // Modal state
    const [modalConfig, setModalConfig] = useState<{ title: string; options: SelectableOption[]; selectedValue: string | null; onSelect: (value: string) => void; } | null>(null);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [gendersData, countriesData, statesData, professionsData, languagesData] = await Promise.all([
                    profileService.getGenders(),
                    profileService.getCountries(),
                    profileService.getEmotionalStates(),
                    profileService.getProfessions(),
                    profileService.getLanguages(),
                ]);
                setGenders(gendersData);
                setCountries(countriesData);
                setEmotionalStates(statesData);
                setProfessions(professionsData);
                setLanguages(languagesData);
            } catch (error) {
                console.error("Failed to fetch profile options:", error);
            }
        };
        fetchData();
    }, []);

    const handleFieldChange = (field: keyof User, value: any) => {
        setEditedUser(prev => ({ ...prev, [field]: value }));
    };

    const handleTagsChange = (value: string) => {
        const tags = value.split(',').map(tag => tag.trim()).filter(Boolean).map(label => ({ id: label.toLowerCase().replace(/\s+/g, '_'), label }));
        setEditedUser(prev => ({ ...prev, personalityTags: tags }));
    };
    
    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                const photoDataUrl = reader.result as string;
                const updatedUser = await addProfilePhoto(user.id, photoDataUrl);
                showApiResponse(`POST /api/users/${user.id}/photos`, updatedUser);
                setEditedUser(updatedUser);
            } catch (error) {
                console.error("Failed to upload photo:", error);
                alert(error instanceof Error ? error.message : "Falha no upload da foto.");
            } finally {
                setIsUploading(false);
            }
        };
        reader.onerror = () => {
            setIsUploading(false);
            alert("Falha ao ler o arquivo.");
        };
    };

    const handleDeletePhoto = async () => {
        if (!viewingPhoto) return;
        setIsDeleting(true);
        try {
            const updatedUser = await deleteProfilePhoto(user.id, viewingPhoto);
            showApiResponse(`DELETE /api/users/${user.id}/photos`, updatedUser);
            setEditedUser(updatedUser);
            setViewingPhoto(null);
        } catch (error) {
            console.error("Failed to delete photo:", error);
            alert(error instanceof Error ? error.message : "Falha ao apagar a foto.");
        } finally {
            setIsDeleting(false);
        }
    };


    const handleSave = async () => {
        setIsSubmitting(true);
        try {
             const payload: Partial<User> = {
                nickname: editedUser.nickname,
                gender: editedUser.gender,
                birthday: editedUser.birthday,
                personalSignature: editedUser.personalSignature,
                country: editedUser.country,
                emotionalState: editedUser.emotionalState,
                personalityTags: editedUser.personalityTags,
                profession: editedUser.profession,
                languages: editedUser.languages,
                height: editedUser.height ? Number(editedUser.height) : null,
                weight: editedUser.weight ? Number(editedUser.weight) : null,
            };

            const finalUpdatedUser = await updateUserProfile(user.id, payload);
            showApiResponse(`PUT /api/users/${user.id}`, finalUpdatedUser);
            onSave(finalUpdatedUser);
        } catch (error) {
            console.error("Failed to save profile:", error);
            alert("Falha ao salvar o perfil.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const genderLabel = useMemo(() => genders.find(g => g.id === editedUser.gender)?.label || 'Não especificado', [editedUser.gender, genders]);
    const countryLabel = useMemo(() => countries.find(c => c.id === editedUser.country)?.label || 'Não especificado', [editedUser.country, countries]);
    const emotionalStateLabel = useMemo(() => emotionalStates.find(e => e.id === editedUser.emotionalState)?.label || 'Não especificado', [editedUser.emotionalState, emotionalStates]);
    const professionLabel = useMemo(() => professions.find(p => p.id === editedUser.profession)?.label || 'Não especificado', [editedUser.profession, professions]);
    const languageLabel = useMemo(() => languages.find(l => l.id === editedUser.languages?.[0])?.label || 'Não especificado', [editedUser.languages, languages]);
    const birthdayLabel = useMemo(() => editedUser.birthday ? new Date(editedUser.birthday + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não especificado', [editedUser.birthday]);

    const photoGallery = editedUser.photo_gallery || (editedUser.avatar_url ? [editedUser.avatar_url] : []);
    const tagsValue = (editedUser.personalityTags || []).map(t => t.label).join(', ');

  return (
    <>
      <div className="h-screen w-full bg-black text-white flex flex-col font-sans">
        <header className="p-4 flex items-center shrink-0 border-b border-gray-800 relative">
          <button onClick={onExit} className="p-2 -m-2 z-10"><ArrowLeftIcon className="w-6 h-6" /></button>
          <h1 className="font-semibold text-xl absolute left-1/2 -translate-x-1/2">Editar o perfil</h1>
          <button onClick={handleSave} disabled={isSubmitting} className="font-semibold text-green-500 hover:text-green-400 disabled:opacity-50 ml-auto z-10">
              {isSubmitting ? 'Salvando...' : 'Salvar'}
          </button>
        </header>

        <main className="flex-grow p-4 overflow-y-auto scrollbar-hide">
          <div className="bg-[#1c1c1c] p-3 rounded-lg flex items-center justify-between text-sm mb-6">
            <span>Faça upload de fotos reais e nítidas, deixe o destino começar no avatar da beleza</span>
            <button className="p-1 -m-1"><CrossIcon className="w-4 h-4 text-gray-400" /></button>
          </div>
          
          <div className="grid grid-cols-4 gap-3 mb-2">
            {photoGallery.map((photo, index) => (
              <button key={index} onClick={() => setViewingPhoto(photo)} className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden">
                <img src={photo} alt={`Foto do perfil ${index + 1}`} className="w-full h-full object-cover" />
                {photo === editedUser.avatar_url && (
                  <div className="absolute bottom-0 left-0 right-0 bg-purple-600 text-white text-xs text-center py-0.5 font-semibold">Retrato</div>
                )}
              </button>
            ))}
            {photoGallery.length < 8 && (
              <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="aspect-square bg-[#1c1c1c] border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center">
                 {isUploading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <PlusIcon className="w-8 h-8 text-gray-500" />}
              </button>
            )}
             <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                aria-hidden="true"
            />
          </div>
          <p className="text-xs text-gray-500 mb-6">{photoGallery.length}/8 Clique para ver e apagar imagens, segure para ordenar</p>

          <div className="divide-y divide-gray-800">
              <EditableInputRow label="Apelido" value={editedUser.nickname || ''} onChange={(val) => handleFieldChange('nickname', val)} />
              <EditableRow label="Gênero" value={genderLabel} onClick={() => setModalConfig({ title: 'Selecione o Gênero', options: genders, selectedValue: editedUser.gender, onSelect: (val) => { handleFieldChange('gender', val as Gender); setModalConfig(null); } })} />
              <EditableRow label="Aniversário" value={birthdayLabel} onClick={() => setIsDatePickerOpen(true)} />
              <EditableInputRow label="Apresentar-se" value={editedUser.personalSignature || ''} onChange={(val) => handleFieldChange('personalSignature', val)} placeholder="Apresente-se" />
              <EditableRow label="Residência atual" value={countryLabel} onClick={() => setModalConfig({ title: 'Selecione a Residência', options: countries, selectedValue: editedUser.country, onSelect: (val) => { handleFieldChange('country', val); setModalConfig(null); } })} />
              <EditableRow label="Estado emocional" value={emotionalStateLabel} onClick={() => setModalConfig({ title: 'Selecione o Estado Emocional', options: emotionalStates, selectedValue: editedUser.emotionalState, onSelect: (val) => { handleFieldChange('emotionalState', val); setModalConfig(null); } })} />
              <EditableInputRow label="Tags (separadas por vírgula)" value={tagsValue} onChange={handleTagsChange} placeholder="Interesses, hobbies, etc." />
              <EditableRow label="Profissão" value={professionLabel} onClick={() => setModalConfig({ title: 'Selecione a Profissão', options: professions, selectedValue: editedUser.profession, onSelect: (val) => { handleFieldChange('profession', val); setModalConfig(null); } })} />
              <EditableRow label="Língua dominada" value={languageLabel} onClick={() => setModalConfig({ title: 'Selecione o Idioma', options: languages, selectedValue: editedUser.languages?.[0] || null, onSelect: (val) => { handleFieldChange('languages', [val]); setModalConfig(null); } })} />
              <EditableInputRow label="Altura (cm)" value={String(editedUser.height || '')} onChange={(val) => handleFieldChange('height', val)} type="number" maxLength={3} />
              <EditableInputRow label="Peso corporal (Kg)" value={String(editedUser.weight || '')} onChange={(val) => handleFieldChange('weight', val)} type="number" maxLength={3} />
          </div>
        </main>
      </div>
      
      {modalConfig && (
        <SelectionModal
          isOpen={!!modalConfig}
          onClose={() => setModalConfig(null)}
          title={modalConfig.title}
          options={modalConfig.options}
          selectedValue={modalConfig.selectedValue}
          onSelect={modalConfig.onSelect}
        />
      )}
      
      <DatePickerModal
          isOpen={isDatePickerOpen}
          onClose={() => setIsDatePickerOpen(false)}
          onSelectDate={(date) => { handleFieldChange('birthday', date); setIsDatePickerOpen(false); }}
          currentDate={editedUser.birthday}
      />
       {viewingPhoto && (
        <PhotoViewerModal
          photoUrl={viewingPhoto}
          onClose={() => setViewingPhoto(null)}
          onDelete={handleDeletePhoto}
          isDeleting={isDeleting}
          canDelete={photoGallery.length > 1}
        />
      )}
    </>
  );
};

export default ProfileEditorScreen;
