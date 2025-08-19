import React, { useState, useEffect, useMemo } from 'react';
import type { User, Gender, SelectableOption } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import PlusIcon from './icons/PlusIcon';
import CrossIcon from './icons/CrossIcon';
import { updateUserProfile } from '../services/authService';
import * as profileService from '../services/profileService';
import { useApiViewer } from './ApiContext';
import SelectionModal from './SelectionModal';
import DatePickerModal from './DatePickerModal';

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
    const [nickname, setNickname] = useState(user.nickname || '');
    const [gender, setGender] = useState<Gender | null>(user.gender);
    const [birthday, setBirthday] = useState<string | null>(user.birthday);
    const [personalSignature, setPersonalSignature] = useState(user.personalSignature || '');
    const [country, setCountry] = useState<string | null>(user.country);
    const [emotionalState, setEmotionalState] = useState<string | null>(user.emotionalState);
    const [tags, setTags] = useState((user.personalityTags?.map(t => t.label) || []).join(', '));
    const [profession, setProfession] = useState<string | null>(user.profession);
    const [language, setLanguage] = useState<string | null>(user.languages?.[0] || null);
    const [height, setHeight] = useState(user.height ? String(user.height) : '');
    const [weight, setWeight] = useState(user.weight ? String(user.weight) : '');
    
    const [photos, setPhotos] = useState<string[]>(user.avatar_url ? [user.avatar_url] : []);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showApiResponse } = useApiViewer();
    
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

    const handleSave = async () => {
        setIsSubmitting(true);
        try {
            const personalityTags = tags.split(',').map(tag => tag.trim()).filter(Boolean).map(label => ({ id: label.toLowerCase().replace(/\s+/g, '_'), label }));
            const parsedHeight = height ? parseInt(height, 10) : null;
            const parsedWeight = weight ? parseInt(weight, 10) : null;

            const updatedData: Partial<User> = {
                nickname,
                gender,
                birthday,
                personalSignature,
                country,
                emotionalState,
                personalityTags,
                profession,
                languages: language ? [language] : [],
                height: isNaN(parsedHeight!) ? null : parsedHeight,
                weight: isNaN(parsedWeight!) ? null : parsedWeight,
            };
            const updatedUser = await updateUserProfile(user.id, updatedData);
            showApiResponse(`PUT /api/users/${user.id}`, updatedUser);
            onSave(updatedUser);
        } catch (error) {
            console.error("Failed to save profile:", error);
            alert("Falha ao salvar o perfil.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const genderLabel = useMemo(() => genders.find(g => g.id === gender)?.label || 'Não especificado', [gender, genders]);
    const countryLabel = useMemo(() => countries.find(c => c.id === country)?.label || 'Não especificado', [country, countries]);
    const emotionalStateLabel = useMemo(() => emotionalStates.find(e => e.id === emotionalState)?.label || 'Não especificado', [emotionalState, emotionalStates]);
    const professionLabel = useMemo(() => professions.find(p => p.id === profession)?.label || 'Não especificado', [profession, professions]);
    const languageLabel = useMemo(() => languages.find(l => l.id === language)?.label || 'Não especificado', [language, languages]);
    const birthdayLabel = useMemo(() => birthday ? new Date(birthday + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não especificado', [birthday]);

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
            {photos.map((photo, index) => (
              <div key={index} className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden">
                <img src={photo} alt={`Foto do perfil ${index + 1}`} className="w-full h-full object-cover" />
                {index === 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-purple-600 text-white text-xs text-center py-0.5 font-semibold">Retrato</div>
                )}
              </div>
            ))}
            {photos.length < 8 && (
              <button className="aspect-square bg-[#1c1c1c] border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center">
                <PlusIcon className="w-8 h-8 text-gray-500" />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-6">{photos.length}/8 Clique para ver e apagar imagens, segure para ordenar</p>

          <div className="divide-y divide-gray-800">
              <EditableInputRow label="Apelido" value={nickname} onChange={setNickname} />
              <EditableRow label="Gênero" value={genderLabel} onClick={() => setModalConfig({ title: 'Selecione o Gênero', options: genders, selectedValue: gender, onSelect: (val) => { setGender(val as Gender); setModalConfig(null); } })} />
              <EditableRow label="Aniversário" value={birthdayLabel} onClick={() => setIsDatePickerOpen(true)} />
              <EditableInputRow label="Apresentar-se" value={personalSignature} onChange={setPersonalSignature} placeholder="Apresente-se" />
              <EditableRow label="Residência atual" value={countryLabel} onClick={() => setModalConfig({ title: 'Selecione a Residência', options: countries, selectedValue: country, onSelect: (val) => { setCountry(val); setModalConfig(null); } })} />
              <EditableRow label="Estado emocional" value={emotionalStateLabel} onClick={() => setModalConfig({ title: 'Selecione o Estado Emocional', options: emotionalStates, selectedValue: emotionalState, onSelect: (val) => { setEmotionalState(val); setModalConfig(null); } })} />
              <EditableInputRow label="Tags (separadas por vírgula)" value={tags} onChange={setTags} placeholder="Interesses, hobbies, etc." />
              <EditableRow label="Profissão" value={professionLabel} onClick={() => setModalConfig({ title: 'Selecione a Profissão', options: professions, selectedValue: profession, onSelect: (val) => { setProfession(val); setModalConfig(null); } })} />
              <EditableRow label="Língua dominada" value={languageLabel} onClick={() => setModalConfig({ title: 'Selecione o Idioma', options: languages, selectedValue: language, onSelect: (val) => { setLanguage(val); setModalConfig(null); } })} />
              <EditableInputRow label="Altura (cm)" value={height} onChange={setHeight} type="number" maxLength={3} />
              <EditableInputRow label="Peso corporal (Kg)" value={weight} onChange={setWeight} type="number" maxLength={3} />
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
          onSelectDate={(date) => { setBirthday(date); setIsDatePickerOpen(false); }}
          currentDate={birthday}
      />
    </>
  );
};

export default ProfileEditorScreen;